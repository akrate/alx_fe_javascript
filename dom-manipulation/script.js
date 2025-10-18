let quotes = [];

// تحميل الاقتباسات من localStorage أو تعيين اقتباسات افتراضية
function loadQuotes() {
  const storedQuotes = localStorage.getItem("quotes");
  if (storedQuotes) {
    quotes = JSON.parse(storedQuotes);
  } else {
    quotes = [
      { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
      { text: "Life is what happens when you're busy making other plans.", category: "Life" },
      { text: "Success is not in what you have, but who you are.", category: "Success" }
    ];
    saveQuotes();
  }
}

// حفظ الاقتباسات في التخزين المحلي
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

// إظهار اقتباس عشوائي بناءً على الفلتر الحالي
function showRandomQuote() {
  const filtered = getFilteredQuotes();
  if (filtered.length === 0) {
    document.getElementById("quoteDisplay").textContent = "No quotes available in this category.";
    return;
  }

  const randomIndex = Math.floor(Math.random() * filtered.length);
  const quote = filtered[randomIndex];

  document.getElementById("quoteDisplay").innerHTML = `
    <p><strong>Quote:</strong> ${quote.text}</p>
    <p><em>Category:</em> ${quote.category}</p>
  `;

  // حفظ الاقتباس الأخير في sessionStorage
  sessionStorage.setItem("lastViewedQuote", JSON.stringify(quote));
}

// إضافة اقتباس جديد
function addQuote() {
  const textInput = document.getElementById("newQuoteText");
  const categoryInput = document.getElementById("newQuoteCategory");

  const newText = textInput.value.trim();
  const newCategory = categoryInput.value.trim();

  if (!newText || !newCategory) {
    alert("Please enter both quote and category.");
    return;
  }

  quotes.push({ text: newText, category: newCategory });
  saveQuotes();

  textInput.value = "";
  categoryInput.value = "";

  populateCategories(); // تحديث التصنيفات

  alert("Quote added successfully!");
}

// تصدير الاقتباسات إلى ملف JSON
function exportToJson() {
  const jsonStr = JSON.stringify(quotes, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "quotes.json";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// استيراد الاقتباسات من ملف JSON
function importFromJsonFile(event) {
  const fileReader = new FileReader();

  fileReader.onload = function(e) {
    try {
      const importedQuotes = JSON.parse(e.target.result);
      if (Array.isArray(importedQuotes)) {
        quotes.push(...importedQuotes);
        saveQuotes();
        populateCategories();
        alert("Quotes imported successfully!");
      } else {
        alert("Invalid JSON format.");
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  fileReader.readAsText(event.target.files[0]);
}

// تحديث قائمة التصنيفات في القائمة المنسدلة
function populateCategories() {
  const select = document.getElementById("categoryFilter");
  const uniqueCategories = [...new Set(quotes.map(q => q.category))];

  const current = select.value;

  select.innerHTML = `<option value="all">All Categories</option>`;
  uniqueCategories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    select.appendChild(option);
  });

  const savedFilter = localStorage.getItem("selectedCategory") || "all";
  select.value = savedFilter;
}

// ترشيح الاقتباسات حسب الفئة المختارة
function filterQuotes() {
  const selectedCategory = document.getElementById("categoryFilter").value;
  localStorage.setItem("selectedCategory", selectedCategory);
  showRandomQuote();
}

// الحصول على الاقتباسات المفلترة حسب التصنيف
function getFilteredQuotes() {
  const category = document.getElementById("categoryFilter").value;
  if (category === "all") return quotes;
  return quotes.filter(q => q.category.toLowerCase() === category.toLowerCase());
}

// إشعار المستخدم عند وجود تحديث أو تعارض
function notifyUser(message) {
  const notification = document.getElementById("notification");
  notification.textContent = message;
  setTimeout(() => {
    notification.textContent = "";
  }, 5000);
}

// ** المهمة 3: تزامن البيانات مع السيرفر ومعالجة التعارضات **

// جلب الاقتباسات من السيرفر (محاكاة API)
async function fetchQuotesFromServer() {
  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/posts");
    if (!response.ok) throw new Error("Failed to fetch from server");

    const serverData = await response.json();

    // تحويل بيانات السيرفر إلى اقتباسات (نأخذ أول 5 فقط كمثال)
    const serverQuotes = serverData.slice(0, 5).map(post => ({
      text: post.body || post.title || "No content",
      category: "Server"
    }));

    handleServerSync(serverQuotes);
  } catch (error) {
    console.error("Error fetching server quotes:", error);
    notifyUser("Failed to sync with server.");
  }
}

// دمج بيانات السيرفر مع البيانات المحلية مع إعطاء أولوية للسيرفر في حالة التعارض
function handleServerSync(serverQuotes) {
  const localMap = new Map(quotes.map(q => [q.text, q]));
  const merged = [];

  serverQuotes.forEach(serverQuote => {
    if (localMap.has(serverQuote.text)) {
      // حالة تعارض: نستخدم بيانات السيرفر
      merged.push(serverQuote);
      localMap.delete(serverQuote.text);
      notifyUser(`Conflict resolved: Using server version of "${serverQuote.text}"`);
    } else {
      merged.push(serverQuote);
    }
  });

  // إضافة الاقتباسات المحلية المتبقية
  localMap.forEach(q => merged.push(q));

  quotes = merged;
  saveQuotes();
  populateCategories();
  showRandomQuote();
}

// جدولة التزامن الدوري مع السيرفر كل 3 دقائق
setInterval(fetchQuotesFromServer, 3 * 60 * 1000);

// عند تحميل الصفحة
document.addEventListener("DOMContentLoaded", () => {
  loadQuotes();
  populateCategories();

  // عرض آخر اقتباس تم مشاهدته من sessionStorage
  const lastQuote = sessionStorage.getItem("lastViewedQuote");
  if (lastQuote) {
    const quote = JSON.parse(lastQuote);
    document.getElementById("quoteDisplay").innerHTML = `
      <p><strong>Last Viewed Quote:</strong> ${quote.text}</p>
      <p><em>Category:</em> ${quote.category}</p>
    `;
  }

  document.getElementById("newQuote").addEventListener("click", showRandomQuote);

  // استدعاء التزامن مع السيرفر مباشرة عند بدء التطبيق
  fetchQuotesFromServer();
});
