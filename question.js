
document.addEventListener("DOMContentLoaded", () => {
  const questionCategory = document.getElementById("questionCategory");
  const questionArchdeaconry = document.getElementById("questionArchdeaconry");
  const questionNumber = document.getElementById("questionNumber");
  const questionText = document.getElementById("questionText");
  const answerOptions = document.getElementById("answerOptions");
  const submitAnswerBtn = document.getElementById("submitAnswerBtn");
  const answerMessage = document.getElementById("answerMessage");
  const timerElement = document.getElementById("timer");
  const readQuestionBtn = document.getElementById("readQuestionBtn");

  const category = (
    localStorage.getItem("selectedCategory") || ""
  ).toLowerCase().replace(/\s+/g, "_");

  const categoryName =
    localStorage.getItem("selectedCategoryName") || "Not selected";

  const archdeaconry =
    localStorage.getItem("selectedArchdeaconry") || "Not selected";

  const selectedNumber =
    Number(localStorage.getItem("selectedQuestionNumber"));

  questionCategory.textContent = categoryName;
  questionArchdeaconry.textContent = archdeaconry;
  questionNumber.textContent = selectedNumber || "Not selected";

  // Sample questions are used only when no questions have been imported.
  const sampleQuestions = {
    bible: {
      1: {
        question: "Who built the ark?",
        options: ["Moses", "Noah", "Abraham", "David"],
        answer: "Noah"
      },
      2: {
        question: "How many books are in the New Testament?",
        options: ["27", "39", "66", "12"],
        answer: "27"
      }
    },
    anglicanism: {
      1: {
        question: "What is the main book used in Christian worship?",
        options: ["The Bible", "A dictionary", "A newspaper", "A novel"],
        answer: "The Bible"
      },
      2: {
        question: "What colour is commonly associated with Christmas in Anglican worship?",
        options: ["White", "Black", "Grey", "Brown"],
        answer: "White"
      }
    },
    current_affairs: {
      1: {
        question: "What does UN stand for?",
        options: [
          "United Nations",
          "Universal Network",
          "United Neighbours",
          "Union Nation"
        ],
        answer: "United Nations"
      },
      2: {
        question: "What is the capital of Nigeria?",
        options: ["Lagos", "Ibadan", "Abuja", "Kano"],
        answer: "Abuja"
      }
    }
  };

  // Load imported questions safely.
  let importedQuestions = [];

  try {
    const savedQuestions = JSON.parse(
      localStorage.getItem("quizQuestions") || "[]"
    );

    if (Array.isArray(savedQuestions)) {
      importedQuestions = savedQuestions;
    }
  } catch (error) {
    importedQuestions = [];
  }

  const importedQuestion = importedQuestions.find(item =>
    item.category === category &&
    Number(item.questionNumber) === selectedNumber
  );

  // Use imported questions if any exist; otherwise use sample questions.
  const selectedQuestion = importedQuestion
    ? {
        question: importedQuestion.question,
        options: importedQuestion.options,
        answer: importedQuestion.answer
      }
    : importedQuestions.length === 0
      ? sampleQuestions[category]?.[selectedNumber]
      : null;

  if (
    !selectedQuestion ||
    !selectedQuestion.question ||
    !Array.isArray(selectedQuestion.options) ||
    selectedQuestion.options.length !== 4 ||
    !selectedQuestion.options.includes(selectedQuestion.answer)
  ) {
    questionText.textContent = "This question is not available.";
    answerMessage.textContent =
      "Check your imported questions and selected question number.";
    submitAnswerBtn.disabled = true;

    if (readQuestionBtn) {
      readQuestionBtn.disabled = true;
    }

    return;
  }

  questionText.textContent = selectedQuestion.question;

  let selectedAnswer = null;
  let submitted = false;
  let timerFinished = false;
  let timeLeft = 30;

  // SPEECH FEATURE: prefer Nigerian English if the device provides it.
  function readQuestionAloud() {
    if (!("speechSynthesis" in window)) {
      answerMessage.textContent =
        "Voice reading is not supported by this browser.";
      return;
    }

    // Stop any previous reading before replaying.
    window.speechSynthesis.cancel();

    const spokenText =
  "Question. " + selectedQuestion.question + ". " +
  selectedQuestion.options.map((option, index) => {
    const letter = ["A", "B", "C", "D"][index];
    return `Option ${letter}. ${option}.`;
  }).join(" ");

const utterance = new SpeechSynthesisUtterance(spokenText);

    const voices = window.speechSynthesis.getVoices();

    const nigerianVoice = voices.find(voice =>
      /^en[-_]NG$/i.test(voice.lang)
    );

    const englishFallback = voices.find(voice =>
      /^en[-_]GB$/i.test(voice.lang)
    ) || voices.find(voice =>
      /^en[-_]US$/i.test(voice.lang)
    ) || voices.find(voice =>
      /^en/i.test(voice.lang)
    );

    const preferredVoice = nigerianVoice || englishFallback;

    if (preferredVoice) {
      utterance.voice = preferredVoice;
      utterance.lang = preferredVoice.lang;
    } else {
      // Ask the browser for Nigerian English if no voice is listed.
      utterance.lang = "en-NG";
    }

    utterance.rate = 0.9;
    utterance.pitch = 1;

    window.speechSynthesis.speak(utterance);
  }

  if (readQuestionBtn) {
    readQuestionBtn.addEventListener("click", () => {
      if (!submitted) {
        readQuestionAloud();
      }
    });
  }

  // Display answer buttons.
  answerOptions.innerHTML = "";

  selectedQuestion.options.forEach(option => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "answer-option";
    button.textContent = option;

    button.addEventListener("click", () => {
      if (submitted) return;

      answerOptions.querySelectorAll(".answer-option").forEach(btn => {
        btn.classList.remove("selected");
      });

      button.classList.add("selected");
      selectedAnswer = option;
    });

    answerOptions.appendChild(button);
  });

  // Start the 30-second timer.
  timerElement.textContent = timeLeft;

  const timer = setInterval(() => {
    if (submitted) return;

    timeLeft--;
    timerElement.textContent = timeLeft;

    if (timeLeft <= 10) {
      timerElement.parentElement.classList.add("timer-warning");
    }

    if (timeLeft <= 5) {
      timerElement.parentElement.classList.add("timer-danger");
    }

    if (timeLeft <= 0) {
      timerFinished = true;
      submitAnswer();
    }
  }, 1000);

  // Try reading the question automatically.
  // Some browsers require the participant to press the replay button.
  if ("speechSynthesis" in window) {
    window.setTimeout(() => {
      if (!submitted) {
        readQuestionAloud();
      }
    }, 500);
  }

  submitAnswerBtn.addEventListener("click", () => {
    submitAnswer();
  });

  function submitAnswer() {
    if (submitted) return;

    submitted = true;
    submitAnswerBtn.disabled = true;
    clearInterval(timer);

    // Stop the spoken question when the answer is submitted.
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    if (readQuestionBtn) {
      readQuestionBtn.disabled = true;
    }

    const isCorrect = selectedAnswer === selectedQuestion.answer;
    const marks = isCorrect ? 5 : 0;

    // Track each question across all archdeaconries in the same category.
    let usedQuestionKeys = [];

    try {
      const savedKeys = JSON.parse(
        localStorage.getItem("usedQuestionKeys") || "[]"
      );

      if (Array.isArray(savedKeys)) {
        usedQuestionKeys = savedKeys;
      }
    } catch (error) {
      usedQuestionKeys = [];
    }

    const questionKey = JSON.stringify([
      category.trim().toLowerCase().replace(/\s+/g, "_"),
      selectedNumber
    ]);

    if (!usedQuestionKeys.includes(questionKey)) {
      usedQuestionKeys.push(questionKey);

      localStorage.setItem(
        "usedQuestionKeys",
        JSON.stringify(usedQuestionKeys)
      );
    }

    // Save score using the existing scoreboard data format.
    let scores = [];

    try {
      const savedScores = JSON.parse(
        localStorage.getItem("scores") || "[]"
      );

      if (Array.isArray(savedScores)) {
        scores = savedScores;
      }
    } catch (error) {
      scores = [];
    }

    scores.push({
      category: categoryName,
      archdeaconry: archdeaconry,
      questionNumber: selectedNumber,
      marks: marks,
      correct: isCorrect
    });

    localStorage.setItem("scores", JSON.stringify(scores));

    // Display feedback.
    if (isCorrect) {
      answerMessage.textContent = "Correct answer!";
    } else if (timerFinished) {
      answerMessage.textContent =
        `Time is up! The correct answer is ${selectedQuestion.answer}.`;
    } else {
      answerMessage.textContent =
        `Incorrect. The correct answer is ${selectedQuestion.answer}.`;
    }

    // Return to the existing archdeaconry page.
    setTimeout(() => {
      window.location.href = "archdeaconry.html";
    }, 2500);
  }
});
