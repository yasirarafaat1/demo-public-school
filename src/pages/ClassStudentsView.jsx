import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Table,
  Alert,
  Spinner,
  Badge,
} from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaUser, FaSearch } from "react-icons/fa";
import {
  getClasses,
  getStudentClasses,
  getStudents,
  getSessions,
} from "../services/classStudentService";
import StudentProfile from "../components/user/StudentProfile";

const ClassStudentsView = () => {
  const navigate = useNavigate();
  const { classId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [classInfo, setClassInfo] = useState(null);
  const [students, setStudents] = useState([]);
  const [allClasses, setAllClasses] = useState([]);
  const [allSessions, setAllSessions] = useState([]);
  const [showStudentProfile, setShowStudentProfile] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadData();
  }, [classId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [classesData, sessionsData, studentClassesData, allStudentsData] =
        await Promise.all([
          getClasses(),
          getSessions(),
          getStudentClasses(),
          getStudents(),
        ]);

      setAllClasses(classesData);
      setAllSessions(sessionsData);

      // Find the specific class
      const currentClass = classesData.find(
        (cls) => cls.id === parseInt(classId)
      );
      setClassInfo(currentClass);

      // Get all student-class assignments
      const classAssignments = studentClassesData.filter(
        (assignment) => assignment.class_id === parseInt(classId)
      );

      // Get student details for this class
      const classStudentIds = classAssignments.map(
        (assignment) => assignment.student_id
      );
      const classStudents = allStudentsData.filter((student) =>
        classStudentIds.includes(student.id)
      );

      // Add roll number and session info to each student
      const studentsWithInfo = classStudents.map((student) => {
        const assignment = classAssignments.find(
          (assignment) => assignment.student_id === student.id
        );
        return {
          ...student,
          roll_number: assignment?.roll_number || "N/A",
          session_id: assignment?.session_id || null,
        };
      });

      setStudents(studentsWithInfo);
    } catch (err) {
      setError("Failed to load class data. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewStudentProfile = (student) => {
    setSelectedStudent(student);
    setShowStudentProfile(true);
  };

  const handleBack = () => {
    if (showStudentProfile) {
      setShowStudentProfile(false);
      setSelectedStudent(null);
    } else {
      navigate(-1); // Go back to previous page
    }
  };

  // Filter students based on search term
  const filteredStudents = students.filter((student) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      student.student_name.toLowerCase().includes(term) ||
      student.father_name.toLowerCase().includes(term) ||
      student.roll_number.toLowerCase().includes(term) ||
      student.registration_number.toLowerCase().includes(term)
    );
  });

  if (showStudentProfile && selectedStudent) {
    return (
      <StudentProfile
        student={selectedStudent}
        onBack={handleBack}
        onUpdate={loadData}
      />
    );
  }

  return (
    <Container fluid className="py-4">
      <Row>
        <Col>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <div>
                <Button
                  variant="outline-secondary"
                  onClick={handleBack}
                  className="me-3"
                >
                  <FaArrowLeft className="" /> Back
                </Button>
              </div>
              <div>
                <Button
                  variant="primary"
                  onClick={() => navigate(`/admin/student/add`)}
                >
                  Add Student
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

              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </Spinner>
                  <p className="mt-2">Loading Class Students...</p>
                </div>
              ) : (
                <>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div style={{ width: "300px" }}>
                      <div className="input-group">
                        <span className="input-group-text">
                          <FaSearch />
                        </span>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Search students..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <Badge>
                        {filteredStudents.length} students
                      </Badge>
                    </div>
                  </div>

                  {filteredStudents.length > 0 ? (
                    <div className="table-responsive">
                      <Table striped bordered hover>
                        <thead>
                          <tr>
                            <th>Student ID</th>
                            <th>Student Name</th>
                            <th>Father's Name</th>
                            <th>Roll Number</th>
                            <th>Registration No.</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredStudents.map((student) => (
                            <tr key={student.id}>
                              <td>{student.id.toString().padStart(4, "0")}</td>
                              <td>{student.student_name}</td>
                              <td>{student.father_name}</td>
                              <td>{student.roll_number}</td>
                              <td>{student.registration_number}</td>
                              <td>
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() =>
                                    handleViewStudentProfile(student)
                                  }
                                >
                                  <FaUser className="me-1" /> View Profile
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-5">
                      <p className="text-muted">
                        {searchTerm
                          ? "No students match your search."
                          : "No students found in this class."}
                      </p>
                    </div>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ClassStudentsView;
