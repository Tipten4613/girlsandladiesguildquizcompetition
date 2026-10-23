
document.addEventListener("DOMContentLoaded", () => {
  const topicCards = document.querySelectorAll(".topic-card");
  const topicMessage = document.getElementById("topicMessage");

  topicCards.forEach(card => {
    card.addEventListener("click", () => {
      const topic = card.dataset.topic;
      const topicName = card.dataset.topicName;

      if (!topic || !topicName) {
        if (topicMessage) {
          topicMessage.textContent = "Unable to select this topic. Please try again.";
        }
        return;
      }

      localStorage.setItem("selectedBibleTopic", topic);
      localStorage.setItem("selectedBibleTopicName", topicName);

      if (topicMessage) {
        topicMessage.textContent =
          `${topicName} selected. Opening question numbers...`;
      }

      setTimeout(() => {
window.location.href = "archdeaconry.html";
      }, 300);
    });
  });
});
