import React, { useEffect, useState } from "react";
import axios from "axios";
import { LOCAL_URL_API } from "../constants/constans";
import CrearProyecto from "./CrearProyecto";

const Dashboard = () => {
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const token = localStorage.getItem("jwtToken"); // Obtén el token de localStorage
        if (!token) {
          throw new Error("Token no encontrado en localStorage.");
        }
        const response = await axios.get(`${LOCAL_URL_API}wp-json/wp/v2/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`, // Envía el token en la cabecera
          },
        });

        if (response.data.roles && response.data.roles.length > 0) {
          setRole(response.data.roles[0]); // Obtener el primer rol del usuario
        } else {
          console.error("El usuario no tiene roles asignados.");
        }
        setLoading(false);
      } catch (error) {
        console.error("Error al obtener el rol del usuario:", error);
        setLoading(false);
      }
    };
    fetchUserRole();
  }, []);

  if (loading) {
    return <p>Cargando...</p>;
  }

  return (
    <div>
      <h1>Dashboard</h1>
      {role === "project_admin" && (
        <div>
          <h2>Bienvenido, Administrador</h2>
          <p>Aquí puedes gestionar proyectos y tareas.</p>
          <CrearProyecto /> {/* Mostrar el componente CrearProyecto */}
        </div>
      )}
      {role === "project_user" && (
        <div>
          <h2>Bienvenido, Usuario</h2>
          <p>Aquí puedes ver y actualizar tus tareas asignadas.</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;