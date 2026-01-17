import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      return <Navigate to="/" replace />;
    }
    
    return children;
  } catch (error) {
    return <Navigate to="/" replace />;
  }
};

export default ProtectedRoute;
