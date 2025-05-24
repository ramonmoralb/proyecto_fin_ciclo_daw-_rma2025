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
      const storedUserRole = localStorage.getItem('userRole');
      const storedUserName = localStorage.getItem('userName');
      const storedUserEmail = localStorage.getItem('userEmail');

      console.log('=== DEBUG AUTH INITIAL CHECK ===');
      console.log('Token exists:', !!token);
      console.log('Token value:', token);
      console.log('Stored Role:', storedUserRole);
      console.log('Stored Name:', storedUserName);
      console.log('Stored Email:', storedUserEmail);

      if (!token || !storedUserRole) {
        console.log('No token or role found, logging out');
        handleLogout();
        setIsLoading(false);
        return;
      }

      try {
        console.log('=== DEBUG VERIFY AUTH ===');
        console.log('Attempting to verify token...');
        console.log('Request headers:', {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        
        const response = await axios.get(`${LOCAL_URL_API}wp-json/wp/v2/users/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('Response from /users/me:', response.data);
        console.log('Response headers:', response.headers);

        if (response.data) {
          const userData = response.data;
          const roles = userData.roles || [];
          
          console.log('User roles from response:', roles);
          console.log('Stored role to check:', storedUserRole);
          
          if (roles.includes(storedUserRole)) {
            console.log('Role match found, setting authenticated state');
            setIsAuthenticated(true);
            setUserRole(storedUserRole);
            setUserName(storedUserName);
            setUserEmail(storedUserEmail);
          } else {
            console.log('Role mismatch, logging out');
            handleLogout();
          }
        } else {
          console.log('No user data in response, logging out');
          handleLogout();
        }
      } catch (error) {
        console.error('=== DEBUG AUTH ERROR ===');
        console.error('Error details:', error);
        if (error.response) {
          console.error('Error response:', error.response.data);
          console.error('Error status:', error.response.status);
          console.error('Error headers:', error.response.headers);
        }
        handleLogout();
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuth();
  }, []);

  const handleLogout = () => {
    console.log('=== DEBUG LOGOUT ===');
    console.log('Clearing auth state and localStorage');
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    setIsAuthenticated(false);
    setUserRole(null);
    setUserName('');
    setUserEmail('');
  };

  const login = (token, email, role, name) => {
    console.log('=== DEBUG LOGIN ===');
    console.log('Setting auth state with:', { email, role, name });
    localStorage.setItem('jwtToken', token);
    localStorage.setItem('userRole', role);
    localStorage.setItem('userName', name);
    localStorage.setItem('userEmail', email);
    setIsAuthenticated(true);
    setUserRole(role);
    setUserName(name);
    setUserEmail(email);
  };

  const logout = () => {
    handleLogout();
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