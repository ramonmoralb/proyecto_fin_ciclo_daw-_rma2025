import React, { useState } from "react";
import axios from "axios";
import { LOCAL_URL_API } from "../constants/constans";

const RegisterForm = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage("Las contraseñas no coinciden.");
      return;
    }

    try {
      const response = await axios.post(
        `${LOCAL_URL_API}wp-json/jwt-auth/v1/register`,
        {
          username: username,
          password: password,
        }
      );

      setMessage("Registro exitoso. Puedes iniciar sesión.");
    } catch (error) {
      console.error("Error al registrar:", error);
      setMessage("Error al registrar. Verifica tus datos.");
    }
  };

  return (
    <form onSubmit={handleRegister}>
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
      <div>
        <label>Confirmar contraseña:</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>
      <button type="submit">Registrarse</button>
      {message && <p>{message}</p>}
    </form>
  );
};

export default RegisterForm;