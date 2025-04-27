import { useEffect, useState } from 'react'
import { LOCAL_URL_API } from './constants/constans'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import  WordpressForm  from './components/WordPressForm'
import './App.css'
import axios from "axios";
import CrearProyecto from './components/CrearProyecto'
import LoginForm from './components/LoginForm'
import RegisterForm from './components/front/src/components/RegisterForm'


function App() {
  const [dataApi, setDataApi] = useState([])

  /** 
  fetch("http://localhost:8002/wp-json/wp/v2/proyectos/9")
  .then(response => response.json())
  .then(data => {
    const participantes = data.meta.participantes;
    console.log("Participantes:", participantes);
  })
  .catch(error => console.error("Error al obtener el proyecto:", error));
 */

  return (
    <div>
      <ul>
        {dataApi.map((item) => (
          <li key={item.id}>
            <h2>{item.title.rendered}</h2>
            { item.content.rendered }
          </li>
        ))}
      </ul>
     {/* <WordpressForm /> */}
     {/* <CrearProyecto /> */}
      <LoginForm />
      <RegisterForm />

    </div>
  )
   
}

export default App
