
document.addEventListener("DOMContentLoaded", () => {
  const categoryCards = document.querySelectorAll(".quiz-category-card");
  const categoryMessage = document.getElementById("categoryMessage");

  categoryCards.forEach((card) => {
    card.addEventListener("click", () => {
      const selectedCategory = card.dataset.category;
      const categoryName = card.querySelector("h2").textContent;

      localStorage.setItem("selectedCategory", selectedCategory);
      localStorage.setItem("selectedCategoryName", categoryName);

      // Clear any topic selected during a previous round.
      localStorage.removeItem("selectedBibleTopic");
      localStorage.removeItem("selectedBibleTopicName");

      const destination =
        selectedCategory.toLowerCase().replace(/[\s-]+/g, "_") === "bible"
          ? "bible-topic.html"
          : "archdeaconry.html";

      if (categoryMessage) {
        categoryMessage.textContent =
          `${categoryName} selected. Moving to the next page...`;
      }

      setTimeout(() => {
        window.location.href = destination;
      }, 300);
    });
  });
});
