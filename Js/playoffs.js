document.addEventListener("DOMContentLoaded", () => {
  const API_URL = "https://api.mochilacup.xyz/api";
  const SERVER_BASE_URL = "https://api.mochilacup.xyz";
  const bracketContainer = document.getElementById("bracket-container");
  const loader = document.getElementById("loader");

  if (!bracketContainer) {
    console.error(
      "El contenedor del bracket (#bracket-container) no se encontró."
    );
    return;
  }

  const renderMatch = (matchData) => {
    if (!matchData) {
      return `
        <div class="team-entry"><span class="team-name">Por definir</span></div>
        <div class="team-entry"><span class="team-name">Por definir</span></div>
      `;
    }

    const { team1, team2, result, isFinished, winner } = matchData;
    const score1 = isFinished ? result.scoreTeam1 : "";
    const score2 = isFinished ? result.scoreTeam2 : "";

    let class1 = "";
    let class2 = "";
    if (isFinished && winner) {
      if (winner._id === team1?._id) {
        class1 = "winner";
        class2 = "loser";
      } else if (winner._id === team2?._id) {
        class2 = "winner";
        class1 = "loser";
      }
    }

    const team1HTML = team1
      ? `<img src="${SERVER_BASE_URL}${
          team1.logo
        }" class="bracket-team-logo" alt="${team1.name}"> ${team1.name} (${
          team1.stats ? team1.stats.points : 0
        } pts)`
      : "Por definir";
    const team2HTML = team2
      ? `<img src="${SERVER_BASE_URL}${
          team2.logo
        }" class="bracket-team-logo" alt="${team2.name}"> ${team2.name} (${
          team2.stats ? team2.stats.points : 0
        } pts)`
      : "Por definir";

    return `
      <div class="team-entry ${class1}">
        <span class="team-name">${team1HTML}</span>
        <span class="score">${score1}</span>
      </div>
      <div class="team-entry ${class2}">
        <span class="team-name">${team2HTML}</span>
        <span class="score">${score2}</span>
      </div>
    `;
  };

  const fetchAndDisplayBracket = async () => {
    try {
      loader.style.display = "flex";

      const [teamsResponse, matchesResponse] = await Promise.all([
        fetch(`${API_URL}/teams`),
        fetch(`${API_URL}/matches`),
      ]);

      if (!teamsResponse.ok || !matchesResponse.ok) {
        throw new Error("No se pudieron cargar los datos.");
      }

      const { teams } = await teamsResponse.json();
      const { matches } = await matchesResponse.json();

      const sortedGroupA = teams
        .filter((t) => t.group === "A")
        .sort((a, b) => {
          if (b.stats.points !== a.stats.points)
            return b.stats.points - a.stats.points;
          return (b.stats.gamesWon || 0) - (a.stats.gamesWon || 0);
        });
      const sortedGroupB = teams
        .filter((t) => t.group === "B")
        .sort((a, b) => {
          if (b.stats.points !== a.stats.points)
            return b.stats.points - a.stats.points;
          return (b.stats.gamesWon || 0) - (a.stats.gamesWon || 0);
        });

      const upperBracketTeams = [
        sortedGroupA[0],
        sortedGroupA[1],
        sortedGroupB[0],
        sortedGroupB[1],
      ].filter((t) => t);

      const lowerBracketTeams = [sortedGroupA[2], sortedGroupB[2]].filter(
        (t) => t
      );

      const playoffMatches = matches.filter(
        (m) => m.isPlayoff && m.playoffRound
      );
      const matchesByRoundId = playoffMatches.reduce((acc, match) => {
        acc[match.playoffRound] = match;
        return acc;
      }, {});

      if (upperBracketTeams.length < 4 || lowerBracketTeams.length < 2) {
        bracketContainer.innerHTML = `<p class="info-message">El bracket se revelará cuando finalice la fase de grupos y haya suficientes equipos clasificados.</p>`;
        loader.style.display = "none";
        return;
      }

      const upperRounds = [
        {
          title: "Upper Bracket - Semifinal",
          ids: ["ub-sf-1", "ub-sf-2"],
          initialTeams: [
            { team1: upperBracketTeams[0], team2: upperBracketTeams[3] },
            { team1: upperBracketTeams[1], team2: upperBracketTeams[2] },
          ],
        },
        { title: "Upper Bracket - Final", ids: ["ub-final"] },
      ];

      const lowerRounds = [
        {
          title: "Lower Bracket - Ronda 1",
          ids: ["lb-r1-1", "lb-r1-2"],
          initialTeams: [
            { team1: lowerBracketTeams[0], team2: null },
            { team1: lowerBracketTeams[1], team2: null },
          ],
        },
        { title: "Lower Bracket - Cuartos", ids: ["lb-qf-1", "lb-qf-2"] },
        { title: "Lower Bracket - Semifinal", ids: ["lb-sf-1"] },
        { title: "Lower Bracket - Final", ids: ["lb-final"] },
      ];

      const createBranchHTML = (roundsData) => {
        const branchDiv = document.createElement("div");
        branchDiv.className = "bracket-branch";
        roundsData.forEach((roundInfo) => {
          const roundDiv = document.createElement("div");
          roundDiv.className = "bracket-round";
          roundDiv.innerHTML = `<h3 class="round-title">${roundInfo.title}</h3>`;
          const matchList = document.createElement("div");
          matchList.className = "match-list";
          roundInfo.ids.forEach((matchId, index) => {
            let matchData = matchesByRoundId[matchId];
            if (!matchData && roundInfo.initialTeams) {
              matchData = roundInfo.initialTeams[index];
            }
            const matchDiv = document.createElement("div");
            matchDiv.className = "match-item";
            matchDiv.innerHTML = renderMatch(matchData);
            matchList.appendChild(matchDiv);
          });
          roundDiv.appendChild(matchList);
          branchDiv.appendChild(roundDiv);
        });
        return branchDiv;
      };

      const upperBranchEl = createBranchHTML(upperRounds);
      const lowerBranchEl = createBranchHTML(lowerRounds);

      const mainBracket = document.createElement("div");
      mainBracket.className = "main-bracket";
      mainBracket.append(upperBranchEl, lowerBranchEl);

      const finalCol = document.createElement("div");
      finalCol.className = "bracket-round grand-final-col";
      finalCol.innerHTML = `<h3 class="round-title grand-final-title">Gran Final</h3>`;
      const finalMatch = document.createElement("div");
      finalMatch.className = "match-item final";
      finalMatch.innerHTML = renderMatch(matchesByRoundId["grand-final"]);
      finalCol.appendChild(finalMatch);

      bracketContainer.append(mainBracket, finalCol);
      loader.style.display = "none";
    } catch (error) {
      console.error("Error al cargar el bracket:", error);
      loader.innerHTML = `<p class="info-message">Error al cargar el bracket. Intenta de nuevo más tarde.</p>`;
    }
  };

  fetchAndDisplayBracket();
});
