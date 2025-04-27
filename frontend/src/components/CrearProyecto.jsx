import React, { useState } from "react";
import { LOCAL_URL_API } from "../constants/constans";
import { useEffect } from "react";
import axios from "axios";

const CrearProyecto = () => {
  const [titulo, setTitulo] = useState("");
  const [participantes, setParticipantes] = useState([]);
  const [tareas, setTareas] = useState([]);
  const [mensaje, setMensaje] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");

  useEffect(()=>{
    const getToken = async () => {    
      try {
        const response = await axios.post(
          "http://localhost:8002/wp-json/jwt-auth/v1/token",
          {
              username: "ramon",
              password: "ramon",   
          }
              
        );
        setToken(response.data.token);
        console.log(response.data.token);
      } catch (error) {
        console.error("Error al obtener el token:", error);
      }
  } 
    getToken()  
  },[])

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = {
        title: titulo,
        status: "publish",
        meta: {
            participantes: participantes,
            tareas: tareas
        }
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
        <label>Participantes (separados por comas):</label>
        <input
          type="text"
          onChange={(e) =>
            setParticipantes(e.target.value.split(",").map((p) => p.trim()))
          }
        />
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