import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { LOCAL_URL_API } from "../constants/constans";
import "../styles/Header.css";

const Header = () => {
  const { isAuthenticated, userRole, userName, logout } = useAuth();
  const navigate = useNavigate();
  const [profileImage, setProfileImage] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserProfile();
    } else {
      setProfileImage(null);
    }
  }, [isAuthenticated, userName]);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      if (!token) return;

      const response = await axios.get(`${LOCAL_URL_API}wp-json/wp/v2/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.meta?.profile_image_url) {
        setProfileImage(response.data.meta.profile_image_url);
      } else {
        setProfileImage(null);
      }
    } catch (error) {
      console.error('Error al cargar la imagen de perfil:', error);
      setProfileImage(null);
    }
  };

  const handleLogout = () => {
    setProfileImage(null);
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
                <Link to="/profile" className="profile-link">
                  <div className="user-info">
                    {profileImage ? (
                      <img 
                        src={profileImage} 
                        alt="Imagen de perfil" 
                        className="header-profile-image"
                        onError={() => setProfileImage(null)}
                      />
                    ) : (
                      <div className="header-profile-placeholder">
                        {userName?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="user-name">Hola, {userName}</span>
                  </div>
                </Link>
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