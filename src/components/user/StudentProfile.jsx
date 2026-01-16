import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Modal,
  Form,
  Alert,
  Spinner,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaEdit, FaTrash, FaSave, FaTimes } from "react-icons/fa";
import { Image } from "react-bootstrap";
import {
  getClasses,
  getSessions,
  updateStudent,
  assignStudentToClass,
  updateStudentClassAssignment,
  deleteStudentClassAssignment,
  getStudentClassesByStudentId, // Updated import
  isSessionInPast, // Import the new function
  deleteStudent,
  getStudentClasses, // Import to check for roll number conflicts
} from "../../services/classStudentService";
import { sendEmail, emailTemplates } from "../../../services/emailService";

const StudentProfile = ({ student, onBack, onUpdate }) => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [allSessions, setAllSessions] = useState([]); // All sessions
  const [activeSessions, setActiveSessions] = useState([]); // Only active sessions for assignment
  const [studentClasses, setStudentClasses] = useState([]); // Now contains all assignments for the student
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deletingStudent, setDeletingStudent] = useState(null); // Track student to delete

  // Form states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteAssignmentModal, setShowDeleteAssignmentModal] =
    useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState(null); // Track which assignment to delete

  // Student form data
  const [studentFormData, setStudentFormData] = useState({
    studentName: "",
    fatherName: "",
    motherName: "",
    dob: "",
    mobileNumber: "",
    email: "",
    registrationNumber: "",
    imageUrl: "",
    street: "",
    cityTownVillage: "",
    district: "",
    state: "",
    country: "",
    pinCode: "",
  });

  // Assignment form data
  const [assignmentFormData, setAssignmentFormData] = useState({
    classId: "",
    sessionId: "",
    rollNumber: "",
  });

  // Filter and sort states
  const [filterClass, setFilterClass] = useState("");
  const [filterSession, setFilterSession] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "class_id",
    direction: "desc",
  });

  // State for duplicate roll number modal
  const [showDuplicateRollModal, setShowDuplicateRollModal] = useState(false);
  const [suggestedRollNumber, setSuggestedRollNumber] = useState("");
  const [existingRollNumber, setExistingRollNumber] = useState("");
  const [existingRollNumbers, setExistingRollNumbers] = useState([]);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, [student]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [classesData, sessionsData, studentClassesData] = await Promise.all(
        [getClasses(), getSessions(), getStudentClassesByStudentId(student.id)] // Updated to get by student ID
      );

      // Filter out past sessions for assignment purposes
      const activeSess = sessionsData.filter(
        (session) => !isSessionInPast(session)
      );
      setClasses(classesData);
      setAllSessions(sessionsData); // Store all sessions for filtering
      setActiveSessions(activeSess); // Store active sessions for assignment
      setStudentClasses(studentClassesData);

      // Initialize form data with student info
      if (student) {
        setStudentFormData({
          studentName: student.student_name || "",
          fatherName: student.father_name || "",
          motherName: student.mother_name || "",
          dob: student.date_of_birth || "",
          mobileNumber: student.mobile_number || "",
          email: student.email || "",
          registrationNumber: student.registration_number || "",
          imageUrl: student.image_url || "",
          street: student.street || "",
          cityTownVillage: student.city_town_village || "",
          district: student.district || "",
          state: student.state || "",
          country: student.country || "",
          pinCode: student.pin_code || "",
        });
      }
      setError("");
    } catch (err) {
      setError("Failed to load. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle student form input changes
  const handleStudentFormChange = (e) => {
    const { name, value } = e.target;
    setStudentFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle assignment form input changes
  const handleAssignmentFormChange = async (e) => {
    const { name, value } = e.target;
    setAssignmentFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // If classId is changed, suggest next available roll number and populate existing roll numbers
    if (name === "classId" && value) {
      try {
        const allStudentClasses = await getStudentClasses();

        // Get all roll numbers for this class
        const rollNumbersInClass = allStudentClasses
          .filter((sc) => sc.class_id === parseInt(value))
          .map((sc) => parseInt(sc.roll_number))
          .sort((a, b) => b - a); // Sort in descending order

        // Set existing roll numbers for dropdown
        setExistingRollNumbers(rollNumbersInClass);

        let nextRollNumber = "000001"; // Default starting roll number
        if (rollNumbersInClass.length > 0) {
          const highestRollNumber = rollNumbersInClass[0];
          const nextRoll = highestRollNumber + 1;
          nextRollNumber = nextRoll.toString().padStart(6, "0");
        }

        setAssignmentFormData((prev) => ({
          ...prev,
          rollNumber: nextRollNumber,
        }));
      } catch (err) {
        console.error("Error getting roll numbers:", err);
      }
    }

    // If sessionId is changed, clear existing roll number selection
    if (name === "sessionId" && value) {
      setExistingRollNumber("");
      setExistingRollNumbers([]);
    }
  };

  // Open edit modal
  const openEditModal = () => {
    setShowEditModal(true);
  };

  // Close edit modal
  const closeEditModal = () => {
    setShowEditModal(false);
  };

  // Close delete assignment confirmation
  const closeDeleteAssignmentModal = () => {
    setShowDeleteAssignmentModal(false);
    setAssignmentToDelete(null);
  };

  // Open delete assignment confirmation
  const openDeleteAssignmentModal = (assignment) => {
    setAssignmentToDelete(assignment);
    setShowDeleteAssignmentModal(true);
  };

  // Close duplicate roll number modal and reset form
  const closeDuplicateRollModal = () => {
    setShowDuplicateRollModal(false);
    // Reset form to clear any entered data
    setAssignmentFormData({
      classId: "",
      sessionId: "",
      rollNumber: "",
    });
  };

  // Handle student form submission
  const handleStudentFormSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (
      !studentFormData.studentName ||
      !studentFormData.fatherName ||
      !studentFormData.motherName ||
      !studentFormData.dob
    ) {
      setError(
        "Student name, father name, mother name, and date of birth are required."
      );
      return;
    }

    try {
      setLoading(true);
      // Update existing student
      await updateStudent(student.id, {
        studentName: studentFormData.studentName,
        fatherName: studentFormData.fatherName,
        motherName: studentFormData.motherName,
        dob: studentFormData.dob,
        mobileNumber: studentFormData.mobileNumber,
        email: studentFormData.email,
        registrationNumber: studentFormData.registrationNumber,
        imageUrl: studentFormData.imageUrl,
        street: studentFormData.street,
        cityTownVillage: studentFormData.cityTownVillage,
        district: studentFormData.district,
        state: studentFormData.state,
        country: studentFormData.country,
        pinCode: studentFormData.pinCode,
      });

      setSuccess("Student updated successfully!");

      // Notify parent component of update
      if (onUpdate) {
        onUpdate();
      }

      closeEditModal();
    } catch (err) {
      setError("Failed to update student. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle assignment form submission
  const handleAssignmentFormSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (
      !assignmentFormData.classId ||
      !assignmentFormData.sessionId ||
      !assignmentFormData.rollNumber
    ) {
      setError("Class, session, and roll number are required.");
      return;
    }

    // Validate roll number is 6 digits
    if (!/^\d{6}$/.test(assignmentFormData.rollNumber)) {
      setError("Roll number must be exactly 6 digits.");
      return;
    }

    // Check if roll number already exists in this class
    try {
      const allStudentClasses = await getStudentClasses();
      const existingRollNumber = allStudentClasses.find(
        (sc) =>
          sc.class_id === parseInt(assignmentFormData.classId) &&
          sc.roll_number === assignmentFormData.rollNumber
      );

      if (existingRollNumber) {
        // Find the next available roll number
        const rollNumbersInClass = allStudentClasses
          .filter((sc) => sc.class_id === parseInt(assignmentFormData.classId))
          .map((sc) => parseInt(sc.roll_number))
          .sort((a, b) => b - a);

        let nextRollNumber = "000001";
        if (rollNumbersInClass.length > 0) {
          const highestRollNumber = rollNumbersInClass[0];
          const nextRoll = highestRollNumber + 1;
          nextRollNumber = nextRoll.toString().padStart(6, "0");
        }

        setSuggestedRollNumber(nextRollNumber);
        setShowDuplicateRollModal(true); // Show the duplicate roll number modal
        return;
      }
    } catch (err) {
      console.error("Error checking roll number:", err);
      setError("Error checking roll number. Please try again.");
      return;
    }

    // Check if student is already assigned to this class and session (prevent duplicates)
    const existingAssignment = studentClasses.find(
      (sc) =>
        sc.class_id === parseInt(assignmentFormData.classId) &&
        sc.session_id === parseInt(assignmentFormData.sessionId)
    );

    if (existingAssignment) {
      setError("Student is already assigned to this class and session.");
      return;
    }

    // Check if the selected session is in the past
    const selectedSession = activeSessions.find(
      (s) => s.id === parseInt(assignmentFormData.sessionId)
    );
    if (isSessionInPast(selectedSession)) {
      setError("Cannot assign student to a past session.");
      return;
    }

    try {
      setLoading(true);

      // Add new assignment
      const newAssignment = await assignStudentToClass({
        studentId: student.id,
        classId: parseInt(assignmentFormData.classId),
        sessionId: parseInt(assignmentFormData.sessionId),
        rollNumber: assignmentFormData.rollNumber,
      });

      // Send class assignment email if student has email
      if (studentFormData.email) {
        try {
          const classData = classes.find(c => c.id === parseInt(assignmentFormData.classId));
          const sessionData = allSessions.find(s => s.id === parseInt(assignmentFormData.sessionId));
          
          await sendEmail(emailTemplates.classAssignment(
            studentFormData,
            { ...classData, rollNumber: assignmentFormData.rollNumber },
            sessionData
          ));
          console.log("Class assignment email sent successfully");
        } catch (emailError) {
          console.error("Failed to send class assignment email:", emailError);
          // Don't fail the whole process if email fails
        }
      }

      setSuccess("Student assigned to class successfully!");

      // Reload data to reflect changes
      await loadData();

      // Reset form
      setAssignmentFormData({
        classId: "",
        sessionId: "",
        rollNumber: "",
      });
      setExistingRollNumber("");
      setExistingRollNumbers([]);
    } catch (err) {
      if (err.message && err.message.includes('already assigned')) {
        setError("Student is already assigned to this class for this session.");
      } else {
        setError("Failed to save assignment. Please try again.");
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete assignment
  const handleDeleteAssignment = async () => {
    if (!assignmentToDelete) return;

    try {
      setLoading(true);

      await deleteStudentClassAssignment(assignmentToDelete.id);
      setSuccess("Student assignment deleted successfully!");

      // Reload data to reflect changes
      await loadData();

      closeDeleteAssignmentModal();
    } catch (err) {
      setError("Failed to delete assignment. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Confirm student deletion
  const confirmDeleteStudent = (studentObj) => {
    setDeletingStudent(studentObj);
  };

  // Cancel student deletion
  const cancelDeleteStudent = () => {
    setDeletingStudent(null);
  };

  // Delete student
  const handleDeleteStudent = async () => {
    if (!deletingStudent) return;

    try {
      setLoading(true);
      await deleteStudent(deletingStudent.id);
      setSuccess("Student deleted successfully!");

      // Navigate back to student list
      if (onBack) {
        onBack();
      }
    } catch (err) {
      setError("Failed to delete student. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
      cancelDeleteStudent();
    }
  };

  // Get class name by ID
  const getClassNameById = (id) => {
    const classObj = classes.find((c) => c.id === id);
    return classObj
      ? `${classObj.class_number} (${classObj.class_code})`
      : "N/A";
  };

  // Check if student is already assigned to a specific session
  const isStudentAssignedToSession = (sessionId) => {
    return studentClasses.some(
      (assignment) => assignment.session_id === parseInt(sessionId)
    );
  };

  // Get session details by ID
  const getSessionById = (id) => {
    const sessionObj = allSessions.find((s) => s.id === id);
    return sessionObj || null;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  // Format datetime
  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  // Handle sorting
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Apply filtering and sorting to student classes
  const getFilteredAndSortedClasses = () => {
    let filtered = [...studentClasses];

    // Apply filters
    if (filterClass) {
      filtered = filtered.filter((sc) => sc.class_id === parseInt(filterClass));
    }
    if (filterSession) {
      filtered = filtered.filter(
        (sc) => sc.session_id === parseInt(filterSession)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });

    return filtered;
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

  // Get filtered and sorted student classes
  const filteredStudentClasses = getFilteredAndSortedClasses();

  return (
    <Container fluid>
      <Row className="mb-4 mt-4">
        <Col>
          <Button variant="outline-secondary" onClick={onBack}>
            <FaArrowLeft className="me-2" /> Back to Student List
          </Button>
        </Col>
      </Row>

      <Row>
        <Col md={4}>
          <Card className="mb-4">
            <Card.Body className="text-center">
              <div className="mb-3">
                {studentFormData.imageUrl ? (
                  <Image
                    src={studentFormData.imageUrl}
                    alt={studentFormData.studentName}
                    rounded
                    fluid
                    style={{
                      maxWidth: "200px",
                      maxHeight: "200px",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div
                    className="bg-light rounded-circle d-flex align-items-center justify-content-center"
                    style={{
                      width: "200px",
                      height: "200px",
                      margin: "0 auto",
                    }}
                  >
                    <span className="text-muted">No Image</span>
                  </div>
                )}
              </div>
              <h4>{studentFormData.studentName}</h4>
              <p className="text-muted">
                Student ID: {student.id.toString().padStart(4, "0")}
              </p>
              <div>
                <Button 
                variant="primary"
                size="sm" 
                className="me-3"
                onClick={openEditModal}>
                  <FaEdit className="me-2" /> Edit Info
                </Button>
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => confirmDeleteStudent(student)}
                >
                  <FaTrash />
                </Button>
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <h5>Registration Details</h5>
            </Card.Header>
            <Card.Body>
              <p>
                <strong>Registration Number:</strong>{" "}
                {studentFormData.registrationNumber || "N/A"}
              </p>
              <p>
                <strong>Registration Date:</strong> <br />
                {formatDateTime(student.registration_datetime)}
              </p>
            </Card.Body>
          </Card>
        </Col>

        <Col md={8}>
          <Card className="mb-4">
            <Card.Header>
              <h5>Personal Information</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <p>
                    <strong>Student Name:</strong> {studentFormData.studentName}
                  </p>
                  <p>
                    <strong>Father Name:</strong> {studentFormData.fatherName}
                  </p>
                  <p>
                    <strong>Mother Name:</strong> {studentFormData.motherName}
                  </p>
                  <p>
                    <strong>Date of Birth:</strong>{" "}
                    {formatDate(studentFormData.dob)}
                  </p>
                </Col>
                <Col md={6}>
                  <p>
                    <strong>Mobile Number:</strong>{" "}
                    {studentFormData.mobileNumber || "N/A"}
                  </p>
                  <p>
                    <strong>Email:</strong> {studentFormData.email || "N/A"}
                  </p>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card className="mb-4">
            <Card.Header>
              <h5>Address Information</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={12}>
                  <p>
                    <strong>Street:</strong> {studentFormData.street || "N/A"}
                  </p>
                </Col>
              </Row>
              <Row>
                <Col md={4}>
                  <p>
                    <strong>City/Town/Village:</strong> {studentFormData.cityTownVillage || "N/A"}
                  </p>
                </Col>
                <Col md={4}>
                  <p>
                    <strong>District:</strong> {studentFormData.district || "N/A"}
                  </p>
                </Col>
                <Col md={4}>
                  <p>
                    <strong>State:</strong> {studentFormData.state || "N/A"}
                  </p>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <p>
                    <strong>Country:</strong> {studentFormData.country || "N/A"}
                  </p>
                </Col>
                <Col md={6}>
                  <p>
                    <strong>Pin Code:</strong> {studentFormData.pinCode || "N/A"}
                  </p>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5>Class Assignments</h5>
            </Card.Header>
            <Card.Body>
              {/* Quick Assignment Form */}
              <div className="mb-4 p-3 bg-light rounded">
                <h6 className="mb-3">Assign New Class</h6>
                
                {/* Inline Error Display */}
                {(error || success) && (
                  <div className="mb-3">
                    {error && <Alert variant="danger">{error}</Alert>}
                    {success && <Alert variant="success">{success}</Alert>}
                  </div>
                )}
                
                <Form onSubmit={handleAssignmentFormSubmit}>
                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Class *</Form.Label>
                        <Form.Select
                          name="classId"
                          value={assignmentFormData.classId}
                          onChange={handleAssignmentFormChange}
                          required
                        >
                          <option value="">Select a class</option>
                          {classes.map((classObj) => (
                            <option key={classObj.id} value={classObj.id}>
                              {classObj.class_number} ({classObj.class_code})
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Session *</Form.Label>
                        <Form.Select
                          name="sessionId"
                          value={assignmentFormData.sessionId}
                          onChange={handleAssignmentFormChange}
                          required
                        >
                          <option value="">Select a session</option>
                          {activeSessions.map((session) => {
                            const isAssigned = isStudentAssignedToSession(session.id);
                            return (
                              <option 
                                key={session.id} 
                                value={session.id}
                                disabled={isAssigned}
                                title={isAssigned ? "Student already assigned to this session" : ""}
                              >
                                {session.session_year} ({session.start_month}/
                                {session.start_year} - {session.end_month}/
                                {session.end_year}) {isAssigned ? " ✓" : ""}
                              </option>
                            );
                          })}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Existing Roll Numbers in Class</Form.Label>
                        <Form.Control
                          as="select"
                          name="existingRollNumber"
                          value={existingRollNumber}
                          onChange={(e) => {
                            const rollNum = e.target.value;
                            setExistingRollNumber(rollNum);
                            if (rollNum) {
                              setAssignmentFormData(prev => ({ ...prev, rollNumber: rollNum }));
                            }
                          }}
                        >
                          <option value="">Select an existing roll number...</option>
                          {existingRollNumbers.map((rollNum) => (
                            <option key={rollNum} value={rollNum}>
                              Roll Number: {rollNum.toString().padStart(6, '0')}
                            </option>
                          ))}
                        </Form.Control>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Roll Number *</Form.Label>
                        <Form.Control
                          type="text"
                          name="rollNumber"
                          value={assignmentFormData.rollNumber}
                          onChange={handleAssignmentFormChange}
                          placeholder="Enter roll number"
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <div className="d-flex justify-content-end">
                    <Button variant="primary" type="submit" disabled={loading}>
                      {loading ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-1" />
                          Assigning...
                        </>
                      ) : (
                        "Assign Class"
                      )}
                    </Button>
                  </div>
                </Form>
              </div>
              {/* Filters and Sort Controls */}
              <div className="mb-3">
                <Row>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Filter by Class</Form.Label>
                      <Form.Select
                        value={filterClass}
                        onChange={(e) => setFilterClass(e.target.value)}
                      >
                        <option value="">All Classes</option>
                        {classes.map((classObj) => (
                          <option key={classObj.id} value={classObj.id}>
                            {classObj.class_number} ({classObj.class_code})
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Filter by Session</Form.Label>
                      <Form.Select
                        value={filterSession}
                        onChange={(e) => setFilterSession(e.target.value)}
                      >
                        <option value="">All Sessions</option>
                        {allSessions.map((session) => (
                          <option key={session.id} value={session.id}>
                            {session.session_year} ({session.start_month}/
                            {session.start_year} - {session.end_month}/
                            {session.end_year})
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Sort By</Form.Label>
                      <Form.Select
                        value={sortConfig.key}
                        onChange={(e) => handleSort(e.target.value)}
                      >
                        <option value="class_id">Class</option>
                        <option value="created_at">Assignment Date</option>
                        <option value="session_id">Session</option>
                        <option value="roll_number">Roll Number</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
              </div>

              {/* Class Assignments List */}
              {filteredStudentClasses.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Class</th>
                        <th>Roll Number</th>
                        <th>Session</th>
                        <th>Assigned Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudentClasses.map((assignment) => (
                        <tr key={assignment.id}>
                          <td>{getClassNameById(assignment.class_id)}</td>
                          <td>{assignment.roll_number}</td>
                          <td>
                            {assignment.sessions
                              ? `${assignment.sessions.start_month}/${assignment.sessions.start_year} - ${assignment.sessions.end_month}/${assignment.sessions.end_year}`
                              : "N/A"}
                          </td>
                          <td>{formatDateTime(assignment.created_at)}</td>
                          <td>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() =>
                                openDeleteAssignmentModal(assignment)
                              }
                              className="me-2"
                            >
                              <FaTrash className="me-1" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted">No class assigned to this student.</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Edit Student Modal */}
      <Modal show={showEditModal} onHide={closeEditModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Student Information</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleStudentFormSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Student Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="studentName"
                    value={studentFormData.studentName}
                    onChange={handleStudentFormChange}
                    placeholder="Enter student name"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Registration Number</Form.Label>
                  <Form.Control
                    type="text"
                    name="registrationNumber"
                    value={studentFormData.registrationNumber}
                    onChange={handleStudentFormChange}
                    placeholder="Enter registration number"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Father Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="fatherName"
                    value={studentFormData.fatherName}
                    onChange={handleStudentFormChange}
                    placeholder="Enter father's name"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Mother Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="motherName"
                    value={studentFormData.motherName}
                    onChange={handleStudentFormChange}
                    placeholder="Enter mother's name"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Date of Birth *</Form.Label>
                  <Form.Control
                    type="date"
                    name="dob"
                    value={studentFormData.dob}
                    onChange={handleStudentFormChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Mobile Number</Form.Label>
                  <Form.Control
                    type="tel"
                    name="mobileNumber"
                    value={studentFormData.mobileNumber}
                    onChange={handleStudentFormChange}
                    placeholder="Enter mobile number"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email Address</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={studentFormData.email}
                    onChange={handleStudentFormChange}
                    placeholder="Enter email address"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Student Image</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          setStudentFormData((prev) => ({
                            ...prev,
                            imageUrl: event.target.result,
                          }));
                        };
                        reader.readAsDataURL(e.target.files[0]);
                      }
                    }}
                  />
                  {studentFormData.imageUrl && (
                    <div className="mt-2">
                      <img
                        src={studentFormData.imageUrl}
                        alt="Preview"
                        style={{ maxWidth: "100px", maxHeight: "100px" }}
                      />
                    </div>
                  )}
                  <Form.Text className="text-muted">
                    Upload a passport-sized photo of the student
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <h6 className="mb-3 mt-4">Address Information</h6>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Street Address</Form.Label>
                  <Form.Control
                    type="text"
                    name="street"
                    value={studentFormData.street}
                    onChange={handleStudentFormChange}
                    placeholder="Enter street address"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>City/Town/Village</Form.Label>
                  <Form.Control
                    type="text"
                    name="cityTownVillage"
                    value={studentFormData.cityTownVillage}
                    onChange={handleStudentFormChange}
                    placeholder="Enter city/town/village"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>District</Form.Label>
                  <Form.Control
                    type="text"
                    name="district"
                    value={studentFormData.district}
                    onChange={handleStudentFormChange}
                    placeholder="Enter district"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>State</Form.Label>
                  <Form.Control
                    type="text"
                    name="state"
                    value={studentFormData.state}
                    onChange={handleStudentFormChange}
                    placeholder="Enter state"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Country</Form.Label>
                  <Form.Control
                    type="text"
                    name="country"
                    value={studentFormData.country}
                    onChange={handleStudentFormChange}
                    placeholder="Enter country"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Pin Code</Form.Label>
                  <Form.Control
                    type="text"
                    name="pinCode"
                    value={studentFormData.pinCode}
                    onChange={handleStudentFormChange}
                    placeholder="Enter pin code"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeEditModal}>
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
                  <FaSave className="me-1" /> Save Changes
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Assignment Confirmation Modal */}
      <Modal
        show={showDeleteAssignmentModal}
        onHide={closeDeleteAssignmentModal}
      >
        <Modal.Header closeButton>
          <Modal.Title>Confirm Removal</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Are you sure you want to remove the class assignment for "
            <strong>{studentFormData.studentName}</strong>" from class "
            <strong>
              {assignmentToDelete
                ? getClassNameById(assignmentToDelete.class_id)
                : "N/A"}
            </strong>
            " in session "
            <strong>
              {assignmentToDelete && assignmentToDelete.sessions
                ? `${assignmentToDelete.sessions.start_month}/${assignmentToDelete.sessions.start_year} - ${assignmentToDelete.sessions.end_month}/${assignmentToDelete.sessions.end_year}`
                : "N/A"}
            </strong>
            "? This action cannot be undone.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeDeleteAssignmentModal}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteAssignment}
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-1" />
                Removing...
              </>
            ) : (
              "Remove Assignment"
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Duplicate Roll Number Modal */}
      <Modal show={showDuplicateRollModal} onHide={closeDuplicateRollModal}>
        <Modal.Header closeButton>
          <Modal.Title>Duplicate Roll Number</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Roll number already exists in this class. Suggested next roll
            number: {suggestedRollNumber}
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeDuplicateRollModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Student Confirmation Modal */}
      <Modal show={!!deletingStudent} onHide={cancelDeleteStudent}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Are you sure you want to delete the student "
            <strong>{deletingStudent?.student_name}</strong>"? This action
            cannot be undone and will remove all their records from the system.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={cancelDeleteStudent}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteStudent}
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-1" />
                Deleting...
              </>
            ) : (
              "Delete Student"
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      </Container>
  );
};

export default StudentProfile;
