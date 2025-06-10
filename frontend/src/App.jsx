import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header";
import Home from "./components/Home";
import LoginForm from "./components/LoginForm";
import Dashboard from "./components/Dashboard";
import Footer from "./components/Footer";
import Proyecto from "./components/Proyecto";
import CrearProyecto from "./components/CrearProyecto";
import EditarProyecto from "./components/EditarProyecto";
import AdminDashboard from "./components/AdminDashboard";
import ChangePassword from "./components/ChangePassword";
import { AuthProvider } from "./context/AuthContext";
import ProjectDashboard from './components/ProjectDashboard';
import UserDashboard from './components/UserDashboard';
import UserProfile from './components/UserProfile';
import './styles/base.css';

// Componente para proteger rutas
const ProtectedRoute = ({ children, allowedRoles }) => {
  const userRole = localStorage.getItem('userRole');
  const token = localStorage.getItem('jwtToken');

  if (!token) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Redirigir según el rol
    if (userRole === 'project_user') {
      return <Navigate to="/user-dashboard" />;
    } else if (userRole === 'project_admin') {
      return <Navigate to="/project-dashboard" />;
    } else {
      return <Navigate to="/admin-dashboard" />;
    }
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Header />
        <main style={{ padding: "1rem" }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<LoginForm />} />
            
            {/* Rutas protegidas */}
            <Route
              path="/admin-dashboard"
              element={
                <ProtectedRoute allowedRoles={['super_administrador']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['super_administrador', 'project_admin']}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/proyecto/:id"
              element={
                <ProtectedRoute allowedRoles={['super_administrador', 'project_admin', 'project_user']}>
                  <Proyecto />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/crear-proyecto"
              element={
                <ProtectedRoute allowedRoles={['super_administrador', 'project_admin']}>
                  <CrearProyecto />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/editar-proyecto/:id"
              element={
                <ProtectedRoute allowedRoles={['super_administrador', 'project_admin']}>
                  <EditarProyecto />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/change-password"
              element={
                <ProtectedRoute allowedRoles={['super_administrador', 'project_admin', 'project_user']}>
                  <ChangePassword />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['super_administrador']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/project-dashboard"
              element={
                <ProtectedRoute allowedRoles={['super_administrador', 'project_admin']}>
                  <ProjectDashboard />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/user-dashboard"
              element={
                <ProtectedRoute allowedRoles={['project_user']}>
                  <UserDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute allowedRoles={['super_administrador', 'project_admin', 'project_user']}>
                  <UserProfile />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </Router>
    </AuthProvider>
  );
}

export default App;