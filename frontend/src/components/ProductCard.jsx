import React, { useState } from 'react';
import '../styles/CardStyles.css';
import '../styles/SalesStyles.css';

const ProductCard = ({ product, userRole, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const stock = parseInt(product.meta?.stock || 0);
  const isLowStock = stock < 500;

  return (
    <div 
      className={`product-card ${isExpanded ? 'expanded' : ''} ${isLowStock ? 'low-stock' : ''}`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="card-header">
        <h4>{product.title.rendered || product.title}</h4>
        {userRole === 'super_administrador' && (
          <button 
            className="btn-delete"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(product.id);
            }}
          >
            Eliminar
          </button>
        )}
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
          <p><strong>Precio:</strong> ${product.meta?.precio || 0}</p>
          <p className={isLowStock ? 'stock-warning' : ''}>
            <strong>Stock:</strong> {stock}
            {isLowStock && <span className="warning-icon">⚠️</span>}
          </p>
        </div>

        {isExpanded && (
          <div className="expanded-info">
            {isLowStock && (
              <div className="warning-message">
                <p>⚠️ Stock bajo: Se recomienda realizar un nuevo pedido</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard; 