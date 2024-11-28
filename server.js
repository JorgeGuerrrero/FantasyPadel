require("dotenv").config();

console.log("Correo de usuario:", process.env.EMAIL_USER);
console.log("Contraseña de usuario:", process.env.EMAIL_PASS ? "Cargada" : "No cargada");

const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const cors = require("cors");

const app = express(); // Inicialización de app debe ir antes de cualquier uso de app

// Middleware para registrar todas las solicitudes
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Configuración de middleware adicional
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

app.post("/register", async (req, res) => {
  console.log("Solicitud de registro recibida:", req.body);

  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    console.log("Error: Falta un campo obligatorio.");
    return res.status(400).json({ error: "Todos los campos son obligatorios." });
  }

  console.log("Campos recibidos: ", { username, email });

  // Valida el formato del correo
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.log("Error: Formato de correo inválido para:", email);
    return res.status(400).json({ error: "El formato del correo no es válido." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("Contraseña hasheada correctamente.");

    const confirmationToken = crypto.randomBytes(32).toString("hex");
    console.log("Token de confirmación generado:", confirmationToken);

    const insertUserQuery = `
      INSERT INTO Usuarios (nombre_usuario, email, contraseña, confirmado, token_confirmacion)
      VALUES (?, ?, ?, 0, ?)
    `;

    db.query(insertUserQuery, [username, email, hashedPassword, confirmationToken], (err, result) => {
      if (err) {
        console.error("Error al insertar usuario en la base de datos:", err);
        return res.status(500).json({ error: "Error al registrar el usuario." });
      }

      console.log("Usuario registrado con éxito. ID:", result.insertId);

      sendConfirmationEmail(email, confirmationToken);
      console.log("Correo de confirmación enviado a:", email);

      res.status(201).json({
        success: true,
        message: "Usuario registrado con éxito. Por favor, confirma tu correo.",
      });
    });
  } catch (error) {
    console.error("Error inesperado durante el registro:", error);
    res.status(500).json({ error: "Hubo un problema con el registro." });
  }
});


// Endpoint de inicio de sesión
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // Validar que los campos no estén vacíos
  if (!email || !password) {
    return res.status(400).json({ error: "Todos los campos son obligatorios." });
  }

  try {
    // Consultar al usuario por su email
    const query = "SELECT * FROM Usuarios WHERE email = ?";
    db.query(query, [email], async (err, results) => {
      if (err) {
        console.error("Error en el servidor:", err);
        return res.status(500).json({ error: "Error en el servidor." });
      }

      // Verificar si el usuario existe
      if (results.length === 0) {
        return res.status(400).json({ error: "Usuario o contraseña incorrectos." });
      }

      const user = results[0];

      // Verificar si el correo está confirmado
      if (user.confirmado === 0) {
        return res.status(403).json({ error: "Por favor, confirma tu correo antes de iniciar sesión." });
      }

      // Comparar la contraseña ingresada con la almacenada
      const passwordMatch = await bcrypt.compare(password, user.contraseña);
      if (!passwordMatch) {
        return res.status(400).json({ error: "Usuario o contraseña incorrectos." });
      }

      // Si todo está correcto, devolver éxito
      res.status(200).json({
        success: true,
        usuarioId: user.usuario_id,
        message: "Inicio de sesión exitoso.",
      });
    });
  } catch (error) {
    console.error("Error inesperado:", error);
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


// Endpoint para el registro de usuarios
const crypto = require("crypto");

app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    console.log("Error: Todos los campos son obligatorios.");
    return res.status(400).json({ error: "Todos los campos son obligatorios." });
  }

  // Validar formato del correo
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.log("Error: Formato de correo inválido:", email);
    return res.status(400).json({ error: "El formato del correo no es válido." });
  }

  try {
    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("Contraseña hasheada correctamente para el usuario:", username);

    // Generar token de confirmación
    const confirmationToken = crypto.randomBytes(32).toString("hex");
    console.log("Token de confirmación generado:", confirmationToken);

    // Insertar el usuario en la base de datos con el token
    const insertUserQuery = `
      INSERT INTO Usuarios (nombre_usuario, email, contraseña, confirmado, token_confirmacion)
      VALUES (?, ?, ?, 0, ?)
    `;
    db.query(insertUserQuery, [username, email, hashedPassword, confirmationToken], (err, result) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          console.log("Error: El correo ya está registrado:", email);
          return res.status(400).json({ error: "El correo ya está registrado." });
        }
        console.error("Error al insertar usuario en la base de datos:", err);
        return res.status(500).json({ error: "Error al registrar el usuario." });
      }

      console.log("Usuario registrado en la base de datos con éxito. ID del usuario:", result.insertId);

      // Enviar correo de confirmación
      sendConfirmationEmail(email, confirmationToken);
      console.log("Correo de confirmación enviado a:", email);

      res.status(201).json({
        success: true,
        message: "Usuario registrado con éxito. Por favor, confirma tu correo.",
      });
    });
  } catch (error) {
    console.error("Error inesperado durante el registro:", error);
    res.status(500).json({ error: "Hubo un problema con el registro." });
  }
});


