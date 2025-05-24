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
      console.log('=== DEBUG USERS FETCH ===');
      console.log('Token:', token);
      
      const response = await axios.get(
        `${LOCAL_URL_API}wp-json/wp/v2/users`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Response data:', response.data);
      
      // Filtrar usuarios con rol project_user
      const projectUsers = response.data.filter(user => {
        console.log('User:', user.name, 'Roles:', user.roles);
        return user.roles && user.roles.includes('project_user');
      });
      
      console.log('Filtered project users:', projectUsers);
      
      // Si hay un proyecto seleccionado, filtrar por sus participantes
      if (selectedProject) {
        console.log('Selected project:', selectedProject);
        console.log('Project participants:', selectedProject.meta?.participantes);
        
        const participantesIds = selectedProject.meta?.participantes || [];
        const filteredUsers = projectUsers.filter(user => 
          participantesIds.includes(user.id.toString())
        );
        console.log('Filtered participants:', filteredUsers);
        setUsers(filteredUsers);
      } else {
        // Si no hay proyecto seleccionado, mostrar todos los usuarios project_user
        setUsers(projectUsers);
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
      setError('Error al cargar usuarios. Por favor, intenta de nuevo.');
    }
  };

  // Añadir un useEffect para actualizar los usuarios cuando se selecciona un proyecto
  useEffect(() => {
    if (selectedProject) {
      fetchUsers();
    }
  }, [selectedProject]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await axios.post(
        `${LOCAL_URL_API}wp-json/wp/v2/proyectos/`,
        {
          title: newProject.title,
          content: newProject.description,
          status: 'publish',
          meta: {
            participantes: newProject.assignedUsers.map(id => id.toString()),
            tareas: []
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
      
      // Crear nueva tarea con el formato correcto que espera WordPress
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
        ...response.data,
        meta: {
          ...response.data.meta,
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

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este proyecto? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const token = localStorage.getItem('jwtToken');
      await axios.delete(
        `${LOCAL_URL_API}wp-json/wp/v2/proyectos/${projectId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Actualizar la lista de proyectos
      setProjects(projects.filter(project => project.id !== projectId));
      if (selectedProject?.id === projectId) {
        setSelectedProject(null);
      }
    } catch (error) {
      console.error('Error al eliminar proyecto:', error);
      setError('Error al eliminar el proyecto');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta tarea? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const token = localStorage.getItem('jwtToken');
      const updatedTasks = selectedProject.meta.tareas.filter(task => task.nombre !== taskId);

      await axios.put(
        `${LOCAL_URL_API}wp-json/wp/v2/proyectos/${selectedProject.id}`,
        {
          meta: {
            tareas: updatedTasks
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Actualizar el estado local
      setSelectedProject(prev => ({
        ...prev,
        meta: {
          ...prev.meta,
          tareas: updatedTasks
        }
      }));
    } catch (error) {
      console.error('Error al eliminar tarea:', error);
      setError('Error al eliminar la tarea');
    }
  };

  const renderTask = (task) => (
    <div key={task.nombre} className="task-card">
      <div className="task-header">
        <h4>{task.nombre}</h4>
        <div className="task-actions">
          <button
            className="btn-delete"
            onClick={() => handleDeleteTask(task.nombre)}
            title="Eliminar tarea"
          >
            <i className="fas fa-trash"></i>
          </button>
        </div>
      </div>
      <p>{task.descripcion}</p>
      <div className="task-meta">
        <span className={`priority ${task.prioridad}`}>
          {task.prioridad}
        </span>
        <span className="assigned-to">
          Asignado a: {users.find(user => user.id.toString() === task.asignado)?.name || 'No asignado'}
        </span>
      </div>
      {task.problemas && task.problemas.length > 0 && (
        <div className="task-problems">
          <h5>Problemas Reportados:</h5>
          {task.problemas.map(problem => (
            <div key={problem.nombre} className="problem-card">
              <p className={`severity ${problem.severidad}`}>
                Severidad: {problem.severidad}
              </p>
              <p>{problem.descripcion}</p>
              <small>
                Reportado por {problem.reportadoPor} el {new Date(problem.fechaReporte).toLocaleDateString()}
              </small>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderProject = (project) => (
    <div 
      key={project.id} 
      className={`project-card ${selectedProject?.id === project.id ? 'selected' : ''}`}
      onClick={() => setSelectedProject(project)}
    >
      <div className="project-header">
        <h3>{project.title.rendered}</h3>
        <div className="project-actions">
          <button
            className="btn-delete"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteProject(project.id);
            }}
            title="Eliminar proyecto"
          >
            <i className="fas fa-trash"></i>
          </button>
        </div>
      </div>
      <p>{project.content.rendered}</p>
      <div className="project-meta">
        <span className="participants">
          Participantes: {project.meta?.participantes?.length || 0}
        </span>
        <span className="tasks">
          Tareas: {project.meta?.tareas?.length || 0}
        </span>
      </div>
    </div>
  );

  if (loading) return <div className="loading">Cargando...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="project-dashboard">
      <div className="dashboard-header">
        <h1>Panel de Administración de Proyectos</h1>
        <button className="btn-create" onClick={() => setShowCreateProject(true)}>
          Crear Nuevo Proyecto
        </button>
      </div>

      <div className="dashboard-content">
        <div className="projects-list">
          <h2>Proyectos</h2>
          {projects.map(renderProject)}
        </div>

        {selectedProject && (
          <div className="project-details">
            <h2>{selectedProject.title.rendered}</h2>
            <div className="tasks-container">
              <h3>Tareas</h3>
              <button className="btn-create" onClick={() => setShowCreateTask(true)}>
                Crear Nueva Tarea
              </button>
              {selectedProject.meta?.tareas?.map(renderTask)}
            </div>
          </div>
        )}
      </div>

      {showCreateProject && (
        <div className="modal">
          <div className="modal-content">
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
                <label>Participantes:</label>
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
                <small>Mantén presionado Ctrl (Cmd en Mac) para seleccionar múltiples usuarios</small>
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

      {showCreateTask && (
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

export default ProjectDashboard; 