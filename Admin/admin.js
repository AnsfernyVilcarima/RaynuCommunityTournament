document.addEventListener("DOMContentLoaded", () => {
  // Todo el código se ejecuta solo después de que el DOM esté completamente listo.

  (function () {
    // =================================================================
    // --- 1. CONFIGURACIÓN Y ESTADO GLOBAL ---
    // =================================================================
    const adapterOptions = {
      fallbackAssets: {
        casterPhoto: "../Image/caster.png",
      },
    };

    const ensureFunction = (candidate, fallback) =>
      typeof candidate === "function" ? candidate : fallback;

    const callWithFallback = (candidate, fallback) => (...args) =>
      ensureFunction(candidate, fallback)(...args);

    const createFallbackAdapter = (assets) => {
      const config = window.__RAYNU_CONFIG__ || {};
      const defaults = {
        ...assets,
        ...(config.defaultAssets && typeof config.defaultAssets === "object"
          ? config.defaultAssets
          : {}),
      };

      const normalizeEndpoint = (endpoint = "") =>
        endpoint ? (endpoint.startsWith("/") ? endpoint : `/${endpoint}`) : "";

      const buildApiUrl = (endpoint = "") => {
        const rawBase =
          (typeof config.apiBaseUrl === "string" && config.apiBaseUrl.trim()) ||
          "https://api.raynucommunitytournament.xyz/api";
        const normalizedBase = rawBase.endsWith("/")
          ? rawBase.slice(0, -1)
          : rawBase;
        if (!endpoint) return normalizedBase;
        return `${normalizedBase}${normalizeEndpoint(endpoint)}`;
      };

      const fetchFromConfig =
        typeof config.fetchApiData === "function"
          ? (endpoint) => config.fetchApiData(endpoint)
          : async (endpoint) => {
              const response = await fetch(buildApiUrl(endpoint));
              if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
              }
              return response.json();
            };

      const resolveMediaUrl =
        typeof config.resolveMediaUrl === "function"
          ? (assetPath) => config.resolveMediaUrl(assetPath)
          : (assetPath) => assetPath || "";

      const getDefaultAsset = (key) => defaults[key] || "";

      const withDefault = (assetPath, key) => {
        const resolved = assetPath ? resolveMediaUrl(assetPath) : "";
        return resolved || getDefaultAsset(key);
      };

      return {
        defaults,
        fetchApiData: fetchFromConfig,
        resolveMediaUrl,
        getDefaultAsset,
        withDefault,
        buildApiUrl,
        getConfig: () => config,
      };
    };

    const fallbackAdapter = createFallbackAdapter(
      adapterOptions.fallbackAssets
    );

    const adapter =
      (typeof window.getRaynuAdapter === "function" &&
        window.getRaynuAdapter(adapterOptions)) ||
      (window.RaynuClient &&
      typeof window.RaynuClient.createAdapter === "function"
        ? window.RaynuClient.createAdapter(adapterOptions)
        : null) ||
      fallbackAdapter;

    const fetchApiData = callWithFallback(
      adapter.fetchApiData,
      fallbackAdapter.fetchApiData
    );
    const resolveMediaUrl = callWithFallback(
      adapter.resolveMediaUrl,
      fallbackAdapter.resolveMediaUrl
    );
    const getDefaultAsset = callWithFallback(
      adapter.getDefaultAsset,
      fallbackAdapter.getDefaultAsset
    );
    const withDefaultAsset = callWithFallback(
      adapter.withDefault,
      fallbackAdapter.withDefault
    );
    const buildApiUrl = callWithFallback(
      adapter.buildApiUrl,
      fallbackAdapter.buildApiUrl
    );
    const getConfig = callWithFallback(
      adapter.getConfig,
      fallbackAdapter.getConfig
    );

    const defaults = {
      ...fallbackAdapter.defaults,
      ...(adapter && typeof adapter === "object" && adapter.defaults
        ? adapter.defaults
        : {}),
    };

    const config = {
      API_URL: buildApiUrl(),
      buildApiUrl,
      resolveMediaUrl,
      getDefaultAsset,
      withDefaultAsset,
      fetchApiData,
      defaults,
      getConfig,
    };

    const DEFAULT_CASTER_PHOTO = config.getDefaultAsset("casterPhoto");

    const state = {
      teams: [],
      matches: [],
      casters: [],
      currentCasterSocials: {},
      users: [],
      sanctions: [],
      logs: [],
      currentUser: null,
      selectedTeamId: null,
      editingUserId: null,
      editingCasterId: null,
    };

    // =================================================================
    // --- 2. ELEMENTOS DEL DOM (CENTRALIZADOS) ---
    // =================================================================
    const dom = {
      createTeamForm: document.getElementById("create-team-form"),
      editTeamForm: document.getElementById("edit-team-form"),
      createMatchForm: document.getElementById("create-match-form"),
      updateScoreForm: document.getElementById("update-score-form"),
      casterForm: document.getElementById("caster-form"),
      addSocialButton: document.getElementById("add-social-button"),
      socialPlatformSelect: document.getElementById("social-platform-select"),
      socialUrlInput: document.getElementById("social-url-input"),
      otherPlatformInputGroup: document.getElementById(
        "other-platform-input-group"
      ),
      otherPlatformNameInput: document.getElementById("other-platform-name"),
      socialsListContainer: document.getElementById("socials-list-container"),
      createUserForm: document.getElementById("create-user-form"),
      sanctionForm: document.getElementById("sanction-form"),
      masterTeamSelect: document.getElementById("master-team-select"),
      manualTeam1Select: document.getElementById("manual-team1-select"),
      manualTeam2Select: document.getElementById("manual-team2-select"),
      manualMatchDate: document.getElementById("manual-match-date"),
      manualGroupSelect: document.getElementById("manual-group-select"),
      matchSelect: document.getElementById("match-select"),
      matchDetailsContainer: document.getElementById("match-details"),
      matchTeam1Label: document.getElementById("match-team1-label"),
      matchTeam2Label: document.getElementById("match-team2-label"),
      team1ScoreInput: document.getElementById("team1-score"),
      team2ScoreInput: document.getElementById("team2-score"),
      sanctionTeamSelect: document.getElementById("sanction-team-select"),
      editFieldsContainer: document.getElementById("edit-fields-container"),
      membersListContainer: document.getElementById("members-list-container"),
      castersListContainer: document.getElementById("casters-list-container"),
      usersListContainer: document.getElementById("users-list-container"),
      sanctionsListContainer: document.getElementById(
        "sanctions-list-container"
      ),
      logsListContainer: document.getElementById("logs-list-container"),
      deleteTeamButton: document.getElementById("delete-team-button"),
      addMemberButton: document.getElementById("add-member-button"),
      isPlayoffCheckbox: document.getElementById("is-playoff-checkbox"),
      playoffRoundGroup: document.getElementById("playoff-round-group"),
      casterFormCancelButton: document.getElementById("caster-form-cancel"),
    };

    // =================================================================
    // --- 3. UTILIDADES Y FUNCIONES COMPARTIDAS ---
    // =================================================================
    const utils = {
      showMessage(message, type = "success") {
        alert(`[${type.toUpperCase()}] ${message}`);
      },
      showConfirmationModal(message) {
        return Promise.resolve(window.confirm(message));
      },
      decodeToken(token) {
        try {
          return JSON.parse(atob(token.split(".")[1]));
        } catch (e) {
          return null;
        }
      },
      fetchWithAuth(url, options = {}) {
        const token = localStorage.getItem("authToken");
        const headers = {
          ...options.headers,
          Authorization: `Bearer ${token}`,
        };
        if (!(options.body instanceof FormData)) {
          headers["Content-Type"] = "application/json";
        }
        return fetch(url, { ...options, headers });
      },
      setButtonLoading: (button, isLoading) => {
        if (!button) return;
        if (isLoading) {
          button.disabled = true;
          button.dataset.originalHtml = button.innerHTML;
          button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Procesando...`;
        } else {
          button.disabled = false;
          if (button.dataset.originalHtml) {
            button.innerHTML = button.dataset.originalHtml;
          }
        }
      },

      htmlToMarkdown: (htmlString) => {
        if (!htmlString) return "";
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = htmlString;

        const links = tempDiv.querySelectorAll("a");
        links.forEach((link) => {
          const markdownLink = `[${link.textContent}](${link.href})`;
          link.replaceWith(document.createTextNode(markdownLink));
        });

        return tempDiv.textContent || "";
      },
    };

    // =================================================================
    // --- 4. RENDERIZADO DE COMPONENTES ---
    // =================================================================
    const render = {
      list: (container, items, renderItem) => {
        if (!container) return;
        container.innerHTML = "";
        if (items.length === 0) {
          container.innerHTML = "<p>No hay elementos para mostrar.</p>";
          return;
        }
        items.forEach((item) => container.appendChild(renderItem(item)));
      },
      casters: () => {
        render.list(dom.castersListContainer, state.casters, (item) => {
          const el = document.createElement("div");
          el.className = "admin-list-item";
          const photoUrl = config.withDefaultAsset(item.photo, "casterPhoto");
          const photoHtml = photoUrl
            ? `<img src="${photoUrl}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 50%; margin-right: 10px;" onerror="this.onerror=null; this.src='${DEFAULT_CASTER_PHOTO}';">`
            : "";
          let socialsHtml = "<p>Sin redes sociales.</p>";
          if (item.socials && Object.keys(item.socials).length > 0) {
            socialsHtml =
              "<p>Redes: " +
              Object.entries(item.socials)
                .map(
                  ([platform, url]) =>
                    `<a href="${url}" target="_blank">${
                      platform.charAt(0).toUpperCase() + platform.slice(1)
                    }</a>`
                )
                .join(", ") +
              "</p>";
          }
          el.innerHTML = `
                  <div class="admin-list-item-content" style="display: flex; align-items: center;">
                      ${photoHtml}
                      <div>
                          <h5>${item.name}</h5>
                          <p>Descripción: ${
                            item.description || "No especificada"
                          }</p>
                          ${socialsHtml}
                      </div>
                  </div>
                  <div class="admin-list-item-actions">
                      <button class="edit-btn" data-id="${
                        item._id
                      }" title="Editar Caster"><i class="fas fa-edit"></i></button>
                      <button class="delete-btn" data-id="${
                        item._id
                      }" title="Eliminar Caster"><i class="fas fa-trash"></i></button>
                  </div>`;
          return el;
        });
      },
      users: () => {
        render.list(dom.usersListContainer, state.users, (item) => {
          const el = document.createElement("div");
          el.className = "admin-list-item";
          const isCurrentUser = item._id === state.currentUser.id;
          const deleteButtonDisabled = isCurrentUser
            ? 'disabled title="No puedes eliminar tu propia cuenta"'
            : 'title="Eliminar Usuario"';
          el.innerHTML = `
                  <div class="admin-list-item-content">
                      <h5>${item.email} ${isCurrentUser ? "(Tú)" : ""}</h5>
                      <p>Roles: ${item.roles.join(", ")}</p>
                  </div>
                  <div class="admin-list-item-actions">
                      <button class="edit-user-btn" data-id="${
                        item._id
                      }" title="Editar Usuario"><i class="fas fa-edit"></i></button>
                      <button class="delete-user-btn" data-id="${
                        item._id
                      }" ${deleteButtonDisabled}><i class="fas fa-trash"></i></button>
                  </div>`;
          return el;
        });
      },
      sanctions: () => {
        render.list(dom.sanctionsListContainer, state.sanctions, (item) => {
          const el = document.createElement("div");
          el.className = "admin-list-item";
          el.innerHTML = `
                  <div class="admin-list-item-content">
                      <h5>${
                        item.team ? item.team.name : "Equipo no encontrado"
                      }</h5>
                      <p>${item.reason} - <strong>Penalización:</strong> ${
            item.penalty
          }</p>
                  </div>
                  <div class="admin-list-item-actions">
                      <button class="delete-btn" data-id="${
                        item._id
                      }" title="Eliminar Sanción"><i class="fas fa-trash"></i></button>
                  </div>`;
          return el;
        });
      },
      logs: () => {
        render.list(dom.logsListContainer, state.logs, (item) => {
          const el = document.createElement("div");
          el.className = "admin-list-item log-item";
          el.innerHTML = `
                  <div class="log-header">
                      <span class="log-action"><i class="fas fa-bolt"></i> ${
                        item.action
                      }</span>
                      <span class="log-timestamp">${new Date(
                        item.createdAt
                      ).toLocaleString("es-ES")}</span>
                  </div>
                  <div class="log-body">
                      <p class="log-details">${item.details}</p>
                      <p class="log-responsible">
                          <i class="fas fa-user-shield"></i>
                          Responsable: <strong>${item.user}</strong> 
                          <span>(${item.roles.join(", ")})</span>
                      </p>
                  </div>`;
          return el;
        });
      },
      teamMembers: (team) => {
        if (!dom.membersListContainer) return;
        dom.membersListContainer.innerHTML = "";
        if (!team.members || team.members.length === 0) {
          dom.membersListContainer.innerHTML =
            "<p>Este equipo no tiene miembros registrados.</p>";
          return;
        }
        team.members.forEach((member) => {
          const el = document.createElement("div");
          el.className = "member-item";
          el.innerHTML = `<span class="member-item-info">${member.name}<span class="role">${member.role}</span></span><button class="delete-member-btn" data-member-name="${member.name}"><i class="fas fa-trash"></i></button>`;
          dom.membersListContainer.appendChild(el);
        });
      },
      allTeamSelects: () => {
        const selects = [
          dom.masterTeamSelect,
          dom.manualTeam1Select,
          dom.manualTeam2Select,
          dom.sanctionTeamSelect,
        ];
        selects.forEach((select) => {
          if (!select) return;
          const currentVal = select.value;
          select.innerHTML =
            '<option value="" disabled selected>Selecciona un equipo...</option>';
          state.teams.forEach((team) =>
            select.add(new Option(team.name, team._id))
          );
          select.value = currentVal;
        });
        if (dom.masterTeamSelect) dom.masterTeamSelect.value = "";
      },
      pendingMatches: () => {
        if (!dom.matchSelect) return;
        dom.matchSelect.innerHTML =
          '<option value="" disabled selected>Selecciona una partida...</option>';
        const pendingMatches = state.matches.filter(
          (m) => !m.isFinished && m.team1 && m.team2
        );
        pendingMatches.forEach((match) => {
          dom.matchSelect.add(
            new Option(`${match.team1.name} vs ${match.team2.name}`, match._id)
          );
        });
      },
      renderCasterSocialsInForm: () => {
        if (!dom.socialsListContainer) return;
        dom.socialsListContainer.innerHTML = "";
        if (Object.keys(state.currentCasterSocials).length === 0) {
          dom.socialsListContainer.innerHTML =
            "<p>No se han añadido redes sociales.</p>";
          return;
        }
        Object.entries(state.currentCasterSocials).forEach(
          ([platform, url]) => {
            const el = document.createElement("div");
            el.className = "social-item";
            const displayPlatformName =
              platform.charAt(0).toUpperCase() + platform.slice(1);
            el.innerHTML = `<span>${displayPlatformName}: <a href="${url}" target="_blank">${url}</a></span> <button type="button" class="delete-social-btn" data-platform="${platform}"><i class="fas fa-times"></i></button>`;
            dom.socialsListContainer.appendChild(el);
          }
        );
      },
    };

    // =================================================================
    // --- 5. MÓDULOS DE FUNCIONALIDAD ---
    // =================================================================
    const featureModules = {
      initMatches() {
        // Lógica para crear una nueva partida
        if (dom.createMatchForm) {
          dom.createMatchForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const button = e.submitter;
            utils.setButtonLoading(button, true);
            try {
              const formData = new FormData(dom.createMatchForm);
              const data = Object.fromEntries(formData.entries());
              data.isPlayoff = dom.isPlayoffCheckbox.checked;

              if (data.isPlayoff && !data.playoffRound) {
                throw new Error("Debes seleccionar una ronda de playoff.");
              }

              const response = await utils.fetchWithAuth(
                `${config.API_URL}/matches`,
                {
                  method: "POST",
                  body: JSON.stringify(data),
                }
              );
              if (!response.ok)
                throw new Error((await response.json()).message);
              utils.showMessage("Partida programada con éxito.");
              dom.createMatchForm.reset();
              await App.fetchAllData();
            } catch (error) {
              utils.showMessage(error.message, "error");
            } finally {
              utils.setButtonLoading(button, false);
            }
          });
        }

        if (dom.updateScoreForm) {
          dom.matchSelect.addEventListener("change", () => {
            const matchId = dom.matchSelect.value;
            if (matchId) {
              const match = state.matches.find((m) => m._id === matchId);
              if (match) {
                const team1 = state.teams.find((t) => t._id === match.team1);
                const team2 = state.teams.find((t) => t._id === match.team2);
                dom.matchTeam1Label.textContent = team1.name;
                dom.matchTeam2Label.textContent = team2.name;
                dom.matchDetails.classList.remove("hidden");
              }
            } else {
              dom.matchDetails.classList.add("hidden");
            }
          });

          dom.updateScoreForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const button = e.submitter;
            utils.setButtonLoading(button, true);
            const matchId = dom.matchSelect.value;
            const scoreTeam1 = dom.team1ScoreInput.value;
            const scoreTeam2 = dom.team2ScoreInput.value;

            try {
              const response = await utils.fetchWithAuth(
                `${config.API_URL}/matches/${matchId}`,
                {
                  method: "PUT",
                  body: JSON.stringify({
                    scoreTeam1,
                    scoreTeam2,
                    isFinished: true,
                  }),
                }
              );
              if (!response.ok)
                throw new Error((await response.json()).message);
              utils.showMessage("Resultado guardado y partido finalizado.");
              dom.updateScoreForm.reset();
              dom.matchDetails.classList.add("hidden");
              await App.fetchAllData();

              const pendingGroupMatches = state.matches.filter(
                (m) => !m.isFinished && !m.isPlayoff
              );
              if (pendingGroupMatches.length === 1) {
                const confirmed = await utils.showConfirmationModal(
                  "Este es el último partido de la fase de grupos. ¿Quieres generar la fase de playoffs automáticamente?"
                );
                if (confirmed) {
                  await createPlayoffMatches();
                }
              }
            } catch (error) {
              utils.showMessage(error.message, "error");
            } finally {
              utils.setButtonLoading(button, false);
            }
          });
        }

        if (dom.isPlayoffCheckbox) {
          dom.isPlayoffCheckbox.addEventListener("change", (e) => {
            if (e.target.checked) {
              dom.playoffRoundGroup.style.display = "block";
              dom.playoffRoundInput.required = true;
            } else {
              dom.playoffRoundGroup.style.display = "none";
              dom.playoffRoundInput.required = false;
              dom.playoffRoundInput.value = "";
            }
          });
        }

        if (dom.generatePlayoffsBtn) {
          dom.generatePlayoffsBtn.addEventListener("click", async () => {
            const confirmed = await utils.showConfirmationModal(
              "¿Seguro que quieres generar la fase de playoffs? Esta acción no se puede deshacer."
            );
            if (confirmed) {
              const button = dom.generatePlayoffsBtn;
              utils.setButtonLoading(button, true);
              try {
                await createPlayoffMatches();
              } catch (error) {
                utils.showMessage(error.message, "error");
              } finally {
                utils.setButtonLoading(button, false);
              }
            }
          });
        }

        const createPlayoffMatches = async () => {
          try {
            const qualifiedTeams = {};
            state.groups.forEach((group) => {
              const sortedTeams = [...state.teams]
                .filter((t) => t.group === group)
                .sort((a, b) => {
                  if (b.points !== a.points) return b.points - a.points;
                  if (b.mapDifference !== a.mapDifference)
                    return b.mapDifference - a.mapDifference;
                  return b.wins - a.wins;
                });
              qualifiedTeams[group] = sortedTeams.slice(0, 2);
            });

            if (
              Object.values(qualifiedTeams).some((teams) => teams.length < 2)
            ) {
              throw new Error(
                "No todos los grupos tienen equipos clasificados. Asegúrate de que los partidos de la fase de grupos estén finalizados."
              );
            }

            const playoffRounds = [
              {
                team1: qualifiedTeams.A[0],
                team2: qualifiedTeams.B[1],
                round: "ub-sf-1",
                format: "bo3",
                matchDate: "2025-08-10T16:00:00-05:00",
              },
              {
                team1: qualifiedTeams.B[0],
                team2: qualifiedTeams.A[1],
                round: "ub-sf-2",
                format: "bo3",
                matchDate: "2025-08-10T19:30:00-05:00",
              },
            ];

            for (const match of playoffRounds) {
              const data = {
                team1: match.team1._id,
                team2: match.team2._id,
                matchDate: match.matchDate,
                isPlayoff: true,
                playoffRound: match.round,
                format: match.format,
              };

              await utils.fetchWithAuth(`${config.API_URL}/matches`, {
                method: "POST",
                body: JSON.stringify(data),
              });
            }

            utils.showMessage(
              "¡Fase de playoffs generada automáticamente!",
              "success"
            );
            await App.fetchAllData();
          } catch (error) {
            utils.showMessage(error.message, "error");
            throw error;
          }
        };
      },
      initTeams() {
        if (dom.createTeamForm)
          dom.createTeamForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const button = e.submitter;
            utils.setButtonLoading(button, true);
            try {
              const response = await utils.fetchWithAuth(
                `${config.API_URL}/teams`,
                { method: "POST", body: new FormData(dom.createTeamForm) }
              );
              if (!response.ok)
                throw new Error((await response.json()).message);
              utils.showMessage("¡Equipo creado exitosamente!");
              dom.createTeamForm.reset();
              await App.fetchAllData();
            } catch (error) {
              utils.showMessage(error.message, "error");
            } finally {
              utils.setButtonLoading(button, false);
            }
          });
        if (dom.editTeamForm)
          dom.editTeamForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            if (!state.selectedTeamId) return;
            const button = e.submitter;
            utils.setButtonLoading(button, true);
            try {
              const response = await utils.fetchWithAuth(
                `${config.API_URL}/teams/${state.selectedTeamId}`,
                { method: "PUT", body: new FormData(dom.editTeamForm) }
              );
              if (!response.ok)
                throw new Error((await response.json()).message);
              utils.showMessage("¡Equipo actualizado exitosamente!");
              await App.fetchAllData();
              if (dom.masterTeamSelect)
                dom.masterTeamSelect.value = state.selectedTeamId;
            } catch (error) {
              utils.showMessage(error.message, "error");
            } finally {
              utils.setButtonLoading(button, false);
            }
          });
        if (dom.masterTeamSelect)
          dom.masterTeamSelect.addEventListener("change", () => {
            state.selectedTeamId = dom.masterTeamSelect.value;
            if (!state.selectedTeamId) {
              if (dom.editFieldsContainer)
                dom.editFieldsContainer.classList.add("hidden");
              return;
            }
            const team = state.teams.find(
              (t) => t._id === state.selectedTeamId
            );
            if (team) {
              document.getElementById("edit-team-name").value = team.name;
              document.getElementById("edit-team-motto").value = team.motto;
              document.getElementById("edit-team-group").value = team.group;
              render.teamMembers(team);
              if (dom.editFieldsContainer)
                dom.editFieldsContainer.classList.remove("hidden");
            }
          });
        if (dom.deleteTeamButton)
          dom.deleteTeamButton.addEventListener("click", async () => {
            if (!state.selectedTeamId)
              return utils.showMessage(
                "Por favor, selecciona un equipo primero.",
                "error"
              );
            const team = state.teams.find(
              (t) => t._id === state.selectedTeamId
            );
            const confirmed = await utils.showConfirmationModal(
              `¿Estás seguro de que quieres eliminar al equipo "${team.name}"?`
            );
            if (confirmed) {
              try {
                const response = await utils.fetchWithAuth(
                  `${config.API_URL}/teams/${state.selectedTeamId}`,
                  { method: "DELETE" }
                );
                if (!response.ok)
                  throw new Error((await response.json()).message);
                utils.showMessage("Equipo eliminado exitosamente.");
                if (dom.editFieldsContainer)
                  dom.editFieldsContainer.classList.add("hidden");
                await App.fetchAllData();
              } catch (error) {
                utils.showMessage(error.message, "error");
              }
            }
          });
        if (dom.addMemberButton)
          dom.addMemberButton.addEventListener("click", async () => {
            if (!state.selectedTeamId) return;
            const nameInput = document.getElementById("add-member-name");
            const roleInput = document.getElementById("add-member-role");
            const name = nameInput.value.trim();
            if (!name)
              return utils.showMessage(
                "El nombre del miembro es obligatorio.",
                "error"
              );
            const team = state.teams.find(
              (t) => t._id === state.selectedTeamId
            );
            const updatedMembers = [
              ...team.members,
              { name, role: roleInput.value },
            ];
            try {
              const response = await utils.fetchWithAuth(
                `${config.API_URL}/teams/${state.selectedTeamId}`,
                {
                  method: "PUT",
                  body: JSON.stringify({ members: updatedMembers }),
                }
              );
              if (!response.ok)
                throw new Error((await response.json()).message);
              utils.showMessage("Miembro añadido con éxito.");
              nameInput.value = "";
              await App.fetchAllData();
              if (dom.masterTeamSelect) {
                dom.masterTeamSelect.value = state.selectedTeamId;
                dom.masterTeamSelect.dispatchEvent(new Event("change"));
              }
            } catch (error) {
              utils.showMessage(error.message, "error");
            }
          });
        if (dom.membersListContainer)
          dom.membersListContainer.addEventListener("click", async (e) => {
            const deleteBtn = e.target.closest(".delete-member-btn");
            if (deleteBtn) {
              if (!state.selectedTeamId) return;
              const memberName = deleteBtn.dataset.memberName;
              const confirmed = await utils.showConfirmationModal(
                `¿Estás seguro de que quieres eliminar a ${memberName}?`
              );
              if (confirmed) {
                const team = state.teams.find(
                  (t) => t._id === state.selectedTeamId
                );
                const updatedMembers = team.members.filter(
                  (m) => m.name !== memberName
                );
                try {
                  const response = await utils.fetchWithAuth(
                    `${config.API_URL}/teams/${state.selectedTeamId}`,
                    {
                      method: "PUT",
                      body: JSON.stringify({ members: updatedMembers }),
                    }
                  );
                  if (!response.ok)
                    throw new Error((await response.json()).message);
                  utils.showMessage("Miembro eliminado con éxito.");
                  await App.fetchAllData();
                  if (dom.masterTeamSelect) {
                    dom.masterTeamSelect.value = state.selectedTeamId;
                    dom.masterTeamSelect.dispatchEvent(new Event("change"));
                  }
                } catch (error) {
                  utils.showMessage(error.message, "error");
                }
              }
            }
          });
      },
      initSanctions() {
        if (dom.sanctionForm)
          dom.sanctionForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const button = e.submitter;
            utils.setButtonLoading(button, true);
            try {
              const data = Object.fromEntries(
                new FormData(dom.sanctionForm).entries()
              );
              const response = await utils.fetchWithAuth(
                `${config.API_URL}/sanctions`,
                { method: "POST", body: JSON.stringify(data) }
              );
              if (!response.ok)
                throw new Error((await response.json()).message);
              utils.showMessage("Sanción aplicada con éxito.");
              dom.sanctionForm.reset();
              await App.fetchAllData();
            } catch (error) {
              utils.showMessage(error.message, "error");
            } finally {
              utils.setButtonLoading(button, false);
            }
          });
        if (dom.sanctionsListContainer)
          dom.sanctionsListContainer.addEventListener("click", async (e) => {
            const deleteBtn = e.target.closest(".delete-btn");
            if (deleteBtn) {
              const id = deleteBtn.dataset.id;
              const confirmed = await utils.showConfirmationModal(
                "¿Seguro que quieres eliminar esta sanción?"
              );
              if (confirmed) {
                try {
                  const response = await utils.fetchWithAuth(
                    `${config.API_URL}/sanctions/${id}`,
                    { method: "DELETE" }
                  );
                  if (!response.ok)
                    throw new Error((await response.json()).message);
                  utils.showMessage("Sanción eliminada.");
                  App.fetchAllData();
                } catch (error) {
                  utils.showMessage(error.message, "error");
                }
              }
            }
          });
      },
      initCasters() {
        if (!dom.casterForm) return;

        if (dom.socialPlatformSelect) {
          dom.socialPlatformSelect.addEventListener("change", () => {
            if (dom.socialPlatformSelect.value === "other") {
              dom.otherPlatformInputGroup.classList.remove("hidden");
              dom.otherPlatformNameInput.required = true;
            } else {
              dom.otherPlatformInputGroup.classList.add("hidden");
              dom.otherPlatformNameInput.required = false;
              dom.otherPlatformNameInput.value = "";
            }
          });
        }

        if (dom.addSocialButton)
          dom.addSocialButton.addEventListener("click", () => {
            let platform = dom.socialPlatformSelect.value;
            const url = dom.socialUrlInput.value.trim();
            if (platform === "other") {
              platform = dom.otherPlatformNameInput.value.trim().toLowerCase();
              if (!platform)
                return utils.showMessage(
                  "Debes especificar el nombre de la plataforma 'Otro'.",
                  "error"
                );
            }
            if (!platform || !url)
              return utils.showMessage(
                "La plataforma y la URL son obligatorios.",
                "error"
              );
            try {
              new URL(url);
            } catch (_) {
              return utils.showMessage("La URL no es válida.", "error");
            }
            if (state.currentCasterSocials[platform])
              return utils.showMessage(
                `Ya existe una red social para "${platform}".`,
                "error"
              );
            state.currentCasterSocials[platform] = url;
            render.renderCasterSocialsInForm();
            dom.socialPlatformSelect.value = "";
            dom.socialUrlInput.value = "";
            dom.otherPlatformNameInput.value = "";
            dom.otherPlatformInputGroup.classList.add("hidden");
            dom.socialPlatformSelect.focus();
          });

        if (dom.socialsListContainer)
          dom.socialsListContainer.addEventListener("click", (e) => {
            const deleteBtn = e.target.closest(".delete-social-btn");
            if (deleteBtn) {
              const platformToDelete = deleteBtn.dataset.platform;
              delete state.currentCasterSocials[platformToDelete];
              render.renderCasterSocialsInForm();
            }
          });

        dom.casterForm.addEventListener("submit", async (e) => {
          e.preventDefault();
          const button = e.submitter;
          utils.setButtonLoading(button, true);
          try {
            if (!state.editingCasterId && state.casters.length >= 6) {
              return utils.showMessage(
                "No se pueden añadir más de 6 casters.",
                "error"
              );
            }
            const formData = new FormData(dom.casterForm);
            formData.append(
              "socials",
              JSON.stringify(state.currentCasterSocials)
            );
            const url = state.editingCasterId
              ? `${config.API_URL}/casters/${state.editingCasterId}`
              : `${config.API_URL}/casters`;
            const method = state.editingCasterId ? "PUT" : "POST";
            const response = await utils.fetchWithAuth(url, {
              method,
              body: formData,
            });
            if (!response.ok) throw new Error((await response.json()).message);
            utils.showMessage(
              `Caster ${
                state.editingCasterId ? "actualizado" : "añadido"
              } con éxito.`
            );
            dom.casterForm.reset();
            state.currentCasterSocials = {};
            render.renderCasterSocialsInForm();
            state.editingCasterId = null;
            document.getElementById("caster-form-button-text").textContent =
              "Guardar Caster";
            dom.casterFormCancelButton.classList.add("hidden");
            App.fetchAllData();
          } catch (error) {
            utils.showMessage(error.message, "error");
          } finally {
            utils.setButtonLoading(button, false);
          }
        });

        if (dom.castersListContainer)
          dom.castersListContainer.addEventListener("click", async (e) => {
            const editBtn = e.target.closest(".edit-btn");
            if (editBtn) {
              const casterItem = state.casters.find(
                (c) => c._id === editBtn.dataset.id
              );
              if (casterItem) {
                state.editingCasterId = casterItem._id;
                document.getElementById("caster-name").value = casterItem.name;
                document.getElementById("caster-description").value =
                  casterItem.description;
                document.getElementById("caster-photo").value = "";
                state.currentCasterSocials = casterItem.socials || {};
                render.renderCasterSocialsInForm();
                document.getElementById("caster-form-button-text").textContent =
                  "Actualizar Caster";
                dom.casterFormCancelButton.classList.remove("hidden");
                dom.casterForm.scrollIntoView({ behavior: "smooth" });
              }
            }
            const deleteBtn = e.target.closest(".delete-btn");
            if (deleteBtn) {
              const confirmed = await utils.showConfirmationModal(
                "¿Seguro que quieres eliminar este caster?"
              );
              if (confirmed) {
                try {
                  const response = await utils.fetchWithAuth(
                    `${config.API_URL}/casters/${deleteBtn.dataset.id}`,
                    { method: "DELETE" }
                  );
                  if (!response.ok)
                    throw new Error((await response.json()).message);
                  utils.showMessage("Caster eliminado.");
                  App.fetchAllData();
                } catch (error) {
                  utils.showMessage(error.message, "error");
                }
              }
            }
          });

        if (dom.casterFormCancelButton)
          dom.casterFormCancelButton.addEventListener("click", () => {
            dom.casterForm.reset();
            state.currentCasterSocials = {};
            render.renderCasterSocialsInForm();
            state.editingCasterId = null;
            document.getElementById("caster-form-button-text").textContent =
              "Guardar Caster";
            dom.casterFormCancelButton.classList.add("hidden");
          });
      },
      initUsers() {
        if (dom.createUserForm)
          dom.createUserForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const button = e.submitter;
            utils.setButtonLoading(button, true);
            try {
              const data = Object.fromEntries(
                new FormData(dom.createUserForm).entries()
              );
              if (state.editingUserId && !data.password) delete data.password;
              const url = state.editingUserId
                ? `${config.API_URL}/users/${state.editingUserId}`
                : `${config.API_URL}/users`;
              const method = state.editingUserId ? "PUT" : "POST";
              const response = await utils.fetchWithAuth(url, {
                method,
                body: JSON.stringify(data),
              });
              if (!response.ok)
                throw new Error((await response.json()).message);
              utils.showMessage(
                `Usuario ${
                  state.editingUserId ? "actualizado" : "creado"
                } con éxito.`
              );
              state.editingUserId = null;
              dom.createUserForm.reset();
              const submitButton = dom.createUserForm.querySelector(
                'button[type="submit"]'
              );
              submitButton.textContent = "Crear Usuario";
              const cancelButton = document.getElementById(
                "cancel-edit-user-btn"
              );
              if (cancelButton) cancelButton.remove();
              await App.fetchAllData();
            } catch (error) {
              utils.showMessage(error.message, "error");
            } finally {
              utils.setButtonLoading(button, false);
            }
          });
        if (dom.usersListContainer)
          dom.usersListContainer.addEventListener("click", async (e) => {
            const editBtn = e.target.closest(".edit-user-btn");
            if (editBtn) {
              const user = state.users.find(
                (u) => u._id === editBtn.dataset.id
              );
              if (user) {
                state.editingUserId = user._id;
                document.getElementById("user-email").value = user.email;
                document.getElementById("user-role").value =
                  user.roles[0] || "manager";
                const passwordInput = document.getElementById("user-password");
                passwordInput.value = "";
                passwordInput.placeholder = "Dejar en blanco para no cambiar";
                const submitButton = dom.createUserForm.querySelector(
                  'button[type="submit"]'
                );
                submitButton.textContent = "Actualizar Usuario";
                if (!document.getElementById("cancel-edit-user-btn")) {
                  const cancelButton = document.createElement("button");
                  cancelButton.type = "button";
                  cancelButton.id = "cancel-edit-user-btn";
                  cancelButton.textContent = "Cancelar";
                  cancelButton.className = "cta-button offline-button";
                  submitButton.after(cancelButton);
                  cancelButton.addEventListener("click", () => {
                    state.editingUserId = null;
                    dom.createUserForm.reset();
                    submitButton.textContent = "Crear Usuario";
                    passwordInput.placeholder = "";
                    cancelButton.remove();
                  });
                }
                dom.createUserForm.scrollIntoView({ behavior: "smooth" });
              }
            }
            const deleteBtn = e.target.closest(".delete-user-btn");
            if (deleteBtn) {
              const confirmed = await utils.showConfirmationModal(
                "¿Seguro que quieres eliminar este usuario?"
              );
              if (confirmed) {
                try {
                  const response = await utils.fetchWithAuth(
                    `${config.API_URL}/users/${deleteBtn.dataset.id}`,
                    { method: "DELETE" }
                  );
                  if (!response.ok)
                    throw new Error((await response.json()).message);
                  utils.showMessage("Usuario eliminado.");
                  App.fetchAllData();
                } catch (error) {
                  utils.showMessage(error.message, "error");
                }
              }
            }
          });
      },
      initLogs() {},
    };

    // =================================================================
    // --- 6. LÓGICA PRINCIPAL DE LA APLICACIÓN ---
    // =================================================================
    const App = {
      async fetchAllData() {
        try {
          const dataSources = [
            { key: "teams", url: `${config.API_URL}/teams` },
            { key: "matches", url: `${config.API_URL}/matches` },
            { key: "casters", url: `${config.API_URL}/casters` },
            { key: "users", url: `${config.API_URL}/users` },
            { key: "sanctions", url: `${config.API_URL}/sanctions` },
            { key: "logs", url: `${config.API_URL}/logs` },
          ];
          const responses = await Promise.all(
            dataSources.map((source) =>
              utils.fetchWithAuth(source.url).catch((err) => null)
            )
          );
          for (let i = 0; i < responses.length; i++) {
            const response = responses[i];
            if (response && response.ok) {
              const data = await response.json();
              state[dataSources[i].key] =
                data[dataSources[i].key] || data[Object.keys(data)[0]] || [];
            } else if (response) {
              console.error(
                `Error fetching ${dataSources[i].key}: ${response.status} ${response.statusText}`
              );
            }
          }
          this.renderAll();
        } catch (error) {
          utils.showMessage(
            `Error fatal al cargar los datos: ${error.message}`,
            "error"
          );
        }
      },

      renderAll() {
        render.allTeamSelects();
        render.pendingMatches();
        render.casters();
        render.users();
        render.sanctions();
        render.logs();
        render.renderCasterSocialsInForm();
      },

      init() {
        const token = localStorage.getItem("authToken");
        if (!token) {
          document.body.innerHTML =
            '<div style="text-align: center; padding: 50px; color: white;"><h1>Acceso Denegado</h1><p>No tienes permiso para ver esta página. Por favor, <a href="../Admin/login.html" style="color: var(--accent-gold);">inicia sesión</a>.</p></div>';
          return;
        }
        state.currentUser = utils.decodeToken(token);

        const isAdmin = state.currentUser.roles.includes("admin");
        const isManager = state.currentUser.roles.includes("manager");

        const setCardVisibility = (id, condition) => {
          const el = document.getElementById(id);
          if (el) el.style.display = condition ? "block" : "none";
        };

        const allCards = [
          "card-anuncios",
          "card-partidas",
          "card-crear-equipo",
          "card-gestionar-equipos",
          "card-sanciones",
          "card-casters",
          "card-usuarios",
          "card-logs",
        ];

        allCards.forEach((id) => setCardVisibility(id, false));

        if (isAdmin || isManager) {
          setCardVisibility("card-partidas", true);
          featureModules.initMatches();
          setCardVisibility("card-crear-equipo", true);
          featureModules.initTeams();
          setCardVisibility("card-gestionar-equipos", true);
          setCardVisibility("card-sanciones", true);
          featureModules.initSanctions();
        }

        if (isAdmin) {
          setCardVisibility("card-casters", true);
          featureModules.initCasters();
          setCardVisibility("card-usuarios", true);
          featureModules.initUsers();
          setCardVisibility("card-logs", true);
          featureModules.initLogs();
        }

        this.fetchAllData();
      },
    };

    // =================================================================
    // --- 7. PUNTO DE ENTRADA ---
    // =================================================================
    App.init();
  })();
});
