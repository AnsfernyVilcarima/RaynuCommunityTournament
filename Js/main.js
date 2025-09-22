document.addEventListener("DOMContentLoaded", () => {
  console.log("Script global (main.js) cargado.");

  const dom = {
    loginButton: document.getElementById("login-button"),
    logoutButton: document.getElementById("logout-button"),
    adminPanelButton: document.getElementById("admin-panel-button"),
    navMenu: document.getElementById("nav-menu"),
    yearSpan: document.getElementById("year"),
    backgroundMusic: document.getElementById("background-music"),
  };

  const utils = {
    decodeToken: (token) => {
      try {
        return JSON.parse(atob(token.split(".")[1]));
      } catch (e) {
        return null;
      }
    },
  };

  const App = {
    init: () => {
      App.bindEventListeners();
      App.updateAuthUI();
      App.updateFooterYear();
      App.handleAudioPlayback();
    },

    handleAudioPlayback: () => {
      const isLivePage = window.location.pathname.includes("live.html");
      const savedTime = localStorage.getItem("backgroundMusicTime");

      if (dom.backgroundMusic) {
        if (isLivePage) {
          dom.backgroundMusic.pause();
          dom.backgroundMusic.currentTime = 0;
          localStorage.removeItem("backgroundMusicTime");
          return;
        }

        if (savedTime) {
          dom.backgroundMusic.currentTime = parseFloat(savedTime);
        }

        const playPromise = dom.backgroundMusic.play();

        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log("Música de fondo reproduciéndose.");
            })
            .catch((error) => {
              console.log(
                "Autoplay de audio bloqueado. Esperando interacción del usuario."
              );
              document.addEventListener(
                "click",
                () => {
                  dom.backgroundMusic.play().catch((e) => {
                    console.error("Error al reproducir audio tras el clic:", e);
                  });
                },
                { once: true }
              );
            });
        }

        window.addEventListener("pagehide", () => {
          if (!dom.backgroundMusic.paused) {
            localStorage.setItem(
              "backgroundMusicTime",
              dom.backgroundMusic.currentTime
            );
          }
        });
      }
    },

    updateAuthUI: () => {
      const token = localStorage.getItem("authToken");
      if (token) {
        const userData = utils.decodeToken(token);
        const isExpired = userData && userData.exp * 1000 < Date.now();

        if (
          userData &&
          !isExpired &&
          (userData.roles.includes("admin") ||
            userData.roles.includes("manager"))
        ) {
          if (dom.adminPanelButton)
            dom.adminPanelButton.classList.remove("hidden");
          if (dom.logoutButton) dom.logoutButton.classList.remove("hidden");
          if (dom.loginButton) dom.loginButton.classList.add("hidden");
        } else {
          localStorage.removeItem("authToken");
          if (dom.adminPanelButton)
            dom.adminPanelButton.classList.add("hidden");
          if (dom.logoutButton) dom.logoutButton.classList.add("hidden");
          if (dom.loginButton) dom.loginButton.classList.remove("hidden");
        }
      } else {
        if (dom.adminPanelButton) dom.adminPanelButton.classList.add("hidden");
        if (dom.logoutButton) dom.logoutButton.classList.add("hidden");
        if (dom.loginButton) dom.loginButton.classList.remove("hidden");
      }
    },

    logoutUser: () => {
      localStorage.removeItem("authToken");
      window.location.href = "/";
    },

    bindEventListeners: () => {
      if (dom.navToggle && dom.navMenu) {
        dom.navToggle.addEventListener("click", () => {
          dom.navMenu.classList.toggle("nav-open");
        });
      }

      if (dom.logoutButton) {
        dom.logoutButton.addEventListener("click", App.logoutUser);
      }

      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          const openModals = document.querySelectorAll(".modal.is-active");
          openModals.forEach((modal) => {
            modal.classList.remove("is-active");
          });
        }
      });
    },

    updateFooterYear: () => {
      if (dom.yearSpan) {
        dom.yearSpan.textContent = new Date().getFullYear();
      }
    },
  };

  App.init();
});
