import React, { useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Alert,
  Breadcrumb,
} from "react-bootstrap";
import {
  getStudentByRollNumberAndClassCode,
  getStudents,
} from "../../services/classStudentService";
import { getStudentFeeSummary } from "../../services/feeService";
import { useNavigate } from "react-router-dom";

const AddStudentFees = () => {
  const [searchForm, setSearchForm] = useState({
    classCode: "",
    rollNumber: "",
  });
  const [studentInfo, setStudentInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    setSearchForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSearchStudent = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      if (!searchForm.classCode.trim() || !searchForm.rollNumber.trim()) {
        setError("Please enter both class code and roll number.");
        setLoading(false);
        return;
      }

      const student = await getStudentByRollNumberAndClassCode(
        searchForm.rollNumber,
        searchForm.classCode
      );

      if (student) {
        // Now get the full student information using getStudents function
        const allStudents = await getStudents();
        const foundStudent = allStudents.find(
          (s) => s.student_name === student.student_name
        );

        if (foundStudent) {
          setStudentInfo({
            ...student,
            id: foundStudent.id,
            father_name: foundStudent.father_name,
            registration_number: foundStudent.registration_number,
          });
          setSuccess("Student found successfully!");
        } else {
          setError("Student information not found in the system.");
        }
      } else {
        setError(
          "No student found with the provided class code and roll number."
        );
      }
    } catch (err) {
      console.error("Error searching for student:", err);
      setError("Failed to search for student. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewStudentFees = () => {
    if (studentInfo) {
      navigate(`/admin/student-fees/${studentInfo.id}`, {
        state: {
          studentInfo: {
            id: studentInfo.id,
            student_name: studentInfo.student_name,
            father_name: studentInfo.father_name,
            registration_number: studentInfo.registration_number,
          },
          classInfo: {
            class_number: studentInfo.class,
            class_code: studentInfo.class_code,
          },
          sessionInfo: null, // We'll get this when the component loads
        },
      });
    }
  };

  return (
    <Container fluid className="py-4">
      {/* <Row className="mb-4">
        <Col xs={12}>
          <Breadcrumb>
            <Breadcrumb.Item
              onClick={() => navigate("/admin")}
              style={{ cursor: "pointer" }}
            >
              Admin Dashboard
            </Breadcrumb.Item>
            <Breadcrumb.Item
              onClick={() => navigate("/admin/fees")}
              style={{ cursor: "pointer" }}
            >
              Fees Management
            </Breadcrumb.Item>
            <Breadcrumb.Item active>Add Student Fees</Breadcrumb.Item>
          </Breadcrumb>
          <h3 className="mb-0">Add Student Fees</h3>
        </Col>
      </Row> */}

      {error && (
        <Alert variant="danger" onClose={() => setError("")} dismissible>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" onClose={() => setSuccess("")} dismissible>
          {success}
        </Alert>
      )}

      {/* Search Student Form */}
      <Row className="mb-4">
        <Col xs={12}>
          <Card>
            <Card.Body>
              <h5>Search Student by Class Code and Roll Number</h5>
              <Form onSubmit={handleSearchStudent}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Class Code</Form.Label>
                      <Form.Control
                        type="text"
                        name="classCode"
                        value={searchForm.classCode}
                        onChange={handleSearchChange}
                        placeholder="Enter class code (e.g., A101)"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Roll Number</Form.Label>
                      <Form.Control
                        type="text"
                        name="rollNumber"
                        value={searchForm.rollNumber}
                        onChange={handleSearchChange}
                        placeholder="Enter roll number"
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Button variant="primary" type="submit" disabled={loading}>
                  {loading ? "Searching..." : "Search Student"}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Student Information */}
      {studentInfo && (
        <Row className="mb-4">
          <Col xs={12}>
            <Card>
              <Card.Body>
                <Row>
                  <Col md={3}>
                    <strong>Student ID:</strong> {studentInfo.id}
                  </Col>
                  <Col md={3}>
                    <strong>Student Name:</strong> {studentInfo.student_name}
                  </Col>
                  <Col md={3}>
                    <strong>Father's Name:</strong> {studentInfo.father_name}
                  </Col>
                  <Col md={3}>
                    <strong>Registration Number:</strong>{" "}
                    {studentInfo.registration_number}
                  </Col>
                </Row>
                <Row className="mt-2">
                  <Col md={3}>
                    <strong>Class:</strong> {studentInfo.class}
                  </Col>
                  <Col md={3}>
                    <strong>Class Code:</strong> {studentInfo.class_code}
                  </Col>
                  <Col md={3}>
                    <strong>Roll Number:</strong> {studentInfo.roll_number}
                  </Col>
                  <Col md={3}>
                    <Button variant="primary" onClick={handleViewStudentFees}>
                      View/Manage Fees
                    </Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default AddStudentFees;
