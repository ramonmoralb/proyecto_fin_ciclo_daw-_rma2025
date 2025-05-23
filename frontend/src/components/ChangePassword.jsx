import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LOCAL_URL_API } from '../constants/constans';
import '../styles/ChangePassword.css';

const ChangePassword = () => {
    const navigate = useNavigate();
    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setPasswords({
            ...passwords,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (passwords.newPassword !== passwords.confirmPassword) {
            setError('Las contraseñas no coinciden');
            setLoading(false);
            return;
        }

        if (passwords.newPassword.length < 8) {
            setError('La contraseña debe tener al menos 8 caracteres');
            setLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${LOCAL_URL_API}/wp-json/wp/v2/users/me`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    password: passwords.newPassword,
                    first_login: false
                })
            });

            if (!response.ok) {
                throw new Error('Error al cambiar la contraseña');
            }

            // Redirigir al dashboard según el rol del usuario
            const userResponse = await fetch(`${LOCAL_URL_API}/wp-json/wp/v2/users/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const userData = await userResponse.json();
            
            if (userData.roles.includes('super_administrador')) {
                navigate('/admin-dashboard');
            } else if (userData.roles.includes('project_admin')) {
                navigate('/dashboard');
            } else {
                navigate('/dashboard');
            }
        } catch (error) {
            setError('Error al cambiar la contraseña. Por favor, inténtalo de nuevo.');
            console.error('Error changing password:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="change-password-container">
            <div className="change-password-card">
                <h2>Cambiar Contraseña</h2>
                <p className="change-password-message">
                    Por seguridad, debes cambiar tu contraseña en tu primer inicio de sesión.
                </p>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit} className="change-password-form">
                    <div className="form-group">
                        <label>Contraseña Actual:</label>
                        <input
                            type="password"
                            name="currentPassword"
                            value={passwords.currentPassword}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Nueva Contraseña:</label>
                        <input
                            type="password"
                            name="newPassword"
                            value={passwords.newPassword}
                            onChange={handleChange}
                            required
                            minLength="8"
                        />
                        <small>La contraseña debe tener al menos 8 caracteres</small>
                    </div>

                    <div className="form-group">
                        <label>Confirmar Nueva Contraseña:</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={passwords.confirmPassword}
                            onChange={handleChange}
                            required
                            minLength="8"
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="btn-change-password"
                        disabled={loading}
                    >
                        {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChangePassword; 