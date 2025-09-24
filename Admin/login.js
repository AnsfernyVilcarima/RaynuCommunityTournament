document.addEventListener("DOMContentLoaded", () => {
  const ensureFunction = (candidate, fallback) =>
    typeof candidate === "function" ? candidate : fallback;

  const createFallbackAdapter = () => {
    const config = window.__RAYNU_CONFIG__ || {};

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

    return {
      buildApiUrl,
    };
  };

  const fallbackAdapter = createFallbackAdapter();

  const adapter =
    (typeof window.getRaynuAdapter === "function" &&
      window.getRaynuAdapter()) ||
    (window.RaynuClient &&
    typeof window.RaynuClient.createAdapter === "function"
      ? window.RaynuClient.createAdapter()
      : null) ||
    fallbackAdapter;

  const buildApiUrl = (endpoint = "") =>
    ensureFunction(adapter.buildApiUrl, fallbackAdapter.buildApiUrl)(endpoint);

  const loginForm = document.getElementById("login-form");
  const messageBox = document.getElementById("login-message");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      const submitButton = loginForm.querySelector('button[type="submit"]');

      submitButton.disabled = true;
      submitButton.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Ingresando...';

      if (messageBox) {
        messageBox.textContent = "";
        messageBox.classList.remove("show", "error", "success");
      }

      try {
        const response = await fetch(buildApiUrl("/auth/login"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Error desconocido al iniciar sesión."
          );
        }

        localStorage.setItem("authToken", data.token);

        window.location.href = "../Admin/admin.html";
      } catch (error) {
        if (messageBox) {
          messageBox.textContent = error.message;
          messageBox.className = "login-message-box show error";
        }

        submitButton.disabled = false;
        submitButton.textContent = "Ingresar";
      }
    });
  }
});
