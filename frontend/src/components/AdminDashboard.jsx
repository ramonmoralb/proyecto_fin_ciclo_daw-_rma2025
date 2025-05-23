import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LOCAL_URL_API } from '../constants/constans';
import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'project_user',
    first_name: '',
    last_name: ''
  });
  const [newProject, setNewProject] = useState({
    title: '',
    content: '',
    status: 'pending'
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Verificar si es la primera vez que el usuario inicia sesión
    const checkFirstLogin = async () => {
      try {
        const response = await fetch(`${LOCAL_URL_API}/wp-json/wp/v2/users/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        
        if (data.meta && data.meta.first_login) {
          navigate('/change-password');
          return;
        }
      } catch (error) {
        console.error('Error checking first login:', error);
      }
    };

    checkFirstLogin();
    fetchUsers();
    fetchProjects();
  }, [navigate]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${LOCAL_URL_API}/wp-json/wp/v2/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      setError('Error al cargar usuarios');
      console.error('Error fetching users:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${LOCAL_URL_API}/wp-json/wp/v2/proyectos`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      setError('Error al cargar proyectos');
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${LOCAL_URL_API}/wp-json/jwt-auth/v1/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newUser)
      });

      if (!response.ok) {
        throw new Error('Error al crear usuario');
      }

      setShowAddUserModal(false);
      setNewUser({
        username: '',
        email: '',
        password: '',
        role: 'project_user',
        first_name: '',
        last_name: ''
      });
      fetchUsers();
    } catch (error) {
      setError('Error al crear usuario');
      console.error('Error creating user:', error);
    }
  };

  const handleAddProject = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${LOCAL_URL_API}/wp-json/wp/v2/proyectos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newProject)
      });

      if (!response.ok) {
        throw new Error('Error al crear proyecto');
      }

      setShowAddProjectModal(false);
      setNewProject({
        title: '',
        content: '',
        status: 'pending'
      });
      fetchProjects();
    } catch (error) {
      setError('Error al crear proyecto');
      console.error('Error creating project:', error);
    }
  };

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  return (
    <div className="admin-dashboard">
      <h1>Panel de Administración</h1>
      
      {error && <div className="error-message">{error}</div>}

      <div className="dashboard-sections">
        <section className="users-section">
          <div className="section-header">
            <h2>Usuarios</h2>
            <button onClick={() => setShowAddUserModal(true)} className="btn-add">
              Añadir Usuario
            </button>
          </div>
          <div className="users-list">
            {users.map(user => (
              <div key={user.id} className="user-card">
                <h3>{user.name}</h3>
                <p>Email: {user.email}</p>
                <p>Rol: {user.roles.join(', ')}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="projects-section">
          <div className="section-header">
            <h2>Proyectos</h2>
            <button onClick={() => setShowAddProjectModal(true)} className="btn-add">
              Añadir Proyecto
            </button>
          </div>
          <div className="projects-list">
            {projects.map(project => (
              <div key={project.id} className="project-card">
                <h3>{project.title.rendered}</h3>
                <p>Estado: {project.status}</p>
                <button 
                  onClick={() => navigate(`/proyecto/${project.id}`)}
                  className="btn-view"
                >
                  Ver Detalles
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      {showAddUserModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Añadir Nuevo Usuario</h2>
            <form onSubmit={handleAddUser}>
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
                  <option value="project_user">Usuario de Proyecto</option>
                  <option value="project_admin">Administrador de Proyecto</option>
                </select>
              </div>
              <div className="form-group">
                <label>Nombre:</label>
                <input
                  type="text"
                  value={newUser.first_name}
                  onChange={(e) => setNewUser({...newUser, first_name: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Apellidos:</label>
                <input
                  type="text"
                  value={newUser.last_name}
                  onChange={(e) => setNewUser({...newUser, last_name: e.target.value})}
                />
              </div>
              <div className="modal-buttons">
                <button type="submit" className="btn-save">Guardar</button>
                <button 
                  type="button" 
                  className="btn-cancel"
                  onClick={() => setShowAddUserModal(false)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddProjectModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Añadir Nuevo Proyecto</h2>
            <form onSubmit={handleAddProject}>
              <div className="form-group">
                <label>Título:</label>
                <input
                  type="text"
                  value={newProject.title}
                  onChange={(e) => setNewProject({...newProject, title: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Descripción:</label>
                <textarea
                  value={newProject.content}
                  onChange={(e) => setNewProject({...newProject, content: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Estado:</label>
                <select
                  value={newProject.status}
                  onChange={(e) => setNewProject({...newProject, status: e.target.value})}
                >
                  <option value="pending">Pendiente</option>
                  <option value="in_progress">En Progreso</option>
                  <option value="completed">Completado</option>
                </select>
              </div>
              <div className="modal-buttons">
                <button type="submit" className="btn-save">Guardar</button>
                <button 
                  type="button" 
                  className="btn-cancel"
                  onClick={() => setShowAddProjectModal(false)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard; 