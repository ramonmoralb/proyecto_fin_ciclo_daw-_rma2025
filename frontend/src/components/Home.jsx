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
          Plataforma de gestión de proyectos intuitiva y eficiente para equipos de trabajo
        </p>
        <div className="cta-buttons">
          <Link to="/register" className="btn-register">
            Registrarse
          </Link>
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
            <p>Visualiza el progreso de tus proyectos de forma clara y organizada</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">👥</span>
            <h3>Colaboración en Equipo</h3>
            <p>Trabaja en equipo de manera eficiente y coordinada</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">✅</span>
            <h3>Gestión de Tareas</h3>
            <p>Organiza y realiza seguimiento de todas tus tareas</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">🔒</span>
            <h3>Seguridad</h3>
            <p>Tu información está protegida y segura</p>
          </div>
        </div>
      </div>

      <div className="how-it-works">
        <h2>Cómo Funciona</h2>
        <div className="steps-container">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Regístrate</h3>
            <p>Crea tu cuenta en minutos</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Crea tu Proyecto</h3>
            <p>Define objetivos y tareas</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Invita a tu Equipo</h3>
            <p>Colabora con otros miembros</p>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <h3>¡Comienza a Trabajar!</h3>
            <p>Gestiona y completa tus proyectos</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 