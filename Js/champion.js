document.addEventListener("DOMContentLoaded", () => {
  function animateWinRateCircle(element) {
    const percentage = parseFloat(element.getAttribute("data-percentage"));
    let currentPercentage = 0;
    const speed = 20;
    const updateCircle = () => {
      if (currentPercentage < percentage) {
        currentPercentage++;
        element.style.background = `conic-gradient(var(--primary-orange) ${currentPercentage}%, var(--border-color) 0)`;
        element.querySelector(
          ".stat-value"
        ).textContent = `${currentPercentage}%`;
        requestAnimationFrame(updateCircle);
      }
    };

    requestAnimationFrame(updateCircle);
  }

  function animateMmrBar(element) {
    const percentage = parseFloat(element.getAttribute("data-percentage"));
    let currentPercentage = 0;
    const speed = 20;
    const updateBar = () => {
      if (currentPercentage < percentage) {
        currentPercentage++;
        element.style.width = `${currentPercentage}%`;
        requestAnimationFrame(updateBar);
      }
    };

    requestAnimationFrame(updateBar);
  }

  function handleIntersection(entries, observer) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        if (entry.target.classList.contains("circle-inner")) {
          animateWinRateCircle(entry.target);
        }
        if (entry.target.classList.contains("bar-fill")) {
          animateMmrBar(entry.target);
        }
        observer.unobserve(entry.target);
      }
    });
  }

  const observer = new IntersectionObserver(handleIntersection, {
    root: null,
    rootMargin: "0px",
    threshold: 0.5,
  });

  const winRateCircle = document.querySelector(".circle-inner");
  if (winRateCircle) {
    observer.observe(winRateCircle);
  }

  const mmrBar = document.querySelector(".bar-fill");
  if (mmrBar) {
    observer.observe(mmrBar);
  }
});
