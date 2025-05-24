import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LOCAL_URL_API } from '../constants/constans';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
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
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('users');
  const [selectedProject, setSelectedProject] = useState(null);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'media',
    assignedTo: ''
  });
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newProject, setNewProject] = useState({
    title: '',
    content: '',
    status: 'publish'
  });

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
    fetchProjects();
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
      const filteredUsers = response.data.filter(user => 
        !user.roles?.includes('administrator')
      );
      console.log('Datos de usuarios filtrados:', filteredUsers);
      setUsers(filteredUsers);
      setLoading(false);
    } catch (error) {
      console.error('Error completo:', error);
      setError(error.response?.data?.message || 'Error al cargar los usuarios');
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await axios.get(
        `${LOCAL_URL_API}wp-json/wp/v2/proyectos/`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      setProjects(response.data);
    } catch (error) {
      console.error('Error al cargar proyectos:', error);
      setError('Error al cargar los proyectos');
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
        setSuccessMessage('Usuario creado exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
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

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('jwtToken');
      const currentTasks = selectedProject.meta?.tareas || [];
      
      const newTaskData = {
        nombre: newTask.title,
        estado: 'pendiente',
        descripcion: newTask.description,
        prioridad: newTask.priority,
        asignado: newTask.assignedTo
      };

      const updatedTasks = [...currentTasks, newTaskData];

      const response = await axios.post(
        `${LOCAL_URL_API}wp-json/wp/v2/proyectos/${selectedProject.id}`,
        {
          meta: {
            tareas: updatedTasks,
            participantes: selectedProject.meta?.participantes || []
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      setSelectedProject({
        ...response.data,
        meta: {
          ...response.data.meta,
          tareas: updatedTasks
        }
      });

      setNewTask({
        title: '',
        description: '',
        priority: 'media',
        assignedTo: ''
      });
      setShowCreateTask(false);
      setSuccessMessage('Tarea creada exitosamente');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error al crear tarea:', error);
      setError('Error al crear la tarea. Por favor, intenta de nuevo.');
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus, projectId) => {
    try {
      const token = localStorage.getItem('jwtToken');
      
      const response = await axios.post(
        `${LOCAL_URL_API}wp-json/pm/v1/tasks/${projectId}/update`,
        {
          task_name: taskId,
          new_status: newStatus
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data) {
        setProjects(prevProjects => 
          prevProjects.map(p => 
            p.id === projectId 
              ? {
                  ...p,
                  meta: {
                    ...p.meta,
                    tareas: response.data.tareas
                  }
                }
              : p
          )
        );
        setSuccessMessage('Estado de la tarea actualizado');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error al actualizar tarea:', error);
      setError('Error al actualizar la tarea');
    }
  };

  const handleDeleteTask = async (taskId, projectId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta tarea? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const token = localStorage.getItem('jwtToken');
      const project = projects.find(p => p.id === projectId);
      const updatedTasks = project.meta.tareas.filter(task => task.nombre !== taskId);

      const response = await axios.post(
        `${LOCAL_URL_API}wp-json/wp/v2/proyectos/${projectId}`,
        {
          meta: {
            tareas: updatedTasks,
            participantes: project.meta.participantes || []
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data) {
        setProjects(prevProjects => 
          prevProjects.map(p => 
            p.id === projectId 
              ? {
                  ...p,
                  meta: {
                    ...p.meta,
                    tareas: updatedTasks
                  }
                }
              : p
          )
        );
        setSuccessMessage('Tarea eliminada exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error al eliminar tarea:', error);
      setError('Error al eliminar la tarea');
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await axios.post(
        `${LOCAL_URL_API}wp-json/wp/v2/proyectos`,
        {
          title: newProject.title,
          content: newProject.content,
          status: newProject.status,
          meta: {
            tareas: [],
            participantes: []
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data) {
        setShowCreateProject(false);
        setNewProject({
          title: '',
          content: '',
          status: 'publish'
        });
        fetchProjects();
        setSuccessMessage('Proyecto creado exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error al crear proyecto:', error);
      setError('Error al crear el proyecto. Por favor, intenta de nuevo.');
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este proyecto? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const token = localStorage.getItem('jwtToken');
      const response = await axios.delete(
        `${LOCAL_URL_API}wp-json/wp/v2/proyectos/${projectId}?force=true`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data) {
        setProjects(prevProjects => prevProjects.filter(p => p.id !== projectId));
        setSuccessMessage('Proyecto eliminado exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error al eliminar proyecto:', error);
      setError('Error al eliminar el proyecto');
    }
  };

  const renderProjectsTab = () => (
    <div className="projects-overview">
      <div className="projects-header">
        <h2>Proyectos</h2>
        <button 
          className="btn-create"
          onClick={() => setShowCreateProject(true)}
        >
          <i className="fas fa-plus"></i> Nuevo Proyecto
        </button>
      </div>
      {projects.length === 0 ? (
        <p>No hay proyectos disponibles</p>
      ) : (
        <div className="projects-grid">
          {projects.map(project => (
            <div key={project.id} className="project-card">
              <div className="project-header">
                <h3>{project.title.rendered}</h3>
                <div className="project-actions">
                  <button 
                    className="btn-create-task"
                    onClick={() => {
                      setSelectedProject(project);
                      setShowCreateTask(true);
                    }}
                  >
                    <i className="fas fa-plus"></i> Nueva Tarea
                  </button>
                  <button 
                    className="btn-delete"
                    onClick={() => handleDeleteProject(project.id)}
                    title="Eliminar proyecto"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
              <div className="project-content">
                <div dangerouslySetInnerHTML={{ __html: project.content.rendered }} />
                <div className="tasks-list">
                  {project.meta?.tareas?.map(task => (
                    <div key={task.nombre} className="task-card">
                      <div className="task-header">
                        <h4>{task.nombre}</h4>
                        <div className="task-actions">
                          <select
                            className={`status-select ${task.estado}`}
                            value={task.estado}
                            onChange={(e) => handleUpdateTaskStatus(task.nombre, e.target.value, project.id)}
                          >
                            <option value="pendiente">Pendiente</option>
                            <option value="en_progreso">En Progreso</option>
                            <option value="completada">Completada</option>
                          </select>
                          {task.estado === 'completada' && (
                            <button 
                              className="btn-delete-task"
                              onClick={() => handleDeleteTask(task.nombre, project.id)}
                              title="Eliminar tarea"
                            >
                              <i className="fas fa-trash"></i> Eliminar
                            </button>
                          )}
                        </div>
                      </div>
                      <p>{task.descripcion}</p>
                      <div className="task-meta">
                        <span className={`priority ${task.prioridad}`}>
                          {task.prioridad}
                        </span>
                        {task.asignado && (
                          <span className="assigned-to">
                            Asignado a: {users.find(u => u.id.toString() === task.asignado)?.name || 'No asignado'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (loading) return <div className="loading">Cargando...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="admin-dashboard">
      <h1>Panel de Administración</h1>
      
      {successMessage && (
        <div className="success-message">
          {successMessage}
        </div>
      )}

      <div className="dashboard-tabs">
        <button 
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Usuarios
        </button>
        <button 
          className={`tab-button ${activeTab === 'projects' ? 'active' : ''}`}
          onClick={() => setActiveTab('projects')}
        >
          Proyectos
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'users' ? (
          <div className="users-section">
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
                          ? user.roles
                              .filter(role => role !== 'administrator')
                              .map(role => {
                                switch(role) {
                                  case 'project_admin':
                                    return 'Administrador de Proyectos';
                                  case 'project_user':
                                    return 'Usuario de Proyectos';
                                  default:
                                    return role;
                                }
                              })
                              .join(', ')
                          : typeof user.roles === 'object' 
                            ? Object.keys(user.roles)
                                .filter(role => role !== 'administrator')
                                .map(role => {
                                  switch(role) {
                                    case 'project_admin':
                                      return 'Administrador de Proyectos';
                                    case 'project_user':
                                      return 'Usuario de Proyectos';
                                    default:
                                      return role;
                                  }
                                })
                                .join(', ')
                            : user.roles && user.roles !== 'administrator'
                              ? user.roles
                              : 'Sin rol'}
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
        ) : (
          renderProjectsTab()
        )}
      </div>

      {showCreateProject && (
        <div className="modal">
          <div className="modal-content">
            <h2>Crear Nuevo Proyecto</h2>
            <form onSubmit={handleCreateProject}>
              <div className="form-group">
                <label>Título del Proyecto:</label>
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
                  rows="5"
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-submit">Crear Proyecto</button>
                <button type="button" className="btn-cancel" onClick={() => setShowCreateProject(false)}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCreateTask && selectedProject && (
        <div className="modal">
          <div className="modal-content">
            <h2>Crear Nueva Tarea</h2>
            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <label>Título:</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Descripción:</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Prioridad:</label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                >
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                </select>
              </div>
              <div className="form-group">
                <label>Asignar a:</label>
                <select
                  value={newTask.assignedTo}
                  onChange={(e) => setNewTask({...newTask, assignedTo: e.target.value})}
                >
                  <option value="">Seleccionar usuario</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-submit">Crear Tarea</button>
                <button type="button" className="btn-cancel" onClick={() => setShowCreateTask(false)}>
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