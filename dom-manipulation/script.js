let quotes = [];

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

function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

function showRandomQuote() {
  if (quotes.length === 0) {
    document.getElementById("quoteDisplay").textContent = "No quotes available.";
    return;
  }

  const randomIndex = Math.floor(Math.random() * quotes.length);
  const quote = quotes[randomIndex];

  const quoteDisplay = document.getElementById("quoteDisplay");
  quoteDisplay.innerHTML = `
    <p><strong>Quote:</strong> ${quote.text}</p>
    <p><em>Category:</em> ${quote.category}</p>
  `;

  sessionStorage.setItem("lastViewedQuote", JSON.stringify(quote));
}

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

function addQuote() {
  const textInput = document.getElementById("newQuoteText");
  const categoryInput = document.getElementById("newQuoteCategory");

  const newText = textInput.value.trim();
  const newCategory = categoryInput.value.trim();

  if (newText === "" || newCategory === "") {
    alert("Please enter both quote text and category.");
    return;
  }

  quotes.push({ text: newText, category: newCategory });
  saveQuotes();
  textInput.value = "";
  categoryInput.value = "";
  alert("Quote added successfully!");
}

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

function importFromJsonFile(event) {
  const fileReader = new FileReader();

  fileReader.onload = function(event) {
    try {
      const importedQuotes = JSON.parse(event.target.result);
      if (Array.isArray(importedQuotes)) {
        quotes.push(...importedQuotes);
        saveQuotes();
        alert("Quotes imported successfully!");
      } else {
        alert("Invalid JSON format. Must be an array.");
      }
    } catch (err) {
      alert("Error reading file: " + err.message);
    }
  };

  fileReader.readAsText(event.target.files[0]);
}

document.addEventListener("DOMContentLoaded", () => {
  loadQuotes();
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
});
