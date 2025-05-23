import React, { useState, useContext } from "react";
import axios from "axios";
import { LOCAL_URL_API } from "../constants/constans";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../styles/Auth.css";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
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

      const { token, user_email, user_nicename, roles } = response.data;

      if (token) {
        // Verificar que el usuario tenga uno de los roles permitidos
        const allowedRoles = ['super_admin', 'project_admin', 'project_user'];
        const userRole = roles.find(role => allowedRoles.includes(role));

        if (!userRole) {
          setMessage("Error: No tienes permisos para acceder a esta aplicación.");
          return;
        }

        localStorage.setItem("jwtToken", token);
        localStorage.setItem("userRole", userRole);
        localStorage.setItem("userEmail", user_email);
        localStorage.setItem("userName", user_nicename);

        login(user_email, userRole);
        
        setMessage("Inicio de sesión exitoso. Redirigiendo...");
        
        // Redirigir según el rol
        setTimeout(() => {
          if (userRole === 'super_admin') {
            navigate("/admin-dashboard");
          } else {
            navigate("/dashboard");
          }
        }, 1500);
      }
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
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