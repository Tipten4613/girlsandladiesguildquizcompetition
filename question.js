document.addEventListener("DOMContentLoaded", () => {
  const questionElement = document.getElementById("question");
  const optionsElement = document.getElementById("options");
  const timerElement = document.getElementById("timer");
  const correctButton = document.getElementById("correctBtn");
  const wrongButton = document.getElementById("wrongBtn");
  const answerElement = document.getElementById("correctAnswer");
  const messageElement = document.getElementById("message");

  const params = new URLSearchParams(window.location.search);

  const category = (
    params.get("category") ||
    localStorage.getItem("selectedCategory") ||
    "bible"
  ).toLowerCase();

  const questionNumber =
    params.get("questionNumber") ||
    params.get("number") ||
    localStorage.getItem("selectedQuestionNumber") ||
    "";

  const archdeaconry =
    params.get("archdeaconry") ||
    localStorage.getItem("selectedArchdeaconry") ||
    "";

  let timer = 30;
  let timerInterval = null;
  let questionFinished = false;

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

  function showMessage(text) {
    if (messageElement) {
      messageElement.textContent = text;
    }
  }

  function stopTimer() {
    if (timerInterval !== null) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function updateTimer() {
    if (timerElement) {
      timerElement.textContent = `Time: ${timer}s`;
    }
  }

  function getAllQuestions() {
    const imported = getJSON("quizQuestions", []);
    return Array.isArray(imported) ? imported : [];
  }

  function findQuestion() {
    const questions = getAllQuestions();

    return questions.find((item) => {
      const sameCategory =
        normalize(item.category) === normalize(category);

      const sameNumber =
        String(item.questionNumber) === String(questionNumber);

      const sameArchdeaconry =
        !item.archdeaconry ||
        !archdeaconry ||
        normalize(item.archdeaconry) === normalize(archdeaconry);

      return sameCategory && sameNumber && sameArchdeaconry;
    });
  }

  function getUsedQuestions() {
    return getJSON("usedQuestions", []);
  }

  function markQuestionUsed() {
    const used = getUsedQuestions();
    const key = JSON.stringify([
      normalize(category),
      String(questionNumber),
    ]);

    if (!used.includes(key)) {
      used.push(key);
      localStorage.setItem("usedQuestions", JSON.stringify(used));
    }
  }

  function getScores() {
    return getJSON("quizScores", {});
  }

  function saveScore(isCorrect) {
    const scores = getScores();

    const contestant =
      localStorage.getItem("contestantName") ||
      localStorage.getItem("participantName") ||
      localStorage.getItem("teamName") ||
      "Contestant";

    if (!scores[contestant]) {
      scores[contestant] = {
        bible: 0,
        anglicanism: 0,
        current_affairs: 0,
        overall: 0,
      };
    }

    if (typeof scores[contestant] === "number") {
      scores[contestant] = {
        bible: 0,
        anglicanism: 0,
        current_affairs: 0,
        overall: scores[contestant],
      };
    }

    const points = isCorrect ? 5 : 0;
    const normalizedCategory = normalize(category);

    if (
      Object.prototype.hasOwnProperty.call(
        scores[contestant],
        normalizedCategory
      )
    ) {
      scores[contestant][normalizedCategory] += points;
    } else {
      scores[contestant][normalizedCategory] = points;
    }

    scores[contestant].overall =
      (Number(scores[contestant].bible) || 0) +
      (Number(scores[contestant].anglicanism) || 0) +
      (Number(scores[contestant].current_affairs) || 0);

    localStorage.setItem("quizScores", JSON.stringify(scores));
  }

  function returnToArchdeaconry() {
    const destination = new URL(
      "archdeaconry.html",
      window.location.href
    );

    destination.searchParams.set("category", category);

    if (archdeaconry) {
      destination.searchParams.set("archdeaconry", archdeaconry);
    }

    window.location.href = destination.href;
  }

  function finishQuestion(isCorrect) {
    if (questionFinished) return;

    questionFinished = true;
    stopTimer();

    if (correctButton) correctButton.disabled = true;
    if (wrongButton) wrongButton.disabled = true;

    saveScore(isCorrect);
    markQuestionUsed();

    if (answerElement) {
      answerElement.style.display = "block";
      answerElement.textContent =
        `Correct answer: ${currentQuestion.answer}`;
    }

    showMessage(
      isCorrect
        ? "Marked CORRECT. 5 marks awarded."
        : "Marked WRONG. 0 marks awarded."
    );

    setTimeout(returnToArchdeaconry, 2500);
  }

  const currentQuestion = findQuestion();

  if (!currentQuestion) {
    if (questionElement) {
      questionElement.textContent = "Question not found.";
    }

    showMessage(
      "Check that the question was imported and the question number is correct."
    );

    if (optionsElement) optionsElement.replaceChildren();
    if (timerElement) timerElement.textContent = "";
    if (correctButton) correctButton.disabled = true;
    if (wrongButton) wrongButton.disabled = true;

    return;
  }

  if (questionElement) {
    questionElement.textContent = currentQuestion.question;
  }

  if (optionsElement) {
    optionsElement.replaceChildren();

    const type = normalize(currentQuestion.type);

    if (
      type === "fill_blank" ||
      type === "fillinthegap" ||
      type === "fillintheblank"
    ) {
      const note = document.createElement("p");
      note.textContent = "Question type: Fill in the gap";
      optionsElement.appendChild(note);
    } else {
      const options = Array.isArray(currentQuestion.options)
        ? currentQuestion.options
        : [];

      options.forEach((option, index) => {
        const optionElement = document.createElement("p");
        optionElement.textContent =
          `${String.fromCharCode(65 + index)}. ${option}`;
        optionsElement.appendChild(optionElement);
      });
    }
  }

  if (answerElement) {
    answerElement.style.display = "none";
    answerElement.textContent = "";
  }

  if (correctButton) {
    correctButton.addEventListener("click", () => {
      finishQuestion(true);
    });
  }

  if (wrongButton) {
    wrongButton.addEventListener("click", () => {
      finishQuestion(false);
    });
  }

  updateTimer();

  timerInterval = setInterval(() => {
    if (questionFinished) {
      stopTimer();
      return;
    }

    timer--;

    if (timer <= 0) {
      timer = 0;
      updateTimer();
      stopTimer();
      showMessage(
        "Time is up. Judge: please mark the answer CORRECT or WRONG."
      );
      return;
    }

    updateTimer();
  }, 1000);
});
