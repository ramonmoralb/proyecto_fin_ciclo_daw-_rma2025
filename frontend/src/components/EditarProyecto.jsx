import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LOCAL_URL_API } from '../constants/constans';
import '../styles/CrearProyecto.css';

const EditarProyecto = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    participantes: []
  });
  const [usuarios, setUsuarios] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
      navigate('/login');
      return;
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    // Cargar datos del proyecto
    const fetchProyecto = async () => {
      try {
        const response = await fetch(`${LOCAL_URL_API}wp-json/wp/v2/proyectos/${id}`, {
          headers: headers
        });

        if (!response.ok) {
          throw new Error('Error al cargar el proyecto');
        }

        const data = await response.json();
        setFormData({
          title: data.title.rendered,
          content: data.content.rendered,
          participantes: data.meta?.participantes || []
        });
      } catch (error) {
        setError('Error al cargar el proyecto');
        console.error('Error:', error);
      }
    };

    // Cargar lista de usuarios
    const fetchUsuarios = async () => {
      try {
        const response = await fetch(`${LOCAL_URL_API}wp-json/wp/v2/users?per_page=100`, {
          headers: headers
        });

        if (!response.ok) {
          throw new Error('Error al cargar usuarios');
        }

        const data = await response.json();
        setUsuarios(data);
      } catch (error) {
        setError('Error al cargar usuarios');
        console.error('Error:', error);
      }
    };

    Promise.all([fetchProyecto(), fetchUsuarios()])
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleParticipantesChange = (e) => {
    const options = e.target.options;
    const selectedValues = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedValues.push(options[i].value);
      }
    }
    setFormData(prev => ({
      ...prev,
      participantes: selectedValues
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const token = localStorage.getItem('jwtToken');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const response = await fetch(`${LOCAL_URL_API}wp-json/wp/v2/proyectos/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          meta: {
            participantes: formData.participantes
          }
        })
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el proyecto');
      }

      setSuccess(true);
      setTimeout(() => {
        navigate(`/proyecto/${id}`);
      }, 1500);
    } catch (error) {
      setError('Error al actualizar el proyecto');
      console.error('Error:', error);
    }
  };

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  return (
    <div className="crear-proyecto-container">
      <div className="crear-proyecto-card">
        <h2>Editar Proyecto</h2>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">Proyecto actualizado correctamente</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Título del Proyecto</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="content">Descripción</label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              required
              rows="5"
            />
          </div>

          <div className="form-group">
            <label htmlFor="participantes">Participantes</label>
            <select
              id="participantes"
              name="participantes"
              multiple
              value={formData.participantes}
              onChange={handleParticipantesChange}
              className="participantes-select"
            >
              {usuarios.map(usuario => (
                <option key={usuario.id} value={usuario.id}>
                  {usuario.name} ({usuario.id})
                </option>
              ))}
            </select>
            <small>Mantén presionado Ctrl (Cmd en Mac) para seleccionar múltiples participantes</small>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-guardar">
              Guardar Cambios
            </button>
            <button 
              type="button" 
              className="btn-cancelar"
              onClick={() => navigate(`/proyecto/${id}`)}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditarProyecto; 