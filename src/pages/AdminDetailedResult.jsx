import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Button,
  Modal,
  Alert,
  Spinner,
} from "react-bootstrap";
import { getAllResults, deleteResult } from "../services/resultService";
import SkeletonLoader from "../components/user/SkeletonLoader";

const AdminDetailedResult = () => {
  const navigate = useNavigate();
  const { rollNo, classCode } = useParams();
  const [results, setResults] = useState([]);
  const [studentInfo, setStudentInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null); // Track specific result to delete

  useEffect(() => {
    const loadResults = async () => {
      try {
        const allResults = await getAllResults();
        const rollResults = allResults.filter(
          (r) => r.roll_no === rollNo && r.class_code === classCode
        );
        
        if (rollResults.length > 0) {
          setResults(rollResults);
          // Set student info from the first result
          setStudentInfo({
            student_name: rollResults[0].student_name,
            father_name: rollResults[0].father_name,
            roll_no: rollResults[0].roll_no,
            class: rollResults[0].class,
            class_code: rollResults[0].class_code,
          });
        } else {
          setError("No results found for this roll number and class code.");
        }
      } catch (err) {
        console.error("Error loading results:", err);
        setError("Failed to load results. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [rollNo, classCode]);

  const handleDeleteResult = async (resultId) => {
    try {
      await deleteResult(resultId);
      // Refresh the results after deletion
      const allResults = await getAllResults();
      const rollResults = allResults.filter(
        (r) => r.roll_no === rollNo && r.class_code === classCode
      );
      setResults(rollResults);
      
      if (rollResults.length === 0) {
        setError("No results found for this roll number and class code.");
      }
    } catch (err) {
      console.error("Error deleting result:", err);
      setError("Failed to delete result. Please try again.");
    } finally {
      setShowDeleteConfirm(null);
    }
  };

  // Calculate overall metrics
  const calculateOverallMetrics = () => {
    if (!results || results.length === 0) return null;

    let totalMarks = 0;
    let totalMaxMarks = 0;
    let totalSubjects = 0;
    let passCount = 0;
    const grades = [];
    const statuses = [];

    results.forEach((examResult) => {
      if (examResult.subjects && Array.isArray(examResult.subjects)) {
        examResult.subjects.forEach((subject) => {
          totalMarks += subject.marks || subject.obtained_marks || 0;
          totalMaxMarks += subject.max_marks || 100;
          totalSubjects++;
        });
      }

      if (examResult.grade) {
        grades.push(examResult.grade);
      }
      
      if (examResult.result_status) {
        statuses.push(examResult.result_status);
      }
      
      if (examResult.result_status === "Pass") {
        passCount++;
      }
    });

    const overallPercentage = totalMaxMarks > 0 ? (totalMarks / totalMaxMarks) * 100 : 0;
    
    // Determine overall status based on number of passed exams
    const overallStatus = passCount === results.length ? "Pass" : "Fail";
    
    // For overall grade, we can use a simple approach
    let overallGrade = "N/A";
    if (grades.length > 0) {
      overallGrade = grades[0]; // You can implement more complex logic as needed
    }

    return {
      overallPercentage: overallPercentage.toFixed(2),
      overallGrade,
      overallStatus,
      totalExams: results.length,
      passedExams: passCount,
      failedExams: results.length - passCount,
    };
  };

  const overallMetrics = calculateOverallMetrics();

  return (
    <Container className="py-5 mt-5">
      <Row className="justify-content-center">
        <Col md={10}>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="text-primary">Detailed Results</h2>
            <Button 
              variant="secondary" 
              onClick={() => navigate(-1)}
              className="d-flex align-items-center"
            >
              <span className="me-2">←</span> Back
            </Button>
          </div>

          {error && (
            <Alert variant="danger">{error}</Alert>
          )}

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" role="status" className="mb-3">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
              <p>Loading detailed results...</p>
            </div>
          ) : (
            <>
              {/* Student Information Card */}
              {studentInfo && (
                <Card className="mb-4 shadow">
                  <Card.Header className="bg-primary text-white">
                    <h4 className="mb-0">Student Information</h4>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col md={6}>
                        <p className="mb-1"><strong>Student Name:</strong> {studentInfo.student_name}</p>
                        <p className="mb-1"><strong>Class:</strong> {studentInfo.class}</p>
                      </Col>
                      <Col md={6}>
                        <p className="mb-1"><strong>Roll Number:</strong> {studentInfo.roll_no}</p>
                        <p className="mb-1"><strong>Class Code:</strong> {studentInfo.class_code}</p>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              )}

              {/* Overall Metrics Card */}
              {overallMetrics && (
                <Card className="mb-4 shadow">
                  <Card.Header className="bg-success text-white">
                    <h4 className="mb-0">Overall Performance Summary</h4>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col md={3}>
                        <p className="mb-1"><strong>Overall Grade:</strong></p>
                        <p className="fw-bold fs-5">{overallMetrics.overallGrade}</p>
                      </Col>
                      <Col md={3}>
                        <p className="mb-1"><strong>Overall Percentage:</strong></p>
                        <p className="fw-bold fs-5">{overallMetrics.overallPercentage}%</p>
                      </Col>
                      <Col md={3}>
                        <p className="mb-1"><strong>Status:</strong></p>
                        <p className="fw-bold fs-5">
                          <span className={`badge ${overallMetrics.overallStatus === "Pass" ? "bg-success" : "bg-danger"}`}>
                            {overallMetrics.overallStatus}
                          </span>
                        </p>
                      </Col>
                      <Col md={3}>
                        <p className="mb-1"><strong>Exams:</strong></p>
                        <p className="fw-bold fs-5">
                          {overallMetrics.passedExams}/{overallMetrics.totalExams} Passed
                        </p>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              )}

              {/* Results List */}
              <Card className="shadow">
                <Card.Header className="bg-secondary text-white">
                  <h4 className="mb-0">Exam Results</h4>
                </Card.Header>
                <Card.Body>
                  {loading ? (
                    <div>
                      <SkeletonLoader type="card" count={2} />
                    </div>
                  ) : results.length > 0 ? (
                    <div className="results-container">
                      {results.map((result, index) => (
                        <div key={result.id || index} className="mb-4 p-3 border rounded">
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 className="text-primary">
                              {result.exam_type} - {result.exam_date ? new Date(result.exam_date).toLocaleDateString() : "N/A"}
                            </h5>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => setShowDeleteConfirm(result.id)}
                            >
                              Delete
                            </Button>
                          </div>
                          
                          <Row className="mb-3">
                            <Col md={6}>
                              <p className="mb-1"><strong>Exam Type:</strong> {result.exam_type}</p>
                              <p className="mb-1"><strong>Result Date:</strong> {result.exam_date ? new Date(result.exam_date).toLocaleDateString() : "N/A"}</p>
                              <p className="mb-0">
                                <strong>Status:</strong>
                                <span className={`badge ms-2 ${result.result_status === "Pass" ? "bg-success" : "bg-danger"}`}>
                                  {result.result_status}
                                </span>
                              </p>
                            </Col>
                            <Col md={6}>
                              <p className="mb-0 text-end">
                                <strong>Grade:</strong>
                                <span className="fw-bold text-primary ms-2">
                                  {result.grade}
                                </span>
                              </p>
                            </Col>
                          </Row>

                          <Table striped bordered hover responsive>
                            <thead className="table-dark">
                              <tr>
                                <th>Subject</th>
                                <th>Marks</th>
                                <th>Max Marks</th>
                                <th>Percentage</th>
                              </tr>
                            </thead>
                            <tbody>
                              {result.subjects && result.subjects.length > 0 ? (
                                result.subjects.map((subject, subIndex) => (
                                  <tr key={subIndex}>
                                    <td>{subject.name || subject.subject}</td>
                                    <td>{subject.marks || subject.obtained_marks || 0}</td>
                                    <td>{subject.max_marks || 100}</td>
                                    <td>
                                      {(
                                        ((subject.marks || subject.obtained_marks || 0) /
                                        (subject.max_marks || 100)) *
                                        100
                                      ).toFixed(1)}%
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan="4" className="text-center">No subjects found</td>
                                </tr>
                              )}
                            </tbody>
                          </Table>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted">No results found for this student.</p>
                  )}
                </Card.Body>
              </Card>
            </>
          )}

          {/* Delete Confirmation Modal */}
          <Modal show={!!showDeleteConfirm} onHide={() => setShowDeleteConfirm(null)}>
            <Modal.Header closeButton>
              <Modal.Title>Confirm Deletion</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              Are you sure you want to delete this result? This action cannot be undone.
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowDeleteConfirm(null)}>
                Cancel
              </Button>
              <Button 
                variant="danger" 
                onClick={() => handleDeleteResult(showDeleteConfirm)}
              >
                Delete
              </Button>
            </Modal.Footer>
          </Modal>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminDetailedResult;