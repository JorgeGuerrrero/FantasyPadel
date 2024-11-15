document.addEventListener("DOMContentLoaded", () => {
  const registerForm = document.getElementById("registerForm");
  const errorMessage = document.getElementById("error-message");

  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    // Obtener los valores de los campos
    const username = document.getElementById("username").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    // Limpiar mensaje de error
    errorMessage.style.display = "none";
    errorMessage.textContent = "";

    // Validaciones
    if (!validateEmail(email)) {
      errorMessage.style.display = "block";
      errorMessage.textContent = "Por favor ingresa un correo válido.";
      return;
    }

    if (password.length < 6) {
      errorMessage.style.display = "block";
      errorMessage.textContent = "La contraseña debe tener al menos 6 caracteres.";
      return;
    }

    if (password !== confirmPassword) {
      errorMessage.style.display = "block";
      errorMessage.textContent = "Las contraseñas no coinciden.";
      return;
    }

    // Enviar datos al backend
    try {
      const response = await fetch("http://localhost:5000/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password }),
      });

      const result = await response.json();
      if (response.ok) {
        alert("Registro exitoso. Redirigiendo a inicio de sesión...");
        window.location.href = "/users.html";
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      errorMessage.style.display = "block";
      errorMessage.textContent = error.message;
    }
  });
});

// Validación de correo
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}
