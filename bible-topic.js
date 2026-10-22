
document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll(".topic-card");
  const message = document.getElementById("topicMessage");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const topic = button.dataset.topic;
      const topicName = button.dataset.topicName;

      localStorage.setItem("selectedCategory", "bible");
      localStorage.setItem("selectedCategoryName", "Bible");
      localStorage.setItem("selectedBibleTopic", topic);
      localStorage.setItem("selectedBibleTopicName", topicName);

      if (message) {
        message.textContent = `${topicName} selected. Opening Archdeaconry selection...`;
      }

      setTimeout(() => {
        window.location.href = "archdeaconry.html";
      }, 300);
    });
  });
});
