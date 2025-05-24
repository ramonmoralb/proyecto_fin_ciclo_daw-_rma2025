import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LOCAL_URL_API } from '../constants/constans';
import { useAuth } from '../context/AuthContext';
import '../styles/UserDashboard.css';

const UserDashboard = () => {
  const { userRole, userName, userEmail, userId } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [reportProblem, setReportProblem] = useState({
    taskId: '',
    description: '',
    severity: 'medium'
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('tareas');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState('all');

  useEffect(() => {
    if (userRole === 'project_user' || userRole === 'project_admin' || userRole === 'super_administrador') {
      fetchProjects();
    }
  }, [userRole]);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      console.log('Fetching projects for user:', { userEmail, userRole });
      
      // Obtener el ID del usuario directamente del contexto
      const userResponse = await axios.get(
        `${LOCAL_URL_API}wp-json/wp/v2/users/me`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Current user data:', userResponse.data);
      const currentUserId = userResponse.data.id;

      if (!currentUserId) {
        console.error('ID de usuario no encontrado');
        setError('Error: ID de usuario no encontrado');
        return;
      }

      const response = await axios.get(
        `${LOCAL_URL_API}wp-json/wp/v2/proyectos/`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('All projects from API:', response.data);

      // Filtrar proyectos según el rol del usuario
      let userProjects;
      if (userRole === 'project_user') {
        // Para project_user, solo mostrar proyectos donde es participante
        userProjects = response.data.filter(project => {
          const participantes = project.meta?.participantes || [];
          return participantes.some(participantId => 
            parseInt(participantId) === parseInt(currentUserId)
          );
        });
      } else {
        // Para administradores, mostrar todos los proyectos
        userProjects = response.data;
      }

      console.log('Filtered user projects:', userProjects);
      setProjects(userProjects);
    } catch (error) {
      console.error('Error al cargar proyectos:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
      setError('Error al cargar los proyectos');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus, projectId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('jwtToken');
      
      console.log('Updating task with data:', {
        projectId,
        taskId,
        newStatus,
        userRole
      });

      // Actualizar en el backend usando el endpoint personalizado
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

      console.log('Update response:', response.data);

      // Actualizar el estado local con la respuesta del servidor
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

      setSuccessMessage(`Estado de la tarea actualizado a: ${newStatus}`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error al actualizar tarea:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        console.error('Error status:', error.response.status);
        console.error('Error headers:', error.response.headers);
      }
      setError('Error al actualizar la tarea: ' + (error.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const handleReportProblem = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem('jwtToken');
      const task = selectedProject.meta.tareas.find(t => t.id === reportProblem.taskId);
      
      if (!task) {
        setError('Tarea no encontrada');
        return;
      }

      const newProblem = {
        id: Date.now(),
        description: reportProblem.description,
        severity: reportProblem.severity,
        reportedBy: userName,
        reportedAt: new Date().toISOString(),
        status: 'pending',
        assignedTo: null,
        comments: []
      };

      const updatedTask = {
        ...task,
        problems: [
          ...(task.problems || []),
          newProblem
        ],
        lastUpdatedBy: userName,
        lastUpdatedAt: new Date().toISOString()
      };

      const updatedTasks = selectedProject.meta.tareas.map(t => 
        t.id === reportProblem.taskId ? updatedTask : t
      );

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

      setSelectedProject(prev => ({
        ...prev,
        meta: {
          ...prev.meta,
          tareas: updatedTasks
        }
      }));

      setSuccessMessage('Problema reportado correctamente');
      setTimeout(() => setSuccessMessage(''), 3000);

      setReportProblem({
        taskId: '',
        description: '',
        severity: 'medium'
      });
    } catch (error) {
      console.error('Error al reportar problema:', error);
      setError('Error al reportar el problema');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  // Obtener todas las tareas de todos los proyectos
  const allTasks = projects.flatMap(project => {
    const projectTasks = (project.meta?.tareas || []).map(task => ({
      ...task,
      projectTitle: project.title.rendered,
      projectId: project.id,
      title: task.title || task.nombre,
      description: task.description || task.descripcion,
      status: task.status || task.estado
    }));
    return projectTasks;
  });

  // Filtrar tareas por proyecto seleccionado
  const filteredTasks = selectedProjectFilter === 'all' 
    ? allTasks 
    : allTasks.filter(task => task.projectId === parseInt(selectedProjectFilter));

  // Filtrar tareas por estado
  const pendingTasks = filteredTasks.filter(task => task.status === 'pendiente');
  const inProgressTasks = filteredTasks.filter(task => task.status === 'en_progreso');
  const completedTasks = filteredTasks.filter(task => task.status === 'completada');

  return (
    <div className="user-dashboard">
      <div className="dashboard-header">
        <h1>Panel de Usuario</h1>
        <div className="user-info">
          <p>Bienvenido, {userName}</p>
          <p>Email: {userEmail}</p>
        </div>
      </div>

      {successMessage && (
        <div className="success-message">
          {successMessage}
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      <div className="dashboard-tabs">
        <button 
          className={`tab-button ${activeTab === 'tareas' ? 'active' : ''}`}
          onClick={() => setActiveTab('tareas')}
        >
          Mis Tareas
        </button>
        <button 
          className={`tab-button ${activeTab === 'proyectos' ? 'active' : ''}`}
          onClick={() => setActiveTab('proyectos')}
        >
          Mis Proyectos
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'tareas' ? (
          <div className="tasks-container">
            <div className="project-filter">
              <label htmlFor="project-select">Filtrar por proyecto:</label>
              <select
                id="project-select"
                value={selectedProjectFilter}
                onChange={(e) => setSelectedProjectFilter(e.target.value)}
                className="project-select"
              >
                <option value="all">Todos los proyectos</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.title.rendered}
                  </option>
                ))}
              </select>
            </div>

            <div className="tasks-board">
              <div className="tasks-column">
                <h2>Pendientes ({pendingTasks.length})</h2>
                <div className="tasks-list">
                  {pendingTasks.length === 0 ? (
                    <p className="no-tasks">No hay tareas pendientes</p>
                  ) : (
                    pendingTasks.map(task => (
                      <div key={task.nombre} className="task-card pending">
                        <h3>{task.title}</h3>
                        <p>{task.description}</p>
                        <p className="project-name">Proyecto: {task.projectTitle}</p>
                        <div className="task-actions">
                          <select
                            value={task.status}
                            onChange={(e) => handleUpdateTaskStatus(task.nombre, e.target.value, task.projectId)}
                          >
                            <option value="pendiente">Pendiente</option>
                            <option value="en_progreso">En Progreso</option>
                            <option value="completada">Completada</option>
                          </select>
                          <button
                            className="btn-report"
                            onClick={() => {
                              setSelectedProject(projects.find(p => p.id === task.projectId));
                              setReportProblem(prev => ({ ...prev, taskId: task.nombre }));
                            }}
                          >
                            Reportar Problema
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="tasks-column">
                <h2>En Progreso ({inProgressTasks.length})</h2>
                <div className="tasks-list">
                  {inProgressTasks.length === 0 ? (
                    <p className="no-tasks">No hay tareas en progreso</p>
                  ) : (
                    inProgressTasks.map(task => (
                      <div key={task.nombre} className="task-card in-progress">
                        <h3>{task.title}</h3>
                        <p>{task.description}</p>
                        <p className="project-name">Proyecto: {task.projectTitle}</p>
                        <div className="task-actions">
                          <select
                            value={task.status}
                            onChange={(e) => handleUpdateTaskStatus(task.nombre, e.target.value, task.projectId)}
                          >
                            <option value="pendiente">Pendiente</option>
                            <option value="en_progreso">En Progreso</option>
                            <option value="completada">Completada</option>
                          </select>
                          <button
                            className="btn-report"
                            onClick={() => {
                              setSelectedProject(projects.find(p => p.id === task.projectId));
                              setReportProblem(prev => ({ ...prev, taskId: task.nombre }));
                            }}
                          >
                            Reportar Problema
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="tasks-column">
                <h2>Completadas ({completedTasks.length})</h2>
                <div className="tasks-list">
                  {completedTasks.length === 0 ? (
                    <p className="no-tasks">No hay tareas completadas</p>
                  ) : (
                    completedTasks.map(task => (
                      <div key={task.nombre} className="task-card completed">
                        <h3>{task.title}</h3>
                        <p>{task.description}</p>
                        <p className="project-name">Proyecto: {task.projectTitle}</p>
                        <div className="task-actions">
                          <select
                            value={task.status}
                            onChange={(e) => handleUpdateTaskStatus(task.nombre, e.target.value, task.projectId)}
                          >
                            <option value="pendiente">Pendiente</option>
                            <option value="en_progreso">En Progreso</option>
                            <option value="completada">Completada</option>
                          </select>
                          <button
                            className="btn-report"
                            onClick={() => {
                              setSelectedProject(projects.find(p => p.id === task.projectId));
                              setReportProblem(prev => ({ ...prev, taskId: task.nombre }));
                            }}
                          >
                            Reportar Problema
                          </button>
                        </div>
                        {task.lastUpdatedBy && (
                          <div className="task-history">
                            <p>Última actualización por: {task.lastUpdatedBy}</p>
                            <p>Fecha: {new Date(task.lastUpdatedAt).toLocaleDateString()}</p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="projects-overview">
            <h2>Mis Proyectos</h2>
            {projects.length === 0 ? (
              <p>No tienes proyectos asignados</p>
            ) : (
              <div className="projects-grid">
                {projects.map(project => (
                  <div key={project.id} className="project-card">
                    <h3>{project.title.rendered}</h3>
                    <p>{project.content.rendered}</p>
                    <div className="project-stats">
                      <div className="stat">
                        <span className="stat-label">Tareas Totales:</span>
                        <span className="stat-value">{project.meta?.tareas?.length || 0}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Pendientes:</span>
                        <span className="stat-value">
                          {project.meta?.tareas?.filter(t => t.status === 'pendiente').length || 0}
                        </span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">En Progreso:</span>
                        <span className="stat-value">
                          {project.meta?.tareas?.filter(t => t.status === 'en_progreso').length || 0}
                        </span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Completadas:</span>
                        <span className="stat-value">
                          {project.meta?.tareas?.filter(t => t.status === 'completada').length || 0}
                        </span>
                      </div>
                    </div>
                    <button
                      className="btn-view-tasks"
                      onClick={() => {
                        setSelectedProject(project);
                        setActiveTab('tareas');
                      }}
                    >
                      Ver Tareas
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {reportProblem.taskId && (
        <div className="modal">
          <div className="modal-content">
            <h3>Reportar Problema</h3>
            <form onSubmit={handleReportProblem}>
              <div className="form-group">
                <label>Descripción del Problema:</label>
                <textarea
                  value={reportProblem.description}
                  onChange={(e) => setReportProblem(prev => ({
                    ...prev,
                    description: e.target.value
                  }))}
                  required
                  placeholder="Describe el problema que has encontrado..."
                />
              </div>
              <div className="form-group">
                <label>Severidad:</label>
                <select
                  value={reportProblem.severity}
                  onChange={(e) => setReportProblem(prev => ({
                    ...prev,
                    severity: e.target.value
                  }))}
                >
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn-submit">Enviar Reporte</button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setReportProblem({
                    taskId: '',
                    description: '',
                    severity: 'medium'
                  })}
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

export default UserDashboard; 