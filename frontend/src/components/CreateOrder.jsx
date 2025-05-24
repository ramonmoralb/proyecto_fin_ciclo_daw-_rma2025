import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LOCAL_URL_API } from '../constants/constans';
import '../styles/CreateOrder.css';

const CreateOrder = ({ onClose, onOrderCreated }) => {
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchClients();
    fetchProducts();
  }, []);

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
      console.error('Error fetching clients:', error);
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
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Error al cargar los productos');
      setLoading(false);
    }
  };

  const handleAddProduct = () => {
    setSelectedProducts([
      ...selectedProducts,
      { producto_id: '', cantidad: 1 }
    ]);
  };

  const handleProductChange = (index, field, value) => {
    const newProducts = [...selectedProducts];
    newProducts[index][field] = value;
    setSelectedProducts(newProducts);
  };

  const handleRemoveProduct = (index) => {
    const newProducts = selectedProducts.filter((_, i) => i !== index);
    setSelectedProducts(newProducts);
  };

  const calculateTotal = () => {
    return selectedProducts.reduce((total, item) => {
      const product = products.find(p => p.id === item.producto_id);
      return total + (product ? product.meta.precio * item.cantidad : 0);
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedClient || selectedProducts.length === 0) {
      setError('Por favor selecciona un cliente y al menos un producto');
      return;
    }

    try {
      const token = localStorage.getItem('jwtToken');
      const response = await axios.post(
        `${LOCAL_URL_API}wp-json/pm/v1/pedidos`,
        {
          cliente_id: selectedClient,
          productos: selectedProducts
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      onOrderCreated(response.data);
      onClose();
    } catch (error) {
      console.error('Error creating order:', error);
      setError('Error al crear el pedido');
    }
  };

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  return (
    <div className="create-order-modal">
      <div className="modal-content">
        <h2>Crear Nuevo Pedido</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="client">Cliente:</label>
            <select
              id="client"
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              required
            >
              <option value="">Seleccionar Cliente</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.title}
                </option>
              ))}
            </select>
          </div>

          <div className="products-section">
            <h3>Productos</h3>
            {selectedProducts.map((product, index) => (
              <div key={index} className="product-row">
                <select
                  value={product.producto_id}
                  onChange={(e) => handleProductChange(index, 'producto_id', e.target.value)}
                  required
                >
                  <option value="">Seleccionar Producto</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.title} - ${p.meta.precio}
                    </option>
                  ))}
                </select>
                
                <input
                  type="number"
                  min="1"
                  value={product.cantidad}
                  onChange={(e) => handleProductChange(index, 'cantidad', parseInt(e.target.value))}
                  required
                />
                
                <button
                  type="button"
                  onClick={() => handleRemoveProduct(index)}
                  className="btn-remove"
                >
                  Eliminar
                </button>
              </div>
            ))}
            
            <button
              type="button"
              onClick={handleAddProduct}
              className="btn-add"
            >
              Añadir Producto
            </button>
          </div>

          <div className="order-total">
            <h3>Total: ${calculateTotal().toFixed(2)}</h3>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-create">
              Crear Pedido
            </button>
            <button type="button" onClick={onClose} className="btn-cancel">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateOrder; 