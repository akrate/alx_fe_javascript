let quotes = [];

// تحميل الاقتباسات من localStorage
function loadQuotes() {
  const storedQuotes = localStorage.getItem("quotes");
  if (storedQuotes) {
    quotes = JSON.parse(storedQuotes);
  } else {
    // اقتباسات افتراضية إذا لم توجد بيانات محفوظة
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

// إظهار اقتباس عشوائي بناءً على الفلتر
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

// إنشاء نموذج لإضافة اقتباس جديد
function createAddQuoteForm() {
  const formContainer = document.createElement("div");
  formContainer.className = "form-container";

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

  document.body.appendChild(formContainer);
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

  // مزامنة مع السيرفر
  postQuotesToServer();

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

// فلترة الاقتباسات حسب التصنيف المختار
function filterQuotes() {
  const selectedCategory = document.getElementById("categoryFilter").value;
  localStorage.setItem("selectedCategory", selectedCategory);
  showRandomQuote();
}

// إرجاع الاقتباسات بناءً على الفلتر
function getFilteredQuotes() {
  const category = document.getElementById("categoryFilter").value;
  if (category === "all") return quotes;
  return quotes.filter(q => q.category.toLowerCase() === category.toLowerCase());
}

// ملء قائمة التصنيفات في القائمة المنسدلة
function populateCategories() {
  const select = document.getElementById("categoryFilter");
  const uniqueCategories = [...new Set(quotes.map(q => q.category))];

  select.innerHTML = `<option value="all">All Categories</option>`;
  uniqueCategories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    select.appendChild(option);
  });

  // استعادة الفلتر المحفوظ
  const savedFilter = localStorage.getItem("selectedCategory") || "all";
  select.value = savedFilter;
}

// مزامنة البيانات مع السيرفر - جلب البيانات (GET)
async function fetchQuotesFromServer() {
  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/posts");
    if (!response.ok) throw new Error("Failed to fetch data from server");

    const serverData = await response.json();

    // تحويل البيانات إلى شكل اقتباسات
    const serverQuotes = serverData.slice(0, 5).map(post => ({
      text: post.title,
      category: "Server"
    }));

    return serverQuotes;
  } catch (error) {
    console.error("Error fetching quotes from server:", error);
    notifyUser("Failed to sync quotes from server.", true);
    return [];
  }
}

// مزامنة البيانات مع السيرفر - إرسال البيانات (POST)
async function postQuotesToServer() {
  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(quotes)
    });

    if (!response.ok) throw new Error("Failed to post data to server");

    const result = await response.json();
    console.log("Data posted to server successfully:", result);
    notifyUser("Quotes synced to server successfully!");
  } catch (error) {
    console.error("Error posting quotes to server:", error);
    notifyUser("Failed to sync quotes to server.", true);
  }
}

// دالة مزامنة متكاملة: جلب من السيرفر، دمج، حفظ، وإشعار المستخدم
async function syncQuotes() {
  const serverQuotes = await fetchQuotesFromServer();

  // دمج الاقتباسات - السيرفر يأخذ الأولوية
  const mergedQuotes = [...serverQuotes];

  // أضف الاقتباسات المحلية التي ليست موجودة بالسيرفر
  quotes.forEach(localQ => {
    if (!mergedQuotes.some(sq => sq.text === localQ.text)) {
      mergedQuotes.push(localQ);
    }
  });

  // تحقق من وجود اختلاف (تعارض)
  if (JSON.stringify(mergedQuotes) !== JSON.stringify(quotes)) {
    quotes = mergedQuotes;
    saveQuotes();
    populateCategories();
    notifyUser("Quotes synced with server! Conflicts resolved.");
  } else {
    notifyUser("Quotes already up-to-date.");
  }
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

  // مزامنة تلقائية من السيرفر كل 30 ثانية
  syncQuotes();
  setInterval(syncQuotes, 30000);
});
