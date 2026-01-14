import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getStudents,
  getClasses,
  getSessions,
  getStudentClasses,
} from "../../services/classStudentService";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Button,
  Form,
  Alert,
  Spinner,
  InputGroup,
} from "react-bootstrap";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaArrowLeft,
  FaSearch,
  FaEye,
} from "react-icons/fa";

const AllStudents = () => {
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [studentClasses, setStudentClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [sortField, setSortField] = useState("student_name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [filterClass, setFilterClass] = useState("");
  const [filterSession, setFilterSession] = useState("");

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [studentsData, classesData, sessionsData, studentClassesData] =
        await Promise.all([
          getStudents(),
          getClasses(),
          getSessions(),
          getStudentClasses(),
        ]);
      setStudents(studentsData);
      setClasses(classesData);
      setSessions(sessionsData);
      setStudentClasses(studentClassesData);
      setError("");
    } catch (err) {
      setError("Failed to load. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Get student assignment by student ID
  const getStudentAssignment = (studentId) => {
    return studentClasses.find((sc) => sc.student_id === studentId);
  };

  // Filter and sort students
  const processedStudents = students
    .filter((student) => {
      // Search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const searchMatch =
          student.student_name.toLowerCase().includes(term) ||
          student.father_name.toLowerCase().includes(term) ||
          student.mother_name.toLowerCase().includes(term) ||
          student.registration_number.toLowerCase().includes(term) ||
          student.mobile_number.includes(term) ||
          student.email.toLowerCase().includes(term) ||
          (student.street && student.street.toLowerCase().includes(term)) ||
          (student.city_town_village && student.city_town_village.toLowerCase().includes(term)) ||
          (student.district && student.district.toLowerCase().includes(term)) ||
          (student.state && student.state.toLowerCase().includes(term)) ||
          (student.country && student.country.toLowerCase().includes(term)) ||
          (student.pin_code && student.pin_code.includes(term));
        
        if (!searchMatch) return false;
      }
      
      // Class filter
      const assignment = getStudentAssignment(student.id);
      if (filterClass && (!assignment || String(assignment.class_id) !== String(filterClass))) {
        return false;
      }
      
      // Session filter
      if (filterSession) {
        if (!assignment) {
          return false; // Student has no assignment, can't match session filter
        }
        if (String(assignment.session_id) !== String(filterSession)) {
          return false; // Student's session doesn't match selected session
        }
      }
      
      return true;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortField) {
        case "student_name":
          aValue = a.student_name.toLowerCase();
          bValue = b.student_name.toLowerCase();
          break;
        case "registration_number":
          aValue = a.registration_number || "";
          bValue = b.registration_number || "";
          break;
        case "father_name":
          aValue = a.father_name.toLowerCase();
          bValue = b.father_name.toLowerCase();
          break;
        case "class":
          const aAssignment = getStudentAssignment(a.id);
          const bAssignment = getStudentAssignment(b.id);
          aValue = aAssignment ? getClassNameById(aAssignment.class_id) : "";
          bValue = bAssignment ? getClassNameById(bAssignment.class_id) : "";
          break;
        case "registration_datetime":
          aValue = new Date(a.registration_datetime || 0);
          bValue = new Date(b.registration_datetime || 0);
          break;
        default:
          aValue = a.student_name.toLowerCase();
          bValue = b.student_name.toLowerCase();
      }
      
      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  
  // Pagination
  const totalPages = Math.ceil(processedStudents.length / itemsPerPage);
  const paginatedStudents = processedStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterClass, filterSession, sortField, sortDirection]);

  // Handle sort
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };
  
  // Get sort icon
  const getSortIcon = (field) => {
    if (sortField !== field) return "↕️";
    return sortDirection === "asc" ? "↑" : "↓";
  };

  // Format datetime
  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  // Get class name by ID
  const getClassNameById = (id) => {
    const classObj = classes.find((c) => c.id === id);
    return classObj
      ? `${classObj.class_number} (${classObj.class_code})`
      : "N/A";
  };

  // Navigate to student profile
  const navigateToStudentProfile = (student) => {
    navigate(`/admin/student/profile/${student.id}`, { state: { student } });
  };

  // Format address for display
  const formatAddress = (student) => {
    const parts = [];
    if (student.street) parts.push(student.street);
    if (student.city_town_village) parts.push(student.city_town_village);
    if (student.district) parts.push(student.district);
    if (student.state) parts.push(student.state);
    if (student.pin_code) parts.push(student.pin_code);
    
    return parts.length > 0 ? parts.join(', ') : 'N/A';
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
    <Container fluid className="py-3">
      <Card>
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h5 className="mb-0">All Students</h5>
              <small className="text-muted">
                Complete student directory with all sessions
              </small>
            </div>
            <div className="d-flex gap-2">
              <Button 
                variant="outline-secondary" 
                onClick={() => navigate(-1)}
              >
                <FaArrowLeft className="me-1" /> Back
              </Button>
              <Button variant="primary" onClick={() => navigate("/admin/student/add")}>
                <FaPlus className="me-1" /> Add Student
              </Button>
            </div>
          </div>
        </Card.Header>
        
        <Card.Body className="pb-2">
          <Row className="mb-3">
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={3}>
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
            </Col>
            <Col md={3}>
              <Form.Select
                value={filterSession}
                onChange={(e) => setFilterSession(e.target.value)}
              >
                <option value="">All Sessions</option>
                {sessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    ({session.start_month}/{session.start_year} - {session.end_month}/{session.end_year})
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={2}>
              <div className="text-muted small">
                Showing {paginatedStudents.length} of {processedStudents.length} students
              </div>
            </Col>
          </Row>
        </Card.Body>

        <Card.Body>
          {(error || success) && (
            <div className="mb-3">
              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}
            </div>
          )}

          {loading && students.length === 0 ? (
            <div className="text-center py-4">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            </div>
          ) : paginatedStudents.length === 0 ? (
            <p className="text-muted text-center">
              {searchTerm || filterClass || filterSession
                ? "No students match your search criteria."
                : "No students found."}
            </p>
          ) : (
            <>
              <div className="table-responsive">
                <Table bordered hover>
                  <thead>
                    <tr>
                      <th 
                        style={{ cursor: "pointer" }}
                        onClick={() => handleSort("student_name")}
                      >
                        Student Name {getSortIcon("student_name")}
                      </th>
                      <th 
                        style={{ cursor: "pointer" }}
                        onClick={() => handleSort("registration_number")}
                      >
                        Registration No. {getSortIcon("registration_number")}
                      </th>
                      <th 
                        style={{ cursor: "pointer" }}
                        onClick={() => handleSort("father_name")}
                      >
                        Father's Name {getSortIcon("father_name")}
                      </th>
                      <th>Address</th>
                      <th 
                        style={{ cursor: "pointer" }}
                        onClick={() => handleSort("class")}
                      >
                        Current Class {getSortIcon("class")}
                      </th>
                      <th 
                        style={{ cursor: "pointer" }}
                        onClick={() => handleSort("registration_datetime")}
                      >
                        Registration Date {getSortIcon("registration_datetime")}
                      </th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedStudents.map((student) => {
                      const assignment = getStudentAssignment(student.id);
                      return (
                        <tr key={student.id}>
                          <td>{student.student_name}</td>
                          <td>{student.registration_number || "N/A"}</td>
                          <td>{student.father_name}</td>
                          <td>
                            <div style={{ maxWidth: "200px", wordBreak: "break-word" }}>
                              {formatAddress(student)}
                            </div>
                          </td>
                          <td>
                            {assignment
                              ? getClassNameById(assignment.class_id)
                              : "N/A"}
                          </td>
                          <td>{formatDateTime(student.registration_datetime)}</td>
                          <td>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => navigateToStudentProfile(student)}
                              title="View Student Profile"
                            >
                              <FaEye className="me-1" />
                              Profile
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div className="text-muted">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="btn-group" role="group">
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                    >
                      First
                    </Button>
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    
                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "primary" : "outline-secondary"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      Last
                    </Button>
                  </div>
                  <div className="text-muted">
                    {processedStudents.length} total students
                  </div>
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AllStudents;
