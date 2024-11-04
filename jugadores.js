const jugadoresContainer = document.getElementById("jugadoresContainer");
const parejaSeleccionada = document.getElementById("parejaSeleccionada");
const confirmarBtn = document.getElementById("confirmarBtn");

// Renderizar tarjetas de jugadores
function mostrarJugadores(jugadores) {
  jugadores.forEach((jugador) => {
    const card = document.createElement("div");
    card.classList.add("jugador-card");
    card.innerHTML = `
      <img src="${jugador.imagen}" alt="${jugador.nombre}">
      <h3>${jugador.nombre}</h3>
      <p>Habilidad: ${jugador.habilidad}</p>
      <p>Ranking: ${jugador.ranking}</p>
    `;
    card.addEventListener("click", () => seleccionarJugador(jugador));
    jugadoresContainer.appendChild(card);
  });
}

// Almacenar la pareja seleccionada
const seleccionados = [];

// Función para seleccionar un jugador
function seleccionarJugador(jugador) {
  if (seleccionados.length < 2 && !seleccionados.includes(jugador)) {
    seleccionados.push(jugador);
    actualizarParejaSeleccionada();
  } else if (seleccionados.includes(jugador)) {
    // Si ya estaba seleccionado, lo quitamos
    seleccionados.splice(seleccionados.indexOf(jugador), 1);
    actualizarParejaSeleccionada();
  }

  confirmarBtn.disabled = seleccionados.length !== 2;
}

// Actualizar la lista de jugadores seleccionados
function actualizarParejaSeleccionada() {
  parejaSeleccionada.innerHTML = "";
  seleccionados.forEach((jugador) => {
    const li = document.createElement("li");
    li.textContent = jugador.nombre;
    parejaSeleccionada.appendChild(li);
  });
}

// Confirmar selección de la pareja
confirmarBtn.addEventListener("click", () => {
  alert(`Pareja seleccionada: ${seleccionados.map(j => j.nombre).join(" y ")}`);
  // Aquí puedes redirigir a otra pantalla o guardar la pareja seleccionada en el estado de la app
});

// Mostrar los jugadores al cargar la página
mostrarJugadores(jugadores);