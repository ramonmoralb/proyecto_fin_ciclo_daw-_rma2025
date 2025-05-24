import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LOCAL_URL_API } from '../constants/constans';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ClientCard from './ClientCard';
import ProductCard from './ProductCard';
import OrderCard from './OrderCard';
import CreateOrder from './CreateOrder';
import '../styles/AdminDashboard.css';
import '../styles/SalesStyles.css';

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
  const { userRole, isAuthenticated, user, logout } = useAuth();
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
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [newClient, setNewClient] = useState({
    title: '',
    description: '',
    email: '',
    telefono: '',
    direccion: ''
  });
  const [newProduct, setNewProduct] = useState({
    title: '',
    description: '',
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

    if (userRole !== 'super_administrador') {
      setError('No tienes permisos para acceder a esta página');
      return;
    }

    fetchUsers();
    fetchProjects();
    fetchClients();
    fetchProducts();
    fetchOrders();
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
      setUsers(filteredUsers);
      setLoading(false);
    } catch (error) {
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

  const handleCreateClient = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('jwtToken');
      const clientData = {
        title: newClient.title,
        content: newClient.description,
        meta: {
          email: newClient.email,
          telefono: newClient.telefono,
          direccion: newClient.direccion
        }
      };
      
      const response = await axios.post(
        `${LOCAL_URL_API}wp-json/pm/v1/clientes`,
        clientData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
        
      if (response.data) {
        setShowCreateClient(false);
        setNewClient({
          title: '',
          description: '',
          email: '',
          telefono: '',
          direccion: ''
        });
        await fetchClients();
        setSuccessMessage('Cliente creado exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      setError('Error al crear el cliente');
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('jwtToken');
      
      const productData = {
        title: newProduct.title,
        content: newProduct.description,
        meta: {
          precio: parseFloat(newProduct.precio) || 0,
          stock: parseInt(newProduct.stock) || 0
        },
        status: 'publish'
      };
      
      console.log('Enviando datos del producto:', productData);
      
      const response = await axios.post(
        `${LOCAL_URL_API}wp-json/pm/v1/productos`,
        productData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Respuesta del servidor:', response.data);

      if (response.data) {
        setShowCreateProduct(false);
        setNewProduct({
          title: '',
          description: '',
          precio: '',
          stock: ''
        });
        await fetchProducts();
        setSuccessMessage('Producto creado exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error completo al crear producto:', error);
      if (error.response) {
        console.error('Datos del error:', error.response.data);
      }
      setError('Error al crear el producto');
    }
  };

  const handleDeleteClient = async (clientId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este cliente?')) {
      return;
    }

    try {
      const token = localStorage.getItem('jwtToken');
      const response = await axios.delete(
        `${LOCAL_URL_API}wp-json/pm/v1/clientes/${clientId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        fetchClients();
        setSuccessMessage('Cliente eliminado exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error al eliminar cliente:', error);
      setError('Error al eliminar el cliente');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      return;
    }

    try {
      const token = localStorage.getItem('jwtToken');
      const response = await axios.delete(
        `${LOCAL_URL_API}wp-json/pm/v1/productos/${productId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        fetchProducts();
        setSuccessMessage('Producto eliminado exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      setError('Error al eliminar el producto');
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

  const handleDeleteOrder = async (orderId) => {
    try {
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        setError('No hay token de autenticación');
        return;
      }

      const response = await axios.delete(
        `${LOCAL_URL_API}wp-json/pm/v1/pedidos/${orderId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setOrders(orders.filter(order => order.id !== orderId));
        setSuccessMessage('Pedido eliminado correctamente');
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      setError(error.response?.data?.message || 'Error al eliminar el pedido');
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

  const renderSalesTab = () => (
    <div className="sales-overview">
      <div className="sales-header">
        <h2>Gestión de Ventas</h2>
        <div className="sales-actions">
          <button 
            className="btn-create"
            onClick={() => setShowCreateClient(true)}
          >
            <i className="fas fa-plus"></i> Nuevo Cliente
          </button>
          <button 
            className="btn-create"
            onClick={() => setShowCreateProduct(true)}
          >
            <i className="fas fa-plus"></i> Nuevo Producto
          </button>
        </div>
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
          <div key={order.id} className="bg-white p-4 rounded-lg shadow mb-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">{order.title}</h3>
                <p className="text-gray-600">Cliente: {order.meta.cliente.nombre}</p>
                <p className="text-gray-600">Total: ${order.meta.total}</p>
                <p className="text-gray-600">Estado: {order.meta.estado}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleOrderStatusChange(order.id, order.meta.estado === 'pendiente' ? 'servido' : 'pendiente')}
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                >
                  {order.meta.estado === 'pendiente' ? 'Marcar como Servido' : 'Marcar como Pendiente'}
                </button>
                <button
                  onClick={() => handleDeleteOrder(order.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
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
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Panel de Administración</h1>
        <div className="user-info">
          <span>Bienvenido, {user?.user_nicename}</span>
          <button onClick={logout} className="btn-logout">
            Cerrar Sesión
          </button>
        </div>
      </div>
      
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
        ) : activeTab === 'projects' ? (
          renderProjectsTab()
        ) : activeTab === 'sales' ? (
          renderSalesTab()
        ) : (
          renderOrdersTab()
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

      {showCreateClient && (
        <div className="modal">
          <div className="modal-content">
            <h2>Crear Nuevo Cliente</h2>
            <form onSubmit={handleCreateClient}>
              <div className="form-group">
                <label>Nombre:</label>
                <input
                  type="text"
                  value={newClient.title}
                  onChange={(e) => setNewClient({...newClient, title: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Descripción:</label>
                <textarea
                  value={newClient.description}
                  onChange={(e) => setNewClient({...newClient, description: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Teléfono:</label>
                <input
                  type="tel"
                  value={newClient.telefono}
                  onChange={(e) => setNewClient({...newClient, telefono: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Dirección:</label>
                <input
                  type="text"
                  value={newClient.direccion}
                  onChange={(e) => setNewClient({...newClient, direccion: e.target.value})}
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-submit">Crear Cliente</button>
                <button type="button" className="btn-cancel" onClick={() => setShowCreateClient(false)}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCreateProduct && (
        <div className="modal">
          <div className="modal-content">
            <h2>Crear Nuevo Producto</h2>
            <form onSubmit={handleCreateProduct}>
              <div className="form-group">
                <label>Nombre:</label>
                <input
                  type="text"
                  value={newProduct.title}
                  onChange={(e) => setNewProduct({...newProduct, title: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Descripción:</label>
                <textarea
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Precio:</label>
                <input
                  type="number"
                  step="0.01"
                  value={newProduct.precio}
                  onChange={(e) => setNewProduct({...newProduct, precio: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Stock:</label>
                <input
                  type="number"
                  value={newProduct.stock}
                  onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
                  required
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-submit">Crear Producto</button>
                <button type="button" className="btn-cancel" onClick={() => setShowCreateProduct(false)}>
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