import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const Header = () => {
  const { isAuthenticated, userName, userRole, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(); // Llamar a la función de logout del contexto
    navigate("/"); // Redirigir a la pantalla de inicio
  };

  return (
    <header>
      <nav>
        <ul style={{ display: "flex", listStyle: "none", gap: "1rem" }}>
          <li>
            <Link to="/">Inicio</Link>
          </li>
          {!isAuthenticated && (
            <>
              <li>
                <Link to="/register">Registro</Link>
              </li>
            </>
          )}
          {isAuthenticated && userRole === "project_admin" && (
            <li>
              <Link to="/admin">Administrar</Link>
            </li>
          )}
          {isAuthenticated && userRole === "project_user" && (
            <li>
              <Link to="/admin">AdminUser</Link>
            </li>
          )}
          {isAuthenticated && (
            <>
              <li>
                <Link to="/dashboard">Dashboard</Link>
              </li>
              <li>
                <Link to="/profile">
                  {userName && userRole && (
                    <>
                      <strong>{userName}</strong> ({userRole})
                    </>
                  )}
                </Link>
              </li>
              <li>
                <button
                  onClick={handleLogout}
                  style={{ background: "none", border: "none", color: "blue", cursor: "pointer" }}
                >
                  Cerrar sesión
                </button>
              </li>
            </>
          )}
        </ul>
      </nav>
    </header>
  );
};

export default Header;