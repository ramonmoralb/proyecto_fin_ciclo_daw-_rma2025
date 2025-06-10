import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LOCAL_URL_API } from '../constants/constans';
import '../styles/Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Obtener el token
      const response = await fetch(`${LOCAL_URL_API}wp-json/jwt-auth/v1/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al iniciar sesión');
      }

      // 2. Guardar el token
      localStorage.setItem('jwtToken', data.token);

      // 3. Obtener información del usuario
      const userResponse = await fetch(`${LOCAL_URL_API}wp-json/wp/v2/users/me`, {
        headers: {
          'Authorization': `Bearer ${data.token}`
        }
      });

      if (!userResponse.ok) {
        throw new Error('Error al obtener información del usuario');
      }

      const userData = await userResponse.json();
      console.log('User data:', userData);

      // 4. Redirigir según el rol
      if (userData.roles.includes('project_user')) {
        navigate('/user-dashboard');
      } else if (userData.roles.includes('administrator') || userData.roles.includes('project_admin')) {
        navigate('/dashboard');
      } else {
        throw new Error('Rol de usuario no válido');
      }

    } catch (error) {
      console.error('Login error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Iniciar Sesión</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login; 