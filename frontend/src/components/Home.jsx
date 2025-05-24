import React from 'react';
import { Link } from 'react-router-dom';
import LogoWebSVG from '../assets/LogoWebSVG.svg';
import '../styles/Home.css';

const Home = () => {
  return (
    <div className="home-container">
      <div className="hero-section">
        <div className="logo-container">
          <img src={LogoWebSVG} alt="Inn Project Management Logo" className="logo" />
          <h1 className="app-title">Inn Project Management</h1>
        </div>
        <p className="hero-description">
          Tu solución integral para la gestión de proyectos, clientes y productos
        </p>
        <div className="cta-buttons">
          <Link to="/login" className="btn-login">
            Iniciar Sesión
          </Link>
        </div>
      </div>

      <div className="features-section">
        <h2>Características Principales</h2>
        <div className="features-grid">
          <div className="feature-card">
            <span className="feature-icon">📊</span>
            <h3>Dashboard Intuitivo</h3>
            <p>Visualiza el progreso de tus proyectos, gestiona clientes y productos desde un panel centralizado</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">👥</span>
            <h3>Gestión de Clientes</h3>
            <p>Mantén un registro detallado de tus clientes con información de contacto y seguimiento</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">📦</span>
            <h3>Control de Productos</h3>
            <p>Administra tu inventario, precios y stock de productos de manera eficiente</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">✅</span>
            <h3>Gestión de Tareas</h3>
            <p>Organiza y realiza seguimiento de todas tus tareas con estados y prioridades</p>
          </div>
        </div>
      </div>

      <div className="how-it-works">
        <h2>Beneficios Clave</h2>
        <div className="steps-container">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Eficiencia</h3>
            <p>Optimiza tus procesos de trabajo y gestión de recursos</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Organización</h3>
            <p>Mantén todo tu negocio organizado en un solo lugar</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Colaboración</h3>
            <p>Trabaja en equipo de manera coordinada y efectiva</p>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <h3>Control</h3>
            <p>Mantén el control total sobre tus proyectos y operaciones</p>
          </div>
        </div>
      </div>

      <div className="contact-section">
        <h2>¿Necesitas Acceso?</h2>
        <p>Contacta con el administrador del sistema para obtener tus credenciales de acceso</p>
        <a href="mailto:admin@innprojectmanagement.com" className="btn-contact">
          Contactar Administrador
        </a>
      </div>
    </div>
  );
};

export default Home; 