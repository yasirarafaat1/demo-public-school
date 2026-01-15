import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { addStudent } from "../../services/classStudentService";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Spinner,
  Image,
} from "react-bootstrap";
import { FaArrowLeft, FaSave, FaTimes } from "react-icons/fa";

const AddStudent = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [studentFormData, setStudentFormData] = useState({
    studentName: "",
    fatherName: "",
    motherName: "",
    dob: "",
    mobileNumber: "",
    email: "",
    registrationNumber: "",
    imageUrl: "",
    street: "",
    cityTownVillage: "",
    district: "",
    state: "",
    country: "",
    pinCode: "",
  });

  const handleStudentFormChange = (e) => {
    const { name, value } = e.target;
    setStudentFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !studentFormData.studentName ||
      !studentFormData.fatherName ||
      !studentFormData.motherName ||
      !studentFormData.dob
    ) {
      setError(
        "Student name, father name, mother name, and date of birth are required."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      await addStudent({
        studentName: studentFormData.studentName,
        fatherName: studentFormData.fatherName,
        motherName: studentFormData.motherName,
        dob: studentFormData.dob,
        mobileNumber: studentFormData.mobileNumber,
        email: studentFormData.email,
        registrationNumber: studentFormData.registrationNumber,
        imageUrl: studentFormData.imageUrl,
        street: studentFormData.street,
        cityTownVillage: studentFormData.cityTownVillage,
        district: studentFormData.district,
        state: studentFormData.state,
        country: studentFormData.country,
        pinCode: studentFormData.pinCode,
      });

      setSuccess("Student added successfully!");
      setTimeout(() => navigate(-1), 600);
    } catch (err) {
      console.error(err);
      setError("Failed to save student. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container fluid className="py-3">
      <Card>
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Add Student</h5>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => navigate(-1)}
            >
              <FaArrowLeft className="me-1" /> Back
            </Button>
          </div>
        </Card.Header>

        <Card.Body>
          {(error || success) && (
            <div className="mb-3">
              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}
            </div>
          )}

          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Student Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="studentName"
                    value={studentFormData.studentName}
                    onChange={handleStudentFormChange}
                    placeholder="Enter student name"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Registration Number</Form.Label>
                  <Form.Control
                    type="text"
                    name="registrationNumber"
                    value={studentFormData.registrationNumber}
                    onChange={handleStudentFormChange}
                    placeholder="Enter registration number"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Father Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="fatherName"
                    value={studentFormData.fatherName}
                    onChange={handleStudentFormChange}
                    placeholder="Enter father's name"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Mother Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="motherName"
                    value={studentFormData.motherName}
                    onChange={handleStudentFormChange}
                    placeholder="Enter mother's name"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Date of Birth *</Form.Label>
                  <Form.Control
                    type="date"
                    name="dob"
                    value={studentFormData.dob}
                    onChange={handleStudentFormChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Mobile Number</Form.Label>
                  <Form.Control
                    type="tel"
                    name="mobileNumber"
                    value={studentFormData.mobileNumber}
                    onChange={handleStudentFormChange}
                    placeholder="Enter mobile number"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email Address</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={studentFormData.email}
                    onChange={handleStudentFormChange}
                    placeholder="Enter email address"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Student Image</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          setStudentFormData((prev) => ({
                            ...prev,
                            imageUrl: event.target.result,
                          }));
                        };
                        reader.readAsDataURL(e.target.files[0]);
                      }
                    }}
                  />
                  {studentFormData.imageUrl && (
                    <div className="mt-2">
                      <img
                        src={studentFormData.imageUrl}
                        alt="Preview"
                        style={{ maxWidth: "100px", maxHeight: "100px" }}
                      />
                    </div>
                  )}
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <h5 className="mb-3 mt-4">Address Information</h5>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Street Address</Form.Label>
                  <Form.Control
                    type="text"
                    name="street"
                    value={studentFormData.street}
                    onChange={handleStudentFormChange}
                    placeholder="Enter street address"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>City/Town/Village</Form.Label>
                  <Form.Control
                    type="text"
                    name="cityTownVillage"
                    value={studentFormData.cityTownVillage}
                    onChange={handleStudentFormChange}
                    placeholder="Enter city/town/village"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>District</Form.Label>
                  <Form.Control
                    type="text"
                    name="district"
                    value={studentFormData.district}
                    onChange={handleStudentFormChange}
                    placeholder="Enter district"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>State</Form.Label>
                  <Form.Control
                    type="text"
                    name="state"
                    value={studentFormData.state}
                    onChange={handleStudentFormChange}
                    placeholder="Enter state"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Country</Form.Label>
                  <Form.Control
                    type="text"
                    name="country"
                    value={studentFormData.country}
                    onChange={handleStudentFormChange}
                    placeholder="Enter country"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Pin Code</Form.Label>
                  <Form.Control
                    type="text"
                    name="pinCode"
                    value={studentFormData.pinCode}
                    onChange={handleStudentFormChange}
                    placeholder="Enter pin code"
                  />
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex justify-content-end gap-2">
              <Button
                variant="secondary"
                type="button"
                onClick={() => navigate(-1)}
                disabled={loading}
              >
                <FaTimes className="me-1" /> Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-1" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FaSave className="me-1" /> Save
                  </>
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AddStudent;
