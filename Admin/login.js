document.addEventListener("DOMContentLoaded", () => {
  const globalConfig = window.__RAYNU_CONFIG__ || {};
  const API_URL =
    typeof globalConfig.apiBaseUrl === "string"
      ? globalConfig.apiBaseUrl
      : "https://api.raynucommunitytournament.xyz/api";

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
        const response = await fetch(`${API_URL}/auth/login`, {
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
