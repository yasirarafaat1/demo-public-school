import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Card,
  Alert,
  Spinner,
} from "react-bootstrap";
import { getResultById, updateResult } from "../services/resultService";
import { getClasses } from "../services/classStudentService";
import SkeletonLoader from "../components/user/SkeletonLoader";

const EditResult = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    roll_no: "",
    class_code: "",
    exam_type: "",
    subjects: [],
  });
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch classes
        const classesData = await getClasses();
        setClasses(classesData);

        // Fetch result data by ID
        const resultData = await getResultById(id);

        if (resultData) {
          // Set form data with the fetched result
          setFormData({
            roll_no: resultData.roll_no || "",
            class_code: resultData.class_code || "",
            exam_type: resultData.exam_type || "",
            subjects: resultData.subjects || [],
          });
        } else {
          setError("Result not found");
        }
      } catch (err) {
        setError(`Error fetching data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubjectChange = (index, field, value) => {
    const updatedSubjects = [...formData.subjects];
    updatedSubjects[index][field] = value;
    setFormData((prev) => ({
      ...prev,
      subjects: updatedSubjects,
    }));
  };

  const addSubject = () => {
    setFormData((prev) => ({
      ...prev,
      subjects: [...prev.subjects, { name: "", marks: "", max_marks: 100 }],
    }));
  };

  const removeSubject = (index) => {
    if (formData.subjects.length <= 1) return;
    const updatedSubjects = formData.subjects.filter((_, i) => i !== index);
    setFormData((prev) => ({
      ...prev,
      subjects: updatedSubjects,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (
        !formData.roll_no ||
        !formData.class_code ||
        !formData.subjects.length
      ) {
        throw new Error("Please fill in all required fields");
      }

      if (formData.roll_no.length !== 6 || isNaN(formData.roll_no)) {
        throw new Error("Roll Number must be exactly 6 digits");
      }

      const subjectsArray = formData.subjects
        .filter((subject) => subject.name.trim() !== "" && subject.marks !== "")
        .map((subject) => ({
          name: subject.name,
          marks: parseInt(subject.marks) || 0,
          max_marks: parseInt(subject.max_marks) || 100,
        }));

      const resultData = {
        ...formData,
        subjects: subjectsArray,
      };

      await updateResult(id, resultData);
      setSuccess("Result updated successfully");

      setTimeout(() => {
        navigate(`/admin/result/${formData.roll_no}/${formData.class_code}`);
      }, 1500);
    } catch (err) {
      setError(err.message || "Failed to update result");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8}>
          {loading ? (
            <div className="py-5">
              <SkeletonLoader type="card" count={3} />
            </div>
          ) : (
            <Card className="shadow">
              <Card.Header className="bg-primary text-white">
                <h3 className="mb-0">Edit Result</h3>
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
                    <Form.Label>Exam Type</Form.Label>
                    <Form.Select
                      name="exam_type"
                      value={formData.exam_type}
                      onChange={handleInputChange}
                    >
                      <option value="Semester">Semester</option>
                      <option value="Final">Final</option>
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Subjects and Marks</Form.Label>
                    {formData.subjects.map((subject, index) => (
                      <div key={index} className="d-flex mb-2">
                        <Form.Control
                          type="text"
                          placeholder="Subject name"
                          value={subject.name}
                          onChange={(e) =>
                            handleSubjectChange(index, "name", e.target.value)
                          }
                          className="me-2"
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
                        />
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => removeSubject(index)}
                          disabled={formData.subjects.length <= 1}
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
                    >
                      Add Subject
                    </Button>
                  </Form.Group>

                  <div className="d-flex justify-content-between">
                    <Button variant="secondary" onClick={() => navigate(-1)}>
                      Cancel
                    </Button>
                    <Button variant="primary" type="submit" disabled={loading}>
                      {loading ? "Saving..." : "Update Result"}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default EditResult;
