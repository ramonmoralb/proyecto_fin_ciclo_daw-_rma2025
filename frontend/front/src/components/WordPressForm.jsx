import React, { useState } from "react";
import axios from "axios";
import { LOCAL_URL_API } from "../constants/constans";

const WordPressForm = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        `${LOCAL_URL_API}wp-json/wp/v2/posts`,
        {
          title: title,
          content: content,
          status: "publish",
        },
        {
          headers: {
            Authorization: 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwMDAiLCJpYXQiOjE3NDUyMjk0ODEsIm5iZiI6MTc0NTIyOTQ4MSwiZXhwIjoxNzQ1ODM0MjgxLCJkYXRhIjp7InVzZXIiOnsiaWQiOiIxIn19fQ.4583t4So2YWi2Vlu3KEvaILWeJP0ar5712aAggwDkck', 
          },
        }
      );

      setMessage("Post creado con éxito!");
    } catch (error) {
      console.error("Error al crear el post:", error);
      setMessage("Hubo un error al crear el post.");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Título:</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div>
        <label>Contenido:</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
        ></textarea>
      </div>
      <button type="submit">Crear Post</button>
      {message && <p>{message}</p>}
    </form>
  );
};

export default WordPressForm;