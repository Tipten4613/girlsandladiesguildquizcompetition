
document.addEventListener("DOMContentLoaded", () => {
  const categoryNameElement =
    document.getElementById("categoryName");

  const archdeaconryNameElement =
    document.getElementById("archdeaconryName");

  const questionNumberGrid =
    document.getElementById("questionNumberGrid");

  const questionNumberMessage =
    document.getElementById("questionNumberMessage");

  const categoryName =
    localStorage.getItem("selectedCategoryName") || "";

  const archdeaconryName =
    localStorage.getItem("selectedArchdeaconry") || "";

  const category =
    (localStorage.getItem("selectedCategory") || "")
      .toLowerCase()
      .replace(/\s+/g, "_");

  categoryNameElement.textContent =
    categoryName || "Not selected";

  archdeaconryNameElement.textContent =
    archdeaconryName || "Not selected";

// Create a shared key for each category and question number.
function getQuestionKey(number) {
  return JSON.stringify([
    category.trim().toLowerCase().replace(/\s+/g, "_"),
    number
  ]);
}
  // Load used question keys.
  let usedQuestionKeys = [];

  try {
    usedQuestionKeys = JSON.parse(
      localStorage.getItem("usedQuestionKeys") || "[]"
    );

    if (!Array.isArray(usedQuestionKeys)) {
      usedQuestionKeys = [];
    }
  } catch (error) {
    usedQuestionKeys = [];
  }

  // Load imported questions.
  let importedQuestions = [];

  try {
    importedQuestions = JSON.parse(
      localStorage.getItem("quizQuestions") || "[]"
    );

    if (!Array.isArray(importedQuestions)) {
      importedQuestions = [];
    }
  } catch (error) {
    importedQuestions = [];
  }

  const categoryQuestions = importedQuestions.filter(
    item => item.category === category
  );

  const importedNumbers = [
    ...new Set(
      categoryQuestions
        .map(item => Number(item.questionNumber))
        .filter(number => Number.isInteger(number) && number > 0)
    )
  ].sort((a, b) => a - b);

  // Show imported numbers, or 20 test numbers if nothing is imported.
  const questionNumbers = importedQuestions.length > 0
    ? importedNumbers
    : Array.from({ length: 20 }, (_, index) => index + 1);

  if (importedQuestions.length > 0 && questionNumbers.length === 0) {
    questionNumberMessage.textContent =
      "No questions have been imported for this category yet.";
    return;
  }

  questionNumbers.forEach(number => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "question-number-card";

    const isUsed = usedQuestionKeys.includes(getQuestionKey(number));

    if (isUsed) {
      card.classList.add("used");
      card.disabled = true;
    }

    card.innerHTML = `
      <strong>${number}</strong>
      <span>${isUsed ? "Used" : "Available"}</span>
    `;

    card.addEventListener("click", () => {
      localStorage.setItem("selectedQuestionNumber", number);

      questionNumberMessage.textContent =
        `Question ${number} selected. Opening question...`;

      window.location.href = "question.html";
    });

    questionNumberGrid.appendChild(card);
  });
});
