import React, { useEffect } from "react";
import { Helmet } from "react-helmet";
import AOS from "aos";
import "aos/dist/aos.css";
import "./App.css";
import "./styles/MobileHoverFix.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import Nav from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Gallery from "./pages/Gallery";
import GalleryCategory from "./pages/GalleryCategory";
import Staff from "./pages/Staff";
import Infrastructure from "./pages/Infrastructure";
import PageNotFound from "./pages/PageNotFound";
import PrincipalMessage from "./pages/PrincipalMessage";
import Admission from "./pages/Admission";
import AdmissionEnquiry from "./pages/AdmissionEnquiry";
import DeveloperInfo from "./pages/DeveloperInfo";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLogin from "./pages/AdminLogin";
import ProtectedRoute from "./components/user/ProtectedRoute";
import SettingsManager from "./components/admin/SettingsManager";
import Result from "./pages/Result";
import AdminDetailedResult from "./pages/AdminDetailedResult";
import EditResult from "./pages/EditResult";
import AddResult from "./pages/AddResult";
import ClassSessionManager from "./components/admin/ClassSessionManager";
import ClassStudentsView from "./pages/ClassStudentsView";
import StudentFeesPage from "./pages/StudentFeesPage";
import { trackVisitor } from "./services/supabaseService";
import { requestNotificationPermission } from "./services/notificationService";

// Layout component to conditionally render Nav and Footer
const AppLayout = () => {
  const location = useLocation();

  const hideNavFooter = location.pathname.startsWith("/admin");

  // Track visitor on page load (except for admin pages)
  useEffect(() => {
    if (!hideNavFooter) {
      trackVisitor();
    }
  }, [location.pathname, hideNavFooter]);

  return (
    <>
      {!hideNavFooter && <Nav />}
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/infrastructure" element={<Infrastructure />} />
          <Route path="/staff" element={<Staff />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/gallery/:category" element={<GalleryCategory />} />
          <Route path="/principal-message" element={<PrincipalMessage />} />
          <Route path="/admission" element={<Admission />} />
          <Route path="/admission/enquiry" element={<AdmissionEnquiry />} />
          <Route path="/developer/info" element={<DeveloperInfo />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/setting" element={<SettingsManager />} />
          <Route path="/result" element={<Result />} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/class-session"
            element={
              <ProtectedRoute>
                <ClassSessionManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/class/:classId/students"
            element={
              <ProtectedRoute>
                <ClassStudentsView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/result/:rollNo/:classCode"
            element={
              <ProtectedRoute>
                <AdminDetailedResult />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/result/:rollNo/:classCode/edit"
            element={
              <ProtectedRoute>
                <EditResult />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/result/add"
            element={
              <ProtectedRoute>
                <AddResult />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/student-fees/:studentId"
            element={
              <ProtectedRoute>
                <StudentFeesPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </main>
      {!hideNavFooter && <Footer />}
    </>
  );
};

export default function App() {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
    });

    // Request notification permission when the app loads
    requestNotificationPermission();
  }, []);

  return (
    <Router basename={import.meta.env.BASE_URL}>
      <div className="app-container">
        <AppLayout />
      </div>
    </Router>
  );
}
