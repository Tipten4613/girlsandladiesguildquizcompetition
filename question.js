
document.addEventListener("DOMContentLoaded", () => {
  const questionElement = document.getElementById("questionText");
  const optionsElement = document.getElementById("answerOptions");
  const timerElement = document.getElementById("timer");
  const answerElement = document.getElementById("correctAnswer");
  const messageElement = document.getElementById("answerMessage");
  const categoryElement = document.getElementById("questionCategory");
  const archdeaconryElement = document.getElementById("questionArchdeaconry");
  const numberElement = document.getElementById("questionNumber");
  const readButton = document.getElementById("readQuestionBtn");

  const correctButton = document.getElementById("correctBtn");
  const wrongButton = document.getElementById("wrongBtn");

  if (correctButton) correctButton.style.display = "none";
  if (wrongButton) wrongButton.style.display = "none";

  const params = new URLSearchParams(window.location.search);

  function getJSON(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  }

  function normalize(value) {
    return String(value ?? "")
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, "_");
  }

  const category = normalize(
    params.get("category") ||
    localStorage.getItem("selectedCategory") ||
    "bible"
  );

  const questionNumber = String(
    params.get("questionNumber") ||
    params.get("number") ||
    localStorage.getItem("selectedQuestionNumber") ||
    ""
  );

  const archdeaconry =
    params.get("archdeaconry") ||
    localStorage.getItem("selectedArchdeaconry") ||
    "";

  const topic = normalize(
    params.get("topic") ||
    localStorage.getItem("selectedBibleTopic") ||
    ""
  );

  const topicName =
    localStorage.getItem("selectedBibleTopicName") || "";

  let seconds = 30;
  let timerInterval = null;
  let questionFinished = false;
  let submitButton = null;
  let currentQuestion = null;

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

    return questions.find(item => {
      const sameCategory =
        normalize(item.category) === category;

      const sameNumber =
        String(item.questionNumber) === questionNumber;

      const sameTopic =
        category !== "bible" ||
        normalize(item.topic) === topic;

      const sameArchdeaconry =
        !item.archdeaconry ||
        !archdeaconry ||
        normalize(item.archdeaconry) ===
          normalize(archdeaconry);

      return sameCategory &&
        sameNumber &&
        sameTopic &&
        sameArchdeaconry;
    });
  }

  function getOptions() {
    if (Array.isArray(currentQuestion.options)) {
      return currentQuestion.options;
    }

    return [
      currentQuestion.optionA,
      currentQuestion.optionB,
      currentQuestion.optionC,
      currentQuestion.optionD
    ].filter(value => value !== undefined && value !== "");
  }

  function isCorrectAnswer(selectedValue) {
    const options = getOptions();
    const answer = String(currentQuestion.answer ?? "").trim();

    if (/^[A-D]$/i.test(answer)) {
      const index = answer.toUpperCase().charCodeAt(0) - 65;
      return selectedValue === String(index);
    }

    const selectedOption = options[Number(selectedValue)];

    return normalize(selectedValue) === normalize(answer) ||
      (
        selectedOption !== undefined &&
        normalize(selectedOption) === normalize(answer)
      );
  }

  function markQuestionUsed() {
    const used = getJSON("usedQuestions", []);

    const key = JSON.stringify([
      category,
      category === "bible" ? topic : "",
      questionNumber
    ]);

    if (!used.includes(key)) {
      used.push(key);
      localStorage.setItem("usedQuestions", JSON.stringify(used));
    }
  }

  function saveScore(isCorrect) {
    const scores = getJSON("quizScores", {});

 const contestant =
  archdeaconry ||
  localStorage.getItem("selectedArchdeaconry") ||
  localStorage.getItem("contestantName") ||
  localStorage.getItem("participantName") ||
  localStorage.getItem("teamName") ||
  "Contestant";

    if (!scores[contestant] ||
        typeof scores[contestant] !== "object") {
      scores[contestant] = {
        bible: 0,
        anglicanism: 0,
        current_affairs: 0,
        overall: 0
      };
    }

    const points = isCorrect ? 5 : 0;

    if (Object.prototype.hasOwnProperty.call(
      scores[contestant], category
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

  function returnToArchdeaconry() {
    window.location.href = "archdeaconry.html";
  }

  function finishQuestion(isCorrect, timedOut = false) {
    if (questionFinished) return;

    questionFinished = true;
    stopTimer();

    if (submitButton) submitButton.disabled = true;

    document.querySelectorAll(
      'input[name="contestantAnswer"]'
    ).forEach(input => {
      input.disabled = true;
    });

    saveScore(isCorrect);
    markQuestionUsed();

    if (answerElement) {
      answerElement.style.display = "block";
      answerElement.textContent =
        "Correct answer: " + currentQuestion.answer;
    }


if (timedOut) {
  showMessage("Time is up!");
} else if (isCorrect) {
  showMessage("Correct answer! 5 marks awarded.");
} else {
  showMessage("Wrong answer!");
}

if (answerElement) {
  answerElement.style.display = "block";
  answerElement.textContent =
    "Correct answer: " + currentQuestion.answer;

  if (!isCorrect && !timedOut) {
    answerElement.style.color = "red";
    answerElement.style.fontWeight = "bold";
  } else {
    answerElement.style.color = "";
    answerElement.style.fontWeight = "";
  }
}

    setTimeout(returnToArchdeaconry, 2500);
  }

  currentQuestion = findQuestion();

  if (!currentQuestion) {
    if (questionElement) {
      questionElement.textContent = "Question not found.";
    }

    showMessage(
      "Please check the imported questions, selected topic and question number."
    );

    if (optionsElement) optionsElement.replaceChildren();
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
    archdeaconryElement.textContent =
      category === "bible"
        ? (topicName || topic.replace(/_/g, " "))
        : (archdeaconry || "—");
  }

  if (numberElement) {
    numberElement.textContent = questionNumber;
  }

  if (answerElement) {
    answerElement.style.display = "none";
    answerElement.textContent = "";
  }

  if (optionsElement) {
    optionsElement.replaceChildren();

    const type = normalize(currentQuestion.type);
    const isFillBlank =
      type === "fill_blank" || type === "fillinthegap";

    const form = document.createElement("form");
    form.id = "contestantAnswerForm";

    if (isFillBlank) {
      const input = document.createElement("input");
      input.type = "text";
      input.name = "contestantAnswer";
      input.id = "contestantAnswer";
      input.placeholder = "Type your answer here";
      input.autocomplete = "off";
      input.required = true;
      form.appendChild(input);
    } else {
      const options = getOptions();

      options.forEach((option, index) => {
        const label = document.createElement("label");
        label.className = "answer-option";

        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = "contestantAnswer";
        radio.value = String(index);
        radio.required = true;

        const optionText = document.createElement("span");
        optionText.className = "answer-option-text";
        optionText.textContent =
          String.fromCharCode(65 + index) + ". " + option;

        label.appendChild(radio);
        label.appendChild(optionText);
        form.appendChild(label);
      });
    }

    submitButton = document.createElement("button");
    submitButton.type = "submit";
    submitButton.className = "submit-button";
    submitButton.textContent = "Submit Answer";

    form.appendChild(submitButton);
    optionsElement.appendChild(form);

    form.addEventListener("submit", event => {
      event.preventDefault();

      if (questionFinished) return;

      const selected = form.querySelector(
        'input[name="contestantAnswer"]:checked'
      );

      const textInput = form.querySelector(
        'input[name="contestantAnswer"][type="text"]'
      );

      if (!selected && !textInput) {
        showMessage(
          isFillBlank
            ? "Please enter your answer."
            : "Please select an answer."
        );
        return;
      }

      const value = selected
        ? selected.value
        : textInput.value.trim();

      if (!value) {
        showMessage("Please enter your answer.");
        return;
      }

      const isCorrect = selected
        ? isCorrectAnswer(value)
        : normalize(value) === normalize(currentQuestion.answer);

      finishQuestion(isCorrect);
    });
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
        ...getOptions()
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
      finishQuestion(false, true);
    }
  }, 1000);
});
