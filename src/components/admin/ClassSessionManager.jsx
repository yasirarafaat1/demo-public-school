import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Tabs,
  Tab,
  Table,
  Alert,
  Spinner,
  Badge,
  Form,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import {
  FaSync,
  FaUser,
  FaUsers,
  FaChalkboardTeacher,
  FaArrowLeft,
  FaSave,
  FaTimes,
  FaEdit,
  FaTrash,
} from "react-icons/fa";
import {
  getClasses,
  getSessions,
  getStudentClasses,
  getStudents,
  isSessionInPast,
  addClass,
  updateClass,
  deleteClass,
  addSession,
  updateSession,
} from "../../services/classStudentService";
import StudentProfile from "../user/StudentProfile";
import SkeletonLoader from "../user/SkeletonLoader";

const ClassSessionManager = ({ refreshTimestamp }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("classes");
  const [loading, setLoading] = useState({
    classes: false,
    sessions: false,
    students: false,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showStudentProfile, setShowStudentProfile] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // View mode states
  const [viewMode, setViewMode] = useState("list"); // 'list', 'addClass', 'addSession'
  const [editingClass, setEditingClass] = useState(null);
  const [editingSession, setEditingSession] = useState(null);
  const [editingClassId, setEditingClassId] = useState(null); // Track which class is being edited
  const [editingSessionId, setEditingSessionId] = useState(null); // Track which session is being edited

  // Form data states
  const [classFormData, setClassFormData] = useState({
    classNumber: "",
    classCode: "",
  });
  const [sessionFormData, setSessionFormData] = useState({
    startDate: "",
    endDate: "",
  });

  // Data states
  const [classes, setClasses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [allStudentClasses, setAllStudentClasses] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);

  // Filtered data for current session
  const [currentSessionClasses, setCurrentSessionClasses] = useState([]);
  const [currentSessionClassStudents, setCurrentSessionClassStudents] =
    useState({});

  // Load all data on component mount and when refreshTimestamp changes
  useEffect(() => {
    loadData();
  }, [refreshTimestamp]); // This ensures the data is refreshed when the refresh button is clicked in the admin panel

  // Update current session and filtered data when sessions change
  useEffect(() => {
    if (sessions.length > 0) {
      // Find the current (non-past) session
      const current = sessions.find((session) => !isSessionInPast(session));
      setCurrentSession(current || sessions[0]); // Use first session if no current session
    }
  }, [sessions]);

  useEffect(() => {
    if (currentSession && classes.length > 0 && allStudentClasses.length > 0) {
      // Filter classes for current session
      const currentSessionClassesData = classes.map((cls) => {
        const classAssignments = allStudentClasses.filter(
          (sc) => sc.class_id === cls.id && sc.session_id === currentSession.id
        );
        return {
          ...cls,
          studentCount: classAssignments.length,
          assignments: classAssignments,
        };
      });
      setCurrentSessionClasses(currentSessionClassesData);

      // Get students for each class in current session
      const classStudents = {};
      classes.forEach((cls) => {
        const classAssignments = allStudentClasses.filter(
          (sc) => sc.class_id === cls.id && sc.session_id === currentSession.id
        );
        const studentIds = classAssignments.map((sc) => sc.student_id);
        const classStudentsList = allStudents.filter((student) =>
          studentIds.includes(student.id)
        );
        classStudents[cls.id] = classStudentsList;
      });
      setCurrentSessionClassStudents(classStudents);
    }
  }, [currentSession, classes, allStudentClasses, allStudents]);

  // Handle form input changes
  const handleClassFormChange = (e) => {
    const { name, value } = e.target;
    setClassFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSessionFormChange = (e) => {
    const { name, value } = e.target;
    setSessionFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Functions to handle adding/editing
  const openAddClassForm = () => {
    setEditingClass(null);
    setEditingClassId(null);
    setClassFormData({
      classNumber: "",
      classCode: "",
    });
    setViewMode("addClass");
  };

  const openEditClassForm = (cls) => {
    setEditingClass(cls);
    setEditingClassId(cls.id);
    setClassFormData({
      classNumber: cls.class_number,
      classCode: cls.class_code,
    });
    setViewMode("list"); // Don't change view mode, just set the editing ID
  };

  const openAddSessionForm = () => {
    setEditingSession(null);
    setEditingSessionId(null);
    setSessionFormData({
      startDate: "",
      endDate: "",
    });
    setViewMode("addSession");
  };

  const openEditSessionForm = (session) => {
    setEditingSession(session);
    setEditingSessionId(session.id);
    // Format dates for the month input (YYYY-MM format)
    const startDateStr = `${session.start_year}-${String(
      session.start_month
    ).padStart(2, "0")}`;
    const endDateStr = `${session.end_year}-${String(
      session.end_month
    ).padStart(2, "0")}`;

    setSessionFormData({
      startDate: startDateStr,
      endDate: endDateStr,
    });
    setViewMode("list"); // Don't change view mode, just set the editing ID
  };

  const closeForm = () => {
    setViewMode("list");
    setEditingClass(null);
    setEditingClassId(null);
    setEditingSession(null);
    setEditingSessionId(null);
    setClassFormData({
      classNumber: "",
      classCode: "",
    });
    setSessionFormData({
      startDate: "",
      endDate: "",
    });
  };

  const handleClassSubmit = async (e) => {
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
      setLoading({ ...loading, classes: true });
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
      closeForm();
    } catch (err) {
      setError("Failed to save class. Please try again.");
      console.error(err);
    } finally {
      setLoading({ ...loading, classes: false });
    }
  };

  const handleSessionSubmit = async (e) => {
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
      setLoading({ ...loading, sessions: true });
      if (editingSession) {
        // Update existing session
        await updateSession(editingSession.id, {
          startYear: startDate.getFullYear(),
          startMonth: startDate.getMonth() + 1,
          endYear: endDate.getFullYear(),
          endMonth: endDate.getMonth() + 1,
        });
        setSuccess("Session updated successfully!");
      } else {
        // Add new session
        await addSession({
          startYear: startDate.getFullYear(),
          startMonth: startDate.getMonth() + 1,
          endYear: endDate.getFullYear(),
          endMonth: endDate.getMonth() + 1,
        });
        setSuccess("Session added successfully!");
      }

      // Refresh data
      await loadData();
      closeForm();
    } catch (err) {
      setError("Failed to save session. Please try again.");
      console.error(err);
    } finally {
      setLoading({ ...loading, sessions: false });
    }
  };

  const loadData = async () => {
    try {
      setLoading({ classes: true, sessions: true, students: true });

      const [classesData, sessionsData, studentClassesData, studentsData] =
        await Promise.all([
          getClasses(),
          getSessions(),
          getStudentClasses(),
          getStudents(),
        ]);

      setClasses(classesData);
      setSessions(sessionsData);
      setAllStudentClasses(studentClassesData);
      setAllStudents(studentsData);
      setError("");
    } catch (err) {
      setError("Failed to load data. Please try again.");
      console.error(err);
    } finally {
      setLoading({ classes: false, sessions: false, students: false });
    }
  };

  const refreshTabData = async (tab) => {
    try {
      switch (tab) {
        case "classes":
          setLoading((prev) => ({ ...prev, classes: true }));
          const [classesData, studentClassesData, studentsData] =
            await Promise.all([
              getClasses(),
              getStudentClasses(),
              getStudents(),
            ]);
          setClasses(classesData);
          setAllStudentClasses(studentClassesData);
          setAllStudents(studentsData);
          break;
        case "sessions":
          setLoading((prev) => ({ ...prev, sessions: true }));
          const sessionsData = await getSessions();
          setSessions(sessionsData);
          break;
        default:
          break;
      }
    } catch (err) {
      setError("Failed to refresh data. Please try again.");
      console.error(err);
    } finally {
      setLoading((prev) => ({ ...prev, [tab]: false }));
    }
  };

  const handleViewClassStudents = (classId) => {
    // Navigate to a new page showing students in this class
    navigate(`/admin/class/${classId}/students`);
  };

  const handleViewStudentProfile = (student) => {
    setSelectedStudent(student);
    setShowStudentProfile(true);
  };

  const handleBackToManager = () => {
    setShowStudentProfile(false);
    setSelectedStudent(null);
  };

  if (showStudentProfile && selectedStudent) {
    return (
      <StudentProfile
        student={selectedStudent}
        onBack={handleBackToManager}
        onUpdate={() => refreshTabData("classes")}
      />
    );
  }

  return (
    <Container fluid className="py-4">
      <Row>
        <Col>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h4>Classes & Sessions Management</h4>
              <div className="d-flex gap-2">
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => refreshTabData(activeTab)}
                  disabled={loading[activeTab]}
                >
                  <FaSync
                    className={`me-2 ${loading[activeTab] ? "fa-spin" : ""}`}
                  />
                  Refresh {activeTab === "classes" ? "Classes" : "Sessions"}
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              {error && (
                <Alert
                  variant="danger"
                  onClose={() => setError("")}
                  dismissible
                >
                  {error}
                </Alert>
              )}

              {success && (
                <Alert
                  variant="success"
                  onClose={() => setSuccess("")}
                  dismissible
                >
                  {success}
                </Alert>
              )}

              <Tabs
                activeKey={activeTab}
                onSelect={(tab) => setActiveTab(tab)}
                className="mb-3"
              >
                {/* Classes Tab */}
                <Tab eventKey="classes" title="Classes">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5>
                      Classes in Current Session:{" "}
                      {currentSession ? (
                        <Badge bg="primary">
                          {currentSession.start_year} -{" "}
                          {currentSession.end_year}
                        </Badge>
                      ) : (
                        "No current session"
                      )}
                    </h5>
                    <Button variant="primary" onClick={openAddClassForm}>
                      Add Class
                    </Button>
                  </div>

                  {/* Add Class Form at the top when in add mode */}
                  {viewMode === "addClass" && (
                    <Card className="mb-4">
                      <Card.Header>
                        <div className="d-flex justify-content-between align-items-center">
                          <h5>Add New Class</h5>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={closeForm}
                          >
                            <FaTimes className="me-1" /> Cancel
                          </Button>
                        </div>
                      </Card.Header>
                      <Card.Body>
                        <Form onSubmit={handleClassSubmit}>
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
                              Enter class number in Roman numerals (e.g., Ist,
                              IInd, IIIrd, IVth, Vth, VIth)
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
                              Enter class code (one uppercase letter followed by
                              three digits)
                            </Form.Text>
                          </Form.Group>

                          <div className="d-flex justify-content-end gap-2">
                            <Button
                              variant="secondary"
                              onClick={closeForm}
                              disabled={loading.classes}
                            >
                              <FaTimes className="me-1" /> Cancel
                            </Button>
                            <Button
                              variant="primary"
                              type="submit"
                              disabled={loading.classes}
                            >
                              {loading.classes ? (
                                <>
                                  <Spinner
                                    animation="border"
                                    size="sm"
                                    className="me-1"
                                  />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <FaSave className="me-1" /> Save
                                </>
                              )}
                            </Button>
                          </div>
                        </Form>
                      </Card.Body>
                    </Card>
                  )}

                  {loading.classes ? (
                    <div className="table-responsive">
                      <Table striped bordered hover>
                        <thead>
                          <tr>
                            <th>Class</th>
                            <th>Class Code</th>
                            <th>Student Count</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          <SkeletonLoader type="table-row" count={5} />
                        </tbody>
                      </Table>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <Table striped bordered hover>
                        <thead>
                          <tr>
                            <th>Class</th>
                            <th>Class Code</th>
                            <th>Student Count</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentSessionClasses.length > 0 ? (
                            currentSessionClasses.map((cls) => (
                              <React.Fragment key={cls.id}>
                                {/* Edit Class Form below the specific class */}
                                {editingClassId === cls.id && (
                                  <tr>
                                    <td colSpan="4">
                                      <Card className="mb-3">
                                        <Card.Body>
                                          <Form onSubmit={handleClassSubmit}>
                                            <Form.Group className="mb-3">
                                              <Form.Label>
                                                Class Number *
                                              </Form.Label>
                                              <Form.Control
                                                type="text"
                                                name="classNumber"
                                                value={
                                                  classFormData.classNumber
                                                }
                                                onChange={handleClassFormChange}
                                                placeholder="e.g., Ist, IInd, IIIrd, IVth, Vth, VIth"
                                                required
                                              />
                                            </Form.Group>

                                            <Form.Group className="mb-3">
                                              <Form.Label>
                                                Class Code *
                                              </Form.Label>
                                              <Form.Control
                                                type="text"
                                                name="classCode"
                                                value={classFormData.classCode}
                                                onChange={handleClassFormChange}
                                                placeholder="e.g., A101, B305"
                                                required
                                              />
                                            </Form.Group>

                                            <div className="d-flex justify-content-end gap-2">
                                              <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => {
                                                  setEditingClassId(null);
                                                  setEditingClass(null);
                                                }}
                                                disabled={loading.classes}
                                              >
                                                <FaTimes className="me-1" />{" "}
                                                Cancel
                                              </Button>
                                              <Button
                                                variant="primary"
                                                size="sm"
                                                type="submit"
                                                disabled={loading.classes}
                                              >
                                                {loading.classes ? (
                                                  <>
                                                    <Spinner
                                                      animation="border"
                                                      size="sm"
                                                      className="me-1"
                                                    />
                                                    Saving...
                                                  </>
                                                ) : (
                                                  <>
                                                    <FaSave className="me-1" />{" "}
                                                    Update
                                                  </>
                                                )}
                                              </Button>
                                            </div>
                                          </Form>
                                        </Card.Body>
                                      </Card>
                                    </td>
                                  </tr>
                                )}
                                <tr>
                                  <td>{cls.class_number}</td>
                                  <td>{cls.class_code}</td>
                                  <td>
                                    <Badge bg="info">
                                      {cls.studentCount} students
                                    </Badge>
                                  </td>
                                  <td>
                                    <Button
                                      variant="outline-primary"
                                      size="sm"
                                      onClick={() =>
                                        handleViewClassStudents(cls.id)
                                      }
                                      className="me-2"
                                    >
                                      <FaUsers className="me-1" /> View Students
                                    </Button>
                                    <Button
                                      variant="outline-secondary"
                                      size="sm"
                                      onClick={() => openEditClassForm(cls)}
                                    >
                                      <FaEdit className="me-1" /> Edit
                                    </Button>
                                  </td>
                                </tr>
                              </React.Fragment>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan="4"
                                className="text-center text-muted"
                              >
                                No classes found for current session
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </Tab>

                {/* Sessions Tab */}
                <Tab eventKey="sessions" title="Sessions">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5>All Sessions</h5>
                    <Button variant="primary" onClick={openAddSessionForm}>
                      Add Session
                    </Button>
                  </div>

                  {/* Add Session Form at the top when in add mode */}
                  {viewMode === "addSession" && (
                    <Card className="mb-4">
                      <Card.Header>
                        <div className="d-flex justify-content-between align-items-center">
                          <h5>Add New Session</h5>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={closeForm}
                          >
                            <FaTimes className="me-1" /> Cancel
                          </Button>
                        </div>
                      </Card.Header>
                      <Card.Body>
                        <Form onSubmit={handleSessionSubmit}>
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
                              onClick={closeForm}
                              disabled={loading.sessions}
                            >
                              <FaTimes className="me-1" /> Cancel
                            </Button>
                            <Button
                              variant="primary"
                              type="submit"
                              disabled={loading.sessions}
                            >
                              {loading.sessions ? (
                                <>
                                  <Spinner
                                    animation="border"
                                    size="sm"
                                    className="me-1"
                                  />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <FaSave className="me-1" /> Save
                                </>
                              )}
                            </Button>
                          </div>
                        </Form>
                      </Card.Body>
                    </Card>
                  )}

                  {loading.sessions ? (
                    <div className="table-responsive">
                      <Table striped bordered hover>
                        <thead>
                          <tr>
                            <th>Session</th>
                            <th>Start Date</th>
                            <th>End Date</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          <SkeletonLoader type="table-row" count={5} />
                        </tbody>
                      </Table>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <Table striped bordered hover>
                        <thead>
                          <tr>
                            <th>Session</th>
                            <th>Start Date</th>
                            <th>End Date</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sessions.length > 0 ? (
                            sessions.map((session) => (
                              <React.Fragment key={session.id}>
                                {/* Edit Session Form below the specific session */}
                                {editingSessionId === session.id && (
                                  <tr>
                                    <td colSpan="5">
                                      <Card className="mb-3">
                                        <Card.Body>
                                          <Form onSubmit={handleSessionSubmit}>
                                            <Row>
                                              <Col md={6}>
                                                <Form.Group className="mb-3">
                                                  <Form.Label>
                                                    Start Date *
                                                  </Form.Label>
                                                  <Form.Control
                                                    type="month"
                                                    name="startDate"
                                                    value={
                                                      sessionFormData.startDate
                                                    }
                                                    onChange={
                                                      handleSessionFormChange
                                                    }
                                                    required
                                                  />
                                                </Form.Group>
                                              </Col>
                                              <Col md={6}>
                                                <Form.Group className="mb-3">
                                                  <Form.Label>
                                                    End Date *
                                                  </Form.Label>
                                                  <Form.Control
                                                    type="month"
                                                    name="endDate"
                                                    value={
                                                      sessionFormData.endDate
                                                    }
                                                    onChange={
                                                      handleSessionFormChange
                                                    }
                                                    required
                                                  />
                                                </Form.Group>
                                              </Col>
                                            </Row>

                                            <div className="d-flex justify-content-end gap-2">
                                              <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => {
                                                  setEditingSessionId(null);
                                                  setEditingSession(null);
                                                }}
                                                disabled={loading.sessions}
                                              >
                                                <FaTimes className="me-1" />{" "}
                                                Cancel
                                              </Button>
                                              <Button
                                                variant="primary"
                                                size="sm"
                                                type="submit"
                                                disabled={loading.sessions}
                                              >
                                                {loading.sessions ? (
                                                  <>
                                                    <Spinner
                                                      animation="border"
                                                      size="sm"
                                                      className="me-1"
                                                    />
                                                    Saving...
                                                  </>
                                                ) : (
                                                  <>
                                                    <FaSave className="me-1" />{" "}
                                                    Update
                                                  </>
                                                )}
                                              </Button>
                                            </div>
                                          </Form>
                                        </Card.Body>
                                      </Card>
                                    </td>
                                  </tr>
                                )}
                                <tr>
                                  <td>
                                    {session.start_year} - {session.end_year}
                                  </td>
                                  <td>
                                    {new Date(
                                      session.start_year,
                                      session.start_month - 1,
                                      1
                                    ).toLocaleDateString()}
                                  </td>
                                  <td>
                                    {new Date(
                                      session.end_year,
                                      session.end_month - 1,
                                      1
                                    ).toLocaleDateString()}
                                  </td>
                                  <td>
                                    {isSessionInPast(session) ? (
                                      <Badge bg="secondary">Past</Badge>
                                    ) : (
                                      <Badge bg="success">Current</Badge>
                                    )}
                                  </td>
                                  <td>
                                    <Button
                                      variant="outline-primary"
                                      size="sm"
                                      onClick={() =>
                                        openEditSessionForm(session)
                                      }
                                      className="me-2"
                                    >
                                      <FaEdit className="me-1" /> Edit
                                    </Button>
                                    <Button
                                      variant="outline-info"
                                      size="sm"
                                      onClick={() => {
                                        setCurrentSession(session);
                                        setActiveTab("classes");
                                      }}
                                    >
                                      View Classes
                                    </Button>
                                  </td>
                                </tr>
                              </React.Fragment>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan="5"
                                className="text-center text-muted"
                              >
                                No sessions found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ClassSessionManager;
