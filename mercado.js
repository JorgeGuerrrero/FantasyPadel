document.addEventListener("DOMContentLoaded", () => {
  const parejasContainer = document.getElementById("parejasContainer");
  const compradasContainer = document.getElementById("compradasContainer");

  async function cargarParejas() {
    try {
      const response = await fetch("http://localhost:5000/parejas");
      if (!response.ok) {
        throw new Error(`Error en la solicitud al servidor: ${response.status}`);
      }

      const parejas = await response.json();
      mostrarParejas(parejas);
    } catch (error) {
      console.error("Error al cargar parejas:", error);
    }
  }

  function mostrarParejas(parejas) {
    parejasContainer.innerHTML = "";  // Limpiar el contenedor

    parejas.forEach(pareja => {
      const card = document.createElement("div");
      card.classList.add("pareja-card");
      card.innerHTML = `
        <h3>Pareja ${pareja.pareja_id}</h3>
        <p>Jugador 1: ${pareja.jugador1}</p>
        <p>Jugador 2: ${pareja.jugador2}</p>
        <p>Ranking: ${pareja.ranking_pareja}</p>
        <p>Precio: $${pareja.precio}</p>
        <button class="comprar-btn" data-pareja-id="${pareja.pareja_id}">Comprar</button>
      `;
      parejasContainer.appendChild(card);
    });

    // Añadir event listener a cada botón "Comprar"
    const comprarButtons = document.querySelectorAll(".comprar-btn");
    comprarButtons.forEach(button => {
      button.addEventListener("click", (event) => {
        const parejaId = event.target.getAttribute("data-pareja-id");
        comprarPareja(parejaId);
      });
    });
  }

  // Función para manejar la compra de la pareja
  async function comprarPareja(parejaId) {
    // Obtener el usuarioId desde el Local Storage
    const usuarioId = localStorage.getItem("usuarioId");
  
    if (!usuarioId) {
      alert("Por favor, inicia sesión para realizar una compra.");
      window.location.href = "/login";  // Redirigir al inicio de sesión si no hay usuarioId
      return;
    }
  
    try {
      const response = await fetch("http://localhost:5000/comprar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ usuarioId, parejaId })
      });
  
      const result = await response.json();
      if (response.ok) {
        alert(result.message || "Pareja comprada con éxito");
        window.location.href = "/mercado.html";  // Redirigir a la página del mercado después de la compra
      } else {
        alert(result.error || "No se pudo comprar la pareja");
      }
    } catch (error) {
      console.error("Error al comprar pareja:", error);
      alert("Ocurrió un error al realizar la compra.");
    }
  }
  

  // Función para obtener y mostrar las parejas compradas
  async function obtenerParejasCompradas() {
    const usuarioId = localStorage.getItem("usuarioId");

    if (!usuarioId) {
      alert("Por favor, inicia sesión para ver tus parejas compradas.");
      window.location.href = "/login";
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/parejas-compradas?usuarioId=${usuarioId}`);
      const parejas = await response.json();

      if (response.ok) {
        mostrarParejasCompradas(parejas); // Mostrar las parejas compradas en el frontend
      } else {
        console.error("Error al obtener parejas compradas:", parejas.error);
      }
    } catch (error) {
      console.error("Error en la solicitud:", error);
    }
  }

  function mostrarParejasCompradas(parejas) {
    compradasContainer.innerHTML = ""; // Limpiar el contenedor

    parejas.forEach(pareja => {
      const card = document.createElement("div");
      card.classList.add("pareja-card");
      card.innerHTML = `
        <h3>Pareja ${pareja.pareja_id}</h3>
        <p>Jugador 1: ${pareja.jugador1}</p>
        <p>Jugador 2: ${pareja.jugador2}</p>
        <p>Ranking: ${pareja.ranking_pareja}</p>
        <p>Precio: $${pareja.precio}</p>
        <button class="seleccionar-btn" data-pareja-id="${pareja.pareja_id}">Seleccionar</button>
      `;
      compradasContainer.appendChild(card);
    });
  }

  cargarParejas();  // Llamar a la función para cargar y mostrar las parejas
});
  
