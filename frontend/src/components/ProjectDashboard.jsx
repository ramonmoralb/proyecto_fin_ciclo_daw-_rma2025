import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LOCAL_URL_API } from '../constants/constans';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styles/ProjectDashboard.css';
import '../styles/SalesStyles.css';
import ClientCard from './ClientCard';
import ProductCard from './ProductCard';
import OrderCard from './OrderCard';
import CreateOrder from './CreateOrder';

const ProjectDashboard = () => {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
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
  const { userRole, isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('projects'); // 'projects' o 'sales' o 'pedidos'
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [newClient, setNewClient] = useState({
    nombre: '',
    email: '',
    telefono: '',
    direccion: ''
  });
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    stock: ''
  });
  const [orders, setOrders] = useState([]);
  const [showCreateOrder, setShowCreateOrder] = useState(false);

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
    if (activeTab === 'sales') {
      fetchClients();
      fetchProducts();
    } else if (activeTab === 'pedidos') {
      fetchOrders();
    }
  }, [userRole, isAuthenticated, navigate, activeTab]);

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
      
      // Filtrar usuarios que son project_user o project_admin
      const projectUsers = response.data.filter(user => 
        user.roles && (user.roles.includes('project_user') || user.roles.includes('project_admin'))
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

  const getUserName = (userId) => {
    const user = users.find(u => u.id.toString() === userId.toString());
    return user ? user.name : 'No asignado';
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
        setSelectedProject(prev => ({
          ...prev,
          meta: {
            ...prev.meta,
            tareas: updatedTasks
          }
        }));
        setSuccessMessage('Tarea eliminada exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
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
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTask(task.nombre, selectedProject.id);
                              }}
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
                            Asignado a: {getUserName(task.asignado)}
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
      setProducts(response.data);
    } catch (error) {
      console.error('Error al cargar productos:', error);
      setError('Error al cargar los productos');
    }
  };

  const handleCreateClient = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await axios.post(
        `${LOCAL_URL_API}wp-json/wp/v2/clientes`,
        {
          title: newClient.nombre,
          content: newClient.descripcion,
          status: 'publish',
          meta: {
            email: newClient.email,
            telefono: newClient.telefono,
            direccion: newClient.direccion
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
        setClients([...clients, response.data]);
        setShowCreateClient(false);
        setNewClient({
          nombre: '',
          email: '',
          telefono: '',
          direccion: ''
        });
        setSuccessMessage('Cliente creado exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error al crear cliente:', error);
      setError('Error al crear el cliente');
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await axios.post(
        `${LOCAL_URL_API}wp-json/wp/v2/productos`,
        {
          title: newProduct.nombre,
          content: newProduct.descripcion,
          status: 'publish',
          meta: {
            precio: newProduct.precio,
            stock: newProduct.stock
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
        setProducts([...products, response.data]);
        setShowCreateProduct(false);
        setNewProduct({
          nombre: '',
          descripcion: '',
          precio: '',
          stock: ''
        });
        setSuccessMessage('Producto creado exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error al crear producto:', error);
      setError('Error al crear el producto');
    }
  };

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await axios.get(
        `${LOCAL_URL_API}wp-json/pm/v1/pedidos`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Error al cargar los pedidos');
    }
  };

  const handleOrderStatusChange = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        setError('No hay token de autenticación');
        return;
      }

      const response = await axios.put(
        `${LOCAL_URL_API}wp-json/pm/v1/pedidos/${orderId}`,
        { estado: newStatus },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data) {
        setOrders(orders.map(o => 
          o.id === orderId 
            ? { ...o, meta: { ...o.meta, estado: newStatus } }
            : o
        ));
        setSuccessMessage('Estado del pedido actualizado correctamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      setError(error.response?.data?.message || 'Error al actualizar el estado del pedido');
    }
  };

  const handleOrderCreated = (newOrder) => {
    setOrders([...orders, newOrder]);
  };

  const renderSalesTab = () => (
    <div className="sales-overview">
      <div className="sales-header">
        <h2>Gestión de Ventas</h2>
      </div>

      <div className="sales-content">
        <div className="clients-section">
          <h3>Clientes</h3>
          <div className="clients-grid">
            {clients.map(client => (
              <ClientCard key={client.id} client={client} />
            ))}
          </div>
        </div>

        <div className="products-section">
          <h3>Productos</h3>
          <div className="products-grid">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderOrdersTab = () => (
    <div className="orders-overview">
      <div className="orders-header">
        <h2>Gestión de Pedidos</h2>
        <div className="orders-actions">
          <button 
            className="btn-create"
            onClick={() => setShowCreateOrder(true)}
          >
            <i className="fas fa-plus"></i> Nuevo Pedido
          </button>
        </div>
      </div>

      <div className="orders-content">
        {orders.map(order => (
          <OrderCard 
            key={order.id} 
            order={order}
            onStatusChange={handleOrderStatusChange}
          />
        ))}
      </div>

      {showCreateOrder && (
        <CreateOrder
          onClose={() => setShowCreateOrder(false)}
          onOrderCreated={handleOrderCreated}
        />
      )}
    </div>
  );

  if (loading) return <div className="loading">Cargando...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Panel de Proyectos</h1>
        <div className="user-info">
          <span>Bienvenido, {user?.user_nicename}</span>
          <button onClick={logout} className="btn btn-danger">
            Cerrar Sesión
          </button>
        </div>
      </div>

      <div className="dashboard-tabs">
        <button 
          className={`tab-button ${activeTab === 'projects' ? 'active' : ''}`}
          onClick={() => setActiveTab('projects')}
        >
          Proyectos
        </button>
        <button 
          className={`tab-button ${activeTab === 'sales' ? 'active' : ''}`}
          onClick={() => setActiveTab('sales')}
        >
          Ventas
        </button>
        <button 
          className={`tab-button ${activeTab === 'pedidos' ? 'active' : ''}`}
          onClick={() => setActiveTab('pedidos')}
        >
          Pedidos
        </button>
      </div>

      <div className="dashboard-content">
        {error && <div className="message error-message">{error}</div>}
        {successMessage && <div className="message success-message">{successMessage}</div>}

        {activeTab === 'projects' ? (
          <div className="projects-overview">
            <div className="dashboard-header">
              <h1>Panel de Administración de Proyectos</h1>
              <div className="dashboard-actions">
                <button className="btn btn-primary" onClick={() => setShowCreateProject(true)}>
                  <i className="fas fa-plus"></i> Nuevo Proyecto
                </button>
              </div>
            </div>

            {selectedProject ? (
              renderProjectDetails()
            ) : (
              <div className="list">
                <h2>Proyectos</h2>
                {projects.length === 0 ? (
                  <p>No hay proyectos disponibles</p>
                ) : (
                  <div className="grid">
                    {projects.map(project => (
                      <div 
                        key={project.id} 
                        className="card"
                        onClick={() => handleProjectClick(project)}
                      >
                        <div className="card-header">
                          <h3>{project.title.rendered}</h3>
                          <div className="project-actions">
                            <button 
                              className="btn btn-danger" 
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
                        <button className="btn btn-primary">
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
                      <button type="submit" className="btn btn-success">Crear Proyecto</button>
                      <button type="button" className="btn btn-danger" onClick={() => setShowCreateProject(false)}>
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
                      <button type="submit" className="btn btn-success">Crear Tarea</button>
                      <button type="button" className="btn btn-danger" onClick={() => setShowCreateTask(false)}>
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'sales' ? (
          renderSalesTab()
        ) : (
          renderOrdersTab()
        )}
      </div>
    </div>
  );
};

export default ProjectDashboard; 