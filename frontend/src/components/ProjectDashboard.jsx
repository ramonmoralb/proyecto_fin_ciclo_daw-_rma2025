import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LOCAL_URL_API } from '../constants/constans';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styles/ProjectDashboard.css';

const ProjectDashboard = () => {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    assignedUsers: []
  });
  const [selectedProject, setSelectedProject] = useState(null);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'media',
    assignedTo: ''
  });

  const { userRole, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (userRole !== 'project_admin') {
      setError('No tienes permisos para acceder a esta página');
      return;
    }

    fetchProjects();
    fetchUsers();
  }, [userRole, isAuthenticated, navigate]);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await axios.get(
        `${LOCAL_URL_API}wp-json/wp/v2/proyectos/`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      setProjects(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar proyectos:', error);
      setError('Error al cargar los proyectos');
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      console.log('Token usado:', token);
      
      const response = await axios.get(
        `${LOCAL_URL_API}wp-json/wp/v2/users`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Respuesta completa:', response);
      console.log('Datos de usuarios recibidos:', response.data);
      
      // Filtrar solo los usuarios con rol project_user
      const projectUsers = response.data.filter(user => 
        user.roles && user.roles.includes('project_user')
      );
      
      console.log('Usuarios filtrados (project_user):', projectUsers);
      setUsers(projectUsers);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      console.error('Detalles del error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers
      });
      
      if (error.response) {
        console.error('Detalles del error:', error.response.data);
        setError(`Error al cargar los usuarios: ${error.response.data.message || 'Error de permisos'}`);
      } else {
        setError('Error al cargar los usuarios. Por favor, contacta al administrador.');
      }
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await axios.post(
        `${LOCAL_URL_API}wp-json/wp/v2/proyectos/`,
        newProject,
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
          description: '',
          assignedUsers: []
        });
        fetchProjects();
      }
    } catch (error) {
      console.error('Error al crear proyecto:', error);
      setError('Error al crear el proyecto');
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('jwtToken');
      
      // Obtener las tareas actuales del proyecto
      const currentTasks = selectedProject.meta?.tareas || [];
      
      // Crear nueva tarea con el formato exacto que espera WordPress
      const newTaskData = {
        nombre: newTask.title,
        estado: 'pendiente',
        descripcion: newTask.description,
        prioridad: newTask.priority,
        asignado: newTask.assignedTo
      };

      // Añadir la nueva tarea al array existente
      const updatedTasks = [...currentTasks, newTaskData];

      // Actualizar el proyecto con las nuevas tareas
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

      console.log('Tarea creada:', response.data);
      
      // Actualizar el proyecto seleccionado con las nuevas tareas
      setSelectedProject({
        ...selectedProject,
        meta: {
          ...selectedProject.meta,
          tareas: updatedTasks
        }
      });

      // Limpiar el formulario
      setNewTask({
        title: '',
        description: '',
        priority: 'media',
        assignedTo: ''
      });
      setShowCreateTask(false);
    } catch (error) {
      console.error('Error al crear tarea:', error);
      if (error.response) {
        console.error('Detalles del error:', error.response.data);
        setError(`Error al crear la tarea: ${error.response.data.message || 'Error de formato'}`);
      } else {
        setError('Error al crear la tarea. Por favor, intenta de nuevo.');
      }
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      const token = localStorage.getItem('jwtToken');
      
      // Obtener las tareas actuales
      const currentTasks = selectedProject.meta?.tareas || [];
      
      // Actualizar el estado de la tarea
      const updatedTasks = currentTasks.map(task => 
        task.nombre === taskId ? { ...task, estado: newStatus } : task
      );

      // Actualizar el proyecto con las tareas actualizadas
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

      console.log('Tarea actualizada:', response.data);
      
      // Actualizar el proyecto seleccionado
      setSelectedProject({
        ...selectedProject,
        meta: {
          ...selectedProject.meta,
          tareas: updatedTasks
        }
      });
    } catch (error) {
      console.error('Error al actualizar tarea:', error);
      if (error.response) {
        console.error('Detalles del error:', error.response.data);
        setError(`Error al actualizar la tarea: ${error.response.data.message || 'Error de formato'}`);
      } else {
        setError('Error al actualizar la tarea. Por favor, intenta de nuevo.');
      }
    }
  };

  if (loading) return <div className="loading">Cargando...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="project-dashboard">
      <h1>Panel de Gestión de Proyectos</h1>
      
      <div className="dashboard-actions">
        <button 
          className="btn-create"
          onClick={() => setShowCreateProject(!showCreateProject)}
        >
          {showCreateProject ? 'Cancelar' : 'Crear Nuevo Proyecto'}
        </button>
      </div>

      {showCreateProject && (
        <div className="create-project-form">
          <h2>Crear Nuevo Proyecto</h2>
          <form onSubmit={handleCreateProject}>
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
                value={newProject.description}
                onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Usuarios Asignados:</label>
              <select
                multiple
                value={newProject.assignedUsers}
                onChange={(e) => setNewProject({
                  ...newProject,
                  assignedUsers: Array.from(e.target.selectedOptions, option => option.value)
                })}
              >
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn-submit">Crear Proyecto</button>
          </form>
        </div>
      )}

      <div className="projects-list">
        <h2>Proyectos</h2>
        {projects.map(project => (
          <div key={project.id} className="project-card">
            <h3>{project.title?.rendered || project.title}</h3>
            <p>{project.description?.rendered || project.description}</p>
            <button 
              className="btn-view"
              onClick={() => setSelectedProject(project)}
            >
              Ver Tablero
            </button>
          </div>
        ))}
      </div>

      {selectedProject && (
        <div className="kanban-board">
          <h2>Tablero Kanban - {selectedProject.title?.rendered || selectedProject.title}</h2>
          
          <div className="board-actions">
            <button 
              className="btn-create"
              onClick={() => setShowCreateTask(!showCreateTask)}
            >
              {showCreateTask ? 'Cancelar' : 'Crear Nueva Tarea'}
            </button>
          </div>

          {showCreateTask && (
            <div className="create-task-form">
              <h3>Crear Nueva Tarea</h3>
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
                <button type="submit" className="btn-submit">Crear Tarea</button>
              </form>
            </div>
          )}

          <div className="kanban-columns">
            <div className="kanban-column">
              <h3>Pendiente</h3>
              {selectedProject.meta?.tareas
                ?.filter(task => task.estado === 'pendiente')
                .map(task => (
                  <div key={task.nombre} className="task-card">
                    <h4>{task.nombre}</h4>
                    <p>{task.descripcion}</p>
                    <div className="task-meta">
                      <span className={`priority ${task.prioridad}`}>
                        {task.prioridad}
                      </span>
                      <span className="assigned-to">
                        Asignado a: {task.asignado}
                      </span>
                    </div>
                    <div className="task-actions">
                      <button
                        onClick={() => handleUpdateTaskStatus(task.nombre, 'en_progreso')}
                        className="btn-move"
                      >
                        Mover a En Progreso
                      </button>
                    </div>
                  </div>
                ))}
            </div>

            <div className="kanban-column">
              <h3>En Progreso</h3>
              {selectedProject.meta?.tareas
                ?.filter(task => task.estado === 'en_progreso')
                .map(task => (
                  <div key={task.nombre} className="task-card">
                    <h4>{task.nombre}</h4>
                    <p>{task.descripcion}</p>
                    <div className="task-meta">
                      <span className={`priority ${task.prioridad}`}>
                        {task.prioridad}
                      </span>
                      <span className="assigned-to">
                        Asignado a: {task.asignado}
                      </span>
                    </div>
                    <div className="task-actions">
                      <button
                        onClick={() => handleUpdateTaskStatus(task.nombre, 'completada')}
                        className="btn-move"
                      >
                        Mover a Completada
                      </button>
                    </div>
                  </div>
                ))}
            </div>

            <div className="kanban-column">
              <h3>Completada</h3>
              {selectedProject.meta?.tareas
                ?.filter(task => task.estado === 'completada')
                .map(task => (
                  <div key={task.nombre} className="task-card">
                    <h4>{task.nombre}</h4>
                    <p>{task.descripcion}</p>
                    <div className="task-meta">
                      <span className={`priority ${task.prioridad}`}>
                        {task.prioridad}
                      </span>
                      <span className="assigned-to">
                        Asignado a: {task.asignado}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDashboard; 