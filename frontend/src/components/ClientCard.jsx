import React, { useState } from 'react';
import ClientOrders from './ClientOrders';
import '../styles/CardStyles.css';
import '../styles/SalesStyles.css';

const ClientCard = ({ client, userRole, onDelete }) => {
  const [showOrders, setShowOrders] = useState(false);

  const handleEmail = () => {
    window.location.href = `mailto:${client.meta?.email || ''}`;
  };

  return (
    <div className="card client-card">
      <div className="card-header">
        <h3>{client.title}</h3>
        <div className="card-actions">
          <button 
            className="btn-view-orders"
            onClick={() => setShowOrders(!showOrders)}
          >
            {showOrders ? 'Ocultar Pedidos' : 'Ver Pedidos'}
          </button>
          {userRole === 'super_administrador' && (
            <button 
              className="btn-delete"
              onClick={() => onDelete(client.id)}
            >
              Eliminar
            </button>
          )}
        </div>
      </div>
      <div className="card-content">
        <p><strong>Email:</strong> {client.meta?.email}</p>
        <p><strong>Teléfono:</strong> {client.meta?.telefono}</p>
        <p><strong>Dirección:</strong> {client.meta?.direccion}</p>
      </div>
      {showOrders && (
        <div className="card-orders">
          <ClientOrders clientId={client.id} />
        </div>
      )}
    </div>
  );
};

export default ClientCard; 