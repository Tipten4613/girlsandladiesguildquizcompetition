
document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".category-tab");
  const title = document.getElementById("selectedScoreboardTitle");
  const tableBody = document.getElementById("scoreboardBody");
  const message = document.getElementById("scoreboardMessage");
  const table = document.getElementById("scoreboardTable");
  const resetButton = document.getElementById("resetCompetitionBtn");

  const archdeaconries = [
    "Bethel Sanctuary", "Cathedral", "Ikire", "Odeomu", "Gbongan",
    "Orile-Owu", "Oluponna", "Owoope", "Apomu", "Ikoyi", "Iwo",
    "Wakajaye", "Asamu"
  ];

  const categoryNames = {
    bible: "Bible",
    anglicanism: "Anglicanism",
    current_affairs: "Current Affairs",
    overall: "Overall"
  };

  const categoryAliases = {
    bible: ["bible"],
    anglicanism: ["anglicanism"],
    current_affairs: ["current_affairs", "current affairs"]
  };

  const podiumIds = {
    1: "podiumFirst",
    2: "podiumSecond",
    3: "podiumThird"
  };

  function normalize(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[_-]/g, " ")
      .trim();
  }

  function getScoreData() {
    try {
      const savedTotals = JSON.parse(
        localStorage.getItem("quizScores") || "{}"
      );

      if (
        savedTotals &&
        typeof savedTotals === "object" &&
        !Array.isArray(savedTotals)
      ) {
        return { type: "totals", data: savedTotals };
      }
    } catch (error) {
      console.error("Unable to read quizScores:", error);
    }

    try {
      const savedEntries = JSON.parse(
        localStorage.getItem("scores") || "[]"
      );

      if (Array.isArray(savedEntries)) {
        return { type: "entries", data: savedEntries };
      }
    } catch (error) {
      console.error("Unable to read scores:", error);
    }

    return { type: "totals", data: {} };
  }

  function findArchdeaconry(contestant) {
    return archdeaconries.find(
      name => normalize(name) === normalize(contestant)
    ) || null;
  }

  function getResults(category) {
    const scoreData = getScoreData();

    const results = archdeaconries.map(name => ({
      name,
      participated: false,
      correct: "—",
      totalMarks: 0
    }));

    if (scoreData.type === "totals") {
      for (const [contestant, totals] of Object.entries(scoreData.data)) {
        const result = results.find(
          item => normalize(item.name) === normalize(contestant)
        );

        if (!result || !totals || typeof totals !== "object") {
          continue;
        }

        const bible = Number(totals.bible) || 0;
        const anglicanism = Number(totals.anglicanism) || 0;
        const currentAffairs = Number(totals.current_affairs) || 0;

        const correctQuestions =
          totals.correctQuestions &&
          typeof totals.correctQuestions === "object"
            ? totals.correctQuestions
            : {};

        const bibleCorrect =
          Number(correctQuestions.bible) || 0;

        const anglicanismCorrect =
          Number(correctQuestions.anglicanism) || 0;

        const currentAffairsCorrect =
          Number(correctQuestions.current_affairs) || 0;

        const overallCorrect =
          Number(correctQuestions.overall) || 0;

        const hasCategoryData =
          ["bible", "anglicanism", "current_affairs"].some(
            key => Object.prototype.hasOwnProperty.call(totals, key)
          );

        result.participated = hasCategoryData;

        // Correct questions for the selected category.
        if (category === "overall") {
          result.correct = overallCorrect;

          result.totalMarks =
            Number(totals.overall) ||
            bible + anglicanism + currentAffairs;
        } else if (category === "bible") {
          result.correct = bibleCorrect;
          result.totalMarks = bible;
        } else if (category === "anglicanism") {
          result.correct = anglicanismCorrect;
          result.totalMarks = anglicanism;
        } else if (category === "current_affairs") {
          result.correct = currentAffairsCorrect;
          result.totalMarks = currentAffairs;
        } else {
          result.correct = 0;
          result.totalMarks = 0;
        }
      }
    } else {
      // Compatibility with the older scores array format.
      const entries = scoreData.data;

      results.forEach(result => {
        const matching = entries.filter(score => {
          if (
            !score ||
            normalize(score.archdeaconry) !== normalize(result.name)
          ) {
            return false;
          }

          return category === "overall" ||
            (categoryAliases[category] || [category]).includes(
              normalize(score.category)
            );
        });

        if (matching.length > 0) {
          result.participated = true;

          result.totalMarks = matching.reduce(
            (sum, score) =>
              sum + (Number(score.marks) || 0),
            0
          );

          result.correct = matching.filter(score =>
            score.correct === true ||
            score.correct === "true"
          ).length;
        }
      });
    }

    return results.sort((a, b) =>
      Number(b.participated) - Number(a.participated) ||
      b.totalMarks - a.totalMarks ||
      a.name.localeCompare(b.name)
    );
  }

  function createCell(value) {
    const cell = document.createElement("td");
    cell.textContent = String(value);
    return cell;
  }

  function updatePodium(place, result) {
    const container = document.getElementById(podiumIds[place]);

    if (!container) return;

    const name = container.querySelector(".podium-name");
    const score = container.querySelector(".podium-score");

    if (name) {
      name.textContent = result
        ? result.name
        : "Awaiting competitor";
    }

    if (score) {
      score.textContent = result
        ? `${result.totalMarks} marks`
        : "0 marks";
    }

    container.classList.toggle("no-competitor", !result);
  }

  function createRankingItem(result, position) {
    const item = document.createElement("div");
    item.className = "ranking-item";

    const rank = document.createElement("span");
    rank.className = "ranking-number";
    rank.textContent = String(position);

    const details = document.createElement("div");
    details.className = "ranking-details";

    const name = document.createElement("span");
    name.className = "ranking-name";
    name.textContent = result.name;

    const score = document.createElement("span");
    score.className = "ranking-score";

    score.textContent = result.participated
      ? `${result.totalMarks} marks`
      : "Absent";

    details.append(name, score);
    item.append(rank, details);

    if (position === 1) item.classList.add("rank-gold");
    if (position === 2) item.classList.add("rank-silver");
    if (position === 3) item.classList.add("rank-bronze");

    if (!result.participated) {
      item.classList.add("rank-absent");
    }

    return item;
  }

  function renderRankings(results) {
    const participants = results.filter(
      result => result.participated
    );

    const top = participants.slice(0, 10);

    updatePodium(1, top[0]);
    updatePodium(2, top[1]);
    updatePodium(3, top[2]);

    const left = document.getElementById("leftRanking");
    const right = document.getElementById("rightRanking");
    const bottom = document.getElementById("bottomRankings");

    if (left) left.replaceChildren();
    if (right) right.replaceChildren();
    if (bottom) bottom.replaceChildren();

    top.slice(0, 5).forEach((result, index) => {
      if (left) {
        left.appendChild(
          createRankingItem(result, index + 1)
        );
      }
    });

    top.slice(5, 10).forEach((result, index) => {
      if (right) {
        right.appendChild(
          createRankingItem(result, index + 6)
        );
      }
    });

    top.slice(0, 5).forEach((result, index) => {
      if (!bottom) return;

      const card = document.createElement("div");

      card.className =
        `bottom-rank-card rank-card-${index + 1}`;

      const number = document.createElement("span");

      number.className = "bottom-rank-number";
      number.textContent = String(index + 1);

      const name = document.createElement("strong");
      name.textContent = result.name;

      const score = document.createElement("span");

      score.textContent = `${result.totalMarks} marks`;

      card.append(number, name, score);
      bottom.appendChild(card);
    });

    if (top.length === 0) {
      [left, right].forEach(container => {
        if (!container) return;

        const empty = document.createElement("p");

        empty.className = "empty-leaderboard";
        empty.textContent =
          "No competitors have scores yet.";

        container.appendChild(empty);
      });
    }
  }

  function displayScoreboard(category) {
    if (!title || !tableBody || !table) {
      console.error("Scoreboard HTML elements are missing.");
      return;
    }

    const categoryName = categoryNames[category] || "Bible";

    title.textContent = `${categoryName} Scoreboard`;

    document.body.classList.toggle(
      "overall-mode",
      category === "overall"
    );

    table.classList.toggle(
      "overall-table",
      category === "overall"
    );

    const results = getResults(category);

    tableBody.replaceChildren();

    results.forEach((result, index) => {
      const row = document.createElement("tr");

      if (!result.participated) {
        row.classList.add("absent-row");
      } else if (category === "overall") {
        row.classList.add("overall-participant");
      }

      row.appendChild(createCell(index + 1));
      row.appendChild(createCell(result.name));

      row.appendChild(
        createCell(
          result.participated
            ? result.correct
            : "Absent"
        )
      );

      row.appendChild(
        createCell(
          result.participated
            ? result.totalMarks
            : "Absent"
        )
      );

      tableBody.appendChild(row);
    });

    renderRankings(results);

    const participantCount = results.filter(
      result => result.participated
    ).length;

    if (message) {
      message.textContent =
        `${participantCount} of ${archdeaconries.length} ` +
        `archdeaconries participated in ${categoryName}.`;
    }
  }

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(item => item.classList.remove("active"));

      tab.classList.add("active");

      displayScoreboard(tab.dataset.category);
    });
  });

  const activeTab = document.querySelector(
    ".category-tab.active"
  );

  displayScoreboard(
    activeTab?.dataset.category || "bible"
  );

  window.addEventListener("pageshow", () => {
    const selectedTab = document.querySelector(
      ".category-tab.active"
    );

    displayScoreboard(
      selectedTab?.dataset.category || "bible"
    );
  });

  window.addEventListener("storage", event => {
    if (
      event.key === "quizScores" ||
      event.key === "scores"
    ) {
      const selectedTab = document.querySelector(
        ".category-tab.active"
      );

      displayScoreboard(
        selectedTab?.dataset.category || "bible"
      );
    }
  });

  resetButton?.addEventListener("click", () => {
    const confirmed = window.confirm(
      "Reset the competition? This deletes saved scores and used-question records, but keeps imported questions."
    );

    if (!confirmed) return;

    try {
      localStorage.removeItem("quizScores");
      localStorage.removeItem("scores");
      localStorage.removeItem("usedQuestions");
      localStorage.removeItem("usedQuestionKeys");

      const selectedTab = document.querySelector(
        ".category-tab.active"
      );

      displayScoreboard(
        selectedTab?.dataset.category || "bible"
      );

      window.alert(
        "Competition reset. Saved scores and used-question records were cleared. Imported questions were kept."
      );
    } catch (error) {
      console.error("Unable to reset competition:", error);

      window.alert(
        "Reset failed. Please check the browser Console."
      );
    }
  });
});
