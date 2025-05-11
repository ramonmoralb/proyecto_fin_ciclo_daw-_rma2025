import React, { useState, useEffect } from "react";
import { LOCAL_URL_API } from "../constants/constans";
import axios from "axios";

const TableroKanban = ({ proyectoId, participantes, tareasIniciales, userRole }) => {
  const [tareas, setTareas] = useState({
    pendiente: [],
    en_progreso: [],
    completada: []
  });
  const [nuevaTarea, setNuevaTarea] = useState({
    titulo: "",
    descripcion: "",
    asignado: "",
    estado: "pendiente"
  });
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const canEditTareas = userRole === "project_admin" || userRole === "project_user";

  useEffect(() => {
    // Inicializar las tareas desde las tareas iniciales
    const tareasOrganizadas = tareasIniciales.reduce((acc, tarea) => {
      acc[tarea.estado].push(tarea);
      return acc;
    }, {
      pendiente: [],
      en_progreso: [],
      completada: []
    });
    setTareas(tareasOrganizadas);
  }, [tareasIniciales]);

  const handleDragStart = (e, tareaId) => {
    e.dataTransfer.setData("tareaId", tareaId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const actualizarTareasEnServidor = async (nuevasTareas) => {
    try {
      const token = localStorage.getItem("jwtToken");
      
      // Formatear las tareas según el esquema esperado por el backend
      // Solo enviamos nombre y estado, que son las propiedades permitidas
      const tareasFormateadas = nuevasTareas.map(tarea => ({
        nombre: tarea.titulo,
        estado: tarea.estado
      }));

      console.log('Enviando tareas al servidor:', tareasFormateadas);

      const response = await axios.put(
        `${LOCAL_URL_API}wp-json/wp/v2/proyectos/${proyectoId}`,
        {
          meta: {
            tareas: tareasFormateadas
          }
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error al actualizar las tareas:", error);
      if (error.response) {
        console.error("Datos de la respuesta:", error.response.data);
      }
      throw error;
    }
  };

  const handleDrop = async (e, nuevoEstado) => {
    e.preventDefault();
    const tareaId = e.dataTransfer.getData("tareaId");
    
    // Encontrar la tarea actual
    const tareaActual = Object.values(tareas)
      .flat()
      .find(t => t.id === tareaId);

    if (tareaActual) {
      const tareaActualizada = {
        ...tareaActual,
        estado: nuevoEstado
      };

      try {
        // Preparar todas las tareas actualizadas
        const todasLasTareas = [
          ...Object.values(tareas)
            .flat()
            .filter(t => t.id !== tareaId),
          tareaActualizada
        ];

        await actualizarTareasEnServidor(todasLasTareas);

        // Actualizar el estado local
        setTareas(prevTareas => {
          const nuevasTareas = { ...prevTareas };
          Object.keys(nuevasTareas).forEach(estado => {
            nuevasTareas[estado] = nuevasTareas[estado].filter(t => t.id !== tareaId);
          });
          nuevasTareas[nuevoEstado].push(tareaActualizada);
          return nuevasTareas;
        });
      } catch (error) {
        console.error("Error al actualizar la tarea:", error);
      }
    }
  };

  const handleSubmitNuevaTarea = async (e) => {
    e.preventDefault();
    
    const nuevaTareaCompleta = {
      ...nuevaTarea,
      id: Date.now().toString(),
      fecha_creacion: new Date().toISOString()
    };

    try {
      // Preparar todas las tareas incluyendo la nueva
      const todasLasTareas = [
        ...Object.values(tareas).flat(),
        nuevaTareaCompleta
      ];

      await actualizarTareasEnServidor(todasLasTareas);

      // Actualizar el estado local
      setTareas(prevTareas => ({
        ...prevTareas,
        [nuevaTarea.estado]: [...prevTareas[nuevaTarea.estado], nuevaTareaCompleta]
      }));

      // Limpiar el formulario
      setNuevaTarea({
        titulo: "",
        descripcion: "",
        asignado: "",
        estado: "pendiente"
      });
      setMostrarFormulario(false);
    } catch (error) {
      console.error("Error al crear la tarea:", error);
    }
  };

  // Función para obtener el nombre del participante
  const obtenerNombreParticipante = (participanteId) => {
    if (!participanteId) return 'No asignado';
    
    // Convertir el ID a string para la comparación
    const participanteIdStr = String(participanteId);
    const participante = participantes.find(p => String(p.id) === participanteIdStr);
    
    return participante ? participante.name : 'No asignado';
  };

  return (
    <div className="tablero-kanban">
      <div className="kanban-header">
        <h3>Tablero Kanban</h3>
        {canEditTareas && (
          <button 
            className="btn-nueva-tarea"
            onClick={() => setMostrarFormulario(true)}
          >
            Nueva Tarea
          </button>
        )}
      </div>

      {mostrarFormulario && canEditTareas && (
        <div className="formulario-nueva-tarea">
          <form onSubmit={handleSubmitNuevaTarea}>
            <div className="form-group">
              <label>Título:</label>
              <input
                type="text"
                value={nuevaTarea.titulo}
                onChange={(e) => setNuevaTarea({...nuevaTarea, titulo: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Descripción:</label>
              <textarea
                value={nuevaTarea.descripcion}
                onChange={(e) => setNuevaTarea({...nuevaTarea, descripcion: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Asignar a:</label>
              <select
                value={nuevaTarea.asignado}
                onChange={(e) => setNuevaTarea({...nuevaTarea, asignado: e.target.value})}
                required
              >
                <option value="">Seleccionar participante</option>
                {participantes.map(participante => (
                  <option key={participante.id} value={participante.id}>
                    {participante.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-actions">
              <button type="submit">Crear Tarea</button>
              <button type="button" onClick={() => setMostrarFormulario(false)}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="kanban-columns">
        {Object.entries(tareas).map(([estado, tareasEstado]) => (
          <div
            key={estado}
            className="kanban-column"
            onDragOver={canEditTareas ? handleDragOver : undefined}
            onDrop={canEditTareas ? (e) => handleDrop(e, estado) : undefined}
          >
            <h4>{estado.replace("_", " ").toUpperCase()}</h4>
            <div className="tareas-container">
              {tareasEstado.map((tarea) => (
                <div
                  key={tarea.id}
                  className="tarea-card"
                  draggable={canEditTareas}
                  onDragStart={canEditTareas ? (e) => handleDragStart(e, tarea.id) : undefined}
                >
                  <h5>{tarea.titulo}</h5>
                  <p>{tarea.descripcion}</p>
                  <div className="tarea-asignado">
                    Asignado a: {obtenerNombreParticipante(tarea.asignado)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TableroKanban; 