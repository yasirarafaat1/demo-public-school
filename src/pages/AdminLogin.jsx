import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Card,
  Alert,
} from "react-bootstrap";
import { adminLogin } from "../services/supabaseService";
import { createAdminSession } from "../utils/sessionManager";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const authData = await adminLogin(email, password);
      
      // Create custom admin session with 24-hour expiration
      const sessionData = createAdminSession({
        email: authData.user?.email || email,
        id: authData.user?.id,
        role: 'admin',
        authData: authData
      });

      // On successful login, redirect to the dashboard
      navigate("/admin/dashboard");
    } catch (err) {
      console.error("Login failed:", err);
      // Provide user-friendly error messages
      if (err.message.includes("Invalid login credentials")) {
        setError("Invalid email or password. Please try again.");
      } else {
        setError(`Login failed: ${err.message}. Please try again later.`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Fixed top-left Go to Home button */}
      <div style={{ position: "fixed", top: 12, left: 12, zIndex: 1050 }}>
        <Button as={Link} to="/" variant="outline-secondary" size="sm">
          Back to Home
        </Button>
      </div>

      <Container className="mt-5">
        <Row className="justify-content-center">
          <Col md={6} lg={4}>
            <Card>
              <Card.Header as="h4" className="text-center">
                Admin Login
              </Card.Header>
              <Card.Body>
                {error && <Alert variant="danger">{error}</Alert>}
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3" controlId="formBasicEmail">
                    <Form.Label>Email address</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="Enter email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="formBasicPassword">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </Form.Group>

                  <div className="d-grid">
                    <Button variant="primary" type="submit" disabled={loading}>
                      {loading ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          Logging in...
                        </>
                      ) : (
                        "Login"
                      )}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default AdminLogin;
