
document.addEventListener("DOMContentLoaded", () => {
  const categoryNameElement = document.getElementById("categoryName");
  const archdeaconryNameElement = document.getElementById("archdeaconryName");
  const questionNumberGrid = document.getElementById("questionNumberGrid");
  const questionNumberMessage = document.getElementById("questionNumberMessage");

  function getJSON(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value ?? fallback;
    } catch {
      return fallback;
    }
  }

  function normalize(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, "_");
  }

  const category = normalize(localStorage.getItem("selectedCategory"));
  const categoryName = localStorage.getItem("selectedCategoryName") || "";
  const archdeaconry = localStorage.getItem("selectedArchdeaconry") || "";
  const topic = normalize(localStorage.getItem("selectedBibleTopic"));
  const topicName = localStorage.getItem("selectedBibleTopicName") || "";

  if (categoryNameElement) {
    categoryNameElement.textContent = categoryName || "Not selected";
  }

  if (archdeaconryNameElement) {
    archdeaconryNameElement.textContent = archdeaconry || "Not selected";
  }

  if (!questionNumberGrid) return;

  if (category === "bible" && !["life_of_timothy", "life_of_esther"].includes(topic)) {
    if (questionNumberMessage) {
      questionNumberMessage.textContent =
        "Please choose The Life of Timothy or The Life of Esther first.";
    }
    return;
  }

  const importedQuestions = getJSON("quizQuestions", []);
  const questions = Array.isArray(importedQuestions) ? importedQuestions : [];

  const categoryQuestions = questions.filter(item =>
    normalize(item.category) === category &&
    (category !== "bible" || normalize(item.topic) === topic)
  );

  const importedNumbers = [
    ...new Set(
      categoryQuestions
        .map(item => Number(item.questionNumber))
        .filter(number => Number.isInteger(number) && number > 0)
    )
  ].sort((a, b) => a - b);

  const questionNumbers = questions.length > 0
    ? importedNumbers
    : Array.from({ length: 20 }, (_, index) => index + 1);

  if (questions.length > 0 && questionNumbers.length === 0) {
    if (questionNumberMessage) {
      questionNumberMessage.textContent =
        category === "bible"
          ? `No questions imported for ${topicName || topic}.`
          : "No questions have been imported for this category yet.";
    }
    return;
  }

  const usedQuestions = getJSON("usedQuestions", []);
  const used = Array.isArray(usedQuestions) ? usedQuestions : [];

  function getQuestionKey(number) {
    return JSON.stringify([
      category,
      category === "bible" ? topic : "",
      String(number)
    ]);
  }

  questionNumbers.forEach(number => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "question-number-card";

    const isUsed = used.includes(getQuestionKey(number));

    if (isUsed) {
      card.classList.add("used");
      card.disabled = true;
    }

    card.innerHTML = `
      <strong>${number}</strong>
      <span>${isUsed ? "Used" : "Available"}</span>
    `;

    card.addEventListener("click", () => {
      localStorage.setItem("selectedQuestionNumber", String(number));

      if (questionNumberMessage) {
        questionNumberMessage.textContent =
          `Question ${number} selected. Opening question...`;
      }

      window.location.href = "question.html";
    });

    questionNumberGrid.appendChild(card);
  });
});
