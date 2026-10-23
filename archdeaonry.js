
document.addEventListener("DOMContentLoaded", () => {
  const archdeaconryGrid =
    document.getElementById("archdeaconryGrid");

  const archdeaconryMessage =
    document.getElementById("archdeaconryMessage");

  const selectedCategoryName =
    document.getElementById("selectedCategoryName");

  const categoryButtons =
    document.querySelectorAll(".category-switch-btn");

  const categories = {
    bible: "Bible",
    anglicanism: "Anglicanism",
    current_affairs: "Current Affairs"
  };

  function normalizeCategory(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, "_");
  }

  let category = normalizeCategory(
    localStorage.getItem("selectedCategory")
  );

  if (!categories[category]) {
    category = "bible";
  }

  let attendanceData = [];

  try {
    const savedAttendance = JSON.parse(
      localStorage.getItem("attendanceData") || "[]"
    );

    if (Array.isArray(savedAttendance)) {
      attendanceData = savedAttendance;
    }
  } catch {
    attendanceData = [];
  }

  function updateCategoryDisplay() {
    const name = categories[category];

    localStorage.setItem("selectedCategory", category);
    localStorage.setItem("selectedCategoryName", name);

    if (selectedCategoryName) {
      selectedCategoryName.textContent = name;
    }

    categoryButtons.forEach(button => {
      const active = button.dataset.category === category;

      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function renderArchdeaconries() {
    if (!archdeaconryGrid || !archdeaconryMessage) return;

    archdeaconryGrid.replaceChildren();

    const presentArchdeaconries = attendanceData.filter(
      item =>
        item &&
        typeof item.name === "string" &&
        item.status === "present"
    );

    if (presentArchdeaconries.length === 0) {
      archdeaconryMessage.textContent =
        "No archdeaconries marked Present were found. Please check Attendance.";
      return;
    }

    archdeaconryMessage.textContent =
      `${presentArchdeaconries.length} Archdeaconries Present. Select one to continue.`;

    presentArchdeaconries.forEach((archdeaconry, index) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "archdeaconry-card";

      const details = document.createElement("div");
      const numberLabel = document.createElement("span");
      const name = document.createElement("h3");
      const arrow = document.createElement("span");

      numberLabel.textContent =
        `ARCHDEACONRY ${String(index + 1).padStart(2, "0")}`;

      name.textContent = archdeaconry.name;

      arrow.className = "archdeaconry-arrow";
      arrow.textContent = "→";

      details.append(numberLabel, name);
      card.append(details, arrow);

      card.addEventListener("click", () => {
        localStorage.setItem(
   if (category === "bible") {
  const selectedTopic = localStorage.getItem("selectedBibleTopic");

  if (selectedTopic) {
    window.location.href = "question-number.html";
  } else {
    window.location.href = "bible-topic.html";
  }
} else {       "selectedArchdeaconry",
          archdeaconry.name
        );

        if (category === "bible") {
          window.location.href = "bible-topic.html";
        } else {
          localStorage.removeItem("selectedBibleTopic");
          localStorage.removeItem("selectedBibleTopicName");
          window.location.href = "question-number.html";
        }
      });

      archdeaconryGrid.appendChild(card);
    });
  }

  categoryButtons.forEach(button => {
    button.addEventListener("click", () => {
      const newCategory = normalizeCategory(button.dataset.category);

      if (!categories[newCategory]) return;

      category = newCategory;
      if (newCategory !== "bible") {
  localStorage.removeItem("selectedBibleTopic");
  localStorage.removeItem("selectedBibleTopicName");
}
      updateCategoryDisplay();

      archdeaconryMessage.textContent =
        `${categories[category]} selected. Choose an archdeaconry below.`;

      renderArchdeaconries();
    });
  });
const bibleTopicSwitcher = document.getElementById("bibleTopicSwitcher");
const changeBibleTopicBtn = document.getElementById("changeBibleTopicBtn");

if (bibleTopicSwitcher && category === "bible") {
  bibleTopicSwitcher.style.display = "block";
}

if (changeBibleTopicBtn) {
  changeBibleTopicBtn.addEventListener("click", () => {
    localStorage.removeItem("selectedBibleTopic");
    localStorage.removeItem("selectedBibleTopicName");

    window.location.href = "bible-topic.html";
  });
}
  updateCategoryDisplay();
  renderArchdeaconries();
});
