import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LOCAL_URL_API } from '../constants/constans';
import '../styles/ChangePassword.css';


const ChangePassword = () => {
    const [formData, setFormData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Validar que las contraseñas coincidan
        if (formData.new_password !== formData.confirm_password) {
            setError('Las contraseñas no coinciden');
            setLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${LOCAL_URL_API}/wp-json/jwt-auth/v1/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    current_password: formData.current_password,
                    new_password: formData.new_password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al cambiar la contraseña');
            }

            // Obtener el rol del usuario del token
            const userData = JSON.parse(atob(token.split('.')[1]));
            const userRole = userData.roles[0]; // Asumimos que el usuario tiene un solo rol

            // Redirigir según el rol
            if (userRole === 'super_administrador') {
                navigate('/admin-dashboard');
            } else if (userRole === 'project_admin') {
                navigate('/dashboard');
            } else {
                navigate('/dashboard');
            }

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="change-password-container">
            <div className="change-password-card">
                <h2>Cambiar Contraseña</h2>
                <p>Por favor, cambia tu contraseña para continuar.</p>
                
                {error && <div className="error-message">{error}</div>}
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="current_password">Contraseña Actual</label>
                        <input
                            type="password"
                            id="current_password"
                            name="current_password"
                            value={formData.current_password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="new_password">Nueva Contraseña</label>
                        <input
                            type="password"
                            id="new_password"
                            name="new_password"
                            value={formData.new_password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirm_password">Confirmar Nueva Contraseña</label>
                        <input
                            type="password"
                            id="confirm_password"
                            name="confirm_password"
                            value={formData.confirm_password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button type="submit" className="btn-save" disabled={loading}>
                        {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChangePassword; 