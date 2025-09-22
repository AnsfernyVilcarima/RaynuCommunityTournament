document.addEventListener("DOMContentLoaded", () => {
  const grandFinalTime = new Date("August 15, 2025 19:00:00 GMT-0500");

  const updateMatchStatus = () => {
    const now = new Date();
    const matchCard = document.querySelector(".playoffs-match");
    const matchStreamLink = matchCard
      ? matchCard.querySelector(".match-stream-link")
      : null;

    if (matchStreamLink) {
      const timeDifference = now.getTime() - grandFinalTime.getTime();
      const threeHoursInMs = 3 * 60 * 60 * 1000;

      if (timeDifference >= 0 && timeDifference <= threeHoursInMs) {
        matchCard.classList.add("match-live");
        matchStreamLink.classList.add("live-final");
        matchStreamLink.innerHTML =
          '<i class="fa-brands fa-kickstarter"></i> En Vivo';
      } else if (now > grandFinalTime) {
        matchCard.classList.remove("match-live");
        matchStreamLink.classList.remove("live-final");
        matchStreamLink.innerHTML =
          '<i class="fas fa-play-circle"></i> Ver Resumen';
      } else {
        matchCard.classList.remove("match-live");
        matchStreamLink.classList.remove("live-final");
        matchStreamLink.innerHTML =
          '<i class="fa-brands fa-kickstarter"></i> En Vivo';
      }
    }
  };

  setInterval(updateMatchStatus, 30000);
  updateMatchStatus();
});
