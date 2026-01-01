import React, { useState, useEffect } from "react";
import { Card, Row, Col, Spinner, Alert, Form } from "react-bootstrap";
import {
  FaUsers,
  FaEye,
  FaUserClock,
  FaUserPlus,
  FaChartLine,
  FaDownload,
  FaFileExport,
  FaSync,
} from "react-icons/fa";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getVisitorStatistics } from "../../services/supabaseService";
import styles from "../../styles/VisitorAnalytics.module.css";

const VisitorAnalytics = () => {
  const [analytics, setAnalytics] = useState({
    totalVisitors: 0,
    todayVisitors: 0,
    returnVisitors: 0,
    newVisitors: 0,
    dailyStats: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date()
  });
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getVisitorStatistics();
      setAnalytics(data);
    } catch (err) {
      setError("Failed to load visitor analytics. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Export functionality
  const exportAnalytics = async (format = 'csv') => {
    setExporting(true);
    try {
      const data = await getVisitorStatistics();
      
      if (format === 'csv') {
        // Create CSV content
        const headers = ['Date', 'Total Visitors', 'New Visitors', 'Return Visitors'];
        const rows = analytics.dailyStats.map(stat => [
          stat.date,
          stat.totalVisitors || 0,
          stat.newVisitors || 0,
          stat.returnVisitors || 0
        ]);
        
        const csvContent = [headers, ...rows]
          .map(row => row.join(','))
          .join('\n');
        
        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `visitor-analytics-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else if (format === 'json') {
        // Download JSON
        const jsonContent = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `visitor-analytics-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
      setError('Failed to export analytics. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  // Handle date range change
  const handleDateRangeChange = (field, value) => {
    const newDateRange = { ...dateRange, [field]: value };
    setDateRange(newDateRange);
    
    // Fetch analytics with new date range
    fetchAnalyticsWithDateRange(newDateRange);
  };

  const fetchAnalyticsWithDateRange = async (range) => {
    try {
      setLoading(true);
      setError("");
      const data = await getVisitorStatistics();
      // Filter data based on date range (this would need backend support)
      setAnalytics(data);
    } catch (err) {
      setError("Failed to load visitor analytics. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Quick date range presets
  const setDateRangePreset = (days) => {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
    const newRange = { startDate, endDate };
    setDateRange(newRange);
    fetchAnalyticsWithDateRange(newRange);
  };

  // Prepare chart data for Recharts
  const chartData = analytics.dailyStats.map((stat) => ({
    date: new Date(stat.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    totalVisitors: stat.totalVisitors || 0,
    cumulativeTotalVisitors: stat.cumulativeTotalVisitors || 0,
    cumulativeNewVisitors: stat.cumulativeNewVisitors || 0,
    cumulativeReturnVisitors: stat.cumulativeReturnVisitors || 0,
  }));

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading analytics...</span>
        </Spinner>
        <p className="mt-2">Loading visitor analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" onClose={() => setError("")} dismissible>
        {error}
      </Alert>
    );
  }

  return (
    <div className={styles.analyticsContainer}>
      {/* Statistics Cards */}
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
                    Total Visitors
                  </Card.Title>
                  <Card.Text className={styles.statValue}>
                    {analytics.totalVisitors.toLocaleString()}
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
                  <FaEye />
                </div>
                <div className="ms-3">
                  <Card.Title className={styles.statTitle}>
                    Today's Visitors
                  </Card.Title>
                  <Card.Text className={styles.statValue}>
                    {analytics.todayVisitors.toLocaleString()}
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
                  <FaUserClock />
                </div>
                <div className="ms-3">
                  <Card.Title className={styles.statTitle}>
                    Return Visitors
                  </Card.Title>
                  <Card.Text className={styles.statValue}>
                    {analytics.returnVisitors.toLocaleString()}
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
                  <FaUserPlus />
                </div>
                <div className="ms-3">
                  <Card.Title className={styles.statTitle}>
                    New Visitors
                  </Card.Title>
                  <Card.Text className={styles.statValue}>
                    {analytics.newVisitors.toLocaleString()}
                  </Card.Text>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Page-specific Statistics */}
      <Row className="mb-4">
        <Col md={12}>
          <h5 className="mb-3">Page-specific Visitors</h5>
        </Col>
        {analytics.pageVisitors && Object.entries(analytics.pageVisitors).map(([pageType, count]) => (
          <Col md={3} sm={6} className="mb-3" key={pageType}>
            <Card className={`${styles.statCard} h-100`}>
              <Card.Body>
                <div className="d-flex align-items-center">
                  <div className={styles.statIcon}>
                    <FaEye />
                  </div>
                  <div className="ms-3">
                    <Card.Title className={styles.statTitle}>
                      {pageType.charAt(0).toUpperCase() + pageType.slice(1)} Page
                    </Card.Title>
                    <Card.Text className={styles.statValue}>
                      {count.toLocaleString()}
                    </Card.Text>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Analytics Chart */}
      <Card className={styles.chartCard}>
        <Card.Header className={styles.chartHeader}>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <FaChartLine className="me-2" />
              Visitor Analytics
            </h5>
            <div className="d-flex align-items-center">
              {/* Date Range Controls */}
              <div className="d-flex align-items-center me-3">
                <Form.Control
                  type="date"
                  size="sm"
                  value={dateRange.startDate.toISOString().split('T')[0]}
                  onChange={(e) => handleDateRangeChange('startDate', new Date(e.target.value))}
                  className="me-2"
                  style={{ width: '150px' }}
                />
                <span className="me-2">to</span>
                <Form.Control
                  type="date"
                  size="sm"
                  value={dateRange.endDate.toISOString().split('T')[0]}
                  onChange={(e) => handleDateRangeChange('endDate', new Date(e.target.value))}
                  style={{ width: '150px' }}
                />
              </div>

              {/* Export Buttons */}
              <div className="btn-group" role="group">
                <button 
                  className="btn btn-sm btn-outline-success"
                  onClick={() => exportAnalytics('csv')}
                  disabled={exporting}
                >
                  {exporting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <FaDownload className="me-2" />
                      Export CSV
                    </>
                  )}
                </button>
                <button 
                  className="btn btn-sm btn-outline-info"
                  onClick={() => exportAnalytics('json')}
                  disabled={exporting}
                >
                  <FaFileExport className="me-2" />
                  Export JSON
                </button>
              </div>
              
              <button
                className="btn btn-sm btn-outline-primary m-2"
                onClick={fetchAnalytics}
                disabled={loading}
              >
                <FaSync className="me-2 ms-2" />
                Refresh
              </button>
            </div>
          </div>
        </Card.Header>
        <Card.Body>
          <div className={styles.chartContainer}>
            {analytics.dailyStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12, fill: '#666' }}
                    axisLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#666' }}
                    axisLine={false}
                    tickFormatter={(value) => {
                      if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
                      if (value >= 1000) return (value / 1000).toFixed(0) + 'K';
                      return value;
                    }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                      border: 'none', 
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    formatter={(value, name) => {
                      const formattedValue = Number(value).toLocaleString();
                      return [formattedValue, name.replace('cumulative', '').replace(/([A-Z])/g, ' $1').trim()];
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cumulativeTotalVisitors" 
                    stroke="#4BC0C0" 
                    strokeWidth={2}
                    dot={{ fill: '#4BC0C0', r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Total Visitors"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cumulativeNewVisitors" 
                    stroke="#36A2EB" 
                    strokeWidth={2}
                    dot={{ fill: '#36A2EB', r: 4 }}
                    activeDot={{ r: 6 }}
                    name="New Visitors"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cumulativeReturnVisitors" 
                    stroke="#FF6384" 
                    strokeWidth={2}
                    dot={{ fill: '#FF6384', r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Return Visitors"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-5">
                <FaChartLine className="text-muted mb-3" size={48} />
                <p className="text-muted">No visitor data available yet.</p>
                <small className="text-muted">
                  Visitor tracking will start showing data once users visit your website.
                </small>
              </div>
            )}
          </div>
        </Card.Body>
      </Card>

      {/* Additional Insights */}
      {analytics.dailyStats.length > 0 && (
        <Row className="mt-4">
          <Col md={6}>
            <Card className={styles.insightCard}>
              <Card.Header className={styles.insightHeader}>
                <h6 className="mb-0">Visitor Insights</h6>
              </Card.Header>
              <Card.Body>
                <div className={styles.insightItem}>
                  <span className={styles.insightLabel}>Average Daily Visitors:</span>
                  <span className={styles.insightValue}>
                    {Math.round(
                      analytics.dailyStats.reduce(
                        (sum, stat) => sum + stat.totalVisitors,
                        0
                      ) / analytics.dailyStats.length
                    ).toLocaleString()}
                  </span>
                </div>
                <div className={styles.insightItem}>
                  <span className={styles.insightLabel}>Return Visitor Rate:</span>
                  <span className={styles.insightValue}>
                    {analytics.totalVisitors > 0
                      ? Math.round(
                          (analytics.returnVisitors / analytics.totalVisitors) * 100
                        )
                      : 0}
                    %
                  </span>
                </div>
                <div className={styles.insightItem}>
                  <span className={styles.insightLabel}>Peak Day:</span>
                  <span className={styles.insightValue}>
                    {analytics.dailyStats.length > 0
                      ? (() => {
                          const peakDay = analytics.dailyStats.reduce(
                            (max, stat) =>
                              stat.totalVisitors > max.totalVisitors ? stat : max,
                            analytics.dailyStats[0]
                          );
                          const date = new Date(peakDay.date);
                          return date.toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          });
                        })()
                      : "N/A"}
                  </span>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card className={styles.insightCard}>
              <Card.Header className={styles.insightHeader}>
                <h6 className="mb-0">Growth Metrics</h6>
              </Card.Header>
              <Card.Body>
                <div className={styles.insightItem}>
                  <span className={styles.insightLabel}>Total Page Views:</span>
                  <span className={styles.insightValue}>
                    {analytics.dailyStats
                      .reduce((sum, stat) => sum + stat.totalVisitors, 0)
                      .toLocaleString()}
                  </span>
                </div>
                <div className={styles.insightItem}>
                  <span className={styles.insightLabel}>New vs Returning:</span>
                  <span className={styles.insightValue}>
                    {analytics.newVisitors > 0 && analytics.returnVisitors > 0
                      ? `${Math.round(
                          (analytics.newVisitors / analytics.totalVisitors) * 100
                        )}% / ${Math.round(
                          (analytics.returnVisitors / analytics.totalVisitors) * 100
                        )}%`
                      : "N/A"}
                  </span>
                </div>
                <div className={styles.insightItem}>
                  <span className={styles.insightLabel}>Tracking Period:</span>
                  <span className={styles.insightValue}>30 Days</span>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default VisitorAnalytics;
