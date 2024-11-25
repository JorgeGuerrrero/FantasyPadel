document.addEventListener("DOMContentLoaded", async () => {
    const usuarioId = localStorage.getItem("usuarioId");
  
    if (!usuarioId) {
      alert("Por favor, inicia sesión para continuar.");
      window.location.href = "/login.html";
      return;
    }
  
    try {
      // Obtener parejas compradas
      const response = await fetch(`http://localhost:5000/parejas-compradas?usuarioId=${usuarioId}`);
      const parejas = await response.json();
  
      if (response.ok) {
        mostrarParejasCompradas(parejas);
      } else {
        console.error("Error al obtener las parejas compradas:", parejas.error);
        alert("Ocurrió un error al obtener tus parejas compradas.");
      }
    } catch (error) {
      console.error("Error en la solicitud:", error);
      alert("No se pudieron cargar las parejas compradas.");
    }
  });
  
  function mostrarParejasCompradas(parejas) {
    const compradasContainer = document.getElementById("compradasContainer");
    compradasContainer.innerHTML = ""; // Limpiar el contenedor
  
    parejas.forEach((pareja) => {
      const card = document.createElement("div");
      card.classList.add("pareja-card");
      card.innerHTML = `
        <h3>Pareja ${pareja.pareja_id}</h3>
        <p>Jugador 1: ${pareja.jugador1}</p>
        <p>Jugador 2: ${pareja.jugador2}</p>
        <p>Ranking: ${pareja.ranking_pareja}</p>
        <button class="seleccionar-btn" data-pareja-id="${pareja.pareja_id}">Seleccionar para Torneo</button>
      `;
  
      // Añadir funcionalidad al botón de selección
      const button = card.querySelector(".seleccionar-btn");
      button.addEventListener("click", () => seleccionarPareja(pareja));
  
      compradasContainer.appendChild(card);
    });
  }
  
  function seleccionarPareja(pareja) {
    const seleccionadasContainer = document.getElementById("seleccionadasContainer");
    const seleccionadasCount = seleccionadasContainer.childElementCount; // Contar las parejas seleccionadas actualmente
  
    // Verificar si ya se han seleccionado 4 parejas
    if (seleccionadasCount >= 4) {
      alert("Solo puedes seleccionar hasta 4 parejas para el torneo.");
      return;
    }
  
    // Crear tarjeta de pareja seleccionada
    const card = document.createElement("div");
    card.classList.add("pareja-card");
    card.innerHTML = `
      <h3>Pareja ${pareja.pareja_id}</h3>
      <p>Jugador 1: ${pareja.jugador1}</p>
      <p>Jugador 2: ${pareja.jugador2}</p>
      <p>Ranking: ${pareja.ranking_pareja}</p>
      <button class="quitar-btn" data-pareja-id="${pareja.pareja_id}">Quitar</button>
    `;
  
    // Botón para quitar la pareja seleccionada
    const button = card.querySelector(".quitar-btn");
    button.addEventListener("click", () => {
      card.remove(); // Eliminar tarjeta del contenedor
      verificarEstadoSeleccionadas(); // Actualizar el estado tras quitar una pareja
    });
  
    seleccionadasContainer.appendChild(card);
    verificarEstadoSeleccionadas(); // Actualizar el estado tras agregar una pareja
  }
  
  function verificarEstadoSeleccionadas() {
    const seleccionadasContainer = document.getElementById("seleccionadasContainer");
    const seleccionadasCount = seleccionadasContainer.childElementCount;
  
    // Actualizar el texto del contador
    const contadorSeleccionadas = document.getElementById("contadorSeleccionadas");
    contadorSeleccionadas.textContent = `Parejas seleccionadas: ${seleccionadasCount}/4`;
  }
  