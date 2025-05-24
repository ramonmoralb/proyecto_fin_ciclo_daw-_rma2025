import React, { useState } from 'react';
import '../styles/CardStyles.css';

const OrderCard = ({ order, onStatusChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleStatusChange = (e) => {
    e.stopPropagation();
    onStatusChange(order.id, e.target.value);
  };

  return (
    <div 
      className={`order-card ${isExpanded ? 'expanded' : ''}`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="card-header">
        <h4>{order.title}</h4>
        <button 
          className="btn-expand"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
        >
          {isExpanded ? '−' : '+'}
        </button>
      </div>
      
      <div className="card-content">
        <div className="basic-info">
          <p><strong>Cliente:</strong> {order.meta?.cliente?.nombre || 'Cliente no encontrado'}</p>
          <p><strong>Total:</strong> ${order.meta?.total || 0}</p>
          <p><strong>Estado:</strong> {order.meta?.estado || 'pendiente'}</p>
          <p><strong>Fecha:</strong> {new Date(order.date).toLocaleDateString()}</p>
        </div>

        {isExpanded && (
          <div className="expanded-info">
            <div className="info-section">
              <h5>Productos</h5>
              {order.meta?.productos?.map((producto, index) => (
                <div key={index} className="product-item">
                  <p><strong>Producto ID:</strong> {producto.producto_id}</p>
                  <p><strong>Cantidad:</strong> {producto.cantidad}</p>
                  <p><strong>Precio Unitario:</strong> ${producto.precio_unitario}</p>
                  <p><strong>Subtotal:</strong> ${producto.subtotal}</p>
                </div>
              ))}
            </div>
            
            <div className="info-section">
              <h5>Cambiar Estado</h5>
              <select 
                value={order.meta?.estado || 'pendiente'} 
                onChange={handleStatusChange}
                onClick={(e) => e.stopPropagation()}
              >
                <option value="pendiente">Pendiente</option>
                <option value="servido">Servido</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderCard; 