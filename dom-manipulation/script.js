let quotes = [];

// تحميل الاقتباسات من localStorage
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

// حفظ الاقتباسات في localStorage
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

// عرض اقتباس عشوائي مع الفلتر الحالي
function showRandomQuote() {
  let filtered = getFilteredQuotes();
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

  sessionStorage.setItem("lastViewedQuote", JSON.stringify(quote));
}

// إنشاء النموذج لإضافة اقتباس جديد
function createAddQuoteForm() {
  const formContainer = document.getElementById("formContainer");
  formContainer.innerHTML = ""; // تنظيف إذا فيه نموذج سابق

  const inputText = document.createElement("input");
  inputText.id = "newQuoteText";
  inputText.type = "text";
  inputText.placeholder = "Enter a new quote";

  const inputCategory = document.createElement("input");
  inputCategory.id = "newQuoteCategory";
  inputCategory.type = "text";
  inputCategory.placeholder = "Enter quote category";

  const addButton = document.createElement("button");
  addButton.textContent = "Add Quote";
  addButton.onclick = addQuote;

  formContainer.appendChild(inputText);
  formContainer.appendChild(inputCategory);
  formContainer.appendChild(addButton);
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
  notifyUser("Quote added successfully!");
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

// استيراد اقتباسات من ملف JSON
function importFromJsonFile(event) {
  const fileReader = new FileReader();

  fileReader.onload = function(e) {
    try {
      const importedQuotes = JSON.parse(e.target.result);
      if (Array.isArray(importedQuotes)) {
        quotes.push(...importedQuotes);
        saveQuotes();
        populateCategories();
        notifyUser("Quotes imported successfully!");
      } else {
        alert("Invalid JSON format.");
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  fileReader.readAsText(event.target.files[0]);
}

// فلترة الاقتباسات حسب التصنيف المختار
function filterQuotes() {
  const selectedCategory = document.getElementById("categoryFilter").value;
  localStorage.setItem("selectedCategory", selectedCategory);
  showRandomQuote();
}

// جلب الاقتباسات المفلترة
function getFilteredQuotes() {
  const category = document.getElementById("categoryFilter").value;
  if (category === "all") return quotes;
  return quotes.filter(q => q.category.toLowerCase() === category.toLowerCase());
}

// ملئ قائمة التصنيفات في الـ select
function populateCategories() {
  const select = document.getElementById("categoryFilter");
  const uniqueCategories = [...new Set(quotes.map(q => q.category))];

  // حفظ الخيار الحالي
  const current = select.value;

  select.innerHTML = `<option value="all">All Categories</option>`;
  uniqueCategories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    select.appendChild(option);
  });

  // إعادة تعيين الفلتر المختار إذا كان موجودًا مسبقًا
  const savedFilter = localStorage.getItem("selectedCategory") || "all";
  select.value = savedFilter;
}

// إعلام المستخدم برسائل الحالة
function notifyUser(message, isError = false) {
  const notification = document.getElementById("notification");
  notification.textContent = message;
  notification.style.color = isError ? "red" : "green";
  setTimeout(() => {
    notification.textContent = "";
  }, 4000);
}

// مزامنة البيانات مع السيرفر (محاكاة باستخدام JSONPlaceholder)
async function syncQuotes() {
  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/posts");
    if (!response.ok) throw new Error("Failed to fetch from server");

    const serverData = await response.json();

    // تحويل بيانات السيرفر لمحاكاة الاقتباسات (نأخذ أول 5 فقط)
    const serverQuotes = serverData.slice(0, 5).map(post => ({
      text: post.title,
      category: "Server"
    }));

    // حل تعارض: نستخدم بيانات السيرفر كأولية
    // ادمج السيرفر مع المحلي، وتخلص من التكرار بناء على النص
    const mergedQuotes = [];

    // أضف كل اقتباسات السيرفر أولاً
    serverQuotes.forEach(sq => {
      mergedQuotes.push(sq);
    });

    // أضف اقتباسات محلية غير موجودة بالسيرفر
    quotes.forEach(lq => {
      if (!mergedQuotes.some(mq => mq.text === lq.text)) {
        mergedQuotes.push(lq);
      }
    });

    // تحقق هل هناك تغييرات فعلية
    const isDifferent = JSON.stringify(mergedQuotes) !== JSON.stringify(quotes);

    if (isDifferent) {
      quotes = mergedQuotes;
      saveQuotes();
      populateCategories();
      notifyUser("Quotes updated from server. Conflicts resolved.");
    } else {
      notifyUser("Quotes are already up-to-date.");
    }

  } catch (error) {
    console.error("Sync error:", error);
    notifyUser("Failed to sync quotes from server.", true);
  }
}

// عند تحميل الصفحة
document.addEventListener("DOMContentLoaded", () => {
  loadQuotes();
  populateCategories();
  createAddQuoteForm();

  const lastQuote = sessionStorage.getItem("lastViewedQuote");
  if (lastQuote) {
    const quote = JSON.parse(lastQuote);
    document.getElementById("quoteDisplay").innerHTML = `
      <p><strong>Last Viewed Quote:</strong> ${quote.text}</p>
      <p><em>Category:</em> ${quote.category}</p>
    `;
  }

  document.getElementById("newQuote").addEventListener("click", showRandomQuote);

  // استدعاء المزامنة أول مرة عند التحميل
  syncQuotes();

  // مزامنة دورية كل 30 ثانية
  setInterval(syncQuotes, 30000);
});
