import React, { useState, useEffect } from "react";
import { LOCAL_URL_API } from "../constants/constans";
import TableroKanban from "./TableroKanban";
import { useNavigate, useParams } from "react-router-dom";
import '../styles/Proyecto.css';

const Proyecto = () => {
  const { id } = useParams();
  const [proyecto, setProyecto] = useState(null);
  const [participantes, setParticipantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("jwtToken");
    if (!token) {
      navigate("/login");
      return;
    }

    const headers = {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Accept": "application/json"
    };

    // Obtener el rol del usuario actual
    const fetchUserRole = async () => {
      try {
        const response = await fetch(`${LOCAL_URL_API}wp-json/wp/v2/users/me`, {
          headers: headers
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem("jwtToken");
            navigate("/login");
            return;
          }
          throw new Error("Error al obtener el rol del usuario");
        }
        
        const userData = await response.json();
        setUserRole(userData.roles[0]); // Asumimos que el usuario tiene un solo rol
      } catch (error) {
        console.error("Error al obtener el rol:", error);
        if (error.message.includes("401")) {
          localStorage.removeItem("jwtToken");
          navigate("/login");
          return;
        }
        setError("Error al obtener el rol del usuario");
      }
    };

    // Obtener detalles del proyecto
    const fetchProyecto = async () => {
      try {
        const response = await fetch(`${LOCAL_URL_API}wp-json/wp/v2/proyectos/${id}`, {
          headers: headers
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem("jwtToken");
            navigate("/login");
            return;
          }
          throw new Error("Error al cargar el proyecto");
        }

        const data = await response.json();
        setProyecto(data);

        // Obtener información de los participantes
        if (data.meta && data.meta.participantes) {
          try {
            const usersResponse = await fetch(`${LOCAL_URL_API}wp-json/wp/v2/users?per_page=100`, {
              headers: headers
            });

            if (!usersResponse.ok) {
              if (usersResponse.status === 401) {
                localStorage.removeItem("jwtToken");
                navigate("/login");
                return;
              }
              throw new Error("Error al cargar los usuarios");
            }

            const users = await usersResponse.json();
            const participantesInfo = users.filter(user => 
              data.meta.participantes.includes(user.id.toString())
            );
            setParticipantes(participantesInfo);
          } catch (error) {
            console.error("Error al cargar participantes:", error);
            if (error.message.includes("401")) {
              localStorage.removeItem("jwtToken");
              navigate("/login");
              return;
            }
            setParticipantes([]);
          }
        }
      } catch (error) {
        console.error("Error al cargar el proyecto:", error);
        if (error.message.includes("401")) {
          localStorage.removeItem("jwtToken");
          navigate("/login");
          return;
        }
        setError("Error al cargar el proyecto");
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
    fetchProyecto();
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este proyecto?")) {
      return;
    }

    const token = localStorage.getItem("jwtToken");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(`${LOCAL_URL_API}wp-json/wp/v2/proyectos/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("jwtToken");
          navigate("/login");
          return;
        }
        throw new Error("Error al eliminar el proyecto");
      }

      navigate("/dashboard");
    } catch (error) {
      console.error("Error al eliminar el proyecto:", error);
      if (error.message.includes("401")) {
        localStorage.removeItem("jwtToken");
        navigate("/login");
        return;
      }
      setError("Error al eliminar el proyecto");
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

  const canManageProject = userRole === "administrator" || userRole === "project_admin";

  return (
    <div className="proyecto-container">
      <div className="proyecto-header">
        <div className="proyecto-title">
          <h1>{proyecto.title.rendered}</h1>
          <div className="proyecto-meta">
            <p>Fecha de creación: {new Date(proyecto.date).toLocaleDateString()}</p>
          </div>
        </div>
        {canManageProject && (
          <div className="proyecto-actions">
            <button 
              className="btn-editar"
              onClick={() => navigate(`/editar-proyecto/${id}`)}
            >
              Editar Proyecto
            </button>
            <button 
              className="btn-eliminar"
              onClick={handleDelete}
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