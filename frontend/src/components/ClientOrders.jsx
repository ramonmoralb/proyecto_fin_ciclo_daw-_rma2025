import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LOCAL_URL_API } from '../constants/constans';
import '../styles/ClientOrders.css';

const ClientOrders = ({ clientId, onOrderUpdate }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchClientOrders();
  }, [clientId]);

  const fetchClientOrders = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await axios.get(
        `${LOCAL_URL_API}wp-json/pm/v1/clientes/${clientId}/pedidos`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      setOrders(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar pedidos del cliente:', error);
      setError('Error al cargar los pedidos del cliente');
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('jwtToken');
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

      // Actualizar el estado local
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, meta: { ...order.meta, estado: newStatus } }
            : order
        )
      );

      // Notificar al componente padre si es necesario
      if (onOrderUpdate) {
        onOrderUpdate(response.data);
      }
    } catch (error) {
      console.error('Error al actualizar el estado del pedido:', error);
      setError('Error al actualizar el estado del pedido');
    }
  };

  if (loading) return <div className="loading">Cargando pedidos...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="client-orders">
      <h3>Pedidos del Cliente</h3>
      {orders.length === 0 ? (
        <p>No hay pedidos para este cliente</p>
      ) : (
        <div className="orders-list">
          {orders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <h4>{order.title}</h4>
                <span className={`status ${order.meta.estado}`}>
                  {order.meta.estado === 'pendiente' ? 'Pendiente' : 'Servido'}
                </span>
              </div>
              <div className="order-details">
                <p>Fecha: {new Date(order.date).toLocaleDateString()}</p>
                <div className="products-list">
                  <h5>Productos:</h5>
                  {order.meta.productos.map((producto, index) => (
                    <div key={index} className="product-item">
                      <div className="product-info">
                        <span className="product-name">{producto.nombre}</span>
                        <span className="product-quantity">Cantidad: {producto.cantidad}</span>
                      </div>
                      <div className="product-price">
                        <span className="unit-price">Precio: ${producto.precio_unitario}</span>
                        <span className="subtotal">Subtotal: ${producto.subtotal}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="order-total">
                  <strong>Total: ${order.meta.total}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientOrders; 