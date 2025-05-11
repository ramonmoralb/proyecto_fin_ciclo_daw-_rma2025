import React, { createContext, useState } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");

  const login = (name, role) => {
    setIsAuthenticated(true);
    setUserName(name);
    setUserRole(role);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUserName("");
    setUserRole("");
    localStorage.removeItem("jwtToken"); // Eliminar el token del localStorage
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userName, userRole, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};