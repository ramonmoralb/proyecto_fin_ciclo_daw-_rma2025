import React, { useState } from "react";
import axios from "axios";
import { LOCAL_URL_API } from "../constants/constans";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Auth.css";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await axios.post(
        `${LOCAL_URL_API}wp-json/jwt-auth/v1/token`,
        {
          username: email,
          password: password,
        }
      );

      console.log('=== DEBUG LOGIN RESPONSE ===');
      console.log('Full response:', response.data);
      console.log('Token:', response.data.token);
      console.log('User Email:', response.data.user_email);
      console.log('User Name:', response.data.user_nicename);
      console.log('Roles:', response.data.roles);
      console.log('Selected Role:', response.data.roles[0]);
      console.log('========================');

      if (response.data.token) {
        // Verificar que el usuario tenga uno de los roles permitidos
        const allowedRoles = ['super_administrador', 'project_admin', 'project_user'];
        const userRole = response.data.roles.find(role => allowedRoles.includes(role));

        if (!userRole) {
          setMessage("Error: No tienes permisos para acceder a esta aplicación.");
          return;
        }

        // Guardar el token y los datos del usuario
        localStorage.setItem('jwtToken', response.data.token);
        localStorage.setItem('userRole', userRole);
        localStorage.setItem('userName', response.data.user_nicename);
        localStorage.setItem('userEmail', response.data.user_email);

        // Actualizar el estado de autenticación
        login(response.data.token, response.data.user_email, userRole, response.data.user_nicename);
        setMessage("Inicio de sesión exitoso. Redirigiendo...");
        
        // Redirigir según el rol
        setTimeout(() => {
          if (userRole === 'super_administrador') {
            navigate("/admin-dashboard");
          } else if (userRole === 'project_admin') {
            navigate("/project-dashboard");
          } else {
            navigate("/user-dashboard");
          }
        }, 1500);
      }
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      if (error.response) {
        console.error("Error response:", error.response.data);
        console.error("Error status:", error.response.status);
      }
      setMessage(
        error.response?.data?.message || 
        "Error al iniciar sesión. Verifica tus credenciales."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Iniciar Sesión</h2>
        <p className="auth-subtitle">Accede a tu cuenta de empresa</p>
        
        <form onSubmit={handleLogin} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email corporativo</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@empresa.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {message && (
            <div className={`message ${message.includes("Error") ? "error" : "success"}`}>
              {message}
            </div>
          )}

          <button 
            type="submit" 
            className="btn-submit"
            disabled={loading}
          >
            {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </button>
        </form>

        <div className="auth-footer">
          <p>¿No tienes acceso? Contacta con el administrador de tu empresa.</p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;