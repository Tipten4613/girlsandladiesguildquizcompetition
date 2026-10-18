
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

  const podiumIds = {
    1: "podiumFirst",
    2: "podiumSecond",
    3: "podiumThird"
  };

  function getScores() {
    try {
      const saved = localStorage.getItem("scores");
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("Unable to read scores:", error);
      return [];
    }
  }

  function normalizeCategory(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[_-]/g, " ")
      .trim();
  }

  function createCell(value) {
    const cell = document.createElement("td");
    cell.textContent = value;
    return cell;
  }

  function getResults(category) {
    const allScores = getScores();

    const results = archdeaconries.map(name => {
      const entries = allScores.filter(score => {
        if (score.archdeaconry !== name) return false;

        return category === "overall" ||
          normalizeCategory(score.category) ===
          normalizeCategory(categoryNames[category]);
      });

      const participated = entries.length > 0;

      const correct = entries.filter(score =>
        score.correct === true || score.correct === "true"
      ).length;

      const totalMarks = entries.reduce(
        (sum, score) => sum + (Number(score.marks) || 0),
        0
      );

      return { name, participated, correct, totalMarks };
    });

    results.sort((a, b) =>
      Number(b.participated) - Number(a.participated) ||
      b.totalMarks - a.totalMarks ||
      a.name.localeCompare(b.name)
    );

    return results;
  }

  function setText(element, value) {
    element.textContent = value;
  }

  function updatePodium(place, result) {
    const container = document.getElementById(podiumIds[place]);
    if (!container) return;

    const name = container.querySelector(".podium-name");
    const score = container.querySelector(".podium-score");

    setText(name, result ? result.name : "Awaiting competitor");
    setText(
      score,
      result ? `${result.totalMarks} marks` : "0 marks"
    );

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
    if (!result.participated) item.classList.add("rank-absent");

    return item;
  }

  function renderRankings(results) {
    const participants = results.filter(result => result.participated);
    const top = participants.slice(0, 10);

    updatePodium(1, top[0]);
    updatePodium(2, top[1]);
    updatePodium(3, top[2]);

    const left = document.getElementById("leftRanking");
    const right = document.getElementById("rightRanking");
    const bottom = document.getElementById("bottomRankings");

    left.replaceChildren();
    right.replaceChildren();
    bottom.replaceChildren();

    top.slice(0, 5).forEach((result, index) => {
      left.appendChild(createRankingItem(result, index + 1));
    });

    top.slice(5, 10).forEach((result, index) => {
      right.appendChild(createRankingItem(result, index + 6));
    });

    top.slice(0, 5).forEach((result, index) => {
      const card = document.createElement("div");
      card.className = `bottom-rank-card rank-card-${index + 1}`;

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
      const empty = document.createElement("p");
      empty.className = "empty-leaderboard";
      empty.textContent = "No competitors have scores yet.";
      left.appendChild(empty);
      right.appendChild(empty.cloneNode(true));
    }
  }

  function displayScoreboard(category) {
    const categoryName = categoryNames[category] || "Bible";
    setText(title, `${categoryName} Scoreboard`);

    document.body.classList.toggle("overall-mode", category === "overall");
    table.classList.toggle("overall-table", category === "overall");

    const results = getResults(category);
    tableBody.replaceChildren();

    results.forEach((result, index) => {
      const row = document.createElement("tr");

      if (!result.participated) row.classList.add("absent-row");
      else if (category === "overall") row.classList.add("overall-participant");

      row.appendChild(createCell(index + 1));
      row.appendChild(createCell(result.name));
      row.appendChild(createCell(result.participated ? result.correct : "Absent"));
      row.appendChild(createCell(result.participated ? result.totalMarks : "Absent"));

      tableBody.appendChild(row);
    });

    renderRankings(results);

    const participantCount = results.filter(
      result => result.participated
    ).length;

    setText(
      message,
      `${participantCount} of ${archdeaconries.length} archdeaconries participated in ${categoryName}.`
    );
  }

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(item => item.classList.remove("active"));
      tab.classList.add("active");
      displayScoreboard(tab.dataset.category);
    });
  });

  displayScoreboard("bible");

  window.addEventListener("pageshow", () => {
    const activeTab = document.querySelector(".category-tab.active");
    displayScoreboard(activeTab?.dataset.category || "bible");
  });

  resetButton?.addEventListener("click", () => {
    const confirmed = window.confirm(
      "Reset the competition? This deletes saved scores and used-question records, but keeps imported questions."
    );

    if (!confirmed) return;

    try {
      localStorage.removeItem("scores");
      localStorage.removeItem("usedQuestions");
      localStorage.removeItem("usedQuestionKeys");

      const activeTab = document.querySelector(".category-tab.active");
      displayScoreboard(activeTab?.dataset.category || "bible");

      window.alert(
        "Competition reset. Scores and used-question records were cleared. Imported questions were kept."
      );
    } catch (error) {
      console.error("Unable to reset competition:", error);
      window.alert("Reset failed. Please check the browser Console.");
    }
  });
});
