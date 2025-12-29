import React, { useState, useEffect } from "react";
import { Card, Row, Col, Spinner, Alert } from "react-bootstrap";
import {
  FaUsers,
  FaEye,
  FaUserClock,
  FaUserPlus,
  FaChartLine,
} from "react-icons/fa";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { getVisitorStatistics } from "../../services/supabaseService";
import styles from "../../styles/VisitorAnalytics.module.css";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

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

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getVisitorStatistics();
      console.log("Full visitor analytics data:", JSON.stringify(data, null, 2));
      console.log("Daily stats length:", data.dailyStats?.length);
      console.log("Page visitors:", data.pageVisitors);
      setAnalytics(data);
    } catch (err) {
      console.error("Error fetching visitor analytics:", err);
      setError("Failed to load visitor analytics. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data
  const chartData = {
    labels: analytics.dailyStats.map((stat) => {
      const date = new Date(stat.date);
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }),
    datasets: [
      {
        label: "Cumulative Total Visitors",
        data: analytics.dailyStats.map((stat) => stat.cumulativeTotalVisitors || 0),
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        tension: 0.1,
      },
      {
        label: "Cumulative New Visitors",
        data: analytics.dailyStats.map((stat) => stat.cumulativeNewVisitors || 0),
        borderColor: "rgb(54, 162, 235)",
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        tension: 0.1,
      },
      {
        label: "Cumulative Return Visitors",
        data: analytics.dailyStats.map((stat) => stat.cumulativeReturnVisitors || 0),
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        tension: 0.1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Cumulative Visitor Trends (Last 30 Days)",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

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
              <small className="text-muted me-3">
                Last 30 days
              </small>
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={fetchAnalytics}
                disabled={loading}
              >
                Refresh
              </button>
            </div>
          </div>
        </Card.Header>
        <Card.Body>
          <div className={styles.chartContainer}>
            {analytics.dailyStats.length > 0 ? (
              <Line data={chartData} options={chartOptions} />
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
