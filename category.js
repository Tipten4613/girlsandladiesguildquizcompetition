const categoryCards =
  document.querySelectorAll(".quiz-category-card");

const categoryMessage =
  document.getElementById("categoryMessage");


categoryCards.forEach((card) => {

  card.addEventListener("click", () => {

    const selectedCategory =
      card.dataset.category;

    const categoryName =
      card.querySelector("h2").textContent;


    // Save the selected category
    localStorage.setItem(
      "selectedCategory",
      selectedCategory
    );

    localStorage.setItem(
      "selectedCategoryName",
      categoryName
    );


    categoryMessage.textContent =
      `${categoryName} selected. Moving to Archdeaconry selection...`;


    // Move to the next page
    setTimeout(() => {

      window.location.href =
        "archdeaconry.html";

    }, 500);

  });

});