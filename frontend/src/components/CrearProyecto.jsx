import React, { useState, useEffect } from "react";
import { LOCAL_URL_API } from "../constants/constans";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const CrearProyecto = () => {
  const [titulo, setTitulo] = useState("");
  const [participantes, setParticipantes] = useState([]);
  const [tareas, setTareas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [mensaje, setMensaje] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const token = localStorage.getItem("jwtToken");
        if (!token) {
          throw new Error("Token no encontrado en localStorage.");
        }

        const response = await axios.get(`${LOCAL_URL_API}wp-json/wp/v2/users`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // Filtrar usuarios con el rol project_user
        const usuariosFiltrados = response.data.filter((user) =>
          user.roles.includes("project_user")
        );
        setUsuarios(usuariosFiltrados);
      } catch (error) {
        console.error("Error al obtener los usuarios:", error);
      }
    };

    fetchUsuarios();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("jwtToken");
    if (!token) {
      setMensaje("Error: No se encontró el token de autenticación.");
      return;
    }

    // Convertir los IDs de participantes a strings si no lo son ya
    const participantesIds = participantes.map(id => id.toString());

    const data = {
      title: titulo,
      status: "publish",
      meta: {
        participantes: participantesIds,
        tareas: tareas,
      },
    };

    try {
      const response = await fetch(`${LOCAL_URL_API}wp-json/wp/v2/proyectos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        setMensaje("Proyecto creado con éxito!");
        console.log("Proyecto creado:", result);
        // Redirigir al dashboard después de crear el proyecto
        setTimeout(() => {
          navigate("/dashboard");
        }, 1500); // Esperar 1.5 segundos para que el usuario vea el mensaje de éxito
      } else {
        const error = await response.json();
        setMensaje(`Error: ${error.message}`);
        console.error("Error al crear el proyecto:", error);
      }
    } catch (error) {
      setMensaje("Hubo un error al enviar la solicitud.");
      console.error("Error:", error);
    }
  };

  return (
    <div className="crear-proyecto-container">
      <h2>Crear Nuevo Proyecto</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Título del Proyecto:</label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Participantes:</label>
          <select
            multiple
            value={participantes}
            onChange={(e) =>
              setParticipantes(
                Array.from(e.target.selectedOptions, (option) => option.value)
              )
            }
          >
            {usuarios.map((usuario) => (
              <option key={usuario.id} value={usuario.id}>
                {usuario.name} (ID: {usuario.id})
              </option>
            ))}
          </select>
          <small>Mantén presionado Ctrl (Cmd en Mac) para seleccionar múltiples participantes</small>
        </div>
        <button type="submit" className="btn-crear">Crear Proyecto</button>
        {mensaje && <p className={mensaje.includes("Error") ? "error" : "success"}>{mensaje}</p>}
      </form>
    </div>
  );
};

export default CrearProyecto;