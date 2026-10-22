
document.addEventListener("DOMContentLoaded", () => {
  const questionElement = document.getElementById("questionText");
  const optionsElement = document.getElementById("answerOptions");
  const timerElement = document.getElementById("timer");
  const correctButton = document.getElementById("correctBtn");
  const wrongButton = document.getElementById("wrongBtn");
  const answerElement = document.getElementById("correctAnswer");
  const messageElement = document.getElementById("answerMessage");

  const categoryElement = document.getElementById("questionCategory");
  const archdeaconryElement = document.getElementById("questionArchdeaconry");
  const numberElement = document.getElementById("questionNumber");
  const readButton = document.getElementById("readQuestionBtn");

  const params = new URLSearchParams(window.location.search);

  function getJSON(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
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

  const category = normalize(
    params.get("category") ||
    localStorage.getItem("selectedCategory") ||
    "bible"
  );

  const questionNumber =
    params.get("questionNumber") ||
    params.get("number") ||
    localStorage.getItem("selectedQuestionNumber") ||
    "";

  const archdeaconry =
    params.get("archdeaconry") ||
    localStorage.getItem("selectedArchdeaconry") ||
    "";

  let seconds = 30;
  let timerInterval = null;
  let questionFinished = false;

  function showMessage(message) {
    if (messageElement) {
      messageElement.textContent = message;
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
      timerElement.textContent = seconds;
    }
  }

  function findQuestion() {
    const questions = getJSON("quizQuestions", []);

    if (!Array.isArray(questions)) return null;

    return questions.find((item) => {
      const sameCategory =
        normalize(item.category) === category;

      const sameNumber =
        String(item.questionNumber) === String(questionNumber);

      const sameArchdeaconry =
        !item.archdeaconry ||
        !archdeaconry ||
        normalize(item.archdeaconry) === normalize(archdeaconry);

      return sameCategory && sameNumber && sameArchdeaconry;
    });
  }

  const currentQuestion = findQuestion();

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

  function markQuestionUsed() {
    const used = getJSON("usedQuestions", []);
    const key = JSON.stringify([category, String(questionNumber)]);

    if (!used.includes(key)) {
      used.push(key);
      localStorage.setItem("usedQuestions", JSON.stringify(used));
    }
  }

  function saveScore(isCorrect) {
    const scores = getJSON("quizScores", {});

    const contestant =
      localStorage.getItem("contestantName") ||
      localStorage.getItem("participantName") ||
      localStorage.getItem("teamName") ||
      "Contestant";

    if (!scores[contestant] || typeof scores[contestant] !== "object") {
      scores[contestant] = {
        bible: 0,
        anglicanism: 0,
        current_affairs: 0,
        overall: 0
      };
    }

    const points = isCorrect ? 5 : 0;

    if (Object.prototype.hasOwnProperty.call(
      scores[contestant],
      category
    )) {
      scores[contestant][category] =
        (Number(scores[contestant][category]) || 0) + points;
    }

    scores[contestant].overall =
      (Number(scores[contestant].bible) || 0) +
      (Number(scores[contestant].anglicanism) || 0) +
      (Number(scores[contestant].current_affairs) || 0);

    localStorage.setItem("quizScores", JSON.stringify(scores));
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
        "Correct answer: " + currentQuestion.answer;
    }

    showMessage(
      isCorrect
        ? "Marked CORRECT — 5 marks awarded."
        : "Marked WRONG — 0 marks awarded."
    );

    setTimeout(returnToArchdeaconry, 2500);
  }

  if (!currentQuestion) {
    if (questionElement) {
      questionElement.textContent = "Question not found.";
    }

    showMessage(
      "Please check the imported questions and selected question number."
    );

    if (optionsElement) optionsElement.replaceChildren();
    if (correctButton) correctButton.disabled = true;
    if (wrongButton) wrongButton.disabled = true;
    if (timerElement) timerElement.textContent = "—";

    return;
  }

  if (questionElement) {
    questionElement.textContent = currentQuestion.question;
  }

  if (categoryElement) {
    categoryElement.textContent = category.replace(/_/g, " ");
  }

  if (archdeaconryElement) {
    archdeaconryElement.textContent = archdeaconry || "—";
  }

  if (numberElement) {
    numberElement.textContent = questionNumber;
  }

  if (optionsElement) {
    optionsElement.replaceChildren();

    const type = normalize(currentQuestion.type);

    if (type === "fill_blank" || type === "fillinthegap") {
      const note = document.createElement("p");
      note.textContent = "Fill in the gap";
      optionsElement.appendChild(note);
    } else {
      const options = Array.isArray(currentQuestion.options)
        ? currentQuestion.options
        : [];

      options.forEach((option, index) => {
        const optionElement = document.createElement("p");
        optionElement.textContent =
          String.fromCharCode(65 + index) + ". " + option;

        optionsElement.appendChild(optionElement);
      });
    }
  }

  if (answerElement) {
    answerElement.style.display = "none";
    answerElement.textContent = "";
  }

  if (correctButton) {
    correctButton.disabled = false;
    correctButton.addEventListener("click", () => finishQuestion(true));
  }

  if (wrongButton) {
    wrongButton.disabled = false;
    wrongButton.addEventListener("click", () => finishQuestion(false));
  }

  if (readButton) {
    readButton.addEventListener("click", () => {
      if (!("speechSynthesis" in window)) {
        showMessage("Read-aloud is not supported in this browser.");
        return;
      }

      window.speechSynthesis.cancel();

      const textToRead = [
        currentQuestion.question,
        ...(Array.isArray(currentQuestion.options)
          ? currentQuestion.options
          : [])
      ].join(". ");

      const speech = new SpeechSynthesisUtterance(textToRead);
      speech.lang = "en-NG";
      window.speechSynthesis.speak(speech);
    });
  }

  updateTimer();

  timerInterval = setInterval(() => {
    if (questionFinished) {
      stopTimer();
      return;
    }

    seconds--;
    updateTimer();

    if (seconds <= 0) {
      stopTimer();
      showMessage(
        "Time is up! Judge, please mark the answer CORRECT or WRONG."
      );
    }
  }, 1000);
});
