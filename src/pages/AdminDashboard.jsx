import React, { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "../services/supabaseService";
import { useNavigate } from "react-router-dom";
import {
  getContactForms,
  getAdmissionEnquiries,
  getNewsletterSubscriptions,
  adminLogout,
  getStaffMembers,
  getFeeStructure,
  getImportantDates,
  getNotices,
} from "../services/supabaseService";
import { getAllResults } from "../services/resultService";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Button,
  Alert,
  Spinner,
  Nav,
  Navbar,
  NavDropdown,
  Collapse,
  Form,
  InputGroup,
} from "react-bootstrap";
import {
  FaBars,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaImages,
  FaUsers,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaBell,
  FaGraduationCap,
  FaEnvelope,
  FaChartLine,
  FaSignOutAlt,
  FaThLarge,
  FaSearch,
  FaFilter,
  FaSort,
  FaChevronDown,
} from "react-icons/fa";
import GalleryManager from "../components/admin/GalleryManager";
import StaffManager from "../components/admin/StaffManager";
import FeeStructureManager from "../components/admin/FeeStructureManager";
import ImportantDatesManager from "../components/admin/ImportantDatesManager";
import NoticesManager from "../components/admin/NoticesManager";
import ResultManager from "../components/admin/ResultManager";
import ClassManager from "../components/admin/ClassManager";
import StudentManager from "../components/admin/StudentManager";
import ClassSessionManager from "../components/admin/ClassSessionManager";
import FeesManagement from "../components/admin/FeesManagement";
import VisitorAnalytics from "../components/admin/VisitorAnalytics";
import styles from "../styles/AdminDashboard.module.css";

