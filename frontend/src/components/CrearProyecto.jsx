import React, { useState, useEffect } from "react";
import { LOCAL_URL_API } from "../constants/constans";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from '../context/AuthContext';
import '../styles/CrearProyecto.css';

const CrearProyecto = () => {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [participantes, setParticipantes] = useState([]);
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { userEmail, userName, userId } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("jwtToken");
      console.log('Fetching users with token:', token);

      const response = await axios.get(`${LOCAL_URL_API}wp-json/wp/v2/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('All users from API:', response.data);

      // Filtrar solo usuarios con rol project_user
      const projectUsers = response.data.filter(user => {
        console.log('Checking user:', user.name, 'Roles:', user.roles);
        return user.roles.includes('project_user');
      });

      console.log('Filtered project users:', projectUsers);
      setParticipantes(projectUsers);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      setError('Error al cargar la lista de usuarios');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("jwtToken");
      
      // Crear el objeto del proyecto con los participantes seleccionados
      const proyectoData = {
        title: nombre,
        status: "publish",
        meta: {
          participantes: [
            // Incluir al creador del proyecto
            {
              id: parseInt(userId),
              name: userName,
              email: userEmail
            },
            // Incluir a los participantes seleccionados
            ...selectedParticipants.map(p => ({
              id: parseInt(p.id),
              name: p.name,
              email: p.email
            }))
          ],
          tareas: []
        }
      };

      console.log('Creating project with data:', proyectoData);

      // 1. Crear el proyecto
      const response = await axios.post(
        `${LOCAL_URL_API}wp-json/wp/v2/proyectos`,
        proyectoData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      const proyectoId = response.data.id;
      console.log('Project created:', response.data);

      // Esperar un momento para que el backend procese los cambios
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verificar que los usuarios se actualizaron correctamente
      for (const participant of [userId, ...selectedParticipants.map(p => p.id)]) {
        try {
          const userResponse = await axios.get(
            `${LOCAL_URL_API}wp-json/wp/v2/users/${participant}`,
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          );
          console.log(`User ${participant} updated data:`, userResponse.data);
        } catch (error) {
          console.error(`Error checking user ${participant}:`, error);
        }
      }

      navigate("/admin");
    } catch (error) {
      console.error('Error al crear el proyecto:', error);
      setError("Error al crear el proyecto. Por favor, inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleParticipantChange = (userId) => {
    const participant = participantes.find(p => p.id === parseInt(userId));
    if (participant) {
      setSelectedParticipants(prev => {
        const isSelected = prev.some(p => p.id === participant.id);
        if (isSelected) {
          return prev.filter(p => p.id !== participant.id);
        } else {
          return [...prev, participant];
        }
      });
    }
  };

  return (
    <div className="crear-proyecto-container">
      <h2>Crear Nuevo Proyecto</h2>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit} className="crear-proyecto-form">
        <div className="form-group">
          <label htmlFor="nombre">Nombre del Proyecto:</label>
          <input
            type="text"
            id="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="descripcion">Descripción:</label>
          <textarea
            id="descripcion"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Participantes:</label>
          <div className="participantes-list">
            {participantes.map(participante => (
              <div key={participante.id} className="participante-item">
                <input
                  type="checkbox"
                  id={`participante-${participante.id}`}
                  value={participante.id}
                  onChange={(e) => handleParticipantChange(e.target.value)}
                  checked={selectedParticipants.some(p => p.id === participante.id)}
                />
                <label htmlFor={`participante-${participante.id}`}>
                  {participante.name} ({participante.email}) - ID: {participante.id}
                </label>
              </div>
            ))}
          </div>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Creando...' : 'Crear Proyecto'}
        </button>
      </form>
    </div>
  );
};

export default CrearProyecto;