
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

  function normalizeHeader(value) {
    return String(value || "")
      .replace(/^\uFEFF/, "")
      .trim()
      .toLowerCase()
      .replace(/[\s_-]+/g, "");
  }

  function normalizeValue(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, "_");
  }

  function normalizeType(value) {
    const type = normalizeValue(value).replace(/_/g, "");

    if (
      ["fillblank", "fillinthegap", "fillintheblank"].includes(type)
    ) {
      return "fill_blank";
    }

    return "multiple_choice";
  }

  function normalizeTopic(value) {
    const topic = normalizeValue(value);

    if (["timothy", "life_of_timothy", "the_life_of_timothy"].includes(topic)) {
      return "life_of_timothy";
    }

    if (["esther", "life_of_esther", "the_life_of_esther"].includes(topic)) {
      return "life_of_esther";
    }

    return topic;
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
      } else if ((char === "\n" || char === "\r") && !insideQuotes) {
        if (char === "\r" && next === "\n") i++;

        row.push(cell.trim());
        if (row.some(value => value !== "")) rows.push(row);

        row = [];
        cell = "";
      } else {
        cell += char;
      }
    }

    row.push(cell.trim());
    if (row.some(value => value !== "")) rows.push(row);

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
        const column = name => headers.indexOf(normalizeHeader(name));

        const indexes = {
          type: column("type"),
          category: column("category"),
          topic: column("topic"),
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
          throw new Error("Missing CSV columns: " + missing.join(", "));
        }

        const validCategories = [
          "bible",
          "anglicanism",
          "current_affairs"
        ];

        const questions = [];
        const seenKeys = new Set();

        for (let i = 1; i < rows.length; i++) {
          const cells = rows[i];
          const get = index =>
            index >= 0 ? String(cells[index] || "").trim() : "";

          const category = normalizeValue(get(indexes.category));
          const questionNumber = Number(get(indexes.number));
          const question = get(indexes.question);
          const rawAnswer = get(indexes.answer);
          const type = normalizeType(get(indexes.type));
          const topic = normalizeTopic(get(indexes.topic));

          const options = [
            get(indexes.A),
            get(indexes.B),
            get(indexes.C),
            get(indexes.D)
          ];

          if (!validCategories.includes(category)) {
            throw new Error(`Row ${i + 1}: Invalid category "${category}".`);
          }

          if (!Number.isInteger(questionNumber) || questionNumber < 1) {
            throw new Error(`Row ${i + 1}: Question number must be a positive integer.`);
          }

          if (!question || !rawAnswer) {
            throw new Error(`Row ${i + 1}: Question and answer are required.`);
          }

          if (
            category === "bible" &&
            !["life_of_timothy", "life_of_esther"].includes(topic)
          ) {
            throw new Error(
              `Row ${i + 1}: Bible questions need a topic: life_of_timothy or life_of_esther.`
            );
          }

          if (category === "bible" && questionNumber > 25) {
            throw new Error(
              `Row ${i + 1}: Bible question numbers must be between 1 and 25.`
            );
          }

          let answer = rawAnswer;

          if (type === "multiple_choice") {
            if (options.some(option => !option)) {
              throw new Error(`Row ${i + 1}: All four options are required.`);
            }

            const letterMatch = rawAnswer.match(/^[A-D]$/i);

            if (letterMatch) {
              answer = options[rawAnswer.toUpperCase().charCodeAt(0) - 65];
            }

            if (!options.some(option =>
              option.toLowerCase() === answer.toLowerCase()
            )) {
              throw new Error(
                `Row ${i + 1}: Answer must be A, B, C, D, or match an option.`
              );
            }
          }

          const key = JSON.stringify([
            category,
            category === "bible" ? topic : "",
            questionNumber
          ]);

          if (seenKeys.has(key)) {
            throw new Error(
              `Row ${i + 1}: Duplicate question number ${questionNumber} for this category/topic.`
            );
          }

          seenKeys.add(key);

          questions.push({
            type,
            category,
            topic: category === "bible" ? topic : "",
            questionNumber: String(questionNumber),
            question,
            options: type === "fill_blank" ? [] : options,
            answer
          });
        }

        localStorage.setItem("quizQuestions", JSON.stringify(questions));
        localStorage.setItem("usedQuestions", JSON.stringify([]));
        localStorage.setItem("usedQuestionKeys", JSON.stringify([]));

        showStatus(`Successfully imported ${questions.length} questions.`);
      } catch (error) {
        showStatus(error.message || "Could not import the CSV file.", true);
      }
    };

    reader.onerror = () => {
      showStatus("Could not read the selected file.", true);
    };

    reader.readAsText(file, "UTF-8");
  });
});
