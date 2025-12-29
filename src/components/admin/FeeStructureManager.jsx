import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Button,
  Form,
  Modal,
  Alert,
} from "react-bootstrap";
import {
  getFeeStructure,
  addFeeStructure,
  updateFeeStructure,
  deleteFeeStructure,
} from "../../services/supabaseService";
import { getClasses } from "../../services/classStudentService"; // Fixed import
import SkeletonLoader from "../user/SkeletonLoader";
import { sendFeeStructureNotification } from "../../services/notificationService";

const FeeStructureManager = ({ refreshTimestamp, fetchData }) => {
  const [feeStructures, setFeeStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [currentFee, setCurrentFee] = useState(null);
  const [formData, setFormData] = useState({
    className: "",
    admissionFee: "",
    annualFee: "",
    monthlyFee: "",
  });

  useEffect(() => {
    fetchFeeStructures();
  }, [refreshTimestamp]);

  const fetchFeeStructures = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getFeeStructure();
      setFeeStructures(data);
    } catch (err) {
      console.error("Error fetching fee structures:", err);
      setError("Failed to load fee structures. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleShowModal = (fee = null) => {
    if (fee) {
      setCurrentFee(fee);
      setFormData({
        className: fee.class_name || "",
        admissionFee: fee.admission_fee || "",
        annualFee: fee.annual_fee || "",
        monthlyFee: fee.monthly_fee || "",
      });
    } else {
      setCurrentFee(null);
      setFormData({
        className: "",
        admissionFee: "",
        annualFee: "",
        monthlyFee: "",
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentFee(null);
    setFormData({
      className: "",
      admissionFee: "",
      annualFee: "",
      monthlyFee: "",
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError("");

      const feeData = {
        className: formData.className,
        admissionFee: parseFloat(formData.admissionFee) || 0,
        annualFee: parseFloat(formData.annualFee) || 0,
        monthlyFee: parseFloat(formData.monthlyFee) || 0,
      };

      if (currentFee) {
        // Update existing fee structure
        await updateFeeStructure(currentFee.id, feeData);
        // Send notification for updated fee structure
        await sendFeeStructureNotification("update");
      } else {
        // Add new fee structure
        await addFeeStructure(feeData);
        // Send notification for new fee structure
        await sendFeeStructureNotification("add");
      }

      handleCloseModal();
      fetchFeeStructures();
    } catch (err) {
      console.error("Error saving fee structure:", err);
      setError("Failed to save fee structure. Please try again.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this fee structure?")) {
      try {
        setError("");
        await deleteFeeStructure(id);
        fetchFeeStructures();
      } catch (err) {
        console.error("Error deleting fee structure:", err);
        setError("Failed to delete fee structure. Please try again.");
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col xs={12}>
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <h3 className="mb-0">Fee Structure Management</h3>
            <Button variant="primary" onClick={() => handleShowModal()}>
              Add New Class
            </Button>
          </div>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" onClose={() => setError("")} dismissible>
          {error}
        </Alert>
      )}

      <Row>
        <Col xs={12}>
          <Card>
            <Card.Body className="p-0">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table striped bordered hover responsive className="mb-0">
                    <thead>
                      <tr>
                        <th>Class</th>
                        <th>Admission Fee</th>
                        <th>Annual Fee</th>
                        <th>Monthly Fee</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {feeStructures.map((fee) => (
                        <tr key={fee.id}>
                          <td>{fee.class_name}</td>
                          <td>{formatCurrency(fee.admission_fee)}</td>
                          <td>{formatCurrency(fee.annual_fee)}</td>
                          <td>{formatCurrency(fee.monthly_fee)}</td>
                          <td>
                            <div className="d-flex justify-content-end gap-2">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleShowModal(fee)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleDelete(fee.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {feeStructures.length === 0 && (
                        <tr>
                          <td colSpan="5" className="text-center py-3">
                            No fee structures found. Add a new class to get
                            started.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal for Add/Edit Fee Structure */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>
            {currentFee ? "Edit Fee Structure" : "Add New Fee Structure"}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Class Name</Form.Label>
              <Form.Control
                type="text"
                name="className"
                value={formData.className}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Admission Fee (₹)</Form.Label>
                  <Form.Control
                    type="number"
                    name="admissionFee"
                    value={formData.admissionFee}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Annual Fee (₹)</Form.Label>
                  <Form.Control
                    type="number"
                    name="annualFee"
                    value={formData.annualFee}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Monthly Fee (₹)</Form.Label>
              <Form.Control
                type="number"
                name="monthlyFee"
                value={formData.monthlyFee}
                onChange={handleChange}
                min="0"
                step="0.01"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="flex-column flex-md-row gap-2">
            <Button
              variant="secondary"
              onClick={handleCloseModal}
              className="w-100 w-md-auto"
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" className="w-100 w-md-auto">
              {currentFee ? "Update" : "Save"} Fee Structure
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default FeeStructureManager;
