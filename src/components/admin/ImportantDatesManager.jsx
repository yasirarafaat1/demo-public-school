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
import { FaCalendarAlt } from "react-icons/fa";
import {
  getImportantDates,
  addImportantDate,
  updateImportantDate,
  deleteImportantDate,
} from "../../services/supabaseService";
import { sendImportantDateNotification } from "../../services/notificationService";

const ImportantDatesManager = () => {
  const [dates, setDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [currentDate, setCurrentDate] = useState(null);
  const [formData, setFormData] = useState({
    eventName: "",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    fetchImportantDates();
  }, []);

  const fetchImportantDates = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getImportantDates();
      setDates(data);
    } catch (err) {
      console.error("Error fetching important dates:", err);
      setError("Failed to load important dates. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleShowModal = (date = null) => {
    if (date) {
      setCurrentDate(date);
      setFormData({
        eventName: date.event_name || "",
        startDate: date.start_date || "",
        endDate: date.end_date || "",
      });
    } else {
      setCurrentDate(null);
      setFormData({
        eventName: "",
        startDate: "",
        endDate: "",
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentDate(null);
    setFormData({
      eventName: "",
      startDate: "",
      endDate: "",
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

      const dateData = {
        eventName: formData.eventName,
        startDate: formData.startDate,
        endDate: formData.endDate || null,
      };

      if (currentDate) {
        // Update existing date
        await updateImportantDate(currentDate.id, dateData);
        // Send notification for updated important date
        await sendImportantDateNotification("update", formData.eventName);
      } else {
        // Add new date
        await addImportantDate(dateData);
        // Send notification for new important date
        await sendImportantDateNotification("add", formData.eventName);
      }

      handleCloseModal();
      fetchImportantDates();
    } catch (err) {
      console.error("Error saving important date:", err);
      setError("Failed to save important date. Please try again.");
    }
  };

  const handleDelete = async (id) => {
    if (
      window.confirm("Are you sure you want to delete this important date?")
    ) {
      try {
        setError("");
        await deleteImportantDate(id);
        fetchImportantDates();
      } catch (err) {
        console.error("Error deleting important date:", err);
        setError("Failed to delete important date. Please try again.");
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatDateRange = (startDate, endDate) => {
    if (!startDate) return "";

    const start = formatDate(startDate);

    if (endDate) {
      const end = formatDate(endDate);
      return `${start} - ${end}`;
    }

    return start;
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col xs={12}>
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <h3 className="mb-0">Important Dates Management</h3>
            <Button variant="primary" onClick={() => handleShowModal()}>
              Add New Event
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
                        <th>Event</th>
                        <th>Date Range</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dates.map((date) => (
                        <tr key={date.id}>
                          <td>{date.event_name}</td>
                          <td>
                            {formatDateRange(date.start_date, date.end_date)}
                          </td>
                          <td>
                            <div className="d-flex justify-content-end gap-2">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleShowModal(date)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleDelete(date.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {dates.length === 0 && (
                        <tr>
                          <td colSpan="3" className="text-center py-3">
                            No important dates found. Add a new event to get
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

      {/* Modal for Add/Edit Important Date */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>
            {currentDate ? "Edit Important Date" : "Add New Important Date"}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Event Name</Form.Label>
              <Form.Control
                type="text"
                name="eventName"
                value={formData.eventName}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Start Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>End Date (Optional)</Form.Label>
                  <Form.Control
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>
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
              {currentDate ? "Update" : "Save"} Event
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default ImportantDatesManager;
