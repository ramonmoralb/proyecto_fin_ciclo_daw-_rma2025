import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LOCAL_URL_API } from '../constants/constans';
import '../styles/ClientOrders.css';

const ClientOrders = ({ clientId }) => {
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
                  {order.meta.estado}
                </span>
              </div>
              <div className="order-details">
                <p>Fecha: {new Date(order.date).toLocaleDateString()}</p>
                <p>Total: ${order.meta.total}</p>
                <div className="products-list">
                  <h5>Productos:</h5>
                  {order.meta.productos.map((producto, index) => (
                    <div key={index} className="product-item">
                      <span>Cantidad: {producto.cantidad}</span>
                      <span>Producto ID: {producto.producto_id}</span>
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
};

export default ClientOrders; 