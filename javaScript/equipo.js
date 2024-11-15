document.addEventListener("DOMContentLoaded", () => {
    const teamForm = document.getElementById("teamForm");
    const message = document.getElementById("message");

    teamForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const teamName = document.getElementById("teamName").value;
        const usuarioId = localStorage.getItem("usuarioId"); // Asegúrate de que el usuarioId esté almacenado en localStorage

        // Validar si el usuarioId está disponible
        if (!usuarioId) {
            message.style.color = "red";
            message.textContent = "Por favor, inicia sesión nuevamente.";
            return;
        }

        try {
            const response = await fetch("http://localhost:5000/crear-equipo", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ usuarioId, nombreEquipo: teamName }),
            });

            const result = await response.json();
            if (response.ok) {
                message.style.color = "green";
                message.textContent = "Equipo creado con éxito.";
                localStorage.setItem("equipoId", result.equipoId); // Esto debería hacerse al crear el equipo

            } else {
                throw new Error(result.error || "Error al crear el equipo.");
            }
        } catch (error) {
            message.style.color = "red";
            message.textContent = error.message;
        }
    });

});

  