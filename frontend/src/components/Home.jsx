import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Home.css';

const Home = () => {
  const { isAuthenticated, userRole } = useAuth();

  return (
    <div className="home">
      <section className="hero-section">
        <h1 className="hero-title">Inn Project Management</h1>
        <p className="hero-subtitle">
          Gestiona tus proyectos de manera eficiente y colaborativa. 
          Una plataforma diseñada para equipos que buscan resultados excepcionales.
        </p>
        <div className="hero-buttons">
          {!isAuthenticated ? (
            <Link to="/login" className="hero-button primary-button">
            Iniciar Sesión
          </Link>
          ) : (
            <Link 
              to={
                userRole === 'super_administrador' 
                  ? '/admin' 
                  : userRole === 'project_admin' 
                    ? '/project-dashboard' 
                    : '/user-dashboard'
              } 
              className="hero-button primary-button"
            >
              Ir al Dashboard
            </Link>
          )}
        </div>
      </section>

      <section className="features-section">
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3 className="feature-title">Gestión Eficiente</h3>
            <p className="feature-description">
              Organiza y supervisa todos tus proyectos desde una interfaz intuitiva y fácil de usar.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">👥</div>
            <h3 className="feature-title">Colaboración en Tiempo Real</h3>
            <p className="feature-description">
              Trabaja en equipo de manera efectiva con herramientas de comunicación integradas.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📈</div>
            <h3 className="feature-title">Seguimiento de Progreso</h3>
            <p className="feature-description">
              Monitorea el avance de tus proyectos con métricas y reportes detallados.
            </p>
          </div>
        </div>
      </section>

      <section className="stats-section">
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-number">100+</div>
            <div className="stat-label">Proyectos Completados</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">50+</div>
            <div className="stat-label">Equipos Activos</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">1000+</div>
            <div className="stat-label">Usuarios Satisfechos</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">24/7</div>
            <div className="stat-label">Soporte Técnico</div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <h2 className="cta-title">¿Listo para comenzar?</h2>
        <p className="cta-description">
          Únete a cientos de equipos que ya están optimizando su gestión de proyectos con nuestra plataforma.
        </p>
        {!isAuthenticated ? (
          <Link to="/login" className="cta-button">
            Iniciar Sesión
          </Link>
        ) : (
          <Link 
            to={
              userRole === 'super_administrador' 
                ? '/admin' 
                : userRole === 'project_admin' 
                  ? '/project-dashboard' 
                  : '/user-dashboard'
            } 
            className="cta-button"
          >
            Ir al Dashboard
          </Link>
        )}
      </section>
    </div>
  );
};

export default Home; 