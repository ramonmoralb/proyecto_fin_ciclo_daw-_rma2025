import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LOCAL_URL_API } from '../constants/constans';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styles/UserDashboard.css';

const UserDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showSubtaskForm, setShowSubtaskForm] = useState(false);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [newSubtask, setNewSubtask] = useState({
    title: '',
    description: ''
  });
  const [newIssue, setNewIssue] = useState({
    description: '',
    severity: 'media'
  });

  const { userRole, isAuthenticated, userEmail } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (userRole !== 'project_user') {
      setError('No tienes permisos para acceder a esta página');
      return;
    }

    fetchTasks();
  }, [userRole, isAuthenticated, navigate]);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await axios.get(
        `${LOCAL_URL_API}wp-json/pm/v1/tasks?assigned_to=${userEmail}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      setTasks(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar tareas:', error);
      setError('Error al cargar las tareas');
      setLoading(false);
    }
  };

  const handleAddSubtask = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await axios.post(
        `${LOCAL_URL_API}wp-json/pm/v1/subtasks`,
        {
          ...newSubtask,
          taskId: selectedTask.id
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data) {
        setShowSubtaskForm(false);
        setNewSubtask({
          title: '',
          description: ''
        });
        fetchTasks();
      }
    } catch (error) {
      console.error('Error al crear subtarea:', error);
      setError('Error al crear la subtarea');
    }
  };

  const handleReportIssue = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await axios.post(
        `${LOCAL_URL_API}wp-json/pm/v1/issues`,
        {
          ...newIssue,
          taskId: selectedTask.id
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data) {
        setShowIssueForm(false);
        setNewIssue({
          description: '',
          severity: 'media'
        });
        fetchTasks();
      }
    } catch (error) {
      console.error('Error al reportar problema:', error);
      setError('Error al reportar el problema');
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      const token = localStorage.getItem('jwtToken');
      await axios.put(
        `${LOCAL_URL_API}wp-json/pm/v1/tasks/${taskId}`,
        { status: newStatus },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      fetchTasks();
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      setError('Error al actualizar el estado de la tarea');
    }
  };

  if (loading) return <div className="loading">Cargando...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="user-dashboard">
      <h1>Mis Tareas</h1>

      <div className="tasks-container">
        <div className="tasks-column">
          <h2>Pendientes</h2>
          {tasks
            .filter(task => task.status === 'pendiente')
            .map(task => (
              <div key={task.id} className="task-card">
                <h3>{task.title}</h3>
                <p>{task.description}</p>
                <div className="task-meta">
                  <span className={`priority ${task.priority}`}>
                    {task.priority}
                  </span>
                </div>
                <div className="task-actions">
                  <button
                    onClick={() => {
                      setSelectedTask(task);
                      setShowSubtaskForm(true);
                    }}
                    className="btn-add-subtask"
                  >
                    Añadir Subtarea
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTask(task);
                      setShowIssueForm(true);
                    }}
                    className="btn-report-issue"
                  >
                    Reportar Problema
                  </button>
                  <button
                    onClick={() => handleUpdateTaskStatus(task.id, 'en_progreso')}
                    className="btn-move"
                  >
                    Mover a En Progreso
                  </button>
                </div>
              </div>
            ))}
        </div>

        <div className="tasks-column">
          <h2>En Progreso</h2>
          {tasks
            .filter(task => task.status === 'en_progreso')
            .map(task => (
              <div key={task.id} className="task-card">
                <h3>{task.title}</h3>
                <p>{task.description}</p>
                <div className="task-meta">
                  <span className={`priority ${task.priority}`}>
                    {task.priority}
                  </span>
                </div>
                {task.subtasks && task.subtasks.length > 0 && (
                  <div className="subtasks-list">
                    <h4>Subtareas:</h4>
                    <ul>
                      {task.subtasks.map(subtask => (
                        <li key={subtask.id}>
                          <input
                            type="checkbox"
                            checked={subtask.completed}
                            onChange={() => handleUpdateSubtaskStatus(subtask.id, !subtask.completed)}
                          />
                          <span>{subtask.title}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="task-actions">
                  <button
                    onClick={() => {
                      setSelectedTask(task);
                      setShowSubtaskForm(true);
                    }}
                    className="btn-add-subtask"
                  >
                    Añadir Subtarea
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTask(task);
                      setShowIssueForm(true);
                    }}
                    className="btn-report-issue"
                  >
                    Reportar Problema
                  </button>
                  <button
                    onClick={() => handleUpdateTaskStatus(task.id, 'completada')}
                    className="btn-move"
                  >
                    Mover a Completada
                  </button>
                </div>
              </div>
            ))}
        </div>

        <div className="tasks-column">
          <h2>Completadas</h2>
          {tasks
            .filter(task => task.status === 'completada')
            .map(task => (
              <div key={task.id} className="task-card completed">
                <h3>{task.title}</h3>
                <p>{task.description}</p>
                <div className="task-meta">
                  <span className={`priority ${task.priority}`}>
                    {task.priority}
                  </span>
                </div>
                {task.subtasks && task.subtasks.length > 0 && (
                  <div className="subtasks-list">
                    <h4>Subtareas:</h4>
                    <ul>
                      {task.subtasks.map(subtask => (
                        <li key={subtask.id} className={subtask.completed ? 'completed' : ''}>
                          <input
                            type="checkbox"
                            checked={subtask.completed}
                            disabled
                          />
                          <span>{subtask.title}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>

      {showSubtaskForm && selectedTask && (
        <div className="modal">
          <div className="modal-content">
            <h2>Añadir Subtarea</h2>
            <form onSubmit={handleAddSubtask}>
              <div className="form-group">
                <label>Título:</label>
                <input
                  type="text"
                  value={newSubtask.title}
                  onChange={(e) => setNewSubtask({...newSubtask, title: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Descripción:</label>
                <textarea
                  value={newSubtask.description}
                  onChange={(e) => setNewSubtask({...newSubtask, description: e.target.value})}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn-submit">Añadir</button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowSubtaskForm(false)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showIssueForm && selectedTask && (
        <div className="modal">
          <div className="modal-content">
            <h2>Reportar Problema</h2>
            <form onSubmit={handleReportIssue}>
              <div className="form-group">
                <label>Descripción del Problema:</label>
                <textarea
                  value={newIssue.description}
                  onChange={(e) => setNewIssue({...newIssue, description: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Severidad:</label>
                <select
                  value={newIssue.severity}
                  onChange={(e) => setNewIssue({...newIssue, severity: e.target.value})}
                >
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn-submit">Reportar</button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowIssueForm(false)}
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