const AdminDashboard = () => {
  const [admissions, setAdmissions] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [newsletters, setNewsletters] = useState([]);
  const [staff, setStaff] = useState([]);
  const [feeStructure, setFeeStructure] = useState([]);
  const [importantDates, setImportantDates] = useState([]);
  const [notices, setNotices] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [openPanels, setOpenPanels] = useState({});

  // Search, filter, and sort states (only for non-manager tabs)
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [filters, setFilters] = useState({});
  const [refreshTimestamp, setRefreshTimestamp] = useState(Date.now());

  const navigate = useNavigate();

  // Toggle panel open/close state
  const togglePanel = (panelKey) => {
    setOpenPanels((prev) => ({
      ...prev,
      [panelKey]: !prev[panelKey],
    }));
  };

  // Toggle sidebar collapsed state
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [
        admissionsList,
        contactsList,
        newslettersList,
        staffList,
        feeData,
        datesData,
        noticesData,
        resultsData,
      ] = await Promise.all([
        getAdmissionEnquiries(),
        getContactForms(),
        getNewsletterSubscriptions(),
        getStaffMembers(),
        getFeeStructure(),
        getImportantDates(),
        getNotices(),
        getAllResults(),
      ]);

      setAdmissions(admissionsList);
      setContacts(contactsList);
      setNewsletters(newslettersList);
      setStaff(staffList);
      setFeeStructure(feeData);
      setImportantDates(datesData);
      setNotices(noticesData);
      setResults(resultsData);
    } catch (err) {
      console.error("Error fetching admin data:", err);
      setError(
        "Failed to load data. Please check your connection or permissions."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogout = async () => {
    try {
      setLoading(true);
      setError("");
      await adminLogout();
      navigate("/");
    } catch (err) {
      console.error("Logout failed:", err);
      setError("Logout failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  // Format datetime for display
  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  // Handle sorting
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Apply sorting to data
  const applySorting = (data) => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Handle date sorting
      if (
        sortConfig.key.includes("date") ||
        sortConfig.key.includes("submitted")
      ) {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      // Handle numeric sorting
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortConfig.direction === "asc"
          ? aValue - bValue
          : bValue - aValue;
      }

      // Handle string sorting
      if (typeof aValue === "string" && typeof bValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  };

  // Apply filtering to data
  const applyFilters = (data) => {
    return data.filter((item) => {
      // Apply search term filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        let matches = false;

        // Check all relevant fields based on active tab
        switch (activeTab) {
          case "admissions":
            matches =
              (item.student_name &&
                item.student_name.toLowerCase().includes(searchLower)) ||
              (item.parent_name &&
                item.parent_name.toLowerCase().includes(searchLower)) ||
              (item.email && item.email.toLowerCase().includes(searchLower)) ||
              (item.class_interested &&
                item.class_interested.toLowerCase().includes(searchLower)) ||
              (item.phone && item.phone.includes(searchTerm));
            break;
          case "contacts":
            matches =
              (item.name && item.name.toLowerCase().includes(searchLower)) ||
              (item.email && item.email.toLowerCase().includes(searchLower)) ||
              (item.subject &&
                item.subject.toLowerCase().includes(searchLower)) ||
              (item.phone && item.phone.includes(searchTerm));
            break;
          case "fees":
            matches =
              (item.class && item.class.toLowerCase().includes(searchLower)) ||
              (item.amount && item.amount.toString().includes(searchTerm));
            break;
          case "dates":
            matches =
              (item.title && item.title.toLowerCase().includes(searchLower)) ||
              (item.description &&
                item.description.toLowerCase().includes(searchLower));
            break;
          case "notices":
            matches =
              (item.title && item.title.toLowerCase().includes(searchLower)) ||
              (item.content &&
                item.content.toLowerCase().includes(searchLower));
            break;
          case "results":
            matches =
              (item.student_name &&
                item.student_name.toLowerCase().includes(searchLower)) ||
              (item.roll_no && item.roll_no.includes(searchTerm)) ||
              (item.class && item.class.toLowerCase().includes(searchLower));
            break;
          case "newsletters":
            matches =
              item.email && item.email.toLowerCase().includes(searchLower);
            break;
          default:
            matches = true;
        }

        if (!matches) return false;
      }

      // Apply additional filters
      for (const [key, value] of Object.entries(filters)) {
        if (value && item[key] !== value) {
          return false;
        }
      }

      return true;
    });
  };

  // Get filtered and sorted data based on active tab
  const getProcessedData = () => {
    let data = [];

    switch (activeTab) {
      case "admissions":
        data = admissions;
        break;
      case "contacts":
        data = contacts;
        break;
      case "fees":
        data = feeStructure;
        break;
      case "dates":
        data = importantDates;
        break;
      case "notices":
        data = notices;
        break;
      case "results":
        data = results;
        break;
      case "newsletters":
        data = newsletters;
        break;
      case "fee-structure":
        data = feeStructure;
        break;
      default:
        return [];
    }

    const filtered = applyFilters(data);
    return applySorting(filtered);
  };

  // Get filter options based on active tab
  const getFilterOptions = () => {
    switch (activeTab) {
      case "admissions":
        const classes = [
          ...new Set(admissions.map((a) => a.class_interested).filter(Boolean)),
        ];
        return (
          <Form.Select
            size="sm"
            value={filters.class_interested || ""}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                class_interested: e.target.value || "",
              }))
            }
          >
            <option value="">All Classes</option>
            {classes.map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </Form.Select>
        );
      case "contacts":
        const subjects = [
          ...new Set(contacts.map((c) => c.subject).filter(Boolean)),
        ];
        return (
          <Form.Select
            size="sm"
            value={filters.subject || ""}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, subject: e.target.value || "" }))
            }
          >
            <option value="">All Subjects</option>
            {subjects.map((subj) => (
              <option key={subj} value={subj}>
                {subj}
              </option>
            ))}
          </Form.Select>
        );
      case "fees":
        const feeClasses = [
          ...new Set(feeStructure.map((f) => f.class).filter(Boolean)),
        ];
        return (
          <Form.Select
            size="sm"
            value={filters.class || ""}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, class: e.target.value || "" }))
            }
          >
            <option value="">All Classes</option>
            {feeClasses.map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </Form.Select>
        );
      case "fee-structure":
        const feeStructureClasses = [
          ...new Set(feeStructure.map((f) => f.class_name).filter(Boolean)),
        ];
        return (
          <Form.Select
            size="sm"
            value={filters.class_name || ""}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                class_name: e.target.value || "",
              }))
            }
          >
            <option value="">All Classes</option>
            {feeStructureClasses.map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </Form.Select>
        );
      default:
        return null;
    }
  };

  // Navigation items with icons
  const navItems = [
    { key: "overview", label: "Dashboard", icon: <FaThLarge /> },
    { key: "students", label: "Students", icon: <FaUsers /> },
    {
      key: "class-session",
      label: "Classes & Sessions",
      icon: <FaGraduationCap />,
    },
    { key: "gallery", label: "Gallery", icon: <FaImages /> },
    { key: "staff", label: "Staff", icon: <FaUsers /> },
    { key: "results", label: "Results", icon: <FaChartLine /> },
    { key: "fees", label: "Student Fees", icon: <FaMoneyBillWave /> },
    { key: "fee-structure", label: "Fee Structure", icon: <FaMoneyBillWave /> },
    { key: "dates", label: "Dates", icon: <FaCalendarAlt /> },
    { key: "notices", label: "Notices", icon: <FaBell /> },
    { key: "admissions", label: "Admissions", icon: <FaGraduationCap /> },
    { key: "contacts", label: "Contacts", icon: <FaEnvelope /> },
    { key: "newsletters", label: "Newsletters", icon: <FaEnvelope /> },
  ];

  // Get processed data for current tab
  const processedData = useMemo(
    () => getProcessedData(),
    [
      activeTab,
      searchTerm,
      sortConfig,
      filters,
      admissions,
      contacts,
      staff,
      feeStructure,
      importantDates,
      notices,
      results,
      newsletters,
      refreshTimestamp,
    ]
  );

  return (
    <div className={`container-fluid ${styles.dashboardContainer}`}>
      {/* Mobile Toggle Button */}
      <div className={styles.mobileToggle}>
        <Button
          variant="primary"
          onClick={toggleSidebar}
          aria-controls="sidebar-menu"
        >
          {sidebarCollapsed ? <FaTimes /> : <FaBars />}
        </Button>
      </div>

      <Row className="flex-nowrap">
        {/* Sidebar Navigation */}
        <Col
          xs={12}
          md={3}
          lg={sidebarCollapsed ? 1 : 2}
          className={`${styles.sidebar} ${
            sidebarCollapsed ? styles.collapsed : ""
          }`}
          id="sidebar-menu"
        >
          <div className={styles.sidebarHeader}>
            {!sidebarCollapsed && <h4>Admin Panel</h4>}
            <Button
              variant="link"
              className={styles.collapseBtn}
              onClick={toggleSidebar}
            >
              {sidebarCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
            </Button>
          </div>

          <Nav
            variant="pills"
            className={`${styles.navPills}`}
            activeKey={activeTab}
            onSelect={(selectedKey) => {
              setActiveTab(selectedKey);
              // Reset search and filters when changing tabs (except for manager tabs)
              if (
                selectedKey !== "staff" &&
                selectedKey !== "classes" &&
                selectedKey !== "students" &&
                selectedKey !== "fee-structure"
              ) {
                setSearchTerm("");
                setSortConfig({ key: null, direction: "asc" });
                setFilters({});
              }
            }}
          >
            {navItems.map((item) => (
              <Nav.Item key={item.key} className={styles.navItem}>
                <Nav.Link
                  eventKey={item.key}
                  className={`${styles.navLink} border-0 rounded-0`}
                >
                  <div className="d-flex align-items-center">
                    <span className={styles.navIcon}>{item.icon}</span>
                    {!sidebarCollapsed && (
                      <span className="ms-2">{item.label}</span>
                    )}
                  </div>
                </Nav.Link>
              </Nav.Item>
            ))}
            <Nav.Item className={`mt-auto ${styles.navItem}`}>
              <Nav.Link
                eventKey="logout"
                className={`${styles.navLink} border-0 rounded-0 text-danger`}
                onClick={handleLogout}
              >
                <div className="d-flex align-items-center">
                  <span className={styles.navIcon}>
                    <FaSignOutAlt />
                  </span>
                  {!sidebarCollapsed && <span className="ms-2">Logout</span>}
                </div>
              </Nav.Link>
            </Nav.Item>
          </Nav>
        </Col>

        {/* Main Content Area */}
        <Col
          xs={12}
          md={9}
          lg={sidebarCollapsed ? 11 : 10}
          className={`${styles.mainContent} ${
            sidebarCollapsed ? styles.expanded : ""
          }`}
        >
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="mb-0">Admin Dashboard</h2>
            <Button
              variant="outline-primary"
              onClick={() => {
                // For manager tabs, trigger refresh through timestamp
                if (
                  activeTab === "staff" ||
                  activeTab === "classes" ||
                  activeTab === "class-session" ||
                  activeTab === "students" ||
                  activeTab === "fees" ||
                  activeTab === "fee-structure" ||
                  activeTab === "dates" ||
                  activeTab === "notices" ||
                  activeTab === "results" ||
                  activeTab === "gallery"
                ) {
                  setRefreshTimestamp(Date.now());
                } else {
                  // For data tables, refresh all data
                  fetchData();
                }
              }}
            >
              Refresh Data
            </Button>
          </div>

          {error && (
            <Alert variant="danger" onClose={() => setError("")} dismissible>
              {error}
            </Alert>
          )}

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
              <p className="mt-2">Loading dashboard data...</p>
            </div>
          ) : (
            <>
              {/* Dashboard Overview */}
              {activeTab === "overview" && (
                <div className={styles.dashboardOverview}>
                  <Row className="mb-4">
                    <Col md={3} sm={6} className="mb-3">
                      <Card className={`${styles.statCard} h-100`}>
                        <Card.Body>
                          <div className="d-flex align-items-center">
                            <div className={styles.statIcon}>
                              <FaUsers />
                            </div>
                            <div className="ms-3">
                              <Card.Title className={styles.statTitle}>
                                Total Staff
                              </Card.Title>
                              <Card.Text className={styles.statValue}>
                                {staff.length}
                              </Card.Text>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={3} sm={6} className="mb-3">
                      <Card className={`${styles.statCard} h-100`}>
                        <Card.Body>
                          <div className="d-flex align-items-center">
                            <div className={styles.statIcon}>
                              <FaGraduationCap />
                            </div>
                            <div className="ms-3">
                              <Card.Title className={styles.statTitle}>
                                Admission Enquiries
                              </Card.Title>
                              <Card.Text className={styles.statValue}>
                                {admissions.length}
                              </Card.Text>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={3} sm={6} className="mb-3">
                      <Card className={`${styles.statCard} h-100`}>
                        <Card.Body>
                          <div className="d-flex align-items-center">
                            <div className={styles.statIcon}>
                              <FaEnvelope />
                            </div>
                            <div className="ms-3">
                              <Card.Title className={styles.statTitle}>
                                Contact Forms
                              </Card.Title>
                              <Card.Text className={styles.statValue}>
                                {contacts.length}
                              </Card.Text>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={3} sm={6} className="mb-3">
                      <Card className={`${styles.statCard} h-100`}>
                        <Card.Body>
                          <div className="d-flex align-items-center">
                            <div className={styles.statIcon}>
                              <FaBell />
                            </div>
                            <div className="ms-3">
                              <Card.Title className={styles.statTitle}>
                                Notices
                              </Card.Title>
                              <Card.Text className={styles.statValue}>
                                {notices.length}
                              </Card.Text>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                  <VisitorAnalytics />
                </div>
              )}

              {/* Gallery Management */}
              {activeTab === "gallery" && (
                <Card className="mb-4">
                  <Card.Body>
                    <GalleryManager refreshTimestamp={refreshTimestamp} />
                  </Card.Body>
                </Card>
              )}

              {/* Class Management */}
              {activeTab === "classes" && (
                <Card className="mb-4">
                  <Card.Body>
                    <ClassManager
                      refreshTimestamp={refreshTimestamp}
                      fetchData={fetchData}
                    />
                  </Card.Body>
                </Card>
              )}

              {/* Class & Session Management */}
              {activeTab === "class-session" && (
                <Card className="mb-4">
                  <Card.Body>
                    <ClassSessionManager />
                  </Card.Body>
                </Card>
              )}

              {/* Student Management */}
              {activeTab === "students" && (
                <Card className="mb-4">
                  <Card.Body>
                    <StudentManager
                      refreshTimestamp={refreshTimestamp}
                      fetchData={fetchData}
                    />
                  </Card.Body>
                </Card>
              )}

              {/* Staff Management - Using dedicated component with its own search/filter */}
              {activeTab === "staff" && (
                <Card className="mb-4">
                  <Card.Body>
                    <StaffManager
                      refreshTimestamp={refreshTimestamp}
                      fetchData={fetchData}
                    />
                  </Card.Body>
                </Card>
              )}

              {/* Student Fees Management */}
              {activeTab === "fees" && (
                <Card className="mb-4">
                  <Card.Body>
                    <FeesManagement
                      refreshTimestamp={refreshTimestamp}
                      fetchData={fetchData}
                    />
                  </Card.Body>
                </Card>
              )}

              {/* Fee Structure Management */}
              {activeTab === "fee-structure" && (
                <Card className="mb-4">
                  <Card.Body>
                    <FeeStructureManager
                      refreshTimestamp={refreshTimestamp}
                      fetchData={fetchData}
                    />
                  </Card.Body>
                </Card>
              )}

              {/* Important Dates Management */}
              {activeTab === "dates" && (
                <Card className="mb-4">
                  <Card.Body>
                    <ImportantDatesManager
                      refreshTimestamp={refreshTimestamp}
                      fetchData={fetchData}
                    />
                  </Card.Body>
                </Card>
              )}

              {/* Notices Management */}
              {activeTab === "notices" && (
                <Card className="mb-4">
                  <Card.Body>
                    <NoticesManager
                      refreshTimestamp={refreshTimestamp}
                      fetchData={fetchData}
                    />
                  </Card.Body>
                </Card>
              )}

              {/* Admission Enquiries Table */}
              {activeTab === "admissions" && (
                <Card className="mb-4">
                  <Card.Header as="h5">
                    Admission Enquiries ({processedData.length})
                  </Card.Header>
                  <Card.Body>
                    <div className="d-flex justify-content-between mb-3">
                      <div className="d-flex">
                        <InputGroup className="me-2" style={{ width: "300px" }}>
                          <InputGroup.Text>
                            <FaSearch />
                          </InputGroup.Text>
                          <Form.Control
                            type="text"
                            placeholder="Search by student name, class, email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </InputGroup>
                        {getFilterOptions()}
                      </div>
                    </div>
                    {processedData.length > 0 ? (
                      <div className={styles.tableContainer}>
                        <Table striped bordered hover responsive>
                          <thead>
                            <tr>
                              <th
                                onClick={() => handleSort("student_name")}
                                style={{ cursor: "pointer" }}
                              >
                                Student Name{" "}
                                {sortConfig.key === "student_name" &&
                                  (sortConfig.direction === "asc" ? "↑" : "↓")}
                              </th>
                              <th
                                onClick={() => handleSort("parent_name")}
                                style={{ cursor: "pointer" }}
                              >
                                Parent Name{" "}
                                {sortConfig.key === "parent_name" &&
                                  (sortConfig.direction === "asc" ? "↑" : "↓")}
                              </th>
                              <th
                                onClick={() => handleSort("class_interested")}
                                style={{ cursor: "pointer" }}
                              >
                                Class{" "}
                                {sortConfig.key === "class_interested" &&
                                  (sortConfig.direction === "asc" ? "↑" : "↓")}
                              </th>
                              <th
                                onClick={() => handleSort("submitted_at")}
                                style={{ cursor: "pointer" }}
                              >
                                Submitted{" "}
                                {sortConfig.key === "submitted_at" &&
                                  (sortConfig.direction === "asc" ? "↑" : "↓")}
                              </th>
                              <th
                                onClick={() => handleSort("email")}
                                style={{ cursor: "pointer" }}
                              >
                                Email{" "}
                                {sortConfig.key === "email" &&
                                  (sortConfig.direction === "asc" ? "↑" : "↓")}
                              </th>
                              <th>Phone</th>
                              <th>Message</th>
                            </tr>
                          </thead>
                          <tbody>
                            {processedData.map((admission, index) => (
                              <tr key={admission.id}>
                                <td>{admission.student_name}</td>
                                <td>{admission.parent_name}</td>
                                <td>{admission.class_interested}</td>
                                <td>
                                  {formatDateTime(admission.submitted_at)}
                                </td>
                                <td>{admission.email}</td>
                                <td>{admission.phone}</td>
                                <td>{admission.message}</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    ) : (
                      <p>No admission enquiries found.</p>
                    )}
                  </Card.Body>
                </Card>
              )}

              {/* Contact Forms Table */}
              {activeTab === "contacts" && (
                <Card className="mb-4">
                  <Card.Header as="h5">
                    Contact Forms ({processedData.length})
                  </Card.Header>
                  <Card.Body>
                    <div className="d-flex justify-content-between mb-3">
                      <div className="d-flex">
                        <InputGroup className="me-2" style={{ width: "300px" }}>
                          <InputGroup.Text>
                            <FaSearch />
                          </InputGroup.Text>
                          <Form.Control
                            type="text"
                            placeholder="Search by name, email, subject..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </InputGroup>
                        {getFilterOptions()}
                      </div>
                    </div>
                    {processedData.length > 0 ? (
                      <div className={styles.tableContainer}>
                        <Table striped bordered hover responsive>
                          <thead>
                            <tr>
                              <th
                                onClick={() => handleSort("name")}
                                style={{ cursor: "pointer" }}
                              >
                                Name{" "}
                                {sortConfig.key === "name" &&
                                  (sortConfig.direction === "asc" ? "↑" : "↓")}
                              </th>
                              <th
                                onClick={() => handleSort("email")}
                                style={{ cursor: "pointer" }}
                              >
                                Email{" "}
                                {sortConfig.key === "email" &&
                                  (sortConfig.direction === "asc" ? "↑" : "↓")}
                              </th>
                              <th
                                onClick={() => handleSort("subject")}
                                style={{ cursor: "pointer" }}
                              >
                                Subject{" "}
                                {sortConfig.key === "subject" &&
                                  (sortConfig.direction === "asc" ? "↑" : "↓")}
                              </th>
                              <th
                                onClick={() => handleSort("submitted_at")}
                                style={{ cursor: "pointer" }}
                              >
                                Submitted{" "}
                                {sortConfig.key === "submitted_at" &&
                                  (sortConfig.direction === "asc" ? "↑" : "↓")}
                              </th>
                              <th>Phone</th>
                              <th>Message</th>
                            </tr>
                          </thead>
                          <tbody>
                            {processedData.map((contact, index) => (
                              <tr key={contact.id}>
                                <td>{contact.name}</td>
                                <td>{contact.email}</td>
                                <td>{contact.subject}</td>
                                <td>{formatDateTime(contact.submitted_at)}</td>
                                <td>{contact.phone}</td>
                                <td>{contact.message}</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    ) : (
                      <p>No contact forms found.</p>
                    )}
                  </Card.Body>
                </Card>
              )}

              {/* Results Management */}
              {activeTab === "results" && (
                <Card className="mb-4">
                  <Card.Body>
                    <ResultManager
                      refreshTimestamp={refreshTimestamp}
                      fetchData={fetchData}
                    />
                  </Card.Body>
                </Card>
              )}

              {/* Newsletter Subscriptions Table */}
              {activeTab === "newsletters" && (
                <Card className="mb-4">
                  <Card.Header as="h5">
                    Newsletter Subscriptions ({processedData.length})
                  </Card.Header>
                  <Card.Body>
                    <div className="d-flex justify-content-between mb-3">
                      <div className="d-flex">
                        <InputGroup className="me-2" style={{ width: "300px" }}>
                          <InputGroup.Text>
                            <FaSearch />
                          </InputGroup.Text>
                          <Form.Control
                            type="text"
                            placeholder="Search by email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </InputGroup>
                      </div>
                    </div>
                    {processedData.length > 0 ? (
                      <div className={styles.tableContainer}>
                        <Table striped bordered hover responsive>
                          <thead>
                            <tr>
                              <th
                                onClick={() => handleSort("email")}
                                style={{ cursor: "pointer" }}
                              >
                                Email{" "}
                                {sortConfig.key === "email" &&
                                  (sortConfig.direction === "asc" ? "↑" : "↓")}
                              </th>
                              <th
                                onClick={() => handleSort("subscribed_at")}
                                style={{ cursor: "pointer" }}
                              >
                                Subscribed At{" "}
                                {sortConfig.key === "subscribed_at" &&
                                  (sortConfig.direction === "asc" ? "↑" : "↓")}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {processedData.map((subscription, index) => (
                              <tr key={subscription.id}>
                                <td>{subscription.email}</td>
                                <td>
                                  {formatDateTime(subscription.subscribed_at)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    ) : (
                      <p>No newsletter subscriptions found.</p>
                    )}
                  </Card.Body>
                </Card>
              )}
            </>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default AdminDashboard;
