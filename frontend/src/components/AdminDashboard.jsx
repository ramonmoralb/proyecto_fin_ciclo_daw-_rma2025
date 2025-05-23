import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LOCAL_URL_API } from '../constants/constans';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'project_user'
  });
  const { userRole, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (userRole !== 'super_administrador') {
      setError('No tienes permisos para acceder a esta página');
      return;
    }

    fetchUsers();
  }, [userRole, isAuthenticated, navigate]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await axios.get(
        `${LOCAL_URL_API}wp-json/wp/v2/users`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('Datos de usuarios recibidos:', response.data);
      setUsers(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error completo:', error);
      setError(error.response?.data?.message || 'Error al cargar los usuarios');
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await axios.post(
        `${LOCAL_URL_API}wp-json/wp/v2/users`,
        {
          username: newUser.username,
          email: newUser.email,
          password: newUser.password,
          roles: [newUser.role]
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data) {
        setShowCreateForm(false);
        setNewUser({
          username: '',
          email: '',
          password: '',
          role: 'project_user'
        });
        fetchUsers();
      }
    } catch (error) {
      console.error('Error completo:', error);
      setError(error.response?.data?.message || 'Error al crear el usuario');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar permanentemente este usuario?')) {
      try {
        const token = localStorage.getItem('jwtToken');
        const response = await axios.delete(
          `${LOCAL_URL_API}wp-json/wp/v2/users/${userId}?force=true&reassign=1`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.data) {
          fetchUsers();
        }
      } catch (error) {
        console.error('Error completo:', error);
        setError(error.response?.data?.message || 'Error al eliminar el usuario');
      }
    }
  };

  if (loading) return <div className="loading">Cargando...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="admin-dashboard">
      <h1>Panel de Administración</h1>
      
      <div className="dashboard-actions">
        <button 
          className="btn-create"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? 'Cancelar' : 'Crear Nuevo Usuario'}
        </button>
      </div>

      {showCreateForm && (
        <div className="create-user-form">
          <h2>Crear Nuevo Usuario</h2>
          <form onSubmit={handleCreateUser}>
            <div className="form-group">
              <label>Nombre de Usuario:</label>
              <input
                type="text"
                value={newUser.username}
                onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Email:</label>
              <input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Contraseña:</label>
              <input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Rol:</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({...newUser, role: e.target.value})}
              >
                <option value="project_admin">Administrador de Proyectos</option>
                <option value="project_user">Usuario de Proyectos</option>
              </select>
            </div>
            <button type="submit" className="btn-submit">Crear Usuario</button>
          </form>
        </div>
      )}

      <div className="users-list">
        <h2>Usuarios del Sistema</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  {Array.isArray(user.roles) 
                    ? user.roles.join(', ') 
                    : typeof user.roles === 'object' 
                      ? Object.keys(user.roles).join(', ')
                      : user.roles || 'Sin rol'}
                </td>
                <td>
                  <button 
                    className="btn-delete"
                    onClick={() => handleDeleteUser(user.id)}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard; 