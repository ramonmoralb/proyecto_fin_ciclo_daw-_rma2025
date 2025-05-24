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

  useEffect(() => {
    if (userRole === 'project_user') {
      fetchProjects();
    }
  }, [userRole]);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      console.log('Fetching projects for user:', { userId, userEmail });

      const response = await axios.get(
        `${LOCAL_URL_API}wp-json/wp/v2/proyectos/`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('All projects:', response.data);

      // Filtrar proyectos donde el usuario es participante
      const userProjects = response.data.filter(project => {
        const participantes = project.meta?.participantes || [];
        console.log('Project participants:', participantes);
        
        // Verificar si el usuario es participante por ID o email
        const isParticipant = participantes.some(participant => 
          (participant.id && parseInt(participant.id) === parseInt(userId)) ||
          (participant.email && participant.email === userEmail)
        );
        
        console.log('Is user participant:', isParticipant);
        return isParticipant;
      });

      console.log('Filtered user projects:', userProjects);
      setProjects(userProjects);
    } catch (error) {
      console.error('Error al cargar proyectos:', error);
      setError('Error al cargar los proyectos');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      const token = localStorage.getItem('jwtToken');
      const updatedTasks = selectedProject.meta.tareas.map(task => {
        if (task.id === taskId) {
          return { ...task, status: newStatus };
        }
        return task;
      });

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
      console.error('Error al actualizar tarea:', error);
      setError('Error al actualizar la tarea');
    }
  };

  const handleReportProblem = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('jwtToken');
      const task = selectedProject.meta.tareas.find(t => t.id === reportProblem.taskId);
      
      if (!task) {
        setError('Tarea no encontrada');
        return;
      }

      const updatedTask = {
        ...task,
        problems: [
          ...(task.problems || []),
          {
            id: Date.now(),
            description: reportProblem.description,
            severity: reportProblem.severity,
            reportedBy: userName,
            reportedAt: new Date().toISOString(),
            status: 'pending'
          }
        ]
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

      // Actualizar el estado local
      setSelectedProject(prev => ({
        ...prev,
        meta: {
          ...prev.meta,
          tareas: updatedTasks
        }
      }));

      // Limpiar el formulario
      setReportProblem({
        taskId: '',
        description: '',
        severity: 'medium'
      });
    } catch (error) {
      console.error('Error al reportar problema:', error);
      setError('Error al reportar el problema');
    }
  };

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  return (
    <div className="user-dashboard">
      <div className="dashboard-header">
        <h1>Panel de Usuario</h1>
        <div className="user-info">
          <p>Bienvenido, {userName}</p>
          <p>Email: {userEmail}</p>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="projects-list">
          <h2>Mis Proyectos</h2>
          {projects.map(project => (
            <div
              key={project.id}
              className={`project-card ${selectedProject?.id === project.id ? 'selected' : ''}`}
              onClick={() => setSelectedProject(project)}
            >
              <h3>{project.title.rendered}</h3>
              <p>{project.content.rendered}</p>
            </div>
          ))}
        </div>

        {selectedProject && (
          <div className="project-details">
            <h2>{selectedProject.title.rendered}</h2>
            <div className="tasks-container">
              <h3>Tareas Asignadas</h3>
              {selectedProject.meta?.tareas?.map(task => (
                <div key={task.id} className="task-card">
                  <h4>{task.title}</h4>
                  <p>{task.description}</p>
                  <div className="task-status">
                    <select
                      value={task.status}
                      onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value)}
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="en_progreso">En Progreso</option>
                      <option value="completada">Completada</option>
                    </select>
                  </div>
                  
                  {task.problems && task.problems.length > 0 && (
                    <div className="task-problems">
                      <h5>Problemas Reportados:</h5>
                      {task.problems.map(problem => (
                        <div key={problem.id} className="problem-card">
                          <p className={`severity ${problem.severity}`}>
                            Severidad: {problem.severity}
                          </p>
                          <p>{problem.description}</p>
                          <small>
                            Reportado por {problem.reportedBy} el {new Date(problem.reportedAt).toLocaleDateString()}
                          </small>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    className="btn-report"
                    onClick={() => setReportProblem(prev => ({ ...prev, taskId: task.id }))}
                  >
                    Reportar Problema
                  </button>
                </div>
              ))}
            </div>
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

      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default UserDashboard; 