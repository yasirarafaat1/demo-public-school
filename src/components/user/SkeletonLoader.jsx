import React from "react";
import { Card, Row, Col } from "react-bootstrap";

const SkeletonLoader = ({ type = "default", count = 1 }) => {
  const renderSkeleton = (index) => {
    switch (type) {
      case "table-row":
        return (
          <tr key={index}>
            <td>
              <div className="placeholder-glow">
                <span className="placeholder col-6"></span>
              </div>
            </td>
            <td>
              <div className="placeholder-glow">
                <span className="placeholder col-8"></span>
              </div>
            </td>
            <td>
              <div className="placeholder-glow">
                <span className="placeholder col-4"></span>
              </div>
            </td>
            <td>
              <div className="placeholder-glow">
                <span className="placeholder col-12"></span>
              </div>
            </td>
          </tr>
        );
      case "card":
        return (
          <Col key={index} md={4} sm={6} xs={12} className="mb-3">
            <Card className="h-100">
              <Card.Body>
                <Card.Title>
                  <div className="placeholder-glow">
                    <span className="placeholder col-8"></span>
                  </div>
                </Card.Title>
                <Card.Text>
                  <div className="placeholder-glow mb-2">
                    <span className="placeholder col-12"></span>
                  </div>
                  <div className="placeholder-glow mb-2">
                    <span className="placeholder col-10"></span>
                  </div>
                  <div className="placeholder-glow">
                    <span className="placeholder col-6"></span>
                  </div>
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        );
      case "list-item":
        return (
          <div
            key={index}
            className="d-flex align-items-center p-2 border-bottom"
          >
            <div className="flex-shrink-0">
              <div className="placeholder-glow">
                <span className="placeholder col-8"></span>
              </div>
            </div>
            <div className="flex-grow-1 ms-3">
              <div className="placeholder-glow mb-1">
                <span className="placeholder col-6"></span>
              </div>
              <div className="placeholder-glow">
                <span className="placeholder col-4"></span>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div key={index} className="placeholder-glow mb-3">
            <span className="placeholder col-12"></span>
          </div>
        );
    }
  };

  const skeletonItems = [];
  for (let i = 0; i < count; i++) {
    skeletonItems.push(renderSkeleton(i));
  }

  if (type === "table-row") {
    return <>{skeletonItems}</>;
  }

  return <div className={type === "card" ? "row" : ""}>{skeletonItems}</div>;
};

export default SkeletonLoader;
