document.addEventListener("DOMContentLoaded", () => {
  const config = window.__RAYNU_CONFIG__ || {};
  const fetchApiData =
    typeof config.fetchApiData === "function"
      ? config.fetchApiData
      : async (endpoint) => {
          const response = await fetch(endpoint);
          if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
          }
          return response.json();
        };
  const resolveMediaUrl =
    typeof config.resolveMediaUrl === "function"
      ? config.resolveMediaUrl
      : (assetPath) => assetPath || "";

  const groupABody = document.getElementById("group-a-body");
  const groupBBody = document.getElementById("group-b-body");
  const scoreboardTablesContainer = document.getElementById(
    "scoreboard-tables-container"
  );
  const scoreboardEmptyMessage = document.getElementById(
    "scoreboard-empty-message"
  );

  const renderTable = (tbodyElement, teams) => {
    if (!tbodyElement) return;
    tbodyElement.innerHTML = "";

    if (teams.length === 0) {
      const row = tbodyElement.insertRow();
      row.innerHTML = `
        <td colspan="5" style="text-align:center; color: var(--text-muted); padding: 20px;">
          Aún no tenemos equipos en este grupo.
        </td>
      `;
      return;
    }

    const sortedTeams = teams.sort((a, b) => {
      if (b.stats.points !== a.stats.points) {
        return b.stats.points - a.stats.points;
      }

      if ((b.stats.gamesWon || 0) !== (a.stats.gamesWon || 0)) {
        return (b.stats.gamesWon || 0) - (a.stats.gamesWon || 0);
      }

      return (a.stats.gamesLost || 0) - (b.stats.gamesLost || 0);
    });

    sortedTeams.forEach((team, index) => {
      const row = tbodyElement.insertRow();
      row.className = `position-${index + 1}`;

      const logoUrl = team.logo
        ? resolveMediaUrl(team.logo)
        : "../Image/team.png";
      row.innerHTML = `
        <td data-label="Pos">${index + 1}</td>
        <td data-label="Equipo" title="${team.name}">
          <img src="${logoUrl}" class="bracket-team-logo" alt="${team.name}" onerror="this.onerror=null; this.src='../Image/team.png';">
          ${team.name}
        </td>
        <td data-label="PG">${team.stats.gamesWon || 0}</td>
        <td data-label="PP">${team.stats.gamesLost || 0}</td>
        <td data-label="Puntos">${team.stats.points}</td>
      `;
    });
  };

  const toggleMainContentVisibility = (showTables) => {
    if (showTables) {
      scoreboardTablesContainer.classList.remove("hidden");
      scoreboardEmptyMessage.classList.add("hidden");
    } else {
      scoreboardTablesContainer.classList.add("hidden");
      scoreboardEmptyMessage.classList.remove("hidden");
    }
  };

  const fetchAndRenderTables = async () => {
    try {
      const { teams } = await fetchApiData("/teams");

      if (!teams || teams.length === 0) {
        toggleMainContentVisibility(false);
        scoreboardEmptyMessage.innerHTML = `<i class="fas fa-shield-alt"></i><p>Los equipos contendientes serán revelados próximamente.</p>`;
      } else {
        toggleMainContentVisibility(true);

        const groupA = teams.filter((team) => team.group === "A");
        const groupB = teams.filter((team) => team.group === "B");

        renderTable(groupABody, groupA);
        renderTable(groupBBody, groupB);
      }
    } catch (error) {
      console.error("Error al cargar la tabla de puntuación:", error);
      toggleMainContentVisibility(false);
      scoreboardEmptyMessage.innerHTML = `<i class="fas fa-exclamation-triangle"></i><p>Hubo un problema al cargar los equipos. Por favor, inténtalo de nuevo más tarde.</p>`;
    }
  };

  fetchAndRenderTables();
});
