import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Button,
  Card,
  Form,
  Row,
  Col,
  Modal,
  Alert,
  Spinner,
  Image,
  Table,
  Collapse,
  InputGroup,
} from "react-bootstrap";
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaTimes,
  FaUserTie,
  FaChalkboardTeacher,
  FaUserGraduate,
  FaUpload,
  FaChevronDown,
  FaChevronRight,
  FaArrowLeft,
  FaSearch,
  FaFilter,
} from "react-icons/fa";
import {
  getStaffMembers,
  addStaffMember,
  updateStaffMember,
  deleteStaffMember,
} from "../services/adminService";
import { supabase } from "../services/supabaseService";
import UpdateHistory from "./UpdateHistory";

const StaffManager = ({ refreshTimestamp, fetchData }) => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    qualification: "",
    contact: "",
    email: "",
    status: "active",
    image: "/logo.png",
  });

  // Full page view states
  const [viewMode, setViewMode] = useState("list"); // 'list', 'addStaff', 'editStaff', 'viewHistory'
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openPanel, setOpenPanel] = useState(true);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  // Fetch staff members
  const fetchStaff = async () => {
    setLoading(true);
    setError("");
    try {
      const staffData = await getStaffMembers();
      setStaff(staffData);
    } catch (err) {
      console.error("Error fetching staff:", err);
      // Handle specific error cases
      if (
        err.message &&
        (err.message.includes("row-level security") ||
          err.message.includes("403"))
      ) {
        setError(err.message);
      } else {
        setError("Failed to load staff members. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [refreshTimestamp]);

  // Filter and search staff
  const filteredStaff = useMemo(() => {
    return staff.filter((member) => {
      const matchesSearch =
        !searchTerm ||
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.qualification &&
          member.qualification
            .toLowerCase()
            .includes(searchTerm.toLowerCase()));

      const matchesRole = !roleFilter || member.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [staff, searchTerm, roleFilter]);

  // Get unique roles for filter dropdown
  const uniqueRoles = useMemo(() => {
    return [...new Set(staff.map((member) => member.role).filter(Boolean))];
  }, [staff]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name.includes("social.")) {
      const socialField = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        social: {
          ...prev.social,
          [socialField]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Handle image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
    if (!validTypes.includes(file.type)) {
      setError("Please upload a valid image file (JPEG, JPG, PNG, GIF)");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size exceeds 5MB limit");
      return;
    }

    setUploading(true);
    setError("");

    try {
      // Create unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${fileExt}`;
      const filePath = `staff/${fileName}`;

      // Check available buckets and use the first available one
      let bucketName = "public";
      try {
        const { data: buckets, error: bucketError } =
          await supabase.storage.listBuckets();

        if (bucketError) {
          console.warn("Could not list buckets:", bucketError);
        } else if (buckets && buckets.length > 0) {
          // Use 'images' bucket if it exists, otherwise use the first available bucket
          const imagesBucket = buckets.find(
            (bucket) => bucket.name === "images"
          );
          bucketName = imagesBucket ? imagesBucket.name : buckets[0].name;
        } else {
          // If no buckets exist, we'll try to upload without specifying a bucket
          // and handle the error gracefully
          console.warn("No storage buckets found");
        }
      } catch (bucketError) {
        console.warn(
          "Error listing buckets, will try direct upload:",
          bucketError
        );
      }

      // Try to upload to the selected bucket
      let data, error;
      try {
        const result = await supabase.storage
          .from(bucketName)
          .upload(filePath, file);
        data = result.data;
        error = result.error;
      } catch (uploadError) {
        console.warn("Bucket upload failed:", uploadError);
        // If bucket upload fails, fall back to base64 encoding
        const base64Image = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = (e) =>
            reject(new Error("Failed to process image file."));
          reader.readAsDataURL(file);
        });

        // Update form data with base64 image
        setFormData((prev) => ({
          ...prev,
          image: base64Image,
        }));

        setSuccess("Image processed successfully (stored locally)");
        setTimeout(() => setSuccess(""), 3000);
        return; // Exit early as we're using base64
      }

      if (error) {
        // If we get a bucket error, fall back to base64
        if (error.message && error.message.includes("Bucket")) {
          const base64Image = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) =>
              reject(new Error("Failed to process image file."));
            reader.readAsDataURL(file);
          });

          // Update form data with base64 image
          setFormData((prev) => ({
            ...prev,
            image: base64Image,
          }));

          setSuccess("Image processed successfully (stored locally)");
          setTimeout(() => setSuccess(""), 3000);
          return; // Exit early as we're using base64
        }
        throw error;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucketName).getPublicUrl(filePath);

      // Update form data with new image URL
      setFormData((prev) => ({
        ...prev,
        image: publicUrl,
      }));

      setSuccess("Image uploaded successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error uploading image:", err);
      setError("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // Trigger file input
  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate required fields including image
    if (!formData.name.trim()) {
      setError("Name is required");
      setIsSubmitting(false);
      return;
    }

    if (!formData.role.trim()) {
      setError("Role is required");
      setIsSubmitting(false);
      return;
    }

    if (!formData.email.trim()) {
      setError("Email is required");
      setIsSubmitting(false);
      return;
    }

    // Check if image is the default placeholder (meaning no image was uploaded)
    if (!formData.image || formData.image === "/logo.png") {
      setError("Please upload a staff member image");
      setIsSubmitting(false);
      return;
    }

    try {
      // Prepare staff data
      const staffData = {
        name: formData.name.trim(),
        role: formData.role,
        qualification: formData.qualification,
        contact: formData.contact,
        email: formData.email,
        status: formData.status,
        // Use uploaded image or default
        image_url: formData.image || "/logo.png",
      };

      // If updating, call update function, else create new
      if (editingId) {
        await updateStaffMember(editingId, staffData);
        setSuccess("Staff member updated successfully.");
      } else {
        await addStaffMember(staffData);
        setSuccess("Staff member added successfully.");
      }

      setShowModal(false);
      fetchStaff();
      if (fetchData) {
        fetchData();
      }
    } catch (err) {
      console.error("Error saving staff member:", err);

      // Handle specific error cases
      if (err.message && err.message.includes("row-level security")) {
        setError(
          "You don't have permission to modify staff data. Please contact your administrator."
        );
      } else if (err.message && err.message.includes("403")) {
        setError(
          "Access denied. Please check your authentication and permissions."
        );
      } else {
        setError(
          err.message || "Failed to save staff member. Please try again."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit button click
  const handleEdit = (staffMember) => {
    setFormData({
      name: staffMember.name || "",
      role: staffMember.role || "",
      qualification: staffMember.qualification || "",
      contact: staffMember.contact || "",
      email: staffMember.email || "",
      status: staffMember.status || "active",
      image: staffMember.image_url || staffMember.image || "/logo.png",
    });
    setEditingId(staffMember.id);
    setViewMode("editStaff");
  };

  // Handle delete button click
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this staff member?")) {
      try {
        await deleteStaffMember(id);
        setSuccess("Staff member deleted successfully!");
        fetchStaff();
        if (fetchData) {
          fetchData();
        }
        setTimeout(() => setSuccess(""), 3000);
      } catch (err) {
        console.error("Error deleting staff member:", err);
        setError("Failed to delete staff member. Please try again.");
      }
    }
  };

  // Reset form
  const handleReset = () => {
    setFormData({
      name: "",
      role: "",
      qualification: "",
      contact: "",
      email: "",
      status: "active",
      image: "/logo.png",
    });
    setEditingId(null);
  };

  // Close form
  const closeForm = () => {
    setViewMode("list");
    handleReset();
  };

  // Close history view
  const closeHistoryView = () => {
    setViewMode("list");
    setEditingId(null);
  };

  // Get role icon
  const getRoleIcon = (role) => {
    if (!role) return <FaUserGraduate className="text-muted me-2" />;
    if (role.toLowerCase().includes("principal"))
      return <FaUserTie className="text-primary me-2" />;
    if (
      role.toLowerCase().includes("teacher") ||
      role.toLowerCase().includes("head")
    )
      return <FaChalkboardTeacher className="text-success me-2" />;
    return <FaUserGraduate className="text-muted me-2" />;
  };

  // Toggle panel visibility
  const togglePanel = () => {
    setOpenPanel(!openPanel);
  };

  return (
    <div className="staff-manager">
      {viewMode === "list" && (
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4>Staff Management</h4>
          <Button
            variant="primary"
            onClick={() => {
              handleReset();
              setViewMode("addStaff");
            }}
          >
            <FaPlus className="me-2" /> Add Staff Member
          </Button>
        </div>
      )}

      {viewMode === "list" && error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}
      {viewMode === "list" && success && (
        <Alert variant="success" className="mb-4">
          {success}
        </Alert>
      )}

      <Card className="mb-4">
        <Card.Header
          onClick={togglePanel}
          style={{ cursor: "pointer" }}
          className="d-flex justify-content-between align-items-center"
        >
          <span>Staff Members ({filteredStaff.length})</span>
          <div>{openPanel ? <FaChevronDown /> : <FaChevronRight />}</div>
        </Card.Header>
        <Collapse in={openPanel}>
          <div>
            <Card.Body>
              {/* Search and Filter Controls */}
              <div className="d-flex mb-3">
                <InputGroup className="me-2" style={{ width: "300px" }}>
                  <InputGroup.Text>
                    <FaSearch />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Search staff..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
                <Form.Select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  style={{ width: "200px" }}
                >
                  <option value="">All Roles</option>
                  {uniqueRoles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </Form.Select>
                {(searchTerm || roleFilter) && (
                  <Button
                    variant="outline-secondary"
                    className="ms-2"
                    onClick={() => {
                      setSearchTerm("");
                      setRoleFilter("");
                    }}
                  >
                    Clear
                  </Button>
                )}
              </div>

              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </Spinner>
                  <p className="mt-2">Loading staff members...</p>
                </div>
              ) : filteredStaff.length === 0 ? (
                <div className="text-center py-5">
                  <FaUserTie className="display-4 text-muted mb-3" />
                  <h5>No staff members found</h5>
                  <p className="text-muted">
                    {staff.length === 0
                      ? 'Click the "Add Staff Member" button to add a new staff member'
                      : "Try adjusting your search or filter criteria"}
                  </p>
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="d-none d-md-block">
                    <Table striped bordered hover responsive>
                      <thead>
                        <tr>
                          <th width="10%">Photo</th>
                          <th>Name</th>
                          <th>Role</th>
                          <th>Qualification</th>
                          <th>Contact</th>
                          <th>Status</th>
                          <th width="15%">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStaff.map((member) => (
                          <tr key={member.id}>
                            <td>
                              <Image
                                src={
                                  member.image_url ||
                                  member.image ||
                                  "/logo.png"
                                }
                                alt={member.name}
                                rounded
                                style={{
                                  width: "50px",
                                  height: "50px",
                                  objectFit: "cover",
                                }}
                                onError={(e) => {
                                  e.target.src = "/logo.png";
                                }}
                              />
                            </td>
                            <td>
                              <strong>{member.name}</strong>
                              <div className="small text-muted">
                                {member.email}
                              </div>
                            </td>
                            <td>
                              <div className="d-flex align-items-center">
                                {getRoleIcon(member.role)}
                                {member.role}
                              </div>
                            </td>
                            <td>{member.qualification || "-"}</td>
                            <td>
                              {member.contact ? (
                                <a href={`tel:${member.contact}`}>
                                  {member.contact}
                                </a>
                              ) : (
                                "-"
                              )}
                            </td>
                            <td>
                              <span
                                className={`badge ${
                                  member.status === "active"
                                    ? "bg-success"
                                    : member.status === "inactive"
                                    ? "bg-danger"
                                    : member.status === "retired"
                                    ? "bg-secondary"
                                    : "bg-warning"
                                }`}
                              >
                                {member.status === "active"
                                  ? "Active"
                                  : member.status === "inactive"
                                  ? "Inactive"
                                  : member.status === "retired"
                                  ? "Retired"
                                  : "On Leave"}
                              </span>
                            </td>
                            <td>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                className="me-1"
                                onClick={() => handleEdit(member)}
                              >
                                <FaEdit />
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleDelete(member.id)}
                              >
                                <FaTrash />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="d-md-none">
                    <Row xs={1} className="g-3">
                      {filteredStaff.map((member) => (
                        <Col key={member.id}>
                          <Card>
                            <Card.Body>
                              <div className="d-flex">
                                <Image
                                  src={
                                    member.image_url ||
                                    member.image ||
                                    "/logo.png"
                                  }
                                  alt={member.name}
                                  rounded
                                  style={{
                                    width: "60px",
                                    height: "60px",
                                    objectFit: "cover",
                                  }}
                                  onError={(e) => {
                                    e.target.src = "/logo.png";
                                  }}
                                />
                                <div className="ms-3 flex-grow-1">
                                  <Card.Title className="mb-1 d-flex align-items-center">
                                    {getRoleIcon(member.role)}
                                    {member.name}
                                  </Card.Title>
                                  <div className="small text-muted mb-1">
                                    {member.email}
                                  </div>
                                  <div className="small">
                                    <strong>Role:</strong> {member.role}
                                  </div>
                                  {member.qualification && (
                                    <div className="small">
                                      <strong>Qualification:</strong>{" "}
                                      {member.qualification}
                                    </div>
                                  )}
                                  {member.contact && (
                                    <div className="small">
                                      <strong>Contact:</strong>
                                      <a href={`tel:${member.contact}`}>
                                        {" "}
                                        {member.contact}
                                      </a>
                                    </div>
                                  )}
                                  <div className="small">
                                    <strong>Status:</strong>
                                    <span
                                      className={`badge ${
                                        member.status === "active"
                                          ? "bg-success"
                                          : member.status === "inactive"
                                          ? "bg-danger"
                                          : member.status === "retired"
                                          ? "bg-secondary"
                                          : "bg-warning"
                                      } ms-1`}
                                    >
                                      {member.status === "active"
                                        ? "Active"
                                        : member.status === "inactive"
                                        ? "Inactive"
                                        : member.status === "retired"
                                        ? "Retired"
                                        : "On Leave"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="mt-3 d-flex justify-content-end">
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  className="me-1"
                                  onClick={() => handleEdit(member)}
                                >
                                  <FaEdit />
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleDelete(member.id)}
                                >
                                  <FaTrash />
                                </Button>
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </div>
                </>
              )}
            </Card.Body>
          </div>
        </Collapse>
      </Card>

      {/* Add/Edit Staff Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>
              {editingId ? "Edit Staff Member" : "Add New Staff Member"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row>
              <Col md={4} className="text-center mb-3">
                <div className="position-relative d-inline-block">
                  <div className="position-relative">
                    <Image
                      src={formData.image || "/logo.png"}
                      alt="Staff"
                      rounded
                      className="mb-3"
                      style={{
                        width: "150px",
                        height: "150px",
                        objectFit: "cover",
                      }}
                      onError={(e) => {
                        e.target.src = "/logo.png";
                      }}
                    />
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      style={{ display: "none" }}
                    />
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={triggerFileInput}
                      disabled={uploading}
                      className="position-absolute bottom-0 end-0"
                    >
                      {uploading ? (
                        <Spinner animation="border" size="sm" />
                      ) : (
                        <FaUpload />
                      )}
                    </Button>
                  </div>
                  <Form.Text className="text-muted">
                    Upload a clear photo of the staff member (Max 5MB)
                  </Form.Text>
                </div>
              </Col>
              <Col md={8}>
                <Row>
                  <Col md={6}>
                    <Form.Group controlId="formName" className="mb-3">
                      <Form.Label>Full Name *</Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter full name"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="formRole" className="mb-3">
                      <Form.Label>Role/Position *</Form.Label>
                      <Form.Control
                        type="text"
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        placeholder="e.g., Teacher, Principal"
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group controlId="formQualification" className="mb-3">
                      <Form.Label>Qualification</Form.Label>
                      <Form.Control
                        type="text"
                        name="qualification"
                        value={formData.qualification}
                        onChange={handleInputChange}
                        placeholder="e.g., M.Sc, B.Ed"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="formContact" className="mb-3">
                      <Form.Label>Contact Number</Form.Label>
                      <Form.Control
                        type="tel"
                        name="contact"
                        value={formData.contact}
                        onChange={handleInputChange}
                        placeholder="e.g., +1234567890"
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={12}>
                    <Form.Group controlId="formEmail" className="mb-3">
                      <Form.Label>Email Address *</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="e.g., staff@example.com"
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={12}>
                    <Form.Group controlId="formStatus" className="mb-3">
                      <Form.Label>Status</Form.Label>
                      <Form.Select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="on_leave">On Leave</option>
                        <option value="retired">Retired</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowModal(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={
                !formData.name ||
                !formData.role ||
                !formData.email ||
                isSubmitting
              }
            >
              {isSubmitting ? (
                <>
                  <Spinner
                    as="span"
                    size="sm"
                    animation="border"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  {editingId ? "Updating..." : "Adding..."}
                </>
              ) : editingId ? (
                "Update"
              ) : (
                "Add Staff"
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Staff Form (Full Page View) */}
      {(viewMode === "addStaff" || viewMode === "editStaff") && (
        <Card className="mb-4">
          <Card.Header>
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                {editingId ? "Edit Staff Member" : "Add New Staff Member"}
              </h5>
              <Button variant="outline-secondary" size="sm" onClick={closeForm}>
                <FaArrowLeft className="me-1" /> Back to List
              </Button>
            </div>
          </Card.Header>
          <Card.Body>
            <Form onSubmit={handleSubmit}>
              <Row>
                <Col md={4} className="text-center mb-3">
                  <div className="position-relative d-inline-block">
                    <div className="position-relative">
                      <Image
                        src={formData.image || "/logo.png"}
                        alt="Staff"
                        rounded
                        className="mb-3"
                        style={{
                          width: "150px",
                          height: "150px",
                          objectFit: "cover",
                        }}
                        onError={(e) => {
                          e.target.src = "/logo.png";
                        }}
                      />
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/*"
                        style={{ display: "none" }}
                      />
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={triggerFileInput}
                        disabled={uploading}
                        className="position-absolute bottom-0 end-0"
                      >
                        {uploading ? (
                          <Spinner animation="border" size="sm" />
                        ) : (
                          <FaUpload />
                        )}
                      </Button>
                    </div>
                    <Form.Text className="text-muted">
                      Upload a clear photo of the staff member (Max 5MB)
                    </Form.Text>
                  </div>
                </Col>
                <Col md={8}>
                  <Row>
                    <Col md={6}>
                      <Form.Group controlId="formName" className="mb-3">
                        <Form.Label>Full Name *</Form.Label>
                        <Form.Control
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Enter full name"
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group controlId="formRole" className="mb-3">
                        <Form.Label>Role/Position *</Form.Label>
                        <Form.Control
                          type="text"
                          name="role"
                          value={formData.role}
                          onChange={handleInputChange}
                          placeholder="e.g., Teacher, Principal"
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={6}>
                      <Form.Group
                        controlId="formQualification"
                        className="mb-3"
                      >
                        <Form.Label>Qualification</Form.Label>
                        <Form.Control
                          type="text"
                          name="qualification"
                          value={formData.qualification}
                          onChange={handleInputChange}
                          placeholder="e.g., M.Sc, B.Ed"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group controlId="formContact" className="mb-3">
                        <Form.Label>Contact Number</Form.Label>
                        <Form.Control
                          type="tel"
                          name="contact"
                          value={formData.contact}
                          onChange={handleInputChange}
                          placeholder="e.g., +1234567890"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={12}>
                      <Form.Group controlId="formEmail" className="mb-3">
                        <Form.Label>Email Address *</Form.Label>
                        <Form.Control
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="e.g., staff@example.com"
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={12}>
                      <Form.Group controlId="formStatus" className="mb-3">
                        <Form.Label>Status</Form.Label>
                        <Form.Select
                          name="status"
                          value={formData.status}
                          onChange={handleInputChange}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="on_leave">On Leave</option>
                          <option value="retired">Retired</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                </Col>
              </Row>

              <div className="d-flex justify-content-end gap-2">
                <Button
                  variant="secondary"
                  onClick={closeForm}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={
                    !formData.name ||
                    !formData.role ||
                    !formData.email ||
                    isSubmitting
                  }
                >
                  {isSubmitting ? (
                    <>
                      <Spinner
                        as="span"
                        size="sm"
                        animation="border"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      {editingId ? "Updating..." : "Adding..."}
                    </>
                  ) : editingId ? (
                    "Update"
                  ) : (
                    "Add Staff"
                  )}
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      )}

      {viewMode === "viewHistory" && editingId && (
        <Card className="mb-4">
          <Card.Header>
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Staff Member History</h5>
              <Button variant="outline-secondary" size="sm" onClick={closeHistoryView}>
                <FaArrowLeft className="me-1" /> Back to List
              </Button>
            </div>
          </Card.Header>
          <Card.Body>
            <UpdateHistory tableName="staff" recordId={editingId} />
          </Card.Body>
        </Card>
      )}

      {viewMode === "list" && (
        <UpdateHistory tableName="staff" recordId={null} />
      )}
    </div>
  );
};

export default StaffManager;
