import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Button,
  Card /*Form, Alert, Toast, ToastContainer*/,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";
import NoticeBoard from "../components/user/NoticeBoard";
// import './Home.css';

const Home = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
      offset: 100,
    });

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <>
      {/* <!-- Hero Section --> */}
      <section
        className="hero-section d-flex align-items-center text-white"
        style={{
          backgroundImage: "url('/front.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          minHeight: "80vh",
          position: "relative",
        }}
      >
        <div
          className="overlay"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          }}
        ></div>
        <Container className="position-relative z-1 py-10">
          <Row className="justify-content-center text-center">
            <Col md={8} data-aos="fade-up">
              <h1 className="display-3 fw-bold hero-title">
                Welcome to <span className="highlight">Demo Public School</span>
              </h1>
              <p
                className="lead hero-subtitle"
                data-aos="fade-up"
                data-aos-delay="200"
              >
                Empowering Minds, Building Futures
              </p>
              <div
                className="hero-buttons"
                data-aos="fade-up"
                data-aos-delay="400"
              >
                <Button
                  variant="primary"
                  size="lg"
                  as={Link}
                  to="/about"
                  className="me-3"
                >
                  Learn More
                </Button>
                <Button
                  variant="outline-light"
                  size="lg"
                  as={Link}
                  to="/admission"
                >
                  Apply Now
                </Button>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
      {/* <!-- About Section --> */}
      <section className="about-section py-5 bg-light">
        <Container>
          <Row className="align-items-center">
            <Col lg={6} data-aos="fade-right">
              <h2 className="mb-4">About Our School</h2>
              <p className="lead mb-4">
                Demo Public School is committed to providing quality education and
                fostering a love for learning.
              </p>
              <p>
                Our mission is to nurture young minds and prepare them for a
                bright future through innovative teaching methods and a
                supportive learning environment.
              </p>
              <Button variant="primary" as={Link} to="/about" className="mt-3">
                Learn More About Us
              </Button>
            </Col>

            <Col lg={6} data-aos="fade-left">
              <NoticeBoard />
            </Col>
          </Row>
        </Container>
      </section>

      {/* <!-- Programs Section --> */}
      <section className="programs-section py-5">
        <Container>
          <h2 className="text-center mb-5" data-aos="fade-up">
            Our Programs
          </h2>
          <Row className="g-4">
            <Col md={6} lg={3} data-aos="zoom-in" data-aos-delay="100">
              <div className="program-card text-center p-4">
                <i className="bi bi-mortarboard text-primary display-4 mb-3"></i>
                <h3>Primary Education</h3>
                <p>Building strong foundations for young learners.</p>
              </div>
            </Col>
            <Col md={6} lg={3} data-aos="zoom-in" data-aos-delay="200">
              <div className="program-card text-center p-4">
                <i className="bi bi-book text-primary display-4 mb-3"></i>
                <h3>Secondary Education</h3>
                <p>Comprehensive learning for middle school students.</p>
              </div>
            </Col>
            <Col md={6} lg={3} data-aos="zoom-in" data-aos-delay="300">
              <div className="program-card text-center p-4">
                <i className="bi bi-graph-up text-primary display-4 mb-3"></i>
                <h3>Higher Secondary</h3>
                <p>Preparing students for higher education and careers.</p>
              </div>
            </Col>
            <Col md={6} lg={3} data-aos="zoom-in" data-aos-delay="400">
              <div className="program-card text-center p-4">
                <i className="bi bi-trophy text-primary display-4 mb-3"></i>
                <h3>Extracurricular</h3>
                <p>
                  Sports, arts, and other activities for holistic development.
                </p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* <!-- Admission Section --> */}
      <section className="py-5 bg-light">
        <Container>
          <div className="row justify-content-center">
            <div className="col-lg-10">
              <h2
                className="text-center mb-5 display-5 fw-bold text-primary"
                data-aos="fade-up"
              >
                Message from the Principal
              </h2>
              <div
                className="card border-0 shadow-lg overflow-hidden"
                data-aos="zoom-in"
              >
                <div className="row g-0">
                  <div
                    className="col-md-4 d-flex align-items-center"
                    data-aos="fade-right"
                  >
                    <img
                      src="https://media.istockphoto.com/id/1300434912/photo/young-business-woman-got-overjoyed-by-good-news-and-started-celebrating-while-working-on.webp?a=1&b=1&s=612x612&w=0&k=20&c=qE_KkcG9arxtuMq1rwNNGpVIUp2fd02nJIs7lkWLZhg="
                      className="img-fluid rounded-start"
                      alt="Principal [Name]"
                      style={{ objectFit: "cover", height: "100%" }}
                    />
                  </div>
                  <div className="col-md-8" data-aos="fade-left">
                    <div className="card-body p-4 p-lg-5">
                      <div className="d-flex align-items-center mb-4">
                        <div>
                          <h3 className="card-title mb-1">Dr. Jane Smith</h3>
                          <p className="text-muted mb-0">Principal</p>
                        </div>
                      </div>

                      <blockquote className="blockquote mb-4">
                        <p className="lead fst-italic">
                          "At [School Name], we believe in nurturing each
                          student's unique potential through innovative teaching
                          methods and a values-based education system."
                        </p>
                      </blockquote>

                      <div className="card-text">
                        <p className="lead">
                          Detailed message text goes here... Our commitment to
                          academic excellence combined with character
                          development ensures our students become responsible
                          global citizens.
                        </p>

                        <div className="mt-4">
                          <a
                            href="/principal-message"
                            className="btn btn-outline-primary"
                          >
                            Read Full Message{" "}
                            <i className="bi bi-arrow-right ms-2"></i>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

            {/* <!-- Features Section --> */}
      <section className="features-section py-5">
        <Container>
          <h2 className="text-center mb-5" data-aos="fade-up">
            Why Choose Us
          </h2>
          <Row className="g-4">
            <Col md={4} data-aos="fade-up" data-aos-delay="100">
              <div className="feature-card text-center p-4">
                <i className="bi bi-book text-primary display-4 mb-3"></i>
                <h3>Quality Education</h3>
                <p>
                  Our experienced faculty provides top-notch education with
                  modern teaching methods.
                </p>
              </div>
            </Col>
            <Col md={4} data-aos="fade-up" data-aos-delay="200">
              <div className="feature-card text-center p-4">
                <i className="bi bi-people text-primary display-4 mb-3"></i>
                <h3>Experienced Faculty</h3>
                <p>
                  Learn from the best educators who are passionate about
                  teaching and mentoring.
                </p>
              </div>
            </Col>
            <Col md={4} data-aos="fade-up" data-aos-delay="300">
              <div className="feature-card text-center p-4">
                <i className="bi bi-building text-primary display-4 mb-3"></i>
                <h3>Modern Infrastructure</h3>
                <p>
                  State-of-the-art facilities to support comprehensive learning
                  and development.
                </p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* <!-- Contact Us Section --> */}
      <section className="contact-section py-5 bg-light">
        <Container>
          <Row className="justify-content-center text-center">
            <Col lg={8} data-aos="fade-up">
              <h2 className="mb-4">Have Questions?</h2>
              <p className="lead mb-4">
                We're here to help! Get in touch with us for any queries or
                concerns.
              </p>
              <Button variant="primary" size="lg" as={Link} to="/contact">
                Contact Us
              </Button>
            </Col>
          </Row>
        </Container>
      </section>

      {/* <!-- CTA Section --> */}
      <section className="cta-section py-5 bg-primary text-white">
        <Container>
          <Row className="justify-content-center text-center">
            <Col lg={8} data-aos="fade-up">
              <h2 className="mb-4">Ready to Join Our Community?</h2>
              <p className="lead mb-4">
                Take the first step towards a brighter future for your child.
              </p>
              <Button variant="light" size="lg" as={Link} to="/admission">
                Apply Now
              </Button>
            </Col>
          </Row>
        </Container>
      </section>
    </>
  );
};

export default Home;
