import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Alert, Card } from "react-bootstrap";
import { getSessionTimeRemaining, isSessionExpiringSoon, extendAdminSession } from "../utils/sessionManager";

const SessionStatus = () => {
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isExpiringSoon, setIsExpiringSoon] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const updateSessionStatus = () => {
      const remaining = getSessionTimeRemaining();
      const expiringSoon = isSessionExpiringSoon();
      
      setTimeRemaining(remaining);
      setIsExpiringSoon(expiringSoon);
    };

    // Update immediately
    updateSessionStatus();

    // Update every minute
    const interval = setInterval(updateSessionStatus, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleExtendSession = () => {
    extendAdminSession();
    const remaining = getSessionTimeRemaining();
    setTimeRemaining(remaining);
    setIsExpiringSoon(false);
  };

  if (!timeRemaining) return null;

  return (
    <Card className="mb-3" style={{ backgroundColor: isExpiringSoon ? '#fff3cd' : '#d1ecf1' }}>
      <Card.Body className="py-2">
        <div className="d-flex justify-content-between align-items-center">
          <div className="small">
            <strong>Session Status:</strong> {timeRemaining}
            {isExpiringSoon && (
              <Alert variant="warning" className="mb-0 mt-1 p-2 small">
                Session expiring soon! Consider extending your session.
              </Alert>
            )}
          </div>
          <div>
            {isExpiringSoon && (
              <Button 
                size="sm" 
                variant="outline-primary" 
                onClick={handleExtendSession}
              >
                Extend Session
              </Button>
            )}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default SessionStatus;
