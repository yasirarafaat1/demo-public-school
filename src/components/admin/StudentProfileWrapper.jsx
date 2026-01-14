import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import StudentProfile from "../user/StudentProfile";
import { getStudents } from "../../services/classStudentService";

const StudentProfileWrapper = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadStudent();
  }, [studentId]);

  const loadStudent = async () => {
    try {
      setLoading(true);
      setError("");

      // Check if student data is passed in location state
      if (location.state?.student) {
        setStudent(location.state.student);
      } else {
        // Fetch student data from API
        const students = await getStudents();
        const foundStudent = students.find(s => s.id === parseInt(studentId));
        
        if (foundStudent) {
          setStudent(foundStudent);
        } else {
          setError("Student not found");
        }
      }
    } catch (err) {
      console.error("Error loading student:", err);
      setError("Failed to load student data");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/admin/students/all");
  };

  const handleUpdate = () => {
    // Refresh student data after update
    loadStudent();
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading student profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">
          {error}
        </div>
        <button 
          className="btn btn-secondary"
          onClick={handleBack}
        >
          Back to Students
        </button>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="container py-5">
        <div className="alert alert-warning">
          Student not found
        </div>
        <button 
          className="btn btn-secondary"
          onClick={handleBack}
        >
          Back to Students
        </button>
      </div>
    );
  }

  return (
    <StudentProfile 
      student={student} 
      onBack={handleBack}
      onUpdate={handleUpdate}
    />
  );
};

export default StudentProfileWrapper;
