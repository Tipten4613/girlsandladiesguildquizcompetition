
document.addEventListener("DOMContentLoaded", () => {
  const csvFileInput = document.getElementById("csvFile");
  const importButton = document.getElementById("importButton");
  const statusMessage = document.getElementById("message");

  if (!importButton || !csvFileInput || !statusMessage) {
    console.error("Import page elements were not found.");
    return;
  }

  function showStatus(message, isError = false) {
    statusMessage.textContent = message;
    statusMessage.style.color = isError ? "red" : "green";
  }

  function normalizeHeader(header) {
    return String(header || "")
      .replace(/^\uFEFF/, "")
      .trim()
      .toLowerCase()
      .replace(/[\s_-]+/g, "");
  }

  function normalizeType(type) {
    const value = String(type || "")
      .trim()
      .toLowerCase()
      .replace(/[\s_-]+/g, "");

    if (
      value === "fillblank" ||
      value === "fillinthegap" ||
      value === "fillintheblank"
    ) {
      return "fill_blank";
    }

    return "multiple_choice";
  }

  function parseCSV(text) {
    const rows = [];
    let row = [];
    let cell = "";
    let insideQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const next = text[i + 1];

      if (char === '"' && insideQuotes && next === '"') {
        cell += '"';
        i++;
      } else if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === "," && !insideQuotes) {
        row.push(cell.trim());
        cell = "";
      } else if (
        (char === "\n" || char === "\r") &&
        !insideQuotes
      ) {
        if (char === "\r" && next === "\n") i++;

        row.push(cell.trim());

        if (row.some(value => value !== "")) {
          rows.push(row);
        }

        row = [];
        cell = "";
      } else {
        cell += char;
      }
    }

    row.push(cell.trim());

    if (row.some(value => value !== "")) {
      rows.push(row);
    }

    return rows;
  }

  importButton.addEventListener("click", () => {
    const file = csvFileInput.files[0];

    if (!file) {
      showStatus("Please select a CSV file first.", true);
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const rows = parseCSV(String(reader.result || ""));

        if (rows.length < 2) {
          throw new Error("The CSV file contains no question rows.");
        }

        const headers = rows[0].map(normalizeHeader);
        const column = name =>
          headers.indexOf(normalizeHeader(name));

        const indexes = {
          type: column("type"),
          category: column("category"),
          number: column("questionNumber"),
          question: column("question"),
          A: column("optionA"),
          B: column("optionB"),
          C: column("optionC"),
          D: column("optionD"),
          answer: column("answer")
        };

        const required = [
          ["category", indexes.category],
          ["questionNumber", indexes.number],
          ["question", indexes.question],
          ["optionA", indexes.A],
          ["optionB", indexes.B],
          ["optionC", indexes.C],
          ["optionD", indexes.D],
          ["answer", indexes.answer]
        ];

        const missing = required
          .filter(([, index]) => index === -1)
          .map(([name]) => name);

        if (missing.length) {
          throw new Error(
            "Missing CSV columns: " + missing.join(", ")
          );
        }

        const validCategories = [
          "bible",
          "anglicanism",
          "current_affairs"
        ];

        const questions = [];

        for (let i = 1; i < rows.length; i++) {
          const cells = rows[i];

          const get = index =>
            index >= 0 ? String(cells[index] || "").trim() : "";

          const category = get(indexes.category)
            .toLowerCase()
            .replace(/[\s-]+/g, "_");

          const questionNumber = get(indexes.number);
          const question = get(indexes.question);
          const answer = get(indexes.answer);
          const type = normalizeType(get(indexes.type));

          const options = [
            get(indexes.A),
            get(indexes.B),
            get(indexes.C),
            get(indexes.D)
          ];

          if (!validCategories.includes(category)) {
            throw new Error(
              `Row ${i + 1}: Invalid category "${category}".`
            );
          }

          if (!questionNumber || !question || !answer) {
            throw new Error(
              `Row ${i + 1}: Question number, question and answer are required.`
            );
          }

          if (type === "multiple_choice") {
            if (options.some(option => !option)) {
              throw new Error(
                `Row ${i + 1}: All four options are required.`
              );
            }

            if (!options.some(
              option =>
                option.toLowerCase() === answer.toLowerCase()
            )) {
              throw new Error(
                `Row ${i + 1}: The answer must match one of the four options.`
              );
            }
          }

          questions.push({
            type,
            category,
            questionNumber,
            question,
            options: type === "fill_blank" ? [] : options,
            answer
          });
        }

        localStorage.setItem(
          "quizQuestions",
          JSON.stringify(questions)
        );

        showStatus(
          `Successfully imported ${questions.length} questions.`
        );

      } catch (error) {
        showStatus(
          error.message || "Could not import the CSV file.",
          true
        );
      }
    };

    reader.onerror = () => {
      showStatus("Could not read the selected file.", true);
    };

    reader.readAsText(file, "UTF-8");
  });
});
