import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LOCAL_URL_API } from "../constants/constans";
import "../styles/Header.css";

const Header = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("jwtToken");
    if (token) {
      setIsLoggedIn(true);
      fetchUserInfo(token);
    }
  }, []);

  const fetchUserInfo = async (token) => {
    try {
      const response = await fetch(`${LOCAL_URL_API}wp-json/wp/v2/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUserName(userData.name);
      }
    } catch (error) {
      console.error("Error al obtener información del usuario:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("jwtToken");
    setIsLoggedIn(false);
    setUserName("");
    navigate("/login");
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <Link to="/">Inn Project Management</Link>
        </div>
        <nav className="nav-menu">
          {!isLoggedIn ? (
            <>
              <Link to="/" className="nav-link">Inicio</Link>
              <Link to="/login" className="nav-link">Iniciar Sesión</Link>
              <Link to="/register" className="nav-link">Registrarse</Link>
            </>
          ) : (
            <>
              <Link to="/dashboard" className="nav-link">Dashboard</Link>
              <div className="user-menu">
                <span className="user-name">Hola, {userName}</span>
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