const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const cors = require("cors");

const app = express();

// Configuración de middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname + '/public'));

// Configuración de conexión a la base de datos MySQL
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "fantasy_padel",
});

db.connect((err) => {
  if (err) {
    console.error("Error al conectar con la base de datos:", err);
  } else {
    console.log("Conectado a la base de datos MySQL");
  }
});

// Endpoint para el registro de usuarios
app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: "Todos los campos son obligatorios." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = "INSERT INTO Usuarios (nombre_usuario, email, contraseña) VALUES (?, ?, ?)";
    db.query(query, [username, email, hashedPassword], (err, result) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(400).json({ error: "El correo ya está registrado." });
        }
        return res.status(500).json({ error: "Error al registrar el usuario." });
      }
      res.status(201).json({ success: true, message: "Usuario registrado con éxito." });
    });
  } catch (error) {
    res.status(500).json({ error: "Hubo un problema con el registro." });
  }
});

// Endpoint de inicio de sesión
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Todos los campos son obligatorios." });
  }

  try {
    const query = "SELECT * FROM Usuarios WHERE email = ?";
    db.query(query, [email], async (err, results) => {
      if (err) {
        return res.status(500).json({ error: "Error en el servidor." });
      }

      if (results.length === 0) {
        return res.status(400).json({ error: "Usuario o contraseña incorrectos" });
      }

      const user = results[0];
      const passwordMatch = await bcrypt.compare(password, user.contraseña);
      if (!passwordMatch) {
        return res.status(400).json({ error: "Usuario o contraseña incorrectos" });
      }

      res.status(200).json({ success: true, usuarioId: user.usuario_id, message: "Inicio de sesión exitoso" });
    });
  } catch (error) {
    res.status(500).json({ error: "Hubo un problema al iniciar sesión." });
  }
});

// Endpoint para obtener las parejas
app.get("/parejas", (req, res) => {
  const query = `
    SELECT p.pareja_id, j1.nombre_jugador AS jugador1, j2.nombre_jugador AS jugador2, 
           p.ranking_pareja, p.precio 
    FROM Parejas_Padel p
    JOIN Jugadores_Padel j1 ON p.jugador1_id = j1.jugador_id
    JOIN Jugadores_Padel j2 ON p.jugador2_id = j2.jugador_id;
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error al obtener parejas:", err);
      return res.status(500).json({ error: "Error al obtener las parejas." });
    }
    res.json(results);
  });
});

// Endpoint para crear equipo
app.post("/crear-equipo", (req, res) => {
  const { usuarioId, nombreEquipo } = req.body;

  if (!usuarioId || !nombreEquipo) {
    return res.status(400).json({ error: "Usuario ID y nombre del equipo son requeridos." });
  }

  const crearEquipoQuery = "INSERT INTO Equipos (usuario_id, nombre_equipo) VALUES (?, ?)";
  db.query(crearEquipoQuery, [usuarioId, nombreEquipo], (err, result) => {
    if (err) {
      console.error("Error al crear el equipo:", err);
      return res.status(500).json({ error: "Error al crear el equipo." });
    }

    res.json({ success: true, message: "Equipo creado con éxito.", equipoId: result.insertId });
  });
});

// Endpoint para realizar la compra de una pareja
app.post("/comprar", (req, res) => {
  const { usuarioId, equipoId, parejaId } = req.body;

  if (!usuarioId || !equipoId || !parejaId) {
    console.log("Faltan parámetros en la solicitud");
    return res.status(400).json({ error: "Faltan parámetros en la solicitud." });
  }

  const queryPareja = "SELECT precio FROM Parejas_Padel WHERE pareja_id = ?";
  db.query(queryPareja, [parejaId], (err, parejaResult) => {
    if (err) {
      console.error("Error al obtener precio de la pareja:", err);
      return res.status(500).json({ error: "Error en la compra." });
    }

    if (parejaResult.length === 0) {
      return res.status(404).json({ error: "Pareja no encontrada." });
    }

    const precioPareja = parseFloat(parejaResult[0].precio);
    const queryUsuario = "SELECT saldo FROM Usuarios WHERE usuario_id = ?";
    db.query(queryUsuario, [usuarioId], (err, usuarioResult) => {
      if (err) {
        console.error("Error al obtener saldo del usuario:", err);
        return res.status(500).json({ error: "Error en la compra." });
      }

      if (usuarioResult.length === 0) {
        return res.status(404).json({ error: "Usuario no encontrado." });
      }

      const saldoUsuario = parseFloat(usuarioResult[0].saldo);

      if (saldoUsuario < precioPareja) {
        return res.status(400).json({ error: "Saldo insuficiente para realizar la compra." });
      }

      const nuevoSaldo = saldoUsuario - precioPareja;
      const updateSaldoQuery = "UPDATE Usuarios SET saldo = ? WHERE usuario_id = ?";
      db.query(updateSaldoQuery, [nuevoSaldo, usuarioId], (err) => {
        if (err) {
          console.error("Error al actualizar el saldo:", err);
          return res.status(500).json({ error: "Error al procesar la compra." });
        }

        const insertParejaQuery = "INSERT INTO Equipo_Pareja (equipo_id, usuario_id, pareja_id) VALUES (?, ?, ?)";
        db.query(insertParejaQuery, [equipoId, usuarioId, parejaId], (err) => {
          if (err) {
            console.error("Error al registrar la pareja comprada en Equipo_Pareja:", err.message);
            return res.status(500).json({ error: "Error al registrar la compra. Detalle: " + err.message });
          }

          res.json({ success: true, message: "Compra realizada con éxito. Saldo restante: " + nuevoSaldo });
        });
      });
    });
  });
});

// Endpoint para obtener el equipo de un usuario
app.get("/obtener-equipo", (req, res) => {
  const usuarioId = req.query.usuarioId;

  if (!usuarioId) {
    return res.status(400).json({ error: "Falta el ID de usuario." });
  }

  const query = "SELECT equipo_id FROM Equipos WHERE usuario_id = ?";
  db.query(query, [usuarioId], (err, result) => {
    if (err) {
      console.error("Error al obtener el equipo:", err);
      return res.status(500).json({ error: "Error al obtener el equipo del usuario." });
    }

    if (result.length === 0) {
      return res.status(404).json({ error: "Equipo no encontrado para el usuario." });
    }

    res.json({ equipoId: result[0].equipo_id });
  });
});

// Endpoint para obtener las parejas compradas por un usuario
app.get("/parejas-compradas", (req, res) => {
  const usuarioId = req.query.usuarioId;

  const query = `
    SELECT p.pareja_id, j1.nombre_jugador AS jugador1, j2.nombre_jugador AS jugador2, p.ranking_pareja, p.precio
    FROM Equipo_Pareja ep
    JOIN Parejas_Padel p ON ep.pareja_id = p.pareja_id
    JOIN Jugadores_Padel j1 ON p.jugador1_id = j1.jugador_id
    JOIN Jugadores_Padel j2 ON p.jugador2_id = j2.jugador_id
    WHERE ep.usuario_id = ?
  `;

  db.query(query, [usuarioId], (err, results) => {
    if (err) {
      console.error("Error al obtener las parejas compradas:", err);
      return res.status(500).json({ error: "Error al obtener las parejas compradas." });
    }
    res.json(results);
  });
});

// Iniciar el servidor en el puerto 5000
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

