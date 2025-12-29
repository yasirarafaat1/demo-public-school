import React, { useState, useEffect } from "react";
import {
  Container,
  Form,
  Button,
  Row,
  Col,
  Card,
  Tabs,
  Tab,
  Alert,
} from "react-bootstrap";
import {
  getStaffMembers,
  addStaffMember,
  updateStaffMember,
  deleteStaffMember,
} from "../../services/adminService";
import StaffManager from "./StaffManager";

const SettingsManager = () => {
  const [activeTab, setActiveTab] = useState("staff");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  return (
    <Container className="mt-4">
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-3"
        fill
      >
        <Tab eventKey="staff" title="Staff Management">
          <div className="mt-4">
            <StaffManager />
          </div>
        </Tab>
      </Tabs>
    </Container>
  );
};

export default SettingsManager;
