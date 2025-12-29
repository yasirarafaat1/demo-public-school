import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Button,
  Form,
  Table,
  Alert,
  Collapse,
  Spinner,
} from "react-bootstrap";
import {
  FaUpload,
  FaPlus,
  FaChevronDown,
  FaChevronRight,
  FaEdit,
  FaTrash,
  FaArrowLeft,
} from "react-icons/fa";
import {
  uploadResultsFromCSV,
  addResultManually,
  getUniqueStudentResults,
  updateResult,
  deleteResult,
} from "../../services/resultService";
import SkeletonLoader from "../user/SkeletonLoader";

const ResultManager = ({ refreshTimestamp }) => {
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [openPanel, setOpenPanel] = useState(true);

  const fileInputRef = useRef(null);

  // Toggle panel visibility
  const togglePanel = () => {
    setOpenPanel(!openPanel);
  };

  // Handle CSV upload
  const handleCSVUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
        throw new Error("Please upload a valid CSV file");
      }

      const result = await uploadResultsFromCSV(file);
      setSuccess(`Successfully uploaded ${result.count} results`);

      // Refresh results list
      const updatedResults = await getUniqueStudentResults();
      setResults(updatedResults);
    } catch (err) {
      setError(err.message || "Failed to upload CSV file");
    } finally {
      setLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Load results on component mount and when refreshTimestamp changes
  useEffect(() => {
    const loadResults = async () => {
      try {
        setLoading(true);
        const data = await getUniqueStudentResults();
        setResults(data);
      } catch (err) {
        setError("Failed to load results");
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [refreshTimestamp]);

  // Navigate to detailed result page
  const navigateToResultDetail = (result) => {
    // Navigate to the detailed result page using roll number and class code
    navigate(`/admin/result/${result.roll_no}/${result.class_code}`);
  };

  // Navigate to add result page
  const navigateToAddResult = () => {
    navigate("/admin/result/add");
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4>Result Management</h4>
        <div>
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={handleCSVUpload}
            style={{ display: "none" }}
          />
          <Button
            variant="outline-primary"
            onClick={() => fileInputRef.current.click()}
            disabled={loading}
            className="me-2"
          >
            <FaUpload className="me-2" />
            Upload Student Data CSV
          </Button>
          <Button
            variant="primary"
            onClick={navigateToAddResult}
            disabled={loading}
          >
            <FaPlus className="me-2" />
            Add Result
          </Button>
        </div>
      </div>
      <div className="mb-3">
        <small className="text-muted">
          CSV Templates:{" "}
          <a
            href="/result_template.csv"
            target="_blank"
            rel="noopener noreferrer"
          >
            Student Data
          </a>
        </small>
      </div>

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

      <Card className="mb-4">
        <Card.Header
          onClick={togglePanel}
          style={{ cursor: "pointer" }}
          className="d-flex justify-content-between align-items-center"
        >
          <span>All Results</span>
          <div>{openPanel ? <FaChevronDown /> : <FaChevronRight />}</div>
        </Card.Header>
        <Collapse in={openPanel}>
          <div>
            <Card.Body>
              {loading ? (
                <div className="table-responsive">
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th>Roll No</th>
                        <th>Student Name</th>
                        <th>Class Code</th>
                      </tr>
                    </thead>
                    <tbody>
                      <SkeletonLoader type="table-row" count={5} />
                    </tbody>
                  </Table>
                </div>
              ) : results.length > 0 ? (
                <div className="table-responsive">
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th>Roll No</th>
                        <th>Student Name</th>
                        <th>Class Code</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((result) => (
                        <tr
                          key={
                            result.id ||
                            `${result.roll_no}-${result.class_code}`
                          }
                          onClick={() => navigateToResultDetail(result)}
                          style={{ cursor: "pointer" }}
                        >
                          <td>{result.roll_no}</td>
                          <td>{result.student_name}</td>
                          <td>{result.class_code}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <div className="text-center">
                  <p>
                    No results found. Upload a CSV file or add results manually.
                  </p>
                  <p className="text-muted">
                    <small>
                      Note: For CSV uploads, first import student data, then add
                      subjects and marks using the admin panel or separate
                      subjects CSV.
                    </small>
                  </p>
                </div>
              )}
            </Card.Body>
          </div>
        </Collapse>
      </Card>
    </>
  );
};

export default ResultManager;
