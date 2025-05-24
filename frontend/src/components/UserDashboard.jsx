import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LOCAL_URL_API } from '../constants/constans';
import { useAuth } from '../context/AuthContext';
import ClientCard from './ClientCard';
import ProductCard from './ProductCard';
import OrderCard from './OrderCard';
import CreateOrder from './CreateOrder';
import '../styles/UserDashboard.css';
import '../styles/SalesStyles.css';

const UserDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('proyectos');
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState('all');

  useEffect(() => {
    if (activeTab === 'proyectos') {
      fetchProjects();
    } else if (activeTab === 'ventas') {
      fetchClients();
      fetchProducts();
    } else if (activeTab === 'pedidos') {
      fetchOrders();
    }
  }, [activeTab]);

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
      if (user.user_role === 'project_user') {
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
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      const response = await axios.put(`${LOCAL_URL_API}/wp-json/pm/v1/pedidos/${orderId}`, {
        ...order,
        estado: newStatus
      });

      setOrders(orders.map(o => o.id === orderId ? response.data : o));
    } catch (error) {
      console.error('Error updating order status:', error);
      setError('Error al actualizar el estado del pedido');
    }
  };

  const handleOrderCreated = (newOrder) => {
    setOrders([...orders, newOrder]);
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

  return (
    <div className="user-dashboard">
      <div className="dashboard-header">
        <h1>Panel de Usuario</h1>
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

      {error && <div className="error-message">{error}</div>}

      <div className="dashboard-tabs">
        <button 
          className={activeTab === 'proyectos' ? 'active' : ''}
          onClick={() => setActiveTab('proyectos')}
        >
          Proyectos
        </button>
        <button 
          className={activeTab === 'ventas' ? 'active' : ''}
          onClick={() => setActiveTab('ventas')}
        >
          Ventas
        </button>
        <button 
          className={activeTab === 'pedidos' ? 'active' : ''}
          onClick={() => setActiveTab('pedidos')}
        >
          Pedidos
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'proyectos' ? (
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
        ) : activeTab === 'ventas' ? (
          renderSalesTab()
        ) : (
          renderOrdersTab()
        )}
      </div>
    </div>
  );
};

export default UserDashboard; 