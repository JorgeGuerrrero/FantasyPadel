document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const errorMessage = document.getElementById("error-message");

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    // Obtener valores de los campos de entrada
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    // Limpiar el mensaje de error
    errorMessage.style.display = "none";
    errorMessage.textContent = "";

    try {
      // Enviar la solicitud de inicio de sesión al backend
      const response = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (response.ok) {
        alert("Inicio de sesión exitoso. Redirigiendo...");
        // Redirigir a la página principal del juego
        window.location.href = "/main";
      } else {
        throw new Error(result.error || "Usuario o contraseña incorrectos");
      }
    } catch (error) {
      errorMessage.style.display = "block";
      errorMessage.textContent = error.message;
    }
  });
});