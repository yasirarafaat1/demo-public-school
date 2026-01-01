import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Alert,
  Spinner,
} from "react-bootstrap";
import { getAllResults, addResultManually } from "../services/resultService";
import { getStudentByRollNumberAndClassCode } from "../services/classStudentService";

const AddResult = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [existingResults, setExistingResults] = useState([]);
  const [fetchingStudent, setFetchingStudent] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    student_name: "",
    roll_no: "",
    class: "",
    class_code: "",
    exam_type: "",
    result_status: "Pass",
    grade: "",
  });

  // Subjects state - array of {name, marks, max_marks}
  const [subjects, setSubjects] = useState([
    { name: "", marks: "", max_marks: 100 },
  ]);

  // Track when to fetch student info
  const [shouldFetchStudent, setShouldFetchStudent] = useState(false);
  const [studentNotFound, setStudentNotFound] = useState(false);

  // Load existing results to check for duplicates
  useEffect(() => {
    const loadExistingResults = async () => {
      try {
        const results = await getAllResults();
        setExistingResults(results);
      } catch (err) {
        console.error("Error loading existing results:", err);
      }
    };

    loadExistingResults();
  }, []);

  // Function to check for existing exam types for a specific student
  const checkExistingExamTypes = async (rollNo, classCode) => {
    try {
      console.log('Checking existing exam types using cached data:', { rollNo, classCode });
      
      // Use cached data only to avoid 406 errors
      const cachedExamTypes = existingResults
        .filter(
          (r) =>
            r.roll_no === rollNo && r.class_code === classCode
        )
        .map((r) => r.exam_type);
      
      console.log('Found cached exam types:', cachedExamTypes);
      return cachedExamTypes;
    } catch (err) {
      console.error('Error in checkExistingExamTypes:', err);
      return [];
    }
  };

  // Function to check if specific exam type exists
  const checkExamTypeExists = async (rollNo, classCode, examType) => {
    try {
      console.log('Checking exam type existence using cached data:', { rollNo, classCode, examType });
      
      // Use cached data only to avoid 406 errors
      const cachedResult = existingResults.find(
        (r) =>
          r.roll_no === rollNo &&
          r.class_code === classCode &&
          r.exam_type === examType
      );
      
      console.log('Found cached result:', cachedResult);
      return !!cachedResult;
    } catch (err) {
      console.error('Error in checkExamTypeExists:', err);
      return false;
    }
  };

  // Effect to fetch student info when shouldFetchStudent is true
  useEffect(() => {
    if (shouldFetchStudent && formData.roll_no && formData.class_code) {
      fetchStudentInfo(formData.roll_no, formData.class_code);
      setShouldFetchStudent(false); // Reset the flag
    }
  }, [shouldFetchStudent, formData.roll_no, formData.class_code]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // If roll_no or class_code changes and both fields have values, trigger fetch
    if ((name === "roll_no" || name === "class_code") && value) {
      if (
        (name === "roll_no" && formData.class_code) ||
        (name === "class_code" && formData.roll_no)
      ) {
        setShouldFetchStudent(true);
        setStudentNotFound(false); // Reset not found status when user changes inputs
      }
    }
  };

  // Function to fetch student info based on roll number and class code
  const fetchStudentInfo = async (rollNo, classCode) => {
    if (!rollNo || !classCode) return;

    setFetchingStudent(true);
    try {
      // First try to find in existing results (this avoids Supabase queries)
      const resultsForStudent = existingResults.filter(
        (r) => r.roll_no === rollNo && r.class_code === classCode
      );

      if (resultsForStudent.length > 0) {
        // Get the first result for this student to auto-fill student name and class
        setFormData((prev) => ({
          ...prev,
          student_name: resultsForStudent[0].student_name || "",
          class: resultsForStudent[0].class || "",
        }));
        setStudentNotFound(false);
      } else {
        // Only call the external service if we don't have the data cached
        console.log('Student not found in cached results, calling external service...');
        const studentInfo = await getStudentByRollNumberAndClassCode(
          rollNo,
          classCode
        );
        if (studentInfo) {
          setFormData((prev) => ({
            ...prev,
            student_name: studentInfo.student_name || "",
            class: studentInfo.class || "",
          }));
          setStudentNotFound(false);
        } else {
          // Clear student info if no match found in both sources
          setFormData((prev) => ({
            ...prev,
            student_name: "",
            class: "",
          }));
          setStudentNotFound(true);
        }
      }
    } catch (err) {
      console.error("Error fetching student info:", err);
      // Clear student info if there's an error
      setFormData((prev) => ({
        ...prev,
        student_name: "",
        class: "",
      }));
      setStudentNotFound(true);
    } finally {
      setFetchingStudent(false);
    }
  };

  // Handle subject input changes
  const handleSubjectChange = (index, field, value) => {
    const updatedSubjects = [...subjects];
    updatedSubjects[index][field] = value;
    setSubjects(updatedSubjects);
  };

  // Add a new subject row
  const addSubject = () => {
    setSubjects([...subjects, { name: "", marks: "", max_marks: 100 }]);
  };

  // Remove a subject row
  const removeSubject = (index) => {
    if (subjects.length <= 1) return;
    const updatedSubjects = subjects.filter((_, i) => i !== index);
    setSubjects(updatedSubjects);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Validate required fields
      if (
        !formData.roll_no ||
        !formData.class_code ||
        !formData.exam_type ||
        !formData.grade
      ) {
        throw new Error("Please fill in all required fields");
      }

      // Check if student name and class are populated (auto-fetched)
      if (!formData.student_name || !formData.class) {
        throw new Error(
          "Please enter correct Roll Number and Class Code to auto-fetch student information"
        );
      }

      // Check if exam type already exists for this student and class (using direct query)
      const examTypeExists = await checkExamTypeExists(
        formData.roll_no,
        formData.class_code,
        formData.exam_type
      );

      if (examTypeExists) {
        throw new Error(
          `Result for exam type "${formData.exam_type}" already exists for this student and class. Please edit the existing result instead.`
        );
      }

      // Check if there are already 3 exam types for this roll number and class code (using direct query)
      const existingExamTypesForStudent = await checkExistingExamTypes(
        formData.roll_no,
        formData.class_code
      );

      if (existingExamTypesForStudent.length >= 3) {
        throw new Error(
          `Maximum 3 exam types allowed for roll number ${formData.roll_no} and class code ${formData.class_code}. Cannot add more.`
        );
      }

      // Validate roll number
      if (formData.roll_no.length !== 6 || isNaN(formData.roll_no)) {
        throw new Error("Roll Number must be exactly 6 digits");
      }

      // Prepare subjects array in the required format
      const subjectsArray = subjects
        .filter(
          (subject) =>
            subject.name.trim() !== "" &&
            subject.marks !== "" &&
            subject.max_marks !== ""
        )
        .map((subject) => ({
          name: subject.name,
          marks: parseInt(subject.marks) || 0,
          max_marks: parseInt(subject.max_marks) || 100,
        }));

      if (subjectsArray.length === 0) {
        throw new Error(
          "At least one subject with name, marks, and max marks is required"
        );
      }

      const resultData = {
        ...formData,
        subjects: subjectsArray,
      };

      // Add the new result
      await addResultManually(resultData);
      setSuccess("Result added successfully");

      // Navigate back to the results dashboard
      setTimeout(() => {
        navigate("/admin/dashboard");
      }, 1500);
    } catch (err) {
      setError(err.message || "Failed to add result");
    } finally {
      setLoading(false);
    }
  };

  // Get existing exam types for the current student (using direct query)
  const getExistingExamTypes = async () => {
    if (!formData.roll_no || !formData.class_code) {
      return [];
    }
    return await checkExistingExamTypes(formData.roll_no, formData.class_code);
  };

  // Get existing exam types for the current student (using cached data)
  const getCachedExistingExamTypes = () => {
    return existingResults
      .filter(
        (r) =>
          r.roll_no === formData.roll_no && r.class_code === formData.class_code
      )
      .map((r) => r.exam_type);
  };

  // Get available exam types (all possible exam types that can be selected)
  const getAvailableExamTypes = () => {
    if (!formData.roll_no || !formData.class_code) {
      // Return common exam types if no roll/class info yet
      return ["Quarterly", "Half-Yearly", "Annual"];
    }

    const existingExamTypes = getCachedExistingExamTypes(); // Use cached version for UI
    const allPossibleTypes = ["Quarterly", "Half-Yearly", "Annual"];

    // Filter out existing exam types to only show available ones
    // Handle both "Quarterly" and "Quaterly" spellings for compatibility
    return allPossibleTypes.filter((type) => {
      const normalizedType = type.toLowerCase();
      return !existingExamTypes.some(existing => 
        existing.toLowerCase() === normalizedType || 
        (existing.toLowerCase() === "quaterly" && normalizedType === "quarterly") ||
        (existing.toLowerCase() === "quarterly" && normalizedType === "quaterly")
      );
    });
  };

  const existingExamTypes = getCachedExistingExamTypes(); // Use cached version for UI
  const availableExamTypes = getAvailableExamTypes();

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8}>
          <Card className="shadow">
            <Card.Header
              as="h4"
              className="bg-primary text-white text-center py-3"
            >
              Add Result
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

              {/* Display existing exam types if any */}
              {existingExamTypes.length > 0 && (
                <Alert variant="info">
                  <strong>Existing Exam Types:</strong>{" "}
                  {existingExamTypes.join(", ")}
                  {existingExamTypes.length >= 3 && (
                    <div className="mt-2 text-danger">
                      <strong>Warning:</strong> Maximum 3 exam types already
                      exist for this roll number and class code.
                    </div>
                  )}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Roll Number * (6 digits)</Form.Label>
                  <Form.Control
                    type="text"
                    name="roll_no"
                    value={formData.roll_no}
                    onChange={handleInputChange}
                    maxLength={6}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Class Code * (Unique per class)</Form.Label>
                  <Form.Control
                    type="text"
                    name="class_code"
                    value={formData.class_code}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Student Name (Auto-fetched)</Form.Label>
                  <div className="position-relative">
                    <Form.Control
                      type="text"
                      name="student_name"
                      value={formData.student_name}
                      onChange={() => {}} // No change handler - not editable
                      disabled={true} // Always disabled
                      className={
                        fetchingStudent
                          ? "bg-light"
                          : studentNotFound
                          ? "bg-light"
                          : ""
                      }
                    />
                    {fetchingStudent && (
                      <div className="position-absolute end-0 top-50 translate-middle-y me-2">
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          className="text-primary"
                        />
                      </div>
                    )}
                  </div>
                  {fetchingStudent && (
                    <div className="mt-1">
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        className="text-primary"
                      />
                      <span className="ms-2">
                        Fetching student information...
                      </span>
                    </div>
                  )}
                  {studentNotFound && !fetchingStudent && (
                    <div className="mt-1 text-danger">
                      No student found for this roll number and class code.
                    </div>
                  )}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Class (Auto-fetched)</Form.Label>
                  <div className="position-relative">
                    <Form.Control
                      type="text"
                      name="class"
                      value={formData.class}
                      onChange={() => {}} // No change handler - not editable
                      disabled={true} // Always disabled
                      className={
                        fetchingStudent
                          ? "bg-light"
                          : studentNotFound
                          ? "bg-light"
                          : ""
                      }
                    />
                    {fetchingStudent && (
                      <div className="position-absolute end-0 top-50 translate-middle-y me-2">
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          className="text-primary"
                        />
                      </div>
                    )}
                  </div>
                  {studentNotFound && !fetchingStudent && (
                    <div className="mt-1 text-danger">
                      No student found for this roll number and class code.
                    </div>
                  )}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Exam Type *</Form.Label>
                  <Form.Select
                    name="exam_type"
                    value={formData.exam_type}
                    onChange={handleInputChange}
                    required
                    disabled={studentNotFound || availableExamTypes.length === 0} // Disable if student not found or no exam types available
                  >
                    <option value="">Select an exam type</option>
                    {availableExamTypes.length > 0 ? (
                      availableExamTypes.map((type, index) => (
                        <option key={index} value={type}>
                          {type}
                        </option>
                      ))
                    ) : (
                      <option value="">
                        {existingExamTypes.length > 0 
                          ? `All exam types already used (${existingExamTypes.join(', ')})`
                          : 'No exam types available'
                        }
                      </option>
                    )}
                  </Form.Select>
                  <Form.Text className="text-muted">
                    {existingExamTypes.length >= 3 ? (
                      <div>
                        <strong>Maximum 3 exam types already exist for this student:</strong>
                        <br />
                        {existingExamTypes.map((type, index) => (
                          <span key={index} className="badge bg-secondary me-1 mb-1">
                            {type}
                          </span>
                        ))}
                        <br />
                        <small className="text-danger">
                          To add a new exam type, please delete an existing result first.
                        </small>
                      </div>
                    ) : (
                      <div>
                        You can add {3 - existingExamTypes.length} more exam type(s) for this student.
                        {existingExamTypes.length > 0 && (
                          <div className="mt-1">
                            <small>Existing exam types: </small>
                            {existingExamTypes.map((type, index) => (
                              <span key={index} className="badge bg-info me-1">
                                {type}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Result Status</Form.Label>
                  <Form.Select
                    name="result_status"
                    value={formData.result_status}
                    onChange={handleInputChange}
                    disabled={studentNotFound} // Disable if student not found
                  >
                    <option value="Pass">Pass</option>
                    <option value="Fail">Fail</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Grade *</Form.Label>
                  <Form.Control
                    type="text"
                    name="grade"
                    value={formData.grade}
                    onChange={handleInputChange}
                    required
                    disabled={studentNotFound} // Disable if student not found
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Subjects and Marks</Form.Label>
                  {subjects.map((subject, index) => (
                    <div key={index} className="d-flex mb-2">
                      <Form.Control
                        type="text"
                        placeholder="Subject name"
                        value={subject.name}
                        onChange={(e) =>
                          handleSubjectChange(index, "name", e.target.value)
                        }
                        className="me-2"
                        disabled={studentNotFound} // Disable if student not found
                      />
                      <Form.Control
                        type="number"
                        placeholder="Marks"
                        value={subject.marks}
                        onChange={(e) =>
                          handleSubjectChange(index, "marks", e.target.value)
                        }
                        className="me-2"
                        style={{ width: "100px" }}
                        disabled={studentNotFound} // Disable if student not found
                      />
                      <Form.Control
                        type="number"
                        placeholder="Max Marks"
                        value={subject.max_marks}
                        onChange={(e) =>
                          handleSubjectChange(
                            index,
                            "max_marks",
                            e.target.value
                          )
                        }
                        className="me-2"
                        style={{ width: "100px" }}
                        disabled={studentNotFound} // Disable if student not found
                      />
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => removeSubject(index)}
                        disabled={subjects.length <= 1 || studentNotFound} // Disable if student not found
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={addSubject}
                    className="mt-2"
                    disabled={studentNotFound} // Disable if student not found
                  >
                    Add Subject
                  </Button>
                </Form.Group>

                <div className="d-flex justify-content-between">
                  <Button variant="secondary" onClick={() => navigate(-1)}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={loading || studentNotFound} // Disable if student not found
                  >
                    {loading ? "Saving..." : "Add Result"}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AddResult;
