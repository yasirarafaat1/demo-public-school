import React, { useState, useEffect } from "react";
import {
  getClasses,
  addClass,
  updateClass,
  deleteClass,
  getSessions,
  addSession,
  updateSession,
} from "../../services/classStudentService";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Button,
  Modal,
  Form,
  Alert,
  Spinner,
  InputGroup,
} from "react-bootstrap";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSave,
  FaTimes,
  FaArrowLeft,
} from "react-icons/fa";

const ClassManager = ({ refreshTimestamp, fetchData }) => {
  const [classes, setClasses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form states
  const [showClassModal, setShowClassModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [deletingClass, setDeletingClass] = useState(null);

  // View states
  const [viewMode, setViewMode] = useState("list"); // 'list'
  const [showAddClassForm, setShowAddClassForm] = useState(false);
  const [showAddSessionForm, setShowAddSessionForm] = useState(false);
  const [editingClass, setEditingClassForForm] = useState(null);
  const [editingSession, setEditingSessionForForm] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);

  // Class form data
  const [classFormData, setClassFormData] = useState({
    classNumber: "",
    classCode: "",
  });

  // Session form data
  const [sessionFormData, setSessionFormData] = useState({
    startDate: "",
    endDate: "",
  });

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, [refreshTimestamp]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [classesData, sessionsData] = await Promise.all([
        getClasses(),
        getSessions(),
      ]);
      setClasses(classesData);
      setSessions(sessionsData);
      setError("");
    } catch (err) {
      setError("Failed to load data. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle class form input changes
  const handleClassFormChange = (e) => {
    const { name, value } = e.target;
    setClassFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle session form input changes
  const handleSessionFormChange = (e) => {
    const { name, value } = e.target;
    setSessionFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Open class form for adding
  const openAddClassForm = () => {
    setEditingClass(null);
    setSelectedClass(null);
    setClassFormData({
      classNumber: "",
      classCode: "",
    });
    setShowAddClassForm(true);
  };

  // Open class form for editing
  const openEditClassForm = (classObj) => {
    setEditingClass(classObj);
    setSelectedClass(classObj);
    setClassFormData({
      classNumber: classObj.class_number,
      classCode: classObj.class_code,
    });
    setShowAddClassForm(true);
  };

  // Close class form
  const closeClassForm = () => {
    setViewMode("list");
    setEditingClass(null);
    setSelectedClass(null);
    setClassFormData({
      classNumber: "",
      classCode: "",
    });
  };

  // Open session form for adding
  const openAddSessionForm = () => {
    setEditingSession(null); // Clear any editing session state
    setSessionFormData({
      startDate: "",
      endDate: "",
    });
    setShowAddSessionForm(true);
  };

  // Open session form for editing
  const openEditSessionForm = (session) => {
    setEditingClass(null); // Clear any class editing state
    setEditingSession(session); // Set the session being edited
    setSessionFormData({
      startDate: `${session.start_year}-${String(session.start_month).padStart(
        2,
        "0"
      )}`,
      endDate: `${session.end_year}-${String(session.end_month).padStart(
        2,
        "0"
      )}`,
    });
    setViewMode("addSession");
  };

  // Close session form
  const closeSessionForm = () => {
    setViewMode("list");
    setEditingSession(null); // Clear editing session state
    setSessionFormData({
      startDate: "",
      endDate: "",
    });
  };

  // Handle class form submission
  const handleClassFormSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!classFormData.classNumber || !classFormData.classCode) {
      setError("Both class number and class code are required.");
      return;
    }

    // Validate class code format (1 uppercase letter + 3 digits)
    const classCodeRegex = /^[A-Z]\d{3}$/;
    if (!classCodeRegex.test(classFormData.classCode)) {
      setError(
        "Class code must be in the format: one uppercase letter followed by three digits (e.g., A101)."
      );
      return;
    }

    try {
      setLoading(true);
      if (editingClass) {
        // Update existing class
        await updateClass(editingClass.id, {
          classNumber: classFormData.classNumber,
          classCode: classFormData.classCode,
        });
        setSuccess("Class updated successfully!");
      } else {
        // Add new class
        await addClass({
          classNumber: classFormData.classNumber,
          classCode: classFormData.classCode,
        });
        setSuccess("Class added successfully!");
      }

      // Refresh data
      await loadData();
      if (fetchData) {
        fetchData();
      }
      closeClassForm();
    } catch (err) {
      setError("Failed to save class. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle session form submission
  const handleSessionFormSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!sessionFormData.startDate || !sessionFormData.endDate) {
      setError("All session fields are required.");
      return;
    }

    // Parse dates
    const startDate = new Date(sessionFormData.startDate + "-01");
    const endDate = new Date(sessionFormData.endDate + "-01");

    // Validate that end date is after start date
    if (endDate < startDate) {
      setError("End date must be after start date.");
      return;
    }

    try {
      setLoading(true);

      // Check if we're editing an existing session
      // Since there's no direct way to identify the session being edited in the current structure,
      // we need to pass the session object to identify it
      // We'll need to track the editing session separately
      const sessionData = {
        startYear: startDate.getFullYear(),
        startMonth: startDate.getMonth() + 1,
        endYear: endDate.getFullYear(),
        endMonth: endDate.getMonth() + 1,
      };

      if (editingSession) {
        await updateSession(editingSession.id, sessionData);
        setSuccess("Session updated successfully!");
      } else {
        await addSession(sessionData);
        setSuccess("Session added successfully!");
      }

      // Refresh data
      await loadData();
      if (fetchData) {
        fetchData();
      }
      closeSessionForm();
    } catch (err) {
      setError("Failed to save session. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Confirm class deletion
  const confirmDeleteClass = (classObj) => {
    setDeletingClass(classObj);
  };

  // Cancel class deletion
  const cancelDeleteClass = () => {
    setDeletingClass(null);
  };

  // Delete class
  const handleDeleteClass = async () => {
    if (!deletingClass) return;

    try {
      setLoading(true);
      await deleteClass(deletingClass.id);
      setSuccess("Class deleted successfully!");

      // Refresh data
      await loadData();
      if (fetchData) {
        fetchData();
      }
      cancelDeleteClass();
    } catch (err) {
      setError("Failed to delete class. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Clear messages after timeout
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError("");
        setSuccess("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <h3>Class & Session Management</h3>
          <p>Manage classes and academic sessions</p>
        </Col>
      </Row>

      {(error || success) && (
        <Row className="mb-3">
          <Col>
            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}
          </Col>
        </Row>
      )}

      {viewMode === "list" && (
        <Row className="mb-4">
          <Col md={6}>
            <Card>
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Classes</h5>
                <Button variant="primary" size="sm" onClick={openAddClassForm}>
                  <FaPlus className="me-1" /> Add Class
                </Button>
              </Card.Header>
              <Card.Body>
                {loading && classes.length === 0 ? (
                  <div className="text-center py-4">
                    <Spinner animation="border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </Spinner>
                  </div>
                ) : classes.length === 0 ? (
                  <p className="text-muted text-center">
                    No classes found. Add your first class.
                  </p>
                ) : (
                  <div className="table-responsive">
                    <Table striped bordered hover size="sm">
                      <thead>
                        <tr>
                          <th>Class Number</th>
                          <th>Class Code</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classes.map((classObj) => (
                          <tr key={classObj.id}>
                            <td>{classObj.class_number}</td>
                            <td>{classObj.class_code}</td>
                            <td>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                className="me-2"
                                onClick={() => openEditClassForm(classObj)}
                              >
                                <FaEdit />
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => confirmDeleteClass(classObj)}
                              >
                                <FaTrash />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          <Col md={6}>
            <Card>
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Sessions</h5>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={openAddSessionForm}
                >
                  <FaPlus className="me-1" /> Add Session
                </Button>
              </Card.Header>
              <Card.Body>
                {loading && sessions.length === 0 ? (
                  <div className="text-center py-4">
                    <Spinner animation="border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </Spinner>
                  </div>
                ) : sessions.length === 0 ? (
                  <p className="text-muted text-center">
                    No sessions found. Add your first session.
                  </p>
                ) : (
                  <div className="table-responsive">
                    <Table striped bordered hover size="sm">
                      <thead>
                        <tr>
                          {/* <th>Session Year</th> */}
                          <th>Start Date</th>
                          <th>End Date</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sessions.map((session) => (
                          <tr key={session.id}>
                            {/* <td>{session.session_year}</td> */}
                            <td>
                              {session.start_month}/{session.start_year}
                            </td>
                            <td>
                              {session.end_month}/{session.end_year}
                            </td>
                            <td>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                className="me-2"
                                onClick={() => openEditSessionForm(session)}
                              >
                                <FaEdit />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Class Form (Full Page View) */}
      {(viewMode === "addClass" || viewMode === "editClass") && (
        <Card className="mb-4">
          <Card.Header>
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                {editingClass ? "Edit Class" : "Add New Class"}
              </h5>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={closeClassForm}
              >
                <FaArrowLeft className="me-1" /> Back to List
              </Button>
            </div>
          </Card.Header>
          <Card.Body>
            <Form onSubmit={handleClassFormSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Class Number *</Form.Label>
                <Form.Control
                  type="text"
                  name="classNumber"
                  value={classFormData.classNumber}
                  onChange={handleClassFormChange}
                  placeholder="e.g., Ist, IInd, IIIrd, IVth, Vth, VIth"
                  required
                />
                <Form.Text className="text-muted">
                  Enter class number in Roman numerals (e.g., Ist, IInd, IIIrd,
                  IVth, Vth, VIth)
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Class Code *</Form.Label>
                <Form.Control
                  type="text"
                  name="classCode"
                  value={classFormData.classCode}
                  onChange={handleClassFormChange}
                  placeholder="e.g., A101, B305"
                  required
                />
                <Form.Text className="text-muted">
                  Enter class code (one uppercase letter followed by three
                  digits)
                </Form.Text>
              </Form.Group>

              <div className="d-flex justify-content-end gap-2">
                <Button
                  variant="secondary"
                  onClick={closeClassForm}
                  disabled={loading}
                >
                  <FaTimes className="me-1" /> Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-1" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaSave className="me-1" />{" "}
                      {editingClass ? "Update" : "Save"}
                    </>
                  )}
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      )}

      {/* Session Form (Full Page View) */}
      {viewMode === "addSession" && (
        <Card className="mb-4">
          <Card.Header>
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                {editingSession ? "Edit Session" : "Add New Session"}
              </h5>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={closeSessionForm}
              >
                <FaArrowLeft className="me-1" /> Back to List
              </Button>
            </div>
          </Card.Header>
          <Card.Body>
            <Form onSubmit={handleSessionFormSubmit}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Start Date *</Form.Label>
                    <Form.Control
                      type="month"
                      name="startDate"
                      value={sessionFormData.startDate}
                      onChange={handleSessionFormChange}
                      required
                    />
                    <Form.Text className="text-muted">
                      Select start month and year
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>End Date *</Form.Label>
                    <Form.Control
                      type="month"
                      name="endDate"
                      value={sessionFormData.endDate}
                      onChange={handleSessionFormChange}
                      required
                    />
                    <Form.Text className="text-muted">
                      Select end month and year
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>

              <div className="d-flex justify-content-end gap-2">
                <Button
                  variant="secondary"
                  onClick={closeSessionForm}
                  disabled={loading}
                >
                  <FaTimes className="me-1" /> Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-1" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaSave className="me-1" />{" "}
                      {editingSession ? "Update" : "Save"}
                    </>
                  )}
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      <Modal show={!!deletingClass} onHide={cancelDeleteClass}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {deletingClass && (
            <p>
              Are you sure you want to delete class "
              <strong>{deletingClass.class_number}</strong>" with code "
              <strong>{deletingClass.class_code}</strong>"? This action cannot
              be undone.
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={cancelDeleteClass}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteClass}
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-1" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ClassManager;
