const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Configuración de conexión a la base de datos MySQL
const db = mysql.createConnection({
  host: "localhost", // Cambia a tu configuración de XAMPP si es necesario
  user: "root",
  password: "",
  database: "fantasy_padel", // Nombre de tu base de datos
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

  // Validación básica
  if (!username || !email || !password) {
    return res.status(400).json({ error: "Todos los campos son obligatorios." });
  }

  try {
    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar el nuevo usuario en la base de datos
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

// Iniciar el servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
// Endpoint de inicio de sesión
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // Verificar que el email y la contraseña no estén vacíos
  if (!email || !password) {
    return res.status(400).json({ error: "Todos los campos son obligatorios." });
  }

  try {
    // Buscar el usuario en la base de datos
    const query = "SELECT * FROM Usuarios WHERE email = ?";
    db.query(query, [email], async (err, results) => {
      if (err) {
        return res.status(500).json({ error: "Error en el servidor." });
      }
      
      if (results.length === 0) {
        // No se encontró un usuario con ese email
        return res.status(400).json({ error: "Usuario o contraseña incorrectos" });
      }

      const user = results[0];

      // Verificar la contraseña
      const passwordMatch = await bcrypt.compare(password, user.contraseña);
      if (!passwordMatch) {
        return res.status(400).json({ error: "Usuario o contraseña incorrectos" });
      }

      // Inicio de sesión exitoso
      res.status(200).json({ success: true, message: "Inicio de sesión exitoso" });
    });
  } catch (error) {
    res.status(500).json({ error: "Hubo un problema al iniciar sesión." });
  }
});