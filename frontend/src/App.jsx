import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import Dashboard from "./components/Dashboard";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Proyecto from "./components/Proyecto";
import CrearProyecto from "./components/CrearProyecto";
import { AuthProvider } from "./context/AuthContext"; // Importar el contexto

function App() {
  return (
    <AuthProvider>
      <Router>
        <Header />
        <main style={{ padding: "1rem" }}>
          <Routes>
            <Route path="/" element={<LoginForm />} />
            <Route path="/register" element={<RegisterForm />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/proyecto/:id" element={<Proyecto />} />
            <Route path="/crear-proyecto" element={<CrearProyecto />} />
          </Routes>
        </main>
        <Footer />
      </Router>
    </AuthProvider>
  );
}

export default App;