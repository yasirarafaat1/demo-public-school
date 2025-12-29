import React, { useState, useEffect } from "react";
import { getUpdateHistory } from "../../services/supabaseService";
import { Card, Table, Spinner, Alert, Form } from "react-bootstrap";

const UpdateHistory = ({ tableName, recordId }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchHistory();
  }, [tableName, recordId]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const historyData = await getUpdateHistory(tableName, recordId);
      setHistory(historyData);
      setError("");
    } catch (err) {
      setError("Failed to load update history. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filter history based on selection
  const filteredHistory =
    filter === "all"
      ? history
      : history.filter((item) => item.action === filter);

  // Get unique actions for filter dropdown
  const uniqueActions = [...new Set(history.map((item) => item.action))];

  return (
    <Card className="mt-4">
      <Card.Header>
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Update History</h5>
          <Form.Select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ width: "150px" }}
          >
            <option value="all">All Actions</option>
            {uniqueActions.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </Form.Select>
        </div>
      </Card.Header>
      <Card.Body>
        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </div>
        ) : error ? (
          <Alert variant="danger">{error}</Alert>
        ) : filteredHistory.length === 0 ? (
          <p className="text-muted text-center">No update history found.</p>
        ) : (
          <div className="table-responsive">
            <Table striped bordered hover size="sm">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Action</th>
                  <th>Updated By</th>
                  <th>Changes</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((item) => (
                  <tr key={item.id}>
                    <td>{new Date(item.updated_at).toLocaleString()}</td>
                    <td>
                      <span
                        className={`badge ${
                          item.action === "INSERT"
                            ? "bg-success"
                            : item.action === "UPDATE"
                            ? "bg-primary"
                            : "bg-danger"
                        }`}
                      >
                        {item.action}
                      </span>
                    </td>
                    <td>{item.updated_by || "System"}</td>
                    <td>
                      {item.action === "UPDATE" &&
                      item.old_values &&
                      item.new_values ? (
                        <div>
                          {Object.keys(item.new_values).map((key) => {
                            if (item.old_values[key] !== item.new_values[key]) {
                              return (
                                <div key={key} className="small">
                                  <strong>{key}:</strong>{" "}
                                  {String(item.old_values[key])} →{" "}
                                  {String(item.new_values[key])}
                                </div>
                              );
                            }
                            return null;
                          })}
                        </div>
                      ) : item.action === "INSERT" && item.new_values ? (
                        <div>
                          {Object.entries(item.new_values).map(
                            ([key, value]) => (
                              <div key={key} className="small">
                                <strong>{key}:</strong> {String(value)}
                              </div>
                            )
                          )}
                        </div>
                      ) : item.action === "DELETE" && item.old_values ? (
                        <div>
                          {Object.entries(item.old_values).map(
                            ([key, value]) => (
                              <div key={key} className="small">
                                <strong>{key}:</strong> {String(value)}
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        "No details available"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default UpdateHistory;
