import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { LOCAL_URL_API } from '../constants/constans';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${LOCAL_URL_API}wp-json/wp/v2/users/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const userData = response.data;
        const roles = userData.roles || [];
        
        // Verificar que el usuario tenga uno de los roles permitidos
        const allowedRoles = ['super_administrador', 'project_admin', 'project_user'];
        const userRole = roles.find(role => allowedRoles.includes(role));

        if (userRole) {
          setIsAuthenticated(true);
          setUserRole(userRole);
          setUserName(userData.name);
          setUserEmail(userData.email);
          
          // Actualizar localStorage con los datos correctos
          localStorage.setItem('userRole', userRole);
          localStorage.setItem('userName', userData.name);
          localStorage.setItem('userEmail', userData.email);
        } else {
          // Si el usuario no tiene un rol permitido, cerrar sesión
          logout();
        }
      } catch (error) {
        console.error('Error verificando autenticación:', error);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuth();
  }, []);

  const login = (email, role, name) => {
    setIsAuthenticated(true);
    setUserRole(role);
    setUserName(name);
    setUserEmail(email);
  };

  const logout = () => {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    setIsAuthenticated(false);
    setUserRole('');
    setUserName('');
    setUserEmail('');
  };

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      userRole,
      userName,
      userEmail,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};