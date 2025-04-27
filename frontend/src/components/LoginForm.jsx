import React, { useState } from "react";
import axios from "axios";
import { LOCAL_URL_API } from "../constants/constans";
import { useNavigate } from "react-router-dom"; // Importar useNavigate

const LoginForm = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate(); // Hook para redirigir

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        `${LOCAL_URL_API}wp-json/jwt-auth/v1/token`,
        {
          username: username,
          password: password,
        }
      );

      const token = response.data.token;
      console.log("Token obtenido:", token);

      // Verifica si el token existe antes de guardarlo
      if (token) {
        localStorage.setItem("jwtToken", token); // Guarda el token en localStorage
        setMessage("Inicio de sesión exitoso. Redirigiendo al dashboard...");
        setTimeout(() => {
          navigate("/dashboard"); // Redirigir al dashboard
        }, 2000);
      } else {
        setMessage("Error: No se recibió un token válido.");
      }
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      setMessage("Error al iniciar sesión. Verifica tus credenciales.");
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <div>
        <label>Nombre de usuario:</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Contraseña:</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <button type="submit">Iniciar sesión</button>
      {message && <p>{message}</p>}
    </form>
  );
};

export default LoginForm;