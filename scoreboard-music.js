
document.addEventListener("DOMContentLoaded", () => {
  const winner = document.getElementById("podiumFirst");
  const player = document.getElementById("championVideo");
  const playBtn = document.getElementById("playChampionBtn");
  const muteBtn = document.getElementById("muteChampionBtn");

  if (!winner || !player || !playBtn || !muteBtn) {
    console.warn("Champion music elements are missing.");
    return;
  }

  let youtubeReady = false;
  let started = false;
  let isMuted = false;
  let isPlaying = false;

  // Load the YouTube player API.
  const apiScript = document.createElement("script");
  apiScript.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(apiScript);

  window.onYouTubeIframeAPIReady = function () {
    new YT.Player("championVideo", {
      events: {
        onReady(event) {
          youtubeReady = true;
          event.target.setVolume(70);
          checkWinner();
        },
        onStateChange(event) {
          isPlaying = event.data === YT.PlayerState.PLAYING;
          playBtn.textContent = isPlaying
            ? "⏸ Pause Champion Song"
            : "▶ Play Champion Song";
        }
      }
    });
  };

  let youtubePlayer;

  window.onYouTubeIframeAPIReady = function () {
    youtubePlayer = new YT.Player("championVideo", {
      events: {
        onReady(event) {
          youtubeReady = true;
          event.target.setVolume(70);
          checkWinner();
        },
        onStateChange(event) {
          isPlaying = event.data === YT.PlayerState.PLAYING;
          playBtn.textContent = isPlaying
            ? "⏸ Pause Champion Song"
            : "▶ Play Champion Song";
        }
      }
    });
  };

  function winnerIsDisplayed() {
    return winner.textContent.trim().length > 0;
  }

  function checkWinner() {
    if (!youtubeReady) return;

    if (winnerIsDisplayed() && !started) {
      started = true;
      youtubePlayer.playVideo();
    } else if (!winnerIsDisplayed() && started) {
      started = false;
      youtubePlayer.stopVideo();
    }
  }

  playBtn.addEventListener("click", () => {
    if (!youtubeReady) return;

    if (isPlaying) {
      youtubePlayer.pauseVideo();
    } else {
      youtubePlayer.playVideo();
    }
  });

  muteBtn.addEventListener("click", () => {
    if (!youtubeReady) return;

    isMuted = !isMuted;

    if (isMuted) {
      youtubePlayer.mute();
      muteBtn.textContent = "🔊 Unmute";
    } else {
      youtubePlayer.unMute();
      muteBtn.textContent = "🔇 Mute";
    }
  });

  new MutationObserver(checkWinner).observe(winner, {
    childList: true,
    subtree: true,
    characterData: true
  });
});
