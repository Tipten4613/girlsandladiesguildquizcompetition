
const csvFile = document.getElementById("csvFile");
const importButton = document.getElementById("importButton");
const message = document.getElementById("message");

function parseCSV(text) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  text = text.replace(/^\uFEFF/, "");

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      value += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(value.trim());
      value = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i++;

      row.push(value.trim());

      if (row.some(cell => cell !== "")) {
        rows.push(row);
      }

      row = [];
      value = "";
    } else {
      value += char;
    }
  }

  row.push(value.trim());

  if (row.some(cell => cell !== "")) {
    rows.push(row);
  }

  return rows;
}

importButton.addEventListener("click", async () => {
  const file = csvFile.files[0];

  if (!file) {
    message.textContent = "Please select a CSV file first.";
    return;
  }

  try {
    const text = await file.text();
    const rows = parseCSV(text);

    if (rows.length < 2) {
      throw new Error("The file has no question rows.");
    }

    const headers = rows[0].map(header =>
      header.trim().toLowerCase()
    );

    const requiredHeaders = [
      "category",
      "questionnumber",
      "question",
      "optiona",
      "optionb",
      "optionc",
      "optiond",
      "answer"
    ];

    const missingHeaders = requiredHeaders.filter(
      header => !headers.includes(header)
    );

    if (missingHeaders.length) {
      throw new Error(
        "Missing columns: " + missingHeaders.join(", ")
      );
    }

    const column = name => headers.indexOf(name);

    const importedQuestions = [];

    for (let i = 1; i < rows.length; i++) {
      const cells = rows[i];

      const get = name => cells[column(name)] || "";

      const category = get("category").toLowerCase().replace(/\s+/g, "_");
      const questionNumber = Number(get("questionnumber"));
      const question = get("question");
      const options = [
        get("optiona"),
        get("optionb"),
        get("optionc"),
        get("optiond")
      ];
      const answer = get("answer");

      if (
        !["bible", "anglicanism", "current_affairs"].includes(category) ||
        !Number.isInteger(questionNumber) ||
        questionNumber < 1 ||
        !question ||
        options.some(option => !option) ||
        !options.includes(answer)
      ) {
        throw new Error(
          `Please check row ${i + 1}: category, number, options, or answer is invalid.`
        );
      }

      importedQuestions.push({
        category,
        questionNumber,
        question,
        options,
        answer
      });
    }

    const uniqueKeys = new Set();
    for (const item of importedQuestions) {
      const key = `${item.category}:${item.questionNumber}`;

      if (uniqueKeys.has(key)) {
        throw new Error(
          `Duplicate question number ${item.questionNumber} in ${item.category}.`
        );
      }

      uniqueKeys.add(key);
    }

    localStorage.setItem(
      "quizQuestions",
      JSON.stringify(importedQuestions)
    );

    message.textContent =
      `Success! ${importedQuestions.length} questions imported and saved.`;
  } catch (error) {
    message.textContent = "Import failed: " + error.message;
  }
});
