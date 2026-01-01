import React, { useState } from "react";
import { Toast } from "react-bootstrap";
import "./Footer.css"; // Import the CSS file
import { submitNewsletterSubscription } from "../services/supabaseService";

const Footer = () => {
  const [email, setEmail] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [isSubmitting, setIsSubmitting] = useState(false); // Add submitting state

  // Make the handler async
  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!email) return; // Basic validation
    setIsSubmitting(true);

    try {
      await submitNewsletterSubscription(email);
      setToastType("success");
      setToastMessage("Thank you for subscribing to our newsletter!");
      setShowToast(true);
      setEmail(""); // Clear the input field on success
    } catch (error) {
      console.error("Newsletter subscription error:", error);
      setToastType("danger");
      setToastMessage("Failed to subscribe. Please try again.");
      setShowToast(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="footer bg-dark text-white py-5">
      <div className="container">
        <div className="row text-start flex justify-content-between">
          {/* School Logo and Description */}
          <div className="col-md-4 mb-4">
            <div className="footer-logo mb-4 d-flex align-items-center">
              <img
                src="/logo.png"
                alt="School Logo"
                className="img-fluid"
                style={{ maxHeight: "80px" }}
              />
              <div className="ms-3">
                <h3>Akamify School</h3>
                <p className="mb-0">An Educational Institution</p>
              </div>
            </div>
            <p className="mb-4">
              We are committed to providing quality education and fostering a
              love for learning. Our mission is to nurture young minds and
              prepare them for a bright future.
            </p>
            <div className="social-links">
              <a href="#" className="text-white me-3 social-icon">
                <i className="bi bi-facebook"></i>
              </a>
              <a href="#" className="text-white me-3 social-icon">
                <i className="bi bi-twitter"></i>
              </a>
              <a href="#" className="text-white me-3 social-icon">
                <i className="bi bi-instagram"></i>
              </a>
              <a href="#" className="text-white social-icon">
                <i className="bi bi-youtube"></i>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-md-4 mb-4">
            <h5 className="text-uppercase mb-4">Quick Links</h5>
            <ul className="list-unstyled">
              <li className="mb-2">
                <a
                  href="/about"
                  className="text-white text-decoration-none footer-link"
                >
                  <i className="bi bi-info-circle me-2"></i>About Us
                </a>
              </li>
              <li className="mb-2">
                <a
                  href="/principal-message"
                  className="text-white text-decoration-none footer-link"
                >
                  <i className="bi bi-person-badge me-2"></i>Principal's Message
                </a>
              </li>
              <li className="mb-2">
                <a
                  href="/admission"
                  className="text-white text-decoration-none footer-link"
                >
                  <i className="bi bi-pencil-square me-2"></i>Admission
                </a>
              </li>
              <li className="mb-2">
                <a
                  href="/Infrastructure"
                  className="text-white text-decoration-none footer-link"
                >
                  <i className="bi bi-building me-2"></i>Infrastructure
                </a>
              </li>
              <li className="mb-2">
                <a
                  href="/result"
                  className="text-white text-decoration-none footer-link"
                >
                  <i className="bi bi-file-earmark-bar-graph me-2"></i>Result
                </a>
              </li>
              <li className="mb-2">
                <a
                  href="/staff"
                  className="text-white text-decoration-none footer-link"
                >
                  <i className="bi bi-people me-2"></i>Our Staff
                </a>
              </li>
              <li className="mb-2">
                <a
                  href="/gallery"
                  className="text-white text-decoration-none footer-link"
                >
                  <i className="bi bi-images me-2"></i>Gallery
                </a>
              </li>
              <li className="mb-2">
                <a
                  href="/contact"
                  className="text-white text-decoration-none footer-link"
                >
                  <i className="bi bi-telephone me-2"></i>Contact Us
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="col-md-4 mb-4 text-white">
            <h5 className="text-uppercase mb-4">Contact Info</h5>
            <ul className="list-unstyled">
              <li className="mb-3">
                <a
                  href="https://g.co/kgs/aoGLb9s"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="d-flex align-items-center text-decoration-none text-white footer-link"
                >
                  <i className="bi bi-geo-alt-fill me-3"></i>
                  <span>
                    Chaunspur road, Yaqutganj, Farrukhabad, Uttar Pradesh -
                    209749
                  </span>
                </a>
              </li>
              <li className="mb-3">
                <a
                  href="tel:+919415808804"
                  className="d-flex align-items-center text-decoration-none text-white footer-link"
                >
                  <i className="bi bi-telephone-fill me-3"></i>
                  <span>+91 37846 34723</span>
                </a>
              </li>
              <li className="mb-3">
                <a
                  href="mailto:yasirshekh0786@gmail.com"
                  className="d-flex align-items-center text-decoration-none text-white footer-link"
                >
                  <i className="bi bi-envelope-fill me-3"></i>
                  <span>akamify@gmail.com</span>
                </a>
              </li>
            </ul>
            <div className="newsletter mt-4">
              <h5 className="text-uppercase mb-3">Newsletter</h5>
              <form onSubmit={handleNewsletterSubmit}>
                <div className="input-group">
                  <input
                    type="email"
                    className="form-control newsletter-input text-white"
                    placeholder="Your Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isSubmitting} // Disable input while submitting
                  />
                  <button
                    className="btn btn-primary newsletter-btn"
                    type="submit"
                    disabled={isSubmitting} // Disable button while submitting
                  >
                    {isSubmitting ? (
                      <span
                        className="spinner-border spinner-border-sm"
                        role="status"
                        aria-hidden="true"
                      ></span>
                    ) : (
                      <i className="bi bi-arrow-right-square"></i>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="row mt-4">
          <div className="col-12">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center border-top pt-4">
              <p className="mb-2 mb-md-0 text-start">
                2017 - {new Date().getFullYear()} &copy; Akamify School. All
                rights reserved.
              </p>
              <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center gap-2">
                <a
                  href="/developer/info"
                  className="text-white text-decoration-none footer-link"
                >
                  Developer Info
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      <div
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          zIndex: 9999,
        }}
      >
        <Toast
          onClose={() => setShowToast(false)}
          show={showToast}
          delay={3000}
          autohide
          bg={toastType}
          className="text-white"
        >
          <Toast.Header>
            <strong className="me-auto">
              {toastType === "success" ? "Success" : "Error"}
            </strong>
          </Toast.Header>
          <Toast.Body>{toastMessage}</Toast.Body>
        </Toast>
      </div>
    </footer>
  );
};

export default Footer;
