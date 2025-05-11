import React, { useState, useEffect } from "react";
import { LOCAL_URL_API } from "../constants/constans";
import axios from "axios";
import TableroKanban from "./TableroKanban";
import { useNavigate, useParams } from "react-router-dom";

const Proyecto = () => {
  const { id } = useParams();
  const [proyecto, setProyecto] = useState(null);
  const [participantes, setParticipantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProyecto = async () => {
      try {
        const token = localStorage.getItem("jwtToken");
        if (!token) {
          throw new Error("Token no encontrado");
        }

        // Obtener el rol del usuario actual
        const userResponse = await axios.get(
          `${LOCAL_URL_API}wp-json/wp/v2/users/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setUserRole(userResponse.data.roles[0]);

        // Obtener detalles del proyecto
        const response = await axios.get(
          `${LOCAL_URL_API}wp-json/wp/v2/proyectos/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setProyecto(response.data);

        // Obtener información de los participantes
        if (response.data.meta && response.data.meta.participantes) {
          const participantesPromises = response.data.meta.participantes.map(
            async (participanteId) => {
              const userResponse = await axios.get(
                `${LOCAL_URL_API}wp-json/wp/v2/users/${participanteId}`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );
              return userResponse.data;
            }
          );

          const participantesData = await Promise.all(participantesPromises);
          setParticipantes(participantesData);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error al cargar el proyecto:", error);
        setError("Error al cargar el proyecto");
        setLoading(false);
      }
    };

    if (id) {
      fetchProyecto();
    }
  }, [id]);

  const handleEliminarProyecto = async () => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este proyecto?")) {
      try {
        const token = localStorage.getItem("jwtToken");
        await axios.delete(
          `${LOCAL_URL_API}wp-json/wp/v2/proyectos/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        navigate("/dashboard");
      } catch (error) {
        console.error("Error al eliminar el proyecto:", error);
        setError("Error al eliminar el proyecto");
      }
    }
  };

  if (loading) {
    return <div className="loading">Cargando proyecto...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!proyecto) {
    return <div className="error">No se encontró el proyecto</div>;
  }

  return (
    <div className="proyecto-container">
      <div className="proyecto-header">
        <div className="proyecto-title">
          <h1>{proyecto.title.rendered}</h1>
          <div className="proyecto-meta">
            <p>Fecha de creación: {new Date(proyecto.date).toLocaleDateString()}</p>
          </div>
        </div>
        {userRole === "project_admin" && (
          <div className="proyecto-actions">
            <button 
              className="btn-editar"
              onClick={() => navigate(`/editar-proyecto/${id}`)}
            >
              Editar Proyecto
            </button>
            <button 
              className="btn-eliminar"
              onClick={handleEliminarProyecto}
            >
              Eliminar Proyecto
            </button>
          </div>
        )}
      </div>

      <div className="proyecto-participantes">
        <h2>Participantes</h2>
        <div className="participantes-list">
          {participantes.map((participante) => (
            <div key={participante.id} className="participante-card">
              <div className="participante-avatar">
                <img
                  src={participante.avatar_urls[48]}
                  alt={participante.name}
                />
              </div>
              <div className="participante-info">
                <h3>{participante.name}</h3>
                <p>{participante.roles.join(", ")}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="proyecto-tablero">
        <h2>Tablero de Tareas</h2>
        <TableroKanban 
          proyectoId={id} 
          participantes={participantes}
          tareasIniciales={proyecto.meta?.tareas || []}
          userRole={userRole}
        />
      </div>
    </div>
  );
};

export default Proyecto; 