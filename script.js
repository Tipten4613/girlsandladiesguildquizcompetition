// =========================================
// HOME PAGE
// =========================================

const startCompetitionBtn =
  document.getElementById("startCompetitionBtn");


// When the judge clicks "Start Competition"
startCompetitionBtn.addEventListener("click", () => {

  // For now, Attendance is the next page.
  // We will create attendance.html next.

  window.location.href = "attendance.html";

});