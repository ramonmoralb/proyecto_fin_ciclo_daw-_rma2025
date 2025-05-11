import React, { useState, useEffect } from "react";
import { LOCAL_URL_API } from "../constants/constans";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProyectos = async () => {
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
        setUserRole(userResponse.data.roles[0]); // Asumimos el primer rol como principal

        // Obtener todos los proyectos
        const response = await axios.get(
          `${LOCAL_URL_API}wp-json/wp/v2/proyectos`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // Filtrar proyectos según el rol del usuario
        const proyectosFiltrados = response.data.filter(proyecto => {
          if (userResponse.data.roles.includes("project_admin")) {
            return true; // Los administradores ven todos los proyectos
          }
          // Los usuarios normales solo ven proyectos donde son participantes
          return proyecto.meta?.participantes?.includes(userResponse.data.id.toString());
        });

        setProyectos(proyectosFiltrados);
        setLoading(false);
      } catch (error) {
        console.error("Error al cargar los proyectos:", error);
        setError("Error al cargar los proyectos");
        setLoading(false);
      }
    };

    fetchProyectos();
  }, []);

  const handleProyectoClick = (proyectoId) => {
    navigate(`/proyecto/${proyectoId}`);
  };

  if (loading) {
    return <div className="loading">Cargando proyectos...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Mis Proyectos</h1>
        {userRole === "project_admin" && (
          <button 
            className="btn-crear-proyecto"
            onClick={() => navigate("/crear-proyecto")}
          >
            Crear Nuevo Proyecto
          </button>
        )}
      </div>

      <div className="proyectos-grid">
        {proyectos.length === 0 ? (
          <p className="no-proyectos">No tienes proyectos asignados</p>
        ) : (
          proyectos.map((proyecto) => (
            <div
              key={proyecto.id}
              className="proyecto-card"
              onClick={() => handleProyectoClick(proyecto.id)}
            >
              <h3>{proyecto.title.rendered}</h3>
              <div className="proyecto-info">
                <p>
                  <strong>Fecha de creación:</strong>{" "}
                  {new Date(proyecto.date).toLocaleDateString()}
                </p>
                <p>
                  <strong>Participantes:</strong>{" "}
                  {proyecto.meta?.participantes?.length || 0}
                </p>
                <p>
                  <strong>Tareas:</strong>{" "}
                  {proyecto.meta?.tareas?.length || 0}
                </p>
              </div>
              <div className="proyecto-status">
                {userRole === "project_admin" && (
                  <span className="admin-badge">Administrador</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Dashboard;