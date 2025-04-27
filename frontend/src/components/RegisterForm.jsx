import React, { useState } from "react";
import axios from "axios";
import { LOCAL_URL_API } from "../constants/constans";
import { useNavigate } from "react-router-dom"; // Importar useNavigate

const RegisterForm = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("project_user"); // Rol predeterminado
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate(); // Hook para redirigir

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
          email: email,
          role: role,
          first_name: firstName,
          last_name: lastName,
        }
      );

      setMessage("Registro exitoso. Redirigiendo al dashboard...");
      setTimeout(() => {
        navigate("/dashboard"); // Redirigir al dashboard
      }, 2000);
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
          required
        />
      </div>
      <div>
        <label>Correo electrónico:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
      <div>
        <label>Confirmar contraseña:</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Nombre:</label>
        <input
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
      </div>
      <div>
        <label>Apellido:</label>
        <input
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
      </div>
      <div>
        <label>Rol:</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          required
        >
          <option value="project_user">Usuario de Proyectos</option>
          <option value="project_admin">Administrador de Proyectos</option>
        </select>
      </div>
      <button type="submit">Registrarse</button>
      {message && <p>{message}</p>}
    </form>
  );
};

export default RegisterForm;