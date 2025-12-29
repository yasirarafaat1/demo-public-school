import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Button,
  Form,
  Modal,
  Alert,
  Badge,
} from "react-bootstrap";
import { FaThumbtack, FaExternalLinkAlt } from "react-icons/fa";
import {
  getNotices,
  addNotice,
  updateNotice,
  deleteNotice,
} from "../../services/supabaseService";
import { sendNoticeNotification } from "../../services/notificationService";
import ShareButton from "../user/ShareButton";

const NoticesManager = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [currentNotice, setCurrentNotice] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    link: "",
    isImportant: false,
  });

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getNotices();
      setNotices(data);
    } catch (err) {
      console.error("Error fetching notices:", err);
      setError("Failed to load notices. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleShowModal = (notice = null) => {
    if (notice) {
      setCurrentNotice(notice);
      setFormData({
        title: notice.title || "",
        content: notice.content || "",
        link: notice.link || "",
        isImportant: notice.is_important || false,
      });
    } else {
      setCurrentNotice(null);
      setFormData({
        title: "",
        content: "",
        link: "",
        isImportant: false,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentNotice(null);
    setFormData({
      title: "",
      content: "",
      link: "",
      isImportant: false,
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError("");

      const noticeData = {
        title: formData.title,
        content: formData.content,
        link: formData.link || null,
        isImportant: formData.isImportant,
      };

      if (currentNotice) {
        // Update existing notice
        await updateNotice(currentNotice.id, noticeData);
        // Send notification for updated notice
        await sendNoticeNotification("update", formData.title);
      } else {
        // Add new notice
        await addNotice(noticeData);
        // Send notification for new notice
        await sendNoticeNotification("add", formData.title);
      }

      handleCloseModal();
      fetchNotices();
    } catch (err) {
      console.error("Error saving notice:", err);
      setError("Failed to save notice. Please try again.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this notice?")) {
      try {
        setError("");
        await deleteNotice(id);
        fetchNotices();
      } catch (err) {
        console.error("Error deleting notice:", err);
        setError("Failed to delete notice. Please try again.");
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col xs={12}>
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <h3 className="mb-0">Notices Management</h3>
            <Button variant="primary" onClick={() => handleShowModal()}>
              Add New Notice
            </Button>
          </div>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" onClose={() => setError("")} dismissible>
          {error}
        </Alert>
      )}

      <Row>
        <Col xs={12}>
          <Card>
            <Card.Body className="p-0">
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
                        <th>Title</th>
                        <th>Created On</th>
                        <th>Link</th>
                        <th>Important</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {notices.map((notice) => (
                        <tr key={notice.id}>
                          <td>
                            {notice.title}
                            {notice.is_important && (
                              <FaThumbtack
                                className="text-danger ms-2"
                                title="Important Notice"
                              />
                            )}
                          </td>
                          <td>{formatDate(notice.created_at)}</td>
                          <td>
                            {notice.link ? (
                              <a
                                href={notice.link}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <FaExternalLinkAlt />
                              </a>
                            ) : (
                              "N/A"
                            )}
                          </td>
                          <td>
                            <Badge
                              bg={notice.is_important ? "danger" : "secondary"}
                            >
                              {notice.is_important ? "Yes" : "No"}
                            </Badge>
                          </td>
                          <td>
                            <div className="d-flex justify-content-end gap-2">
                              <ShareButton 
                                notice={notice} 
                                size="sm" 
                                variant="outline-info"
                                className="me-1"
                              />
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleShowModal(notice)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleDelete(notice.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {notices.length === 0 && (
                        <tr>
                          <td colSpan="5" className="text-center py-3">
                            No notices found. Add a new notice to get started.
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

      {/* Modal for Add/Edit Notice */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {currentNotice ? "Edit Notice" : "Add New Notice"}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Content (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="content"
                value={formData.content}
                onChange={handleChange}
                placeholder="Additional details about the notice"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Link (Optional)</Form.Label>
              <Form.Control
                type="url"
                name="link"
                value={formData.link}
                onChange={handleChange}
                placeholder="https://example.com"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                name="isImportant"
                label="Mark as Important"
                checked={formData.isImportant}
                onChange={handleChange}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="flex-column flex-md-row gap-2">
            <Button
              variant="secondary"
              onClick={handleCloseModal}
              className="w-100 w-md-auto"
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" className="w-100 w-md-auto">
              {currentNotice ? "Update" : "Save"} Notice
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default NoticesManager;
