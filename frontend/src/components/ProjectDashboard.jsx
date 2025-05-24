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
  const [projectParticipants, setProjectParticipants] = useState([]);

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
      const response = await axios.get(
        `${LOCAL_URL_API}wp-json/wp/v2/users`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const projectUsers = response.data.filter(user => 
        user.roles && user.roles.includes('project_user')
      );
      
      if (selectedProject) {
        const participantesIds = selectedProject.meta?.participantes || [];
        const filteredUsers = projectUsers.filter(user => 
          participantesIds.includes(user.id.toString())
        );
        setUsers(filteredUsers);
      } else {
        setUsers(projectUsers);
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      setError('Error al cargar usuarios. Por favor, intenta de nuevo.');
    }
  };

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
    } catch (error) {
      console.error('Error al crear tarea:', error);
      setError('Error al crear la tarea. Por favor, intenta de nuevo.');
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      const token = localStorage.getItem('jwtToken');
      
      console.log('Actualizando tarea:', {
        taskId,
        newStatus,
        projectId: selectedProject.id
      });

      const payload = {
        task_name: taskId,
        new_status: newStatus
      };

      console.log('Payload:', payload);

      const response = await axios.post(
        `${LOCAL_URL_API}wp-json/pm/v1/tasks/${selectedProject.id}/update`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Respuesta del servidor:', response.data);

      if (response.data) {
        setSelectedProject({
          ...selectedProject,
          meta: {
            ...selectedProject.meta,
            tareas: response.data.tareas
          }
        });
      }
    } catch (error) {
      console.error('Error al actualizar tarea:', error);
      console.error('Detalles del error:', error.response?.data);
      setError('Error al actualizar la tarea. Por favor, intenta de nuevo.');
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

      const response = await axios.post(
        `${LOCAL_URL_API}wp-json/pm/v1/tasks/${selectedProject.id}/update`,
        {
          task_name: taskId,
          new_status: 'deleted'
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data) {
        setSelectedProject(prev => ({
          ...prev,
          meta: {
            ...prev.meta,
            tareas: response.data.tareas
          }
        }));
      }
    } catch (error) {
      console.error('Error al eliminar tarea:', error);
      setError('Error al eliminar la tarea');
    }
  };

  const fetchProjectParticipants = async (participantIds) => {
    try {
      const token = localStorage.getItem('jwtToken');
      // Primero obtenemos todos los usuarios del proyecto
      const response = await axios.get(
        `${LOCAL_URL_API}wp-json/wp/v2/users`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Filtramos solo los usuarios que son participantes del proyecto
      const participants = response.data.filter(user => 
        participantIds.includes(user.id.toString())
      );

      setProjectParticipants(participants);
    } catch (error) {
      console.error('Error al cargar participantes:', error);
      // En caso de error, mostramos un mensaje más amigable
      setError('No se pudieron cargar los detalles de los participantes. Por favor, intenta de nuevo.');
    }
  };

  const handleProjectClick = async (project) => {
    try {
      setSelectedProject(project);
      if (project.meta?.participantes) {
        await fetchProjectParticipants(project.meta.participantes);
      }
    } catch (error) {
      console.error('Error al cargar detalles del proyecto:', error);
      setError('Error al cargar los detalles del proyecto');
    }
  };

  const renderProjectDetails = () => {
    if (!selectedProject) return null;

    return (
      <div className="project-details">
        <div className="project-details-header">
          <h2>{selectedProject.title.rendered}</h2>
          <button 
            className="btn-back"
            onClick={() => setSelectedProject(null)}
          >
            <i className="fas fa-arrow-left"></i> Volver
          </button>
        </div>

        <div className="project-details-content">
          <div className="project-info">
            <div className="info-section">
              <h3>Descripción</h3>
              <div dangerouslySetInnerHTML={{ __html: selectedProject.content.rendered }} />
            </div>

            <div className="info-section">
              <h3>Participantes</h3>
              <div className="participants-list">
                {projectParticipants.length > 0 ? (
                  projectParticipants.map(participant => (
                    <div key={participant.id} className="participant-card">
                      <div className="participant-avatar">
                        {participant.meta?.profile_image_url ? (
                          <img 
                            src={participant.meta.profile_image_url} 
                            alt={participant.name}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = 'none';
                              e.target.parentElement.querySelector('.avatar-placeholder').style.display = 'flex';
                            }}
                          />
                        ) : (
                          <div className="avatar-placeholder">
                            {participant.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="participant-info">
                        <h4>{participant.name}</h4>
                        <p>{participant.email}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-participants">No hay participantes asignados</p>
                )}
              </div>
            </div>

            <div className="info-section">
              <h3>Tareas</h3>
              <div className="tasks-actions">
                <button 
                  className="btn-create-task"
                  onClick={() => setShowCreateTask(true)}
                >
                  <i className="fas fa-plus"></i> Nueva Tarea
                </button>
              </div>
              <div className="tasks-list">
                {selectedProject.meta?.tareas?.length > 0 ? (
                  selectedProject.meta.tareas.map(task => (
                    <div key={task.nombre} className="task-card">
                      <div className="task-header">
                        <h4>{task.nombre}</h4>
                        <div className="task-actions">
                          <select
                            className={`status-select ${task.estado}`}
                            value={task.estado}
                            onChange={(e) => handleUpdateTaskStatus(task.nombre, e.target.value)}
                          >
                            <option value="pendiente">Pendiente</option>
                            <option value="en_progreso">En Progreso</option>
                            <option value="completada">Completada</option>
                          </select>
                          {task.estado === 'completada' && (
                            <button 
                              className="btn-delete-task"
                              onClick={() => handleDeleteTask(task.nombre)}
                              title="Eliminar tarea"
                            >
                              <i className="fas fa-trash"></i>
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
                  ))
                ) : (
                  <p className="no-tasks">No hay tareas asignadas</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <div className="loading">Cargando...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="project-dashboard">
      <div className="dashboard-header">
        <h1>Panel de Administración de Proyectos</h1>
        <div className="dashboard-actions">
          <button className="btn-create" onClick={() => setShowCreateProject(true)}>
            <i className="fas fa-plus"></i> Nuevo Proyecto
          </button>
        </div>
      </div>

      {selectedProject ? (
        renderProjectDetails()
      ) : (
        <div className="projects-list">
          <h2>Proyectos</h2>
          {projects.length === 0 ? (
            <p>No hay proyectos disponibles</p>
          ) : (
            <div className="projects-grid">
              {projects.map(project => (
                <div 
                  key={project.id} 
                  className="project-card"
                  onClick={() => handleProjectClick(project)}
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
                  <div dangerouslySetInnerHTML={{ __html: project.content.rendered }} />
                  <div className="project-meta">
                    <div className="meta-item">
                      <i className="fas fa-users"></i>
                      <span>Participantes: {project.meta?.participantes?.length || 0}</span>
                    </div>
                    <div className="meta-item">
                      <i className="fas fa-tasks"></i>
                      <span>Tareas: {project.meta?.tareas?.length || 0}</span>
                    </div>
                  </div>
                  <button className="btn-view-details">
                    Ver Detalles
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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