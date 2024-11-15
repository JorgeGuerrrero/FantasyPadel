document.addEventListener("DOMContentLoaded", async () => {
  const usuarioId = localStorage.getItem("usuarioId");

  if (!usuarioId) {
    alert("Por favor, inicia sesión para continuar.");
    window.location.href = "/users.html";
    return;
  }

  let equipoId = localStorage.getItem("equipoId");

  if (!equipoId) {
    // Si equipoId no está en localStorage, intenta obtenerlo del backend
    try {
      const response = await fetch(`http://localhost:5000/obtener-equipo?usuarioId=${usuarioId}`);
      const result = await response.json();

      if (response.ok) {
        equipoId = result.equipoId;
        localStorage.setItem("equipoId", equipoId);  // Guardarlo en localStorage
        console.log("Equipo ID recuperado y guardado:", equipoId);
      } else {
        console.error("Error al obtener el equipo:", result.error);
        alert("No se encontró un equipo para el usuario. Por favor, crea un equipo.");
        window.location.href = "/crear-equipo.html";
        return;
      }
    } catch (error) {
      console.error("Error al intentar recuperar el equipo:", error);
      alert("Ocurrió un problema al intentar recuperar el equipo.");
      return;
    }
  }

  // Ahora que equipoId está disponible, puedes continuar con el resto de la lógica de compra.
  cargarParejas();  // Función para cargar las parejas
});

// Tu código existente para mostrar parejas y manejar la compra de pareja
async function cargarParejas() {
  const parejasContainer = document.getElementById("parejasContainer");
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
  const parejasContainer = document.getElementById("parejasContainer");
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

async function comprarPareja(parejaId) {
  const usuarioId = localStorage.getItem("usuarioId");
  const equipoId = localStorage.getItem("equipoId");

  if (!usuarioId || !equipoId) {
    alert("Por favor, asegúrate de haber iniciado sesión y creado un equipo.");
    return;
  }

  try {
    const response = await fetch("http://localhost:5000/comprar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ usuarioId, equipoId, parejaId }),
    });

    const result = await response.json();
    if (response.ok) {
      alert(result.message || "Pareja comprada con éxito");
      obtenerParejasCompradas();  // Actualizar la lista de parejas compradas si es necesario
    } else {
      alert(result.error || "No se pudo comprar la pareja");
    }
  } catch (error) {
    console.error("Error al comprar pareja:", error);
    alert("Ocurrió un error al realizar la compra.");
  }
}

async function obtenerParejasCompradas() {
  const usuarioId = localStorage.getItem("usuarioId");
  if (!usuarioId) {
    alert("Por favor, inicia sesión para ver tus parejas compradas.");
    window.location.href = "/login.html";
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
  const compradasContainer = document.getElementById("compradasContainer");
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
    `;
    compradasContainer.appendChild(card);
  });
}

obtenerParejasCompradas(); // Llamar a la función para obtener y mostrar las parejas compradas

  
