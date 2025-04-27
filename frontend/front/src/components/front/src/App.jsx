import React from "react";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";

const App = () => {
  return (
    <div>
      <h1>Bienvenido a la Aplicación</h1>
      <LoginForm />
      <RegisterForm />
    </div>
  );
};

export default App;