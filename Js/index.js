document.addEventListener("DOMContentLoaded", () => {
  console.log("Script de la página de inicio (index.js) cargado.");

  const API_BASE_URL = "https://api.mochilacup.xyz/api";
  const SERVER_BASE_URL = "https://api.mochilacup.xyz";
  const DEFAULT_TEAM_LOGO = "../Image/team.png";
  const DEFAULT_CASTER_PHOTO = "../Image/caster.png";

  const dom = {
    countdownContainer: document.getElementById("countdown"),
    daysSpan: document.getElementById("days"),
    hoursSpan: document.getElementById("hours"),
    minutesSpan: document.getElementById("minutes"),
    secondsSpan: document.getElementById("seconds"),
    heroSubtitle: document.querySelector(".hero-content .subtitle"),
    featuredTeamsGrid: document.getElementById("featured-teams-grid"),
    teamModal: document.getElementById("team-modal"),
    closeTeamModalBtn: document.getElementById("close-modal-btn"),
    modalTeamDetails: document.getElementById("modal-team-details"),
    castersGrid: document.getElementById("casters-grid"),
    casterModal: document.getElementById("caster-modal"),
    closeCasterModalBtn: document.getElementById("close-caster-modal-btn"),
    modalCasterPhoto: document.getElementById("modalCasterPhoto"),
    modalCasterName: document.getElementById("modalCasterName"),
    modalCasterDescription: document.getElementById("modalCasterDescription"),
    modalCasterSocials: document.getElementById("modalCasterSocials"),
    fireworksContainer: document.getElementById("fireworks-container"),
  };

  const appState = {
    teamsData: [],
    castersData: [],
    tournamentEndDate: new Date("2025-08-04T18:00:00-05:00").getTime(),
    fireworksCreated: false,
  };

  const utils = {
    fetchAPI: async (endpoint) => {
      try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`);
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        return response.json();
      } catch (error) {
        console.error(`Error al obtener datos de ${endpoint}:`, error);
        throw error;
      }
    },
    socialIconMap: {
      kick: "fab fa-kickstarter",
      twitter: "fab fa-twitter",
      instagram: "fab fa-instagram",
      tiktok: "fab fa-tiktok",
      youtube: "fab fa-youtube",
      twitch: "fab fa-twitch",
      facebook: "fab fa-facebook-f",
      discord: "fab fa-discord",
      website: "fas fa-globe",
      default: "fas fa-link",
    },
    createElement: (tag, classes = [], content = "") => {
      const element = document.createElement(tag);
      element.className = classes.join(" ");
      element.innerHTML = content;
      return element;
    },
  };

  const App = {
    init: () => {
      App.setupCountdown();
      App.loadAllData();
      App.bindEventListeners();
    },

    setupCountdown: () => {
      if (!dom.countdownContainer) return;
      const updateCountdown = () => {
        const now = new Date().getTime();
        const distance = appState.tournamentEndDate - now;

        if (
          dom.daysSpan &&
          dom.hoursSpan &&
          dom.minutesSpan &&
          dom.secondsSpan
        ) {
          dom.daysSpan.textContent = String(
            Math.floor(distance / (1000 * 60 * 60 * 24))
          ).padStart(2, "0");
          dom.hoursSpan.textContent = String(
            Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
          ).padStart(2, "0");
          dom.minutesSpan.textContent = String(
            Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
          ).padStart(2, "0");
          dom.secondsSpan.textContent = String(
            Math.floor((distance % (1000 * 60)) / 1000)
          ).padStart(2, "0");
        }
      };

      const countdownInterval = setInterval(updateCountdown, 1000);
      updateCountdown();
    },

    createFireworksAnimation: () => {
      if (!dom.fireworksContainer) return;
      const numberOfFireworks = 10;
      for (let i = 0; i < numberOfFireworks; i++) {
        const firework = utils.createElement("div", ["firework"]);
        dom.fireworksContainer.appendChild(firework);
      }
    },

    loadAllData: async () => {
      try {
        const [teamsResponse, castersResponse] = await Promise.all([
          utils.fetchAPI("/teams"),
          utils.fetchAPI("/casters"),
        ]);

        appState.teamsData = teamsResponse.teams || [];
        App.renderFeaturedTeams();

        appState.castersData = castersResponse.casters || [];
        App.renderCasters();
      } catch (error) {
        if (dom.featuredTeamsGrid)
          dom.featuredTeamsGrid.innerHTML = `<p style="color: white; grid-column: 1 / -1; text-align: center;">No se pudieron cargar los equipos.</p>`;
        if (dom.castersGrid)
          dom.castersGrid.innerHTML = `<p style="color: white; grid-column: 1 / -1; text-align: center;">No se pudieron cargar los casters.</p>`;
      }
    },

    renderFeaturedTeams: () => {
      if (!dom.featuredTeamsGrid) return;
      dom.featuredTeamsGrid.innerHTML = "";

      if (appState.teamsData.length === 0) {
        dom.featuredTeamsGrid.innerHTML = `<div class="info-message"><i class="fas fa-shield-alt"></i><p>Los equipos serán revelados próximamente.</p></div>`;
        return;
      }

      appState.teamsData.forEach((team) => {
        const teamCard = document.createElement("div");
        teamCard.className = "team-card-index";
        teamCard.dataset.teamId = team._id;
        const logoUrl = team.logo
          ? `${SERVER_BASE_URL}${team.logo}`
          : DEFAULT_TEAM_LOGO;
        teamCard.innerHTML = `
            <img src="${logoUrl}" alt="Logo de ${
          team.name
        }" class="team-logo-card" onerror="this.onerror=null; this.src='${DEFAULT_TEAM_LOGO}';">
            <h3>${team.name}</h3>
            <p>Grupo ${team.group || "N/A"}</p>
            <span class="card-link">Ver Perfil</span>`;
        dom.featuredTeamsGrid.appendChild(teamCard);
      });
    },

    renderCasters: () => {
      if (!dom.castersGrid) return;
      dom.castersGrid.innerHTML = "";

      if (appState.castersData.length === 0) {
        dom.castersGrid.innerHTML = `<div class="info-message"><i class="fas fa-microphone-slash"></i><p>Los casters oficiales serán anunciados pronto.</p></div>`;
        return;
      }

      appState.castersData.forEach((caster) => {
        const casterCard = document.createElement("div");
        casterCard.className = "caster-card";
        casterCard.dataset.casterId = caster._id;
        const photoUrl = caster.photo
          ? `${SERVER_BASE_URL}${caster.photo}`
          : DEFAULT_CASTER_PHOTO;
        casterCard.innerHTML = `
            <img src="${photoUrl}" alt="Foto de ${
          caster.name
        }" class="caster-photo" onerror="this.onerror=null; this.src='${DEFAULT_CASTER_PHOTO}';" />
            <h4>${caster.name || "Nombre no disponible"}</h4>
            <button class="view-details-btn">Ver Detalles</button>`;
        dom.castersGrid.appendChild(casterCard);
      });
    },

    showTeamDetailsInModal: (team) => {
      if (!team || !dom.teamModal || !dom.modalTeamDetails) return;
      const roleOrder = { coach: 1, player: 2, "stand-in": 3 };
      const getIconForRole = (role) =>
        ({
          coach: "fas fa-headset",
          player: "fas fa-gamepad",
          "stand-in": "fas fa-user-clock",
        }[role] || "fas fa-user");

      const sortedMembers = [...(team.members || [])].sort(
        (a, b) => (roleOrder[a.role] || 99) - (roleOrder[b.role] || 99)
      );

      const playersHTML =
        sortedMembers.length > 0
          ? sortedMembers
              .map(
                (p) =>
                  `<li>
              <i class="${getIconForRole(p.role)}"></i>
              <div class="player-info-wrapper">
                <span class="player-name">${p.name}</span>
                ${p.id ? `<span class="player-id">(ID: ${p.id})</span>` : ""}
              </div>
              <span class="player-role">(${p.role})</span>
            </li>`
              )
              .join("")
          : "<li>No hay jugadores registrados.</li>";

      const logoSrc = team.logo
        ? `${SERVER_BASE_URL}${team.logo}`
        : DEFAULT_TEAM_LOGO;

      dom.modalTeamDetails.innerHTML = `
        <img src="${logoSrc}" alt="Logo de ${
        team.name
      }" class="modal-team-logo" onerror="this.onerror=null; this.src='${DEFAULT_TEAM_LOGO}';">
        <h3>${team.name}</h3>
        <p class="team-group">Grupo ${team.group || "N/A"}</p>
        <p class="team-motto"><em>"${team.motto || "Sin lema"}"</em></p>
        <h4>Alineación</h4>
        <ul>${playersHTML}</ul>`;

      dom.teamModal.classList.add("active");
      history.pushState({ modalOpen: true, modalId: "team" }, null);
    },

    showCasterDetailsModal: (casterId) => {
      const caster = appState.castersData.find((c) => c._id === casterId);
      if (!caster || !dom.casterModal) return;

      dom.modalCasterPhoto.src = caster.photo
        ? `${SERVER_BASE_URL}${caster.photo}`
        : DEFAULT_CASTER_PHOTO;
      dom.modalCasterName.textContent = caster.name;
      dom.modalCasterDescription.textContent =
        caster.description || "Este caster no tiene una descripción detallada.";

      dom.modalCasterSocials.innerHTML = "";
      if (caster.socials && Object.keys(caster.socials).length > 0) {
        Object.entries(caster.socials).forEach(([platform, url]) => {
          const iconClass =
            utils.socialIconMap[platform] || utils.socialIconMap.default;
          const platformDisplayName =
            platform.charAt(0).toUpperCase() + platform.slice(1);
          const linkEl = document.createElement("a");
          linkEl.href = url;
          linkEl.target = "_blank";
          linkEl.className = "caster-modal-social-link";
          linkEl.innerHTML = `<i class="${iconClass}"></i><span>${platformDisplayName}</span>`;
          dom.modalCasterSocials.appendChild(linkEl);
        });
      } else {
        dom.modalCasterSocials.innerHTML =
          '<p class="no-socials-modal">Este caster no ha registrado redes sociales.</p>';
      }

      dom.casterModal.classList.add("active");
      history.pushState({ modalOpen: true, modalId: "caster" }, null);
    },

    hideModals: () => {
      dom.teamModal.classList.remove("active");
      dom.casterModal.classList.remove("active");
    },

    bindEventListeners: () => {
      if (dom.featuredTeamsGrid) {
        dom.featuredTeamsGrid.addEventListener("click", (event) => {
          const card = event.target.closest(".team-card-index");
          if (card && card.dataset.teamId) {
            const team = appState.teamsData.find(
              (t) => t._id === card.dataset.teamId
            );
            if (team) App.showTeamDetailsInModal(team);
          }
        });
      }

      if (dom.closeTeamModalBtn) {
        dom.closeTeamModalBtn.addEventListener("click", () => {
          App.hideModals();
        });
      }

      if (dom.teamModal) {
        dom.teamModal.addEventListener("click", (event) => {
          if (event.target === dom.teamModal) {
            App.hideModals();
          }
        });
      }

      if (dom.castersGrid) {
        dom.castersGrid.addEventListener("click", (e) => {
          const card = e.target.closest(".caster-card");
          if (card && card.dataset.casterId)
            App.showCasterDetailsModal(card.dataset.casterId);
        });
      }

      if (dom.closeCasterModalBtn) {
        dom.closeCasterModalBtn.addEventListener("click", () => {
          App.hideModals();
        });
      }

      if (dom.casterModal) {
        dom.casterModal.addEventListener("click", (e) => {
          if (e.target === dom.casterModal) {
            App.hideModals();
          }
        });
      }

      window.addEventListener("popstate", (event) => {
        const isModalOpen =
          dom.teamModal.classList.contains("active") ||
          dom.casterModal.classList.contains("active");
        if (isModalOpen) {
          App.hideModals();
        }
      });

      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          App.hideModals();
        }
      });
    },
  };

  App.init();
});
