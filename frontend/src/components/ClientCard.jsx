import React, { useState } from 'react';
import '../styles/CardStyles.css';

const ClientCard = ({ client }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleEmail = () => {
    window.location.href = `mailto:${client.meta?.email || ''}`;
  };

  return (
    <div 
      className={`client-card ${isExpanded ? 'expanded' : ''}`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="card-header">
        <h4>{client.title.rendered || client.title}</h4>
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
          <p><strong>Email:</strong> {client.meta?.email || ''}</p>
          <p><strong>Teléfono:</strong> {client.meta?.telefono || ''}</p>
          <p><strong>Dirección:</strong> {client.meta?.direccion || ''}</p>
        </div>

        {isExpanded && (
          <div className="expanded-info">
            <div className="action-buttons">
              <button 
                className="btn-action btn-email"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEmail();
                }}
              >
                <i className="fas fa-envelope"></i> Enviar Email
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientCard; 