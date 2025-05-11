import React, { useState, useEffect } from "react";
import { LOCAL_URL_API } from "../constants/constans";
import axios from "axios";

const CrearProyecto = () => {
  const [titulo, setTitulo] = useState("");
  const [participantes, setParticipantes] = useState([]);
  const [tareas, setTareas] = useState([]);
  const [usuarios, setUsuarios] = useState([]); // Lista de usuarios con rol project_user
  const [mensaje, setMensaje] = useState("");
  const [token, setToken] = useState("");

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const token = localStorage.getItem("jwtToken");
        if (!token) {
          throw new Error("Token no encontrado en localStorage.");
        }

        const response = await axios.get(`${LOCAL_URL_API}wp-json/wp/v2/users`, {
          headers: {
            Authorization: `Bearer ${token}`, // Asegúrate de que el token esté en el formato correcto
          },
        });
        console.log("Usuarios obtenidos:", response.data);

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

    const token = localStorage.getItem("jwtToken"); // Obtén el token antes de realizar la solicitud
    if (!token) {
      setMensaje("Error: No se encontró el token de autenticación.");
      return;
    }

    const data = {
      title: titulo,
      status: "publish",
      meta: {
        participantes: participantes,
        tareas: tareas,
      },
    };

    try {
      const response = await fetch(`${LOCAL_URL_API}wp-json/wp/v2/proyectos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Asegúrate de que el token esté en el formato correcto
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        setMensaje("Proyecto creado con éxito!");
        console.log("Proyecto creado:", result);
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
    <form onSubmit={handleSubmit}>
      <div>
        <label>Título del Proyecto:</label>
        <input
          type="text"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
        />
      </div>
      <div>
        <label>Participantes:</label>
        <select
          multiple
          onChange={(e) =>
            setParticipantes(
              Array.from(e.target.selectedOptions, (option) => option.value)
            )
          }
        >
          {usuarios.map((usuario) => (
            <option key={usuario.id} value={usuario.id}>
              {usuario.name} ({usuario.email})
            </option>
          ))}
        </select>
      </div>
      <div>
        <label>Tareas (JSON):</label>
        <textarea
          onChange={(e) => setTareas(JSON.parse(e.target.value))}
          placeholder='[{"nombre": "Tarea 1", "estado": "pendiente"}]'
        ></textarea>
      </div>
      <button type="submit">Crear Proyecto</button>
      {mensaje && <p>{mensaje}</p>}
    </form>
  );
};

export default CrearProyecto;