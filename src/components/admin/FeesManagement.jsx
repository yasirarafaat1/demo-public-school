import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Button,
  Form,
  InputGroup,
  Alert,
  Tab,
  Nav,
} from "react-bootstrap";
import { getStudentsWithFeesForCurrentSession } from "../../services/feeService";
import { getClasses, getSessions } from "../../services/classStudentService";
import SkeletonLoader from "../user/SkeletonLoader";
import { useNavigate } from "react-router-dom";
import AddStudentFees from "./AddStudentFees";

const FeesManagement = ({ refreshTimestamp }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [classes, setClasses] = useState([]);
  const [sessions, setSessions] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [refreshTimestamp]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      // Fetch all required data in parallel
      const [studentsData, classesData, sessionsData] = await Promise.all([
        getStudentsWithFeesForCurrentSession(),
        getClasses(),
        getSessions(),
      ]);

      setStudents(studentsData);
      setClasses(classesData);
      setSessions(sessionsData);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewStudentFees = (studentClass) => {
    navigate(`/admin/student-fees/${studentClass.student_id}`, {
      state: {
        studentInfo: studentClass.student_info,
        classInfo: studentClass.class_info,
        sessionInfo: studentClass.session_info,
      },
    });
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.student_info.student_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      student.student_info.registration_number
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      student.roll_number.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesClass =
      !selectedClass || student.class_info.class_code === selectedClass;
    const matchesStatus =
      !selectedStatus || student.fee_status === selectedStatus;

    return matchesSearch && matchesClass && matchesStatus;
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getFeeStatusVariant = (status) => {
    switch (status) {
      case "no_fees":
        return "secondary";
      case "partial":
        return "warning";
      case "pending":
        return "danger";
      case "paid":
        return "success";
      default:
        return "secondary";
    }
  };

  const getFeeStatusText = (status) => {
    switch (status) {
      case "paid":
        return "Paid";
      case "partial":
        return "Partial";
      case "pending":
        return "Pending";
      case "no_fees":
        return "No Fees";
      default:
        return status;
    }
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col xs={12}>
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <h3 className="mb-0">Fees Management</h3>
          </div>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" onClose={() => setError("")} dismissible>
          {error}
        </Alert>
      )}

      <Tab.Container defaultActiveKey="manage">
        <Row>
          <Col xs={12}>
            <Nav variant="tabs" className="mb-4">
              <Nav.Item>
                <Nav.Link eventKey="manage">Manage Student Fees</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="add">Add Student Fees</Nav.Link>
              </Nav.Item>
            </Nav>
            <Tab.Content>
              <Tab.Pane eventKey="manage">
                {/* Filters */}
                <Row className="mb-4">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Search Students</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Search by name, registration number, or roll number..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Filter by Class</Form.Label>
                      <Form.Select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                      >
                        <option value="">All Classes</option>
                        {classes.map((cls) => (
                          <option key={cls.id} value={cls.class_code}>
                            {cls.class_number} ({cls.class_code})
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  {/* <Col md={3}>
                    <Form.Group>
                      <Form.Label>Filter by Status</Form.Label>
                      <Form.Select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                      >
                        <option value="">All Statuses</option>
                        <option value="paid">Paid</option>
                        <option value="partial">Partial</option>
                        <option value="pending">Pending</option>
                        <option value="no_fees">No Fees</option>
                      </Form.Select>
                    </Form.Group>
                  </Col> */}
                </Row>

                <Row>
                  <Col xs={12}>
                    <Card>
                      <Card.Body className="p-0">
                        {loading ? (
                          <div className="text-center py-5">
                            <div
                              className="spinner-border text-primary"
                              role="status"
                            >
                              <span className="visually-hidden">
                                Loading...
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="table-responsive">
                            <Table
                              striped
                              bordered
                              hover
                              responsive
                              className="mb-0"
                            >
                              <thead>
                                <tr>
                                  <th>Student ID</th>
                                  <th>Registration Number</th>
                                  <th>Student Name</th>
                                  <th>Current Class</th>
                                  <th>Roll Number</th>
                                  <th>Total Fees</th>
                                  <th>Paid Amount</th>
                                  <th>Due Amount</th>
                                  {/* <th>Status</th> */}
                                  <th className="text-center">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredStudents.map((student, index) => (
                                  <tr key={student.id || index}>
                                    <td>{student.student_info.id}</td>
                                    <td>
                                      {student.student_info.registration_number}
                                    </td>
                                    <td>{student.student_info.student_name}</td>
                                    <td>
                                      {student.class_info?.class_number} (
                                      {student.class_info?.class_code})
                                    </td>
                                    <td>{student.roll_number}</td>
                                    <td>
                                      {formatCurrency(student.total_fees)}
                                    </td>
                                    <td>
                                      {formatCurrency(student.total_paid)}
                                    </td>
                                    <td>{formatCurrency(student.total_due)}</td>
                                    {/* <td>
                                      <span
                                        className={`badge bg-${getFeeStatusVariant(
                                          student.fee_status
                                        )}`}
                                      >
                                        {getFeeStatusText(student.fee_status)}
                                      </span>
                                    </td> */}
                                    <td className="text-center">
                                      <Button
                                        variant="outline-primary"
                                        size="sm"
                                        onClick={() =>
                                          handleViewStudentFees(student)
                                        }
                                      >
                                        View Fees
                                      </Button>
                                    </td>
                                  </tr>
                                ))}
                                {filteredStudents.length === 0 && (
                                  <tr>
                                    <td
                                      colSpan="10"
                                      className="text-center py-3"
                                    >
                                      No students found matching your criteria.
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
              </Tab.Pane>
              <Tab.Pane eventKey="add">
                <AddStudentFees />
              </Tab.Pane>
            </Tab.Content>
          </Col>
        </Row>
      </Tab.Container>
    </Container>
  );
};

export default FeesManagement;
