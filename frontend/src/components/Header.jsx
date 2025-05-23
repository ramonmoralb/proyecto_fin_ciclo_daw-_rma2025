import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Header.css";

const Header = () => {
  const { isAuthenticated, userRole, userName, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <Link to="/">Inn Project Management</Link>
        </div>
        <nav className="nav-menu">
          {!isAuthenticated ? (
            <>
              <Link to="/" className="nav-link">Inicio</Link>
              <Link to="/login" className="nav-link">Iniciar Sesión</Link>
            </>
          ) : (
            <>
              {userRole === 'super_administrador' && (
                <Link to="/admin-dashboard" className="nav-link">Panel de Administración</Link>
              )}
              {userRole === 'project_admin' && (
                <Link to="/project-dashboard" className="nav-link">Panel de Proyectos</Link>
              )}
              {userRole === 'project_user' && (
                <Link to="/user-dashboard" className="nav-link">Mis Proyectos</Link>
              )}
              <div className="user-menu">
                <span className="user-name">Hola, {userName}</span>
                <span className="user-role">({userRole === 'super_administrador' ? 'Super Administrador' : 
                  userRole === 'project_admin' ? 'Administrador de Proyectos' : 'Usuario de Proyectos'})</span>
                <button onClick={handleLogout} className="logout-button">
                  Cerrar Sesión
                </button>
              </div>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;