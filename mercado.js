document.addEventListener("DOMContentLoaded", () => {
    const parejasContainer = document.getElementById("parejasContainer");
  
    async function cargarParejas() {
      try {
        console.log("Iniciando solicitud a /parejas");  // Agregar log para verificar inicio
        const response = await fetch("http://localhost:5000/parejas");
  
        if (!response.ok) {
          throw new Error(`Error en la solicitud al servidor: ${response.status}`);
        }
  
        const parejas = await response.json();
        console.log("Parejas obtenidas:", parejas);  // Log para mostrar las parejas obtenidas
        mostrarParejas(parejas);
      } catch (error) {
        console.error("Error al cargar parejas:", error);
      }
    }
  
    function mostrarParejas(parejas) {
      parejasContainer.innerHTML = "";  // Limpiar el contenedor
  
      parejas.forEach(pareja => {
        console.log("Procesando pareja:", pareja);  // Log para verificar cada pareja
        const card = document.createElement("div");
        card.classList.add("pareja-card");
        card.innerHTML = `
          <h3>Pareja ${pareja.pareja_id}</h3>
          <p>Jugador 1: ${pareja.jugador1}</p>
          <p>Jugador 2: ${pareja.jugador2}</p>
          <p>Ranking: ${pareja.ranking_pareja}</p>
          <p>Precio: $${pareja.precio}</p>
        `;
        parejasContainer.appendChild(card);
      });
    }
  
    cargarParejas();  // Llamar a la función para cargar y mostrar las parejas
  });
  