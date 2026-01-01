import React from 'react';
import { Alert } from 'react-bootstrap';

class AnalyticsErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Analytics Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4">
          <Alert variant="danger" className="text-center">
            <Alert.Heading>Analytics Loading Error</Alert.Heading>
            <p className="mb-0">
              The visitor analytics encountered an unexpected error. Please try refreshing the page.
            </p>
            <hr />
            <small className="text-muted">
              Error details have been logged to the console for debugging purposes.
            </small>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AnalyticsErrorBoundary;
