import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Spinner } from "react-bootstrap";
import { isAdminSessionValid } from "../../utils/sessionManager";

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if admin session is valid
    const checkAuth = () => {
      const isValid = isAdminSessionValid();
      setIsAuthenticated(isValid);
      setIsLoading(false);
    };

    checkAuth();

    // Set up interval to check session expiration every minute
    const interval = setInterval(checkAuth, 60000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    // Show a loading indicator while checking auth state
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "100vh" }}
      >
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  // If not loading and not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  // If authenticated, render the child components (the protected page)
  return children;
};

export default ProtectedRoute;
