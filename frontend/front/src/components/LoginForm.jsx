import React, { useState } from "react";
import axios from "axios";
import { LOCAL_URL_API } from "../constants/constans";

const LoginForm = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

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

      // Guarda el token en localStorage
      localStorage.setItem("jwtToken", token);

      setMessage("Inicio de sesión exitoso.");
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
        />
      </div>
      <div>
        <label>Contraseña:</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <button type="submit">Iniciar sesión</button>
      {message && <p>{message}</p>}
    </form>
  );
};

export default LoginForm;