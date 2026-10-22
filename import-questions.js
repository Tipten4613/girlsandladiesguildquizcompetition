document.addEventListener("DOMContentLoaded", () => {
  const importForm = document.getElementById("importForm");
  const csvFileInput = document.getElementById("csvFile");
  const statusMessage = document.getElementById("statusMessage");

  if (!importForm || !csvFileInput) {
    console.error("Question import form or CSV input was not found.");
    return;
  }

  function normalizeHeader(header) {
    return String(header || "")
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

        if (row.some((value) => value !== "")) {
          rows.push(row);
        }

        row = [];
        cell = "";
      } else {
        cell += char;
      }
    }

    row.push(cell.trim());

    if (row.some((value) => value !== "")) {
      rows.push(row);
    }

    return rows;
  }

  function showStatus(message, isError = false) {
    if (statusMessage) {
      statusMessage.textContent = message;
      statusMessage.style.color = isError ? "red" : "green";
    } else {
      alert(message);
    }
  }

  importForm.addEventListener("submit", (event) => {
    event.preventDefault();

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
          showStatus("The CSV file has no question rows.", true);
          return;
        }

        const headers = rows[0].map(normalizeHeader);
        const column = (name) => headers.indexOf(normalizeHeader(name));

        const categoryIndex = column("category");
        const numberIndex = column("questionNumber");
        const questionIndex = column("question");
        const optionAIndex = column("optionA");
        const optionBIndex = column("optionB");
        const optionCIndex = column("optionC");
        const optionDIndex = column("optionD");
        const answerIndex = column("answer");
        const typeIndex = column("type");

        const required = [
          ["category", categoryIndex],
          ["questionNumber", numberIndex],
          ["question", questionIndex],
          ["optionA", optionAIndex],
          ["optionB", optionBIndex],
          ["optionC", optionCIndex],
          ["optionD", optionDIndex],
          ["answer", answerIndex],
        ];

        const missing = required
          .filter(([, index]) => index === -1)
          .map(([name]) => name);

        if (missing.length) {
          showStatus(
            "Missing CSV columns: " + missing.join(", "),
            true
          );
          return;
        }

        const validCategories = [
          "bible",
          "anglicanism",
          "current_affairs",
        ];

        const questions = [];

        for (let i = 1; i < rows.length; i++) {
          const cells = rows[i];

          const get = (index) =>
            index >= 0 ? String(cells[index] || "").trim() : "";

          const category = get(categoryIndex)
            .toLowerCase()
            .replace(/[\s-]+/g, "_");

          const questionNumber = get(numberIndex);
          const question = get(questionIndex);
          const options = [
            get(optionAIndex),
            get(optionBIndex),
            get(optionCIndex),
            get(optionDIndex),
          ];
          const answer = get(answerIndex);
          const type = normalizeType(get(typeIndex));

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
            if (options.some((option) => !option)) {
              throw new Error(
                `Row ${i + 1}: Multiple-choice questions need all four options.`
              );
            }

            if (!options.some(
              (option) => option.toLowerCase() === answer.toLowerCase()
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
            answer,
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
        showStatus(error.message || "Could not import the CSV file.", true);
      }
    };

    reader.onerror = () => {
      showStatus("Could not read the selected file.", true);
    };

    reader.readAsText(file);
  });
});
