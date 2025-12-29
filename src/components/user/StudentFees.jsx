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
  Breadcrumb,
} from "react-bootstrap";
import {
  getStudentFeeSummary,
  getFeesByStudentId,
  addFee,
  updateFee,
  deleteFee,
} from "../../services/feeService";
import { sendFeeAddedEmail } from "../../services/emailService";
import {
  getClasses,
  getSessions,
  getStudentClassesByStudentId,
} from "../../services/classStudentService";
import SkeletonLoader from "./SkeletonLoader";
import { useNavigate, useParams } from "react-router-dom";

const StudentFees = () => {
  const [studentInfo, setStudentInfo] = useState(null);
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingFee, setEditingFee] = useState(null);
  const [feeForm, setFeeForm] = useState({
    month: "",
    year: new Date().getFullYear(),
    amount: "",
    paidAmount: "",
    status: "pending",
    receiptNumber: "",
  });
  const [classes, setClasses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [currentAssignment, setCurrentAssignment] = useState(null);

  const navigate = useNavigate();
  const { studentId } = useParams();

  useEffect(() => {
    if (studentId) {
      fetchData();
    }
  }, [studentId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      // Fetch all required data in parallel
      const [studentData, classesData, sessionsData, studentClassesData] =
        await Promise.all([
          getStudentFeeSummary(studentId),
          getClasses(),
          getSessions(),
          getStudentClassesByStudentId(studentId),
        ]);

      setStudentInfo(studentData.student);
      setFees(studentData.fees);
      setSummary({
        total_fees: studentData.total_fees,
        total_paid: studentData.total_paid,
        total_due: studentData.total_due,
        fee_status: studentData.fee_status,
      });

      // Get the current assignment (latest session)
      if (studentClassesData && studentClassesData.length > 0) {
        // Sort by created_at to get the most recent assignment
        const sortedAssignments = studentClassesData.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        const latestAssignment = sortedAssignments[0];
        setCurrentAssignment(latestAssignment);
      }

      setClasses(classesData);
      setSessions(sessionsData);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load student fee information. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  const handleAddFee = () => {
    setEditingFee(null);
    setFeeForm({
      month: "",
      year: new Date().getFullYear(),
      amount: "",
      paidAmount: "",
      status: "pending",
      receiptNumber: "",
    });
    setShowAddForm(true);
  };

  const handleEditFee = (fee) => {
    setEditingFee(fee);
    setFeeForm({
      month: fee.month,
      year: fee.year,
      amount: fee.amount,
      paidAmount: fee.paid_amount,
      status: fee.status,
      receiptNumber: fee.notes || "",
    });
    setShowAddForm(true);
  };

  const handleDeleteFee = async (feeId) => {
    if (window.confirm("Are you sure you want to delete this fee record?")) {
      try {
        setError("");
        await deleteFee(feeId);
        fetchData(); // Refresh the data
      } catch (err) {
        console.error("Error deleting fee:", err);
        setError("Failed to delete fee record. Please try again.");
      }
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFeeForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      setError("");

      const feeData = {
        studentId: studentId,
        classId: currentAssignment?.class_id,
        sessionId: currentAssignment?.session_id,
        rollNumber: currentAssignment?.roll_number,
        month: feeForm.month,
        year: parseInt(feeForm.year || new Date().getFullYear(), 10),
        amount: parseFloat(feeForm.amount || 0),
        paidAmount: parseFloat(feeForm.paidAmount || 0),
        status: feeForm.status,
        receiptNumber: feeForm.receiptNumber,
      };

      if (editingFee) {
        // Update existing fee
        await updateFee(editingFee.id, feeData);
      } else {
        // Add new fee
        const insertedFee = await addFee(feeData);

        const studentEmail = studentInfo?.email;
        if (studentEmail) {
          const dueAmount = (feeData.amount || 0) - (feeData.paidAmount || 0);

          try {
            await sendFeeAddedEmail({
              to: "yasirshekh0786@gmail.com",
              studentName: studentInfo?.student_name || "Student",
              month: feeData.month,
              year: feeData.year,
              totalAmount: feeData.amount,
              paidAmount: feeData.paidAmount || 0,
              dueAmount,
              status: feeData.status,
              receiptNumber: feeData.receiptNumber,
              createdAt: insertedFee?.created_at || new Date().toISOString(),
              portalLink:
                import.meta.env.VITE_SCHOOL_PORTAL_LINK ||
                window.location.origin,
              schoolName: import.meta.env.VITE_SCHOOL_NAME || "Demo Public School",
              schoolAddress: import.meta.env.VITE_SCHOOL_ADDRESS || "",
              schoolContact: import.meta.env.VITE_SCHOOL_CONTACT || "",
              schoolEmail: import.meta.env.VITE_SCHOOL_EMAIL || "",
            });
          } catch (emailErr) {
            console.error("Fee saved but email sending failed:", emailErr);
            setError(
              "Fee saved successfully, but email sending failed. Please verify Resend configuration."
            );
          }
        } else {
          console.warn(
            "Student email not found. Skipping fee notification email.",
            studentInfo
          );
        }
      }

      setShowAddForm(false);
      fetchData(); // Refresh the data
    } catch (err) {
      console.error("Error saving fee:", err);
      setError("Failed to save fee record. Please try again.");
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getFeeStatusVariant = (status) => {
    switch (status) {
      case "paid":
        return "success";
      case "partial":
        return "warning";
      case "pending":
        return "danger";
      case "overdue":
        return "dark";
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
      case "overdue":
        return "Overdue";
      default:
        return status;
    }
  };

  const getMonthOptions = () => {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return months.map((month) => (
      <option key={month} value={month}>
        {month}
      </option>
    ));
  };

  const getCurrentYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 2; i <= currentYear + 2; i++) {
      years.push(
        <option key={i} value={i}>
          {i}
        </option>
      );
    }
    return years;
  };

  if (loading && !studentInfo) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col xs={12}>
          <Breadcrumb>
            <Breadcrumb.Item
              onClick={() => navigate("/admin/dashboard")}
              style={{ cursor: "pointer" }}
            >
              Admin Dashboard
            </Breadcrumb.Item>
            <Breadcrumb.Item active>
              {studentInfo?.student_name || "Student"} Fees
            </Breadcrumb.Item>
          </Breadcrumb>
          <h3 className="mb-0">
            {studentInfo?.student_name || "Student"} - Fees Management
          </h3>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" onClose={() => setError("")} dismissible>
          {error}
        </Alert>
      )}

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
                    <strong>Registration Number:</strong>{" "}
                    {studentInfo.registration_number}
                  </Col>
                  <Col md={3}>
                    <strong>Father's Name:</strong> {studentInfo.father_name}
                  </Col>
                  <Col md={3}>
                    <strong>Class:</strong>{" "}
                    {currentAssignment?.classes?.class_number || "N/A"}
                  </Col>
                </Row>
                <Row className="mt-2">
                  <Col md={3}>
                    <strong>Class Code:</strong>{" "}
                    {currentAssignment?.classes?.class_code || "N/A"}
                  </Col>
                  <Col md={3}>
                    <strong>Roll Number:</strong>{" "}
                    {currentAssignment?.roll_number || "N/A"}
                  </Col>
                  <Col md={3}>
                    <strong>Current Session:</strong>{" "}
                    {currentAssignment?.sessions
                      ? `${currentAssignment.sessions.start_year}-${currentAssignment.sessions.end_year}`
                      : "N/A"}
                  </Col>
                  <Col md={3}>
                    <strong>Mobile:</strong>{" "}
                    {studentInfo.mobile_number || "N/A"}
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Fee Summary */}
      <Row className="mb-4">
        <Col md={4}>
          <Card className="text-center">
            <Card.Body>
              <h5>Total Fees</h5>
              <h3 className="text-primary">
                {formatCurrency(summary.total_fees || 0)}
              </h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center">
            <Card.Body>
              <h5>Total Paid</h5>
              <h3 className="text-success">
                {formatCurrency(summary.total_paid || 0)}
              </h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center">
            <Card.Body>
              <h5>Total Due</h5>
              <h3
                className={`text-${summary.total_due > 0 ? "danger" : "success"
                  }`}
              >
                {formatCurrency(summary.total_due || 0)}
              </h3>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Add/Edit Fee Form */}
      {showAddForm && (
        <Row className="mb-4">
          <Col xs={12}>
            <Card>
              <Card.Body>
                <h5>{editingFee ? "Edit Fee Record" : "Add New Fee Record"}</h5>
                <Form onSubmit={handleFormSubmit}>
                  <Row>
                    <Col md={6} lg={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Month</Form.Label>
                        <Form.Select
                          name="month"
                          value={feeForm.month}
                          onChange={handleFormChange}
                          required
                        >
                          <option value="">Select Month</option>
                          {getMonthOptions()}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6} lg={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Year</Form.Label>
                        <Form.Select
                          name="year"
                          value={feeForm.year}
                          onChange={handleFormChange}
                          required
                        >
                          {getCurrentYearOptions()}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6} lg={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Total Amount (₹)</Form.Label>
                        <Form.Control
                          type="number"
                          name="amount"
                          value={feeForm.amount}
                          onChange={handleFormChange}
                          min="0"
                          step="0.01"
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6} lg={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Paid Amount (₹)</Form.Label>
                        <Form.Control
                          type="number"
                          name="paidAmount"
                          value={feeForm.paidAmount}
                          onChange={handleFormChange}
                          min="0"
                          step="0.01"
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={6} lg={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Status</Form.Label>
                        <Form.Select
                          name="status"
                          value={feeForm.status}
                          onChange={handleFormChange}
                          required
                        >
                          <option value="pending">Pending</option>
                          <option value="partial">Partial</option>
                          <option value="paid">Paid</option>
                          <option value="overdue">Overdue</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={12}>
                      <Form.Group className="mb-3">
                        <Form.Label>Receipt Number</Form.Label>
                        <Form.Control
                          as="textarea"
                          name="receiptNumber"
                          value={feeForm.receiptNumber}
                          onChange={handleFormChange}
                          rows="2"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <div className="d-flex gap-2">
                    <Button variant="primary" type="submit">
                      {editingFee ? "Update Fee" : "Add Fee"}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setShowAddForm(false);
                        setEditingFee(null);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Fee Records Table */}
      <Row>
        <Col xs={12}>
          <Card>
            <Card.Body className="p-0">
              <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
                <h5 className="mb-0">Fee Records</h5>
                <Button variant="primary" onClick={handleAddFee}>
                  Add New Fee
                </Button>
              </div>

              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table striped bordered hover responsive className="mb-0">
                    <thead>
                      <tr>
                        <th>Receipt Number</th>
                        <th>Month</th>
                        <th>Year</th>
                        <th>Total Amount</th>
                        <th>Paid Amount</th>
                        <th>Due Amount</th>
                        <th>Status</th>
                        <th>Payment Date</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fees.map((fee) => (
                        <tr key={fee.id}>
                          <td>{fee.notes || "-"}</td>
                          <td>{fee.month}</td>
                          <td>{fee.year}</td>
                          <td>{formatCurrency(fee.amount)}</td>
                          <td>{formatCurrency(fee.paid_amount)}</td>
                          <td>{formatCurrency(fee.due_amount)}</td>
                          <td>
                            <span
                              className={`badge bg-${getFeeStatusVariant(
                                fee.status
                              )}`}
                            >
                              {getFeeStatusText(fee.status)}
                            </span>
                          </td>
                          <td>
                            {fee.created_at
                              ? new Date(fee.created_at).toLocaleDateString()
                              : "-"}
                          </td>

                          <td className="text-center">
                            <div className="d-flex justify-content-center gap-2">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleEditFee(fee)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleDeleteFee(fee.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {fees.length === 0 && (
                        <tr>
                          <td colSpan="9" className="text-center py-3">
                            No fee records found for this student.
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
    </Container>
  );
};

export default StudentFees;
