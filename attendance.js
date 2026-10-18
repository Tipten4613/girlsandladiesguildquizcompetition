
const attendanceCards =
  document.querySelectorAll(".attendance-card");

const presentCount =
  document.getElementById("presentCount");

const absentCount =
  document.getElementById("absentCount");

const attendanceMessage =
  document.getElementById("attendanceMessage");

const continueButton =
  document.getElementById("continueAttendanceBtn");


attendanceCards.forEach((card) => {

  const buttons =
    card.querySelectorAll(".attendance-btn");

  buttons.forEach((button) => {

    button.addEventListener("click", () => {

      buttons.forEach((btn) => {
        btn.classList.remove("selected");
      });

      button.classList.add("selected");

      updateAttendance();

    });

  });

});


function updateAttendance() {

  let present = 0;
  let absent = 0;
  let marked = 0;

  const attendanceData = [];

  attendanceCards.forEach((card) => {

    const selected =
      card.querySelector(".attendance-btn.selected");

    const name =
      card.querySelector("h3").textContent;

    if (selected) {

      marked++;

      const status =
        selected.dataset.status;

      if (status === "present") {
        present++;
      }

      if (status === "absent") {
        absent++;
      }

      attendanceData.push({
        name: name,
        status: status
      });

    }

  });

  presentCount.textContent = present;
  absentCount.textContent = absent;


  localStorage.setItem(
    "attendanceData",
    JSON.stringify(attendanceData)
  );


  if (marked === attendanceCards.length) {

    continueButton.classList.add("ready");

    attendanceMessage.textContent =
      `${present} Present and ${absent} Absent. Attendance is complete.`;

  } else {

    continueButton.classList.remove("ready");

    attendanceMessage.textContent =
      `Please mark attendance for all ${attendanceCards.length} Archdeaconries.`;

  }

}


continueButton.addEventListener("click", () => {

  if (!continueButton.classList.contains("ready")) {
    return;
  }

  window.location.href = "category.html";

});