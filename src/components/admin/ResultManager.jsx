import React, { useState, useRef, useEffect, useCallback } from "react";
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
  getAllResults,
} from "../../services/resultService";
import SkeletonLoader from "../user/SkeletonLoader";
import BulkResultUpload from "./BulkResultUpload";

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

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const resultsData = await getAllResults();
      setResults(resultsData);
    } catch (err) {
      console.error("Error fetching results data:", err);
      setError(
        "Failed to load results. Please check your connection or permissions."
      );
    } finally {
      setLoading(false);
    }
  }, []);

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

  // Navigate to bulk upload page
  const navigateToBulkUpload = () => {
    navigate("/admin/bulk-upload");
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4>Result Management</h4>
        <div className="d-flex gap-2">
          <Button
            variant="primary"
            onClick={navigateToAddResult}
            disabled={loading}
          >
            <FaPlus className="me-2" />
            Add Result
          </Button>
          <Button
            variant="success"
            onClick={navigateToBulkUpload}
            disabled={loading}
          >
            <FaUpload className="me-2" />
            Bulk Upload
          </Button>
        </div>
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

      {/* Bulk Result Upload Component */}
      <Card className="mb-4">
        <Card.Body>
          <BulkResultUpload onUploadSuccess={fetchData} />
        </Card.Body>
      </Card>
    </>
  );
};

export default ResultManager;