const nodemailer = require("nodemailer");

function sendConfirmationEmail(email, token) {
  console.log("Preparando para enviar correo de confirmación...");

  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER, // Este debe coincidir con tu correo
      pass: process.env.EMAIL_PASS, // Contraseña de aplicación generada
      
    },
  });
  console.log("Transporte configurado con usuario:", process.env.EMAIL_USER);

  

  const mailOptions = {
    from: `Fantasy Pádel <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Confirma tu correo electrónico",
    html: `
      <p>Hola,</p>
      <p>Gracias por registrarte en Fantasy Pádel. Por favor, haz clic en el siguiente enlace para confirmar tu correo:</p>
      <a href="http://localhost:5000/confirmar?token=${token}">Confirmar Correo</a>
      <p>Si no solicitaste este registro, ignora este correo.</p>
    `,
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error("Error al enviar el correo de confirmación:", err.message);
      console.error("Detalle del error:", err);
      // Mensajes específicos para errores comunes
      if (err.message.includes("Invalid login")) {
        console.error("Error: Credenciales inválidas. Verifica EMAIL_USER y EMAIL_PASS en el archivo .env.");
      } else if (err.message.includes("ENOTFOUND")) {
        console.error("Error: No se pudo conectar al servidor SMTP. Verifica tu conexión a internet.");
      } else if (err.message.includes("ETIMEDOUT")) {
        console.error("Error: Tiempo de espera agotado al intentar enviar el correo.");
      } else if (err.message.includes("535-5.7.8")) {
        console.error("Error: Gmail bloqueó el acceso. Asegúrate de usar una contraseña de aplicación válida.");
      } else {
        console.error("Error desconocido al enviar el correo. Revisa los detalles del error.");
      }
    } else {
      console.log("Correo de confirmación enviado con éxito:", info.response);
    }
  });
}



app.get("/confirmar", (req, res) => {
  // Capturar el token de la URL
  const token = req.query.token;

  if (!token) {
    return res.status(400).json({ error: "Token de confirmación no proporcionado." });
  }

  // Verificar si el token existe en la base de datos
  const checkQuery = "SELECT * FROM Usuarios WHERE token_confirmacion = ?";
  db.query(checkQuery, [token], (err, result) => {
    if (err) {
      console.error("Error al buscar el token:", err);
      return res.status(500).json({ error: "Error interno del servidor." });
    }
  
    if (result.length === 0) {
      return res.status(400).json({ error: "Token inválido o ya usado." });
    }
  
    // Si el token es válido, actualiza el estado del usuario
    const updateQuery = "UPDATE Usuarios SET confirmado = 1, token_confirmacion = NULL WHERE token_confirmacion = ?";
    db.query(updateQuery, [token], (err, result) => {
      if (err) {
        console.error("Error al confirmar el correo:", err);
        return res.status(500).json({ error: "Error al confirmar el correo." });
      }
  
      res.status(200).json({ success: true, message: "Correo confirmado con éxito. Ya puedes iniciar sesión." });
    });
  });  
});


