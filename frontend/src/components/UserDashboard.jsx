import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LOCAL_URL_API } from '../constants/constans';
import { useAuth } from '../context/AuthContext';
import '../styles/UserDashboard.css';
import '../styles/SalesStyles.css';

const UserDashboard = () => {
  const { userRole, userName, userEmail } = useAuth();
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('tareas');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState('all');
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (userRole === 'project_user' || userRole === 'project_admin' || userRole === 'super_administrador') {
      fetchProjects();
      if (activeTab === 'ventas') {
        fetchClients();
        fetchProducts();
      }
    }
  }, [userRole, activeTab]);

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

      // Filtrar proyectos según el rol del usuario
      let userProjects;
      if (userRole === 'project_user') {
        // Obtener el ID del usuario actual
        const userResponse = await axios.get(
          `${LOCAL_URL_API}wp-json/wp/v2/users/me`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        const currentUserId = userResponse.data.id;
        
        // Filtrar proyectos donde el usuario es participante
        userProjects = response.data.filter(project => {
          const participantes = project.meta?.participantes || [];
          return participantes.some(participantId => 
            parseInt(participantId) === parseInt(currentUserId)
          );
        });
      } else {
        userProjects = response.data;
      }

      setProjects(userProjects);
    } catch (error) {
      console.error('Error al cargar proyectos:', error);
      setError('Error al cargar los proyectos');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus, projectId) => {
    try {
      setLoading(true);
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
      setError('Error al actualizar la tarea');
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await axios.get(
        `${LOCAL_URL_API}wp-json/pm/v1/clientes`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('Clientes recibidos:', response.data);
      setClients(response.data);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      setError('Error al cargar los clientes');
    }
  };

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await axios.get(
        `${LOCAL_URL_API}wp-json/pm/v1/productos`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('Productos recibidos:', response.data);
      setProducts(response.data);
    } catch (error) {
      console.error('Error al cargar productos:', error);
      setError('Error al cargar los productos');
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
      projectId: project.id
    }));
    return projectTasks;
  });

  // Filtrar tareas por proyecto seleccionado
  const filteredTasks = selectedProjectFilter === 'all' 
    ? allTasks 
    : allTasks.filter(task => task.projectId === parseInt(selectedProjectFilter));

  // Filtrar tareas por estado
  const pendingTasks = filteredTasks.filter(task => task.estado === 'pendiente');
  const inProgressTasks = filteredTasks.filter(task => task.estado === 'en_progreso');
  const completedTasks = filteredTasks.filter(task => task.estado === 'completada');

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
        <button 
          className={`tab-button ${activeTab === 'ventas' ? 'active' : ''}`}
          onClick={() => setActiveTab('ventas')}
        >
          Ventas
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
                        <h3>{task.nombre}</h3>
                        <p>{task.descripcion}</p>
                        <p className="project-name">Proyecto: {task.projectTitle}</p>
                        <div className="task-actions">
                          <select
                            value={task.estado}
                            onChange={(e) => handleUpdateTaskStatus(task.nombre, e.target.value, task.projectId)}
                            className="status-select"
                          >
                            <option value="pendiente">Pendiente</option>
                            <option value="en_progreso">En Progreso</option>
                            <option value="completada">Completada</option>
                          </select>
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
                        <h3>{task.nombre}</h3>
                        <p>{task.descripcion}</p>
                        <p className="project-name">Proyecto: {task.projectTitle}</p>
                        <div className="task-actions">
                          <select
                            value={task.estado}
                            onChange={(e) => handleUpdateTaskStatus(task.nombre, e.target.value, task.projectId)}
                            className="status-select"
                          >
                            <option value="pendiente">Pendiente</option>
                            <option value="en_progreso">En Progreso</option>
                            <option value="completada">Completada</option>
                          </select>
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
                        <h3>{task.nombre}</h3>
                        <p>{task.descripcion}</p>
                        <p className="project-name">Proyecto: {task.projectTitle}</p>
                        <div className="task-actions">
                          <select
                            value={task.estado}
                            onChange={(e) => handleUpdateTaskStatus(task.nombre, e.target.value, task.projectId)}
                            className="status-select"
                          >
                            <option value="pendiente">Pendiente</option>
                            <option value="en_progreso">En Progreso</option>
                            <option value="completada">Completada</option>
                          </select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'proyectos' ? (
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
                          {project.meta?.tareas?.filter(t => t.estado === 'pendiente').length || 0}
                        </span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">En Progreso:</span>
                        <span className="stat-value">
                          {project.meta?.tareas?.filter(t => t.estado === 'en_progreso').length || 0}
                        </span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Completadas:</span>
                        <span className="stat-value">
                          {project.meta?.tareas?.filter(t => t.estado === 'completada').length || 0}
                        </span>
                      </div>
                    </div>
                    <button
                      className="btn-view-tasks"
                      onClick={() => {
                        setSelectedProjectFilter(project.id.toString());
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
        ) : (
          <div className="sales-overview">
            <div className="sales-header">
              <h2>Gestión de Ventas</h2>
            </div>

            <div className="sales-content">
              <div className="clients-section">
                <h3>Clientes</h3>
                <div className="clients-grid">
                  {clients.map(client => (
                    <div key={client.id} className="client-card">
                      <h4>{client.title.rendered || client.title}</h4>
                      <div className="client-details">
                        <p><strong>Email:</strong> {client.meta?.email || ''}</p>
                        <p><strong>Teléfono:</strong> {client.meta?.telefono || ''}</p>
                        <p><strong>Dirección:</strong> {client.meta?.direccion || ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="products-section">
                <h3>Productos</h3>
                <div className="products-grid">
                  {products.map(product => (
                    <div key={product.id} className="product-card">
                      <h4>{product.title.rendered || product.title}</h4>
                      <div className="product-details">
                        <p><strong>Precio:</strong> ${product.meta?.precio || 0}</p>
                        <p><strong>Stock:</strong> {product.meta?.stock || 0}</p>
                        <p>{product.content?.rendered || product.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard; 