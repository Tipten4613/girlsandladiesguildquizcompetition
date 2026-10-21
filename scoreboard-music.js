
document.addEventListener("DOMContentLoaded", () => {
  const winner = document.getElementById("podiumFirst");
  const player = document.getElementById("championVideo");
  const playBtn = document.getElementById("playChampionBtn");
  const muteBtn = document.getElementById("muteChampionBtn");

  if (!winner || !player || !playBtn || !muteBtn) {
    console.warn("Champion music elements are missing.");
    return;
  }

  let started = false;

  function winnerIsDisplayed() {
    return winner.textContent.trim().length > 0;
  }

  function checkWinner() {
    if (winnerIsDisplayed() && !started) {
      started = true;
      player.play().catch(() => {
        playBtn.textContent = "▶ Play Champion Song";
      });
    }

    if (!winnerIsDisplayed()) {
      started = false;
      player.pause();
    }
  }

  playBtn.addEventListener("click", () => {
    if (player.paused) {
      player.play().catch(() => {});
    } else {
      player.pause();
    }
  });

  muteBtn.addEventListener("click", () => {
    player.muted = !player.muted;
    muteBtn.textContent = player.muted ? "🔊 Unmute" : "🔇 Mute";
  });

  player.addEventListener("play", () => {
    playBtn.textContent = "⏸ Pause Champion Song";
  });

  player.addEventListener("pause", () => {
    playBtn.textContent = "▶ Play Champion Song";
  });

  checkWinner();

  new MutationObserver(checkWinner).observe(winner, {
    childList: true,
    subtree: true,
    characterData: true
  });
});
