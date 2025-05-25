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
    status: 'publish',
    assignedUsers: []
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
    precio: '',
    stock: ''
  });
  const [orders, setOrders] = useState([]);
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [projectParticipants, setProjectParticipants] = useState([]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (userRole !== 'super_administrador') {
      setError('No tienes permisos para acceder a esta página');
      return;
    }

    const initializeDashboard = async () => {
      try {
        setLoading(true);
        await Promise.all([
          fetchUsers(),
          fetchProjects(),
          fetchClients(),
          fetchProducts(),
          fetchOrders()
        ]);
      } catch (error) {
        console.error('Error inicializando el dashboard:', error);
        setError('Error al cargar los datos del dashboard');
      } finally {
        setLoading(false);
      }
    };

    initializeDashboard();
  }, [userRole, isAuthenticated, navigate]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      const response = await axios.get(
        `${LOCAL_URL_API}wp-json/wp/v2/users`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Filtrar solo usuarios project_user y project_admin
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
      throw error;
    }
  };

  const getUserName = (userId) => {
    const user = users.find(u => u.id.toString() === userId.toString());
    return user ? user.name : 'No asignado';
  };

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        throw new Error('No hay token de autenticación');
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
      setProjects(response.data);
    } catch (error) {
      console.error('Error al cargar proyectos:', error);
      throw error;
    }
  };

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

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
      throw error;
    }
  };

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      const response = await axios.get(
        `${LOCAL_URL_API}wp-json/pm/v1/productos`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Asegurarnos de que cada producto tenga su descripción y stock actualizado
      const productsWithContent = response.data.map(product => ({
        ...product,
        content: {
          rendered: product.content?.rendered || product.description || 'Sin descripción'
        },
        meta: {
          ...product.meta,
          stock: parseInt(product.meta?.stock) || 0
        }
      }));
      
      setProducts(productsWithContent);
    } catch (error) {
      console.error('Error al cargar productos:', error);
      throw error;
    }
  };

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

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
      // No lanzamos el error para que no bloquee la carga del dashboard
      setOrders([]);
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
      
      // Actualizar el proyecto seleccionado
      setSelectedProject({
        ...response.data,
        meta: {
          ...response.data.meta,
          tareas: updatedTasks
        }
      });

      // Actualizar la lista de proyectos
      setProjects(prevProjects => 
        prevProjects.map(p => 
          p.id === selectedProject.id 
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
        // Actualizar el proyecto seleccionado
        setSelectedProject(prevProject => ({
          ...prevProject,
          meta: {
            ...prevProject.meta,
            tareas: response.data.tareas
          }
        }));

        // Actualizar la lista de proyectos
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
        // Actualizar el estado local de los proyectos
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

        // Actualizar el proyecto seleccionado si es el que estamos viendo
        if (selectedProject && selectedProject.id === projectId) {
          setSelectedProject(prevProject => ({
            ...prevProject,
            meta: {
              ...prevProject.meta,
              tareas: updatedTasks
            }
          }));
        }

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
            participantes: newProject.assignedUsers ? newProject.assignedUsers.map(id => id.toString()) : []
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
          status: 'publish',
          assignedUsers: []
        });
        setProjects(prevProjects => [...prevProjects, response.data]);
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

      if (response.data) {
        // Asegurarnos de que el producto creado tenga la descripción y stock correctos
        const createdProduct = {
          ...response.data,
          content: {
            rendered: newProduct.description || 'Sin descripción'
          },
          meta: {
            ...response.data.meta,
            stock: parseInt(newProduct.stock) || 0
          }
        };
        
        setShowCreateProduct(false);
        setNewProduct({
          title: '',
          precio: '',
          stock: ''
        });
        
        // Actualizar la lista de productos incluyendo el nuevo producto
        setProducts(prevProducts => [...prevProducts, createdProduct]);
        
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

  // Agregar una función para actualizar el stock de un producto
  const updateProductStock = async (productId, newStock) => {
    try {
      const token = localStorage.getItem('jwtToken');
      const product = products.find(p => p.id === productId);
      
      if (!product) return;

      const response = await axios.post(
        `${LOCAL_URL_API}wp-json/wp/v2/productos/${productId}`,
        {
          meta: {
            ...product.meta,
            stock: newStock
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Actualizar el producto en el estado local
      setProducts(prevProducts => 
        prevProducts.map(p => 
          p.id === productId 
            ? {
                ...p,
                meta: {
                  ...p.meta,
                  stock: newStock
                }
              }
            : p
        )
      );

      return response.data;
    } catch (error) {
      console.error('Error al actualizar stock:', error);
      throw error;
    }
  };

  // Modificar handleOrderStatusChange para actualizar el stock
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
        // Actualizar el estado del pedido
        setOrders(orders.map(o => 
          o.id === orderId 
            ? { ...o, meta: { ...o.meta, estado: newStatus } }
            : o
        ));

        // Si el pedido se marca como servido, actualizar el stock
        if (newStatus === 'servido') {
          const order = orders.find(o => o.id === orderId);
          if (order && order.meta.productos) {
            for (const item of order.meta.productos) {
              await updateProductStock(item.producto_id, item.cantidad);
            }
          }
        }

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
    if (!window.confirm('¿Estás seguro de que deseas eliminar este pedido? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const token = localStorage.getItem('jwtToken');
      const response = await axios.delete(
        `${LOCAL_URL_API}wp-json/pm/v1/pedidos/${orderId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data) {
        setOrders(orders.filter(order => order.id !== orderId));
        setSuccessMessage('Pedido eliminado exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error al eliminar pedido:', error);
      setError('Error al eliminar el pedido');
    }
  };

  const handleProjectClick = async (project) => {
    try {
      setSelectedProject(project);
      // Asegurarse de que los participantes se carguen correctamente
      if (project.meta?.participantes) {
        await fetchProjectParticipants(project.meta.participantes);
        // Actualizar la lista de usuarios disponibles para asignar tareas
        await fetchUsers();
      }
    } catch (error) {
      console.error('Error al cargar detalles del proyecto:', error);
      setError('Error al cargar los detalles del proyecto');
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
      setError('No se pudieron cargar los detalles de los participantes. Por favor, intenta de nuevo.');
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
                            onChange={(e) => handleUpdateTaskStatus(task.nombre, e.target.value, selectedProject.id)}
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
                              <i className="fas fa-trash">Eliminar</i>
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

  const renderProjectsTab = () => (
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
                        <i className="fas fa-trash">Eliminar</i>
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
                  value={newProject.content}
                  onChange={(e) => setNewProject({...newProject, content: e.target.value})}
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
                      {user.name} ({user.roles.join(', ')})
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
                  <option value="">Seleccionar participante</option>
                  {projectParticipants.map(participant => (
                    <option key={participant.id} value={participant.id}>
                      {participant.name}
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
  );

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.')) {
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

      if (response.data) {
        setProducts(products.filter(product => product.id !== productId));
        setSuccessMessage('Producto eliminado exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      setError('Error al eliminar el producto');
    }
  };

  const handleDeleteClient = async (clientId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este cliente? Esta acción no se puede deshacer.')) {
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

      if (response.data) {
        setClients(clients.filter(client => client.id !== clientId));
        setSuccessMessage('Cliente eliminado exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error al eliminar cliente:', error);
      setError('Error al eliminar el cliente');
    }
  };

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
              <ClientCard 
                key={client.id} 
                client={client} 
                userRole={userRole}
                onDelete={handleDeleteClient}
              />
            ))}
          </div>
        </div>

        <div className="products-section">
          <h3>Productos</h3>
          <div className="products-grid">
            {products.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                userRole={userRole}
                onDelete={handleDeleteProduct}
              />
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
            onDelete={handleDeleteOrder}
            userRole={userRole}
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
    <div className="admin-dashboard">
      {successMessage && (
        <div className="message success-message">
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
    

        {activeTab === 'users' && (
          <div className="users-section">
            <div className="dashboard-header">
              <h2>Gestión de Usuarios</h2>
              <button className="btn btn-primary" onClick={() => setShowCreateForm(!showCreateForm)}>
                <i className="fas fa-plus"></i> Nuevo Usuario
              </button>
            </div>

            <div className="list">
              {users.map(user => (
                <div key={user.id} className="card">
                  <div className="card-header">
                    <h3>{user.name}</h3>
                    <div className="user-actions">
                      <button 
                        className="btn btn-danger"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <i className="fas fa-trash">Eliminar</i>
                      </button>
                    </div>
                  </div>
                  <div className="user-details">
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Rol:</strong> {user.roles.join(', ')}</p>
                  </div>
                </div>
              ))}
            </div>

            {showCreateForm && (
              <div className="modal">
                <div className="modal-content">
                  <h2>Crear Nuevo Usuario</h2>
                  <form onSubmit={handleCreateUser}>
                    <div className="form-group">
                      <label>Nombre:</label>
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
                        <option value="project_user">Usuario de Proyecto</option>
                        <option value="project_admin">Administrador de Proyecto</option>
                      </select>
                    </div>
                    <div className="form-actions">
                      <button type="submit" className="btn btn-success">Crear Usuario</button>
                      <button type="button" className="btn btn-danger" onClick={() => setShowCreateForm(false)}>
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'projects' && (
          renderProjectsTab()
        )}

        {activeTab === 'sales' && (
          renderSalesTab()
        )}

        {activeTab === 'pedidos' && (
          renderOrdersTab()
        )}
      </div>

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