import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Card,
  Table,
  Alert,
  Spinner,
} from "react-bootstrap";
import { getResultByRollNoAndClassCode } from "../services/resultService";
import { getStudentByRollNumberAndClassCode } from "../services/classStudentService";
import AOS from "aos";
import "aos/dist/aos.css";
import SkeletonLoader from "../components/user/SkeletonLoader";


const Result = () => {
  const [rollNo, setRollNo] = useState("");
  const [classCode, setClassCode] = useState("");
  const [result, setResult] = useState(null); // This will now hold an array of results
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [studentInfo, setStudentInfo] = useState(null);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
    });
  }, []);

  // Function to calculate overall metrics
  const calculateOverallMetrics = (results) => {
    if (!Array.isArray(results) || results.length === 0) return null;

    let totalMarks = 0;
    let totalMaxMarks = 0;
    let totalSubjects = 0;
    let passCount = 0;
    const grades = [];
    const statuses = [];

    results.forEach((examResult) => {
      if (examResult.subjects && Array.isArray(examResult.subjects)) {
        examResult.subjects.forEach((subject) => {
          totalMarks += subject.marks || subject.obtained_marks || 0;
          totalMaxMarks += subject.max_marks || 100;
          totalSubjects++;
        });
      }

      if (examResult.grade) {
        grades.push(examResult.grade);
      }

      if (examResult.result_status) {
        statuses.push(examResult.result_status);
      }

      if (examResult.result_status === "Pass") {
        passCount++;
      }
    });

    const overallPercentage =
      totalMaxMarks > 0 ? (totalMarks / totalMaxMarks) * 100 : 0;

    // Determine overall status based on number of passed exams
    const overallStatus = passCount === results.length ? "Pass" : "Fail";

    // For overall grade, we can use a simple average or take the most common grade
    let overallGrade = "N/A";
    if (grades.length > 0) {
      // Simple approach: take the first grade or calculate average if grades are numeric
      overallGrade = grades[0]; // You can implement more complex logic as needed
    }

    return {
      overallPercentage: overallPercentage.toFixed(2),
      overallGrade,
      overallStatus,
      totalExams: results.length,
      passedExams: passCount,
      failedExams: results.length - passCount,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    setShowResults(false); // Reset show results state

    try {
      // Validate inputs
      if (!rollNo || !classCode) {
        throw new Error("Please enter both Roll Number and Class Code");
      }

      if (rollNo.length !== 6 || isNaN(rollNo)) {
        throw new Error("Roll Number must be exactly 6 digits");
      }

      const data = await getResultByRollNoAndClassCode(rollNo, classCode);
      if (!data) {
        throw new Error(
          "No result found for the provided Roll Number and Class Code"
        );
      }

      // Set the array of results
      setResult(data);
      setShowResults(true); // Set show results to true after data is fetched
      
      // Fetch additional student information
      try {
        const studentData = await getStudentByRollNumberAndClassCode(rollNo, classCode);
        setStudentInfo(studentData);
      } catch (studentError) {
        console.error('Error fetching student info:', studentError);
        // Continue without student info if fetch fails
      }
    } catch (err) {
      setError(err.message || "Failed to fetch result. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Calculate overall metrics
  const overallMetrics =
    result && Array.isArray(result) ? calculateOverallMetrics(result) : null;

  // Helper function to calculate grade
  const calculateGrade = (obtained, total) => {
    const percentage = (obtained / total) * 100;
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C+';
    if (percentage >= 40) return 'C';
    return 'F';
  };

  const generatePDF = () => {
    if (!result || !Array.isArray(result) || result.length === 0) return;

    const doc = new jsPDF({
      unit: 'pt',
      format: 'a4',
      orientation: 'portrait',
    });

    const pageWidth = doc.internal.pageSize.getWidth();

    // Colors
    const royalBlue = '#4169E1';
    const black = '#000000';

    // Header
    const schoolName = 'Demo Public School';
    const schoolAddress = 'Chaunspur road, Yaqutganj, Farrukhabad, Uttar Pradesh - 209749';
    const schoolLogoUrl = '/logo.png';

    // Header section with logo
    doc.addImage(schoolLogoUrl, 'PNG', 40, 30, 80, 60);
    
    doc.setFontSize(20);
    doc.setTextColor(royalBlue);
    doc.setFont('helvetica', 'bold');
    doc.text(schoolName.toUpperCase(), 130, 50);
    
    doc.setFontSize(10);
    doc.setTextColor(black);
    doc.setFont('helvetica', 'normal');
    doc.text(schoolAddress, 130, 65);
    
    doc.setDrawColor(royalBlue);
    doc.setLineWidth(2);
    doc.line(40, 90, pageWidth - 40, 90);

    // Student Info without borders
    doc.setFontSize(12);
    doc.setTextColor(black);
    doc.setFont('helvetica', 'bold');
    
    // Student details
    const studentInfoY = 125;
    
    // Result title centered
    doc.setFontSize(18);
    doc.setTextColor(royalBlue);
    doc.setFont('helvetica', 'bold');
    doc.text('Result', pageWidth / 2, studentInfoY, { align: 'center' });
    doc.setFontSize(14);
    doc.setTextColor(black);
    doc.text(`Session: ${studentInfo?.session ? `${studentInfo.session.start_year}-${studentInfo.session.end_year}` : result[0]?.session_year || 'N/A'}`, pageWidth / 2, studentInfoY + 20, { align: 'center' });
    
    // First row - Student Information
    doc.setFontSize(11);
    doc.setTextColor(black);
    
    // Name
    doc.setFont('helvetica', 'bold');
    doc.text('Name:', 50, studentInfoY + 65);
    doc.setFont('helvetica', 'normal');
    doc.text(` ${studentInfo?.student_name || result[0]?.student_name || 'N/A'}`, 85, studentInfoY + 65);
    
    // Father's Name
    doc.setFont('helvetica', 'bold');
    doc.text('Father\'s Name:', 50, studentInfoY + 80);
    doc.setFont('helvetica', 'normal');
    doc.text(` ${studentInfo?.father_name || result[0]?.father_name || 'N/A'}`, 140, studentInfoY + 80);
    
    // Mother's Name
    doc.setFont('helvetica', 'bold');
    doc.text('Mother\'s Name:', 50, studentInfoY + 95);
    doc.setFont('helvetica', 'normal');
    doc.text(` ${studentInfo?.mother_name || result[0]?.mother_name || 'N/A'}`, 140, studentInfoY + 95);
    
    // Date of Birth
    doc.setFont('helvetica', 'bold');
    doc.text('Date of Birth:', 50, studentInfoY + 110);
    doc.setFont('helvetica', 'normal');
    doc.text(` ${studentInfo?.date_of_birth ? new Date(studentInfo.date_of_birth).toLocaleDateString('en-IN') : 'N/A'}`, 125, studentInfoY + 110);
    
    // Second row - Academic Details
    // Registration No
    doc.setFont('helvetica', 'bold');
    doc.text('Registration No:', 350, studentInfoY + 65);
    doc.setFont('helvetica', 'normal');
    doc.text(` ${studentInfo?.registration_number || result[0]?.registration_number || 'N/A'}`, 440, studentInfoY + 65);
    
    // Student ID
    doc.setFont('helvetica', 'bold');
    doc.text('Student ID:', 350, studentInfoY + 80);
    doc.setFont('helvetica', 'normal');
    doc.text(` ${studentInfo?.student_id || result[0]?.student_id || 'N/A'}`, 410, studentInfoY + 80);
    
    // Class
    doc.setFont('helvetica', 'bold');
    doc.text('Class:', 350, studentInfoY + 95);
    doc.setFont('helvetica', 'normal');
    doc.text(` ${studentInfo?.class || result[0]?.class || 'N/A'} (${studentInfo?.class_code || result[0]?.class_code || 'N/A'})`, 380, studentInfoY + 95);
    
    // Roll Number
    doc.setFont('helvetica', 'bold');
    doc.text('Roll Number:', 350, studentInfoY + 110);
    doc.setFont('helvetica', 'normal');
    doc.text(` ${studentInfo?.roll_number || result[0]?.roll_no || 'N/A'}`, 420, studentInfoY + 110);
    
    // Enhanced Marks & Subjects Table with dynamic exam types
    let tableColumnHeaders = ['Subject'];
    
    // Collect all unique exam types from the results with their creation order
    const examTypesWithOrder = new Map();
    result.forEach((examResult) => {
      if (examResult.exam_type && !examTypesWithOrder.has(examResult.exam_type)) {
        examTypesWithOrder.set(examResult.exam_type, examResult.created_at || examResult.id || 0);
      }
    });
    
    // Convert to array and sort by creation order (earliest first)
    const sortedExamTypes = Array.from(examTypesWithOrder.entries())
      .sort((a, b) => {
        // Sort by creation date, if available, otherwise by insertion order
        if (a[1] && b[1]) {
          return new Date(a[1]) - new Date(b[1]);
        }
        return 0;
      })
      .map(([examType]) => examType);
    
    // Build headers dynamically based on available exam types
    sortedExamTypes.forEach(examType => {
      tableColumnHeaders.push(examType);
    });
    
    // Always add these columns
    tableColumnHeaders.push('Obtained Marks', 'Total Marks');

    let tableRows = [];
    
    // Process all exam results and subjects
    const allSubjects = {};
    let examTypeTotals = {}; // Track totals for each exam type
    let overallObtainedMarks = 0;
    let overallTotalMarks = 0;
    
    result.forEach((examResult) => {
      const examType = examResult.exam_type;
      
      if (examResult.subjects && Array.isArray(examResult.subjects)) {
        examResult.subjects.forEach((subject) => {
          const subjectName = subject.name || subject.subject || 'Unknown';
          
          if (!allSubjects[subjectName]) {
            allSubjects[subjectName] = {
              name: subjectName,
              examMarks: {},
              obtained: 0,
              total: 0,
              grade: 'N/A',
              status: 'N/A'
            };
            
            // Initialize all exam types with 0
            sortedExamTypes.forEach(type => {
              allSubjects[subjectName].examMarks[type] = 0;
            });
          }
          
          // Add marks for the specific exam type
          const marks = subject.marks || subject.obtained_marks || 0;
          const maxMarks = subject.max_marks || 100;
          const grade = subject.grade; // Fetch grade directly from database
          
          if (examType && allSubjects[subjectName].examMarks.hasOwnProperty(examType)) {
            allSubjects[subjectName].examMarks[examType] = marks;
            
            // Track exam type totals
            if (!examTypeTotals[examType]) {
              examTypeTotals[examType] = { total: 0, obtained: 0 };
            }
            examTypeTotals[examType].total += maxMarks;
            examTypeTotals[examType].obtained += marks;
          }
          
          allSubjects[subjectName].obtained = marks;
          allSubjects[subjectName].total = maxMarks;
          allSubjects[subjectName].grade = grade;
          allSubjects[subjectName].status = marks >= (maxMarks * 0.4) ? 'Pass' : 'Fail';
          
          // Track overall totals
          overallObtainedMarks += marks;
          overallTotalMarks += maxMarks;
        });
      }
    });
    
    // Convert to table rows with dynamic exam columns
    Object.values(allSubjects).forEach(subject => {
      const row = [subject.name];
      
      // Add marks for each exam type
      sortedExamTypes.forEach(examType => {
        row.push(subject.examMarks[examType].toString());
      });
      
      // Calculate obtained marks by summing all exam type marks for this subject
      const subjectObtainedMarks = sortedExamTypes.reduce((sum, examType) => {
        return sum + (subject.examMarks[examType] || 0);
      }, 0);
      
      // Calculate total marks for this subject
      const subjectTotalMarks = sortedExamTypes.reduce((sum, examType) => {
        // Find the max marks for this exam type from the original data
        let maxMarks = 100; // default
        result.forEach((examResult) => {
          if (examResult.exam_type === examType && examResult.subjects) {
            const foundSubject = examResult.subjects.find(s => 
              (s.name || s.subject) === subject.name
            );
            if (foundSubject) {
              maxMarks = foundSubject.max_marks || 100;
            }
          }
        });
        return sum + maxMarks;
      }, 0);
      
      // Update the subject object with calculated values
      subject.obtained = subjectObtainedMarks;
      subject.total = subjectTotalMarks;
      
      // Add the static columns
      row.push(
        subjectObtainedMarks.toString(),
        subjectTotalMarks.toString()
      );
      
      tableRows.push(row);
    });
    
    // Add Total row at the bottom
    const totalRow = ['Total'];
    let finalTotalObtained = 0;
    let finalTotalMarks = 0;
    
    sortedExamTypes.forEach(examType => {
      if (examTypeTotals[examType]) {
        totalRow.push(`${examTypeTotals[examType].obtained}/${examTypeTotals[examType].total}`);
        finalTotalObtained += examTypeTotals[examType].obtained;
        finalTotalMarks += examTypeTotals[examType].total;
      } else {
        totalRow.push('0/0');
      }
    });
    
    const tableOverallPercentage = finalTotalMarks > 0 ? ((finalTotalObtained / finalTotalMarks) * 100).toFixed(1) : '0.0';
    
    // Fetch overall grade from database instead of calculating
    let overallGrade = 'N/A';
    if (result && result.length > 0) {
      // Look for grade in the first result or calculate from available data
      overallGrade = result[0].grade || result[0].overall_grade || 'N/A';
      
      // If no grade found in result, try to find it from subjects
      if (overallGrade === 'N/A' && result[0].subjects) {
        const subjectGrades = result[0].subjects.map(s => s.grade).filter(g => g && g !== 'N/A');
        if (subjectGrades.length > 0) {
          // Use the most frequent grade or first available grade
          overallGrade = subjectGrades[0];
        }
      }
    }
    
    totalRow.push(
      finalTotalObtained.toString(),
      finalTotalMarks.toString()
    );
    
    tableRows.push(totalRow);

    // Enhanced table styling with dynamic column widths
    const columnStyles = {};
    const totalColumns = tableColumnHeaders.length;
    const availableWidth = pageWidth - 80; // Total width minus margins
    
    // Set column widths dynamically
    columnStyles[0] = { cellWidth: 120 }; // Subject column
    
    // Calculate width for exam type columns
    if (sortedExamTypes.length > 0) {
      const examColumnWidth = Math.min(80, (availableWidth - 120 - 160) / sortedExamTypes.length);
      sortedExamTypes.forEach((examType, index) => {
        columnStyles[index + 1] = { cellWidth: examColumnWidth, halign: 'center' };
      });
    }
    
    // Set widths for the last 2 static columns
    const staticColumnStart = sortedExamTypes.length + 1;
    columnStyles[staticColumnStart] = { cellWidth: 80, halign: 'center' }; // Total Marks
    columnStyles[staticColumnStart + 1] = { cellWidth: 80, halign: 'center' }; // Obtained Marks

    autoTable(doc, {
      head: [tableColumnHeaders],
      body: tableRows,
      startY: 270,
      theme: 'grid',
      headStyles: { 
        fillColor: royalBlue, 
        textColor: 'white',
        fontStyle: 'bold',
        fontSize: 10
      },
      styles: { 
        fontSize: 10, 
        cellPadding: 5, 
        textColor: black,
        lineColor: '#e0e0e0'
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250]
      },
      margin: { left: 40, right: 40, top: 10 },
      columnStyles: columnStyles,
      willDrawCell: (data) => {
        // Make the Total row bold
        if (data.row.index === tableRows.length - 1) {
          doc.setFont('helvetica', 'bold');
        }
      },
      didDrawPage: (data) => {
        // Footer with enhanced styling
        const pageHeight = doc.internal.pageSize.getHeight();
        
        // Footer line
        doc.setDrawColor(royalBlue);
        doc.setLineWidth(1);
        doc.line(40, pageHeight - 80, pageWidth - 40, pageHeight - 80);
        
        // Principal's signature
        doc.setFontSize(10);
        doc.setTextColor(black);
        doc.text('Principal\'s Signature', pageWidth - 140, pageHeight - 60);
        doc.setDrawColor(black);
        doc.line(pageWidth - 140, pageHeight - 55, pageWidth - 40, pageHeight - 55);
        
        // Computer generated note
        doc.setFontSize(8);
        doc.setTextColor('#666');
        doc.text('This report card is computer generated and does not require signature.', pageWidth / 2, pageHeight - 30, { align: 'center' });
        
        // Date
        const currentDate = new Date().toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long', 
          year: 'numeric'
        });
        doc.text(`Date: ${currentDate}`, 40, pageHeight - 30);
      },
    });

    // Enhanced Summary Section without border - all in one column
    // Use the calculated totals from the table to ensure consistency
    const totalMarks = finalTotalMarks;
    const totalObtained = finalTotalObtained;
    const overallPercentage = totalMarks > 0 ? ((totalObtained / totalMarks) * 100).toFixed(2) : '0.00';
    const passCriteria = 40;
    const resultStatus = overallPercentage >= passCriteria ? 'PASS' : 'FAIL';
    
    // Fetch grade from database instead of calculating
    let grade = 'N/A';
    if (result && result.length > 0) {
      // Look for grade in the first result
      grade = result[0].grade || result[0].overall_grade || 'N/A';
      
      // If no grade found in result, try to find it from subjects
      if (grade === 'N/A' && result[0].subjects) {
        const subjectGrades = result[0].subjects.map(s => s.grade).filter(g => g && g !== 'N/A');
        if (subjectGrades.length > 0) {
          // Use the most frequent grade or first available grade
          grade = subjectGrades[0];
        }
      }
    }
    
    const summaryY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 400;
    
    // Summary title on left side
    doc.setFontSize(14);
    doc.setTextColor(royalBlue);
    doc.setFont('helvetica', 'bold');
    doc.text('ACADEMIC SUMMARY', 40, summaryY + 15);
    
    // All summary details in one column
    doc.setFontSize(11);
    doc.setTextColor(black);
    
    // All items in single column
    const columnX = 40;
    
    // Total Marks
    doc.setFont('helvetica', 'bold');
    doc.text('Total Marks:', columnX, summaryY + 35);
    doc.setFont('helvetica', 'normal');
    doc.text(` ${totalMarks}`, columnX + 70, summaryY + 35);
    
    // Obtained Marks
    doc.setFont('helvetica', 'bold');
    doc.text('Obtained Marks:', columnX, summaryY + 55);
    doc.setFont('helvetica', 'normal');
    doc.text(` ${totalObtained}`, columnX + 85, summaryY + 55);
    
    // Percentage
    doc.setFont('helvetica', 'bold');
    doc.text('Percentage:', columnX, summaryY + 75);
    doc.setFont('helvetica', 'normal');
    doc.text(` ${overallPercentage}%`, columnX + 65, summaryY + 75);
    
    // Grade
    doc.setFont('helvetica', 'bold');
    doc.text('Grade:', columnX, summaryY + 95);
    doc.setFont('helvetica', 'normal');
    doc.text(` ${grade}`, columnX + 40, summaryY + 95);
    
    // Result status below
    const statusColor = resultStatus === 'PASS' ? [0, 128, 0] : [220, 20, 60];
    doc.setTextColor(...statusColor);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`Result: ${resultStatus}`, columnX, summaryY + 115);

    doc.save(`ReportCard_${result[0].roll_no}.pdf`);
  };


  return (
    <Container className="py-5 mt-5">
      <Row className="justify-content-center">
        <Col md={8}>
          <div className="text-center mb-5" data-aos="fade-down">
            <h1 className="display-4 fw-bold text-primary mb-3">
              Student Result
            </h1>
            <p className="lead text-muted">
              Enter your details to view your academic results
            </p>
            <hr className="my-4" />
          </div>

          <Card className="mb-4 shadow" data-aos="fade-up">
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Roll Number</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter 6-digit roll number"
                        value={rollNo}
                        onChange={(e) => setRollNo(e.target.value)}
                        maxLength={6}
                        className="form-control-lg"
                        disabled={loading} // Disable input during loading
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Class Code</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter class code"
                        value={classCode}
                        onChange={(e) => setClassCode(e.target.value)}
                        className="form-control-lg"
                        disabled={loading} // Disable input during loading
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <div className="d-grid mt-3">
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={loading}
                    className="btn-lg"
                    data-aos="fade-up"
                    data-aos-delay="200"
                  >
                    {loading ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          className="me-2"
                        />
                        Searching...
                      </>
                    ) : (
                      "View Result"
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>

          {error && (
            <Alert
              variant="danger"
              onClose={() => setError("")}
              dismissible
              data-aos="fade-down"
            >
              {error}
            </Alert>
          )}

          {loading && !showResults && (
            <div className="text-center py-5" data-aos="fade-up">
              <Spinner animation="border" role="status" className="mb-3">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
              <p>Fetching your results...</p>
            </div>
          )}

          {showResults && result && !loading && (
            <Card className="shadow" data-aos="fade-up">
              <Card.Header
                as="h4"
                className="text-center bg-primary text-white py-3"
              >
                Result Details
              </Card.Header>
              <Card.Body>
                {/* Display student information from the first result */}
                {Array.isArray(result) && result.length > 0 && (
                  <Row className="mb-4 g-4">
                    <Col md={6} data-aos="fade-right">
                      <div className="p-3 bg-light rounded">
                        <h5 className="text-primary mb-3">
                          Student Information
                        </h5>
                        <p className="mb-2">
                          <strong>Student Name:</strong>{" "}
                          {studentInfo?.student_name || result[0].student_name}
                        </p>
                        <p className="mb-2">
                          <strong>Father's Name:</strong>{" "}
                          {studentInfo?.father_name || result[0].father_name || 'N/A'}
                        </p>
                        <p className="mb-2">
                          <strong>Mother's Name:</strong>{" "}
                          {studentInfo?.mother_name || result[0].mother_name || 'N/A'}
                        </p>
                        <p className="mb-2">
                          <strong>Date of Birth:</strong>{" "}
                          {studentInfo?.date_of_birth ? new Date(studentInfo.date_of_birth).toLocaleDateString('en-IN') : 'N/A'}
                        </p>
                        <p className="mb-2">
                          <strong>Roll Number:</strong> {studentInfo?.roll_number || result[0].roll_no}
                        </p>
                      </div>
                    </Col>
                    <Col md={6} data-aos="fade-left">
                      <div className="p-3 bg-light rounded">
                        <h5 className="text-primary mb-3">Academic Details</h5>
                        <p className="mb-2">
                          <strong>Registration No:</strong> {studentInfo?.registration_number || result[0].registration_number || 'N/A'}
                        </p>
                        <p className="mb-2">
                          <strong>Student ID:</strong> {studentInfo?.student_id || result[0].student_id || 'N/A'}
                        </p>
                        <p className="mb-2">
                          <strong>Class:</strong> {studentInfo?.class || result[0].class}
                        </p>
                        <p className="mb-2">
                          <strong>Class Code:</strong> {studentInfo?.class_code || result[0].class_code}
                        </p>
                        <p className="mb-2">
                          <strong>Session:</strong> {studentInfo?.session ? `${studentInfo.session.start_year}-${studentInfo.session.end_year}` : result[0]?.session_year || '2024-2025'}
                        </p>
                      </div>
                    </Col>
                  </Row>
                )}

                {/* Display overall metrics */}
                {overallMetrics && (
                  <Row className="mb-4 g-4">
                    <Col md={12}>
                      <div className="p-3 bg-success text-white rounded">
                        <h5 className="text-white mb-3">
                          Overall Performance Summary
                        </h5>
                        <Row>
                          <Col md={3}>
                            <p className="mb-1">
                              <strong>Overall Grade:</strong>
                            </p>
                            <p className="fw-bold fs-5">
                              {overallMetrics.overallGrade}
                            </p>
                          </Col>
                          <Col md={3}>
                            <p className="mb-1">
                              <strong>Overall Percentage:</strong>
                            </p>
                            <p className="fw-bold fs-5">
                              {overallMetrics.overallPercentage}%
                            </p>
                          </Col>
                          <Col md={3}>
                            <p className="mb-1">
                              <strong>Status:</strong>
                            </p>
                            <p className="fw-bold fs-5">
                              <span
                                className={`badge ${
                                  overallMetrics.overallStatus === "Pass"
                                    ? "bg-success"
                                    : "bg-danger"
                                }`}
                              >
                                {overallMetrics.overallStatus}
                              </span>
                            </p>
                          </Col>
                          <Col md={3}>
                            <p className="mb-1">
                              <strong>Exams:</strong>
                            </p>
                            <p className="fw-bold fs-5">
                              {overallMetrics.passedExams}/
                              {overallMetrics.totalExams} Passed
                            </p>
                          </Col>
                        </Row>
                      </div>
                    </Col>
                  </Row>
                )}

                <div className="mt-4" data-aos="fade-up">
                  <h5 className="text-center mb-4 pb-2 border-bottom">
                    Exam Results
                  </h5>

                  {/* Display all exam results */}
                  {Array.isArray(result) &&
                    result.map((examResult, index) => (
                      <div key={index} className="mb-4">
                        <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom bg-light py-2">
                          <h5>
                            {examResult.exam_type || "Result"} Details -{" "}
                            {examResult.exam_date
                              ? new Date(
                                  examResult.exam_date
                                ).toLocaleDateString()
                              : "N/A"}
                          </h5>
                        </div>

                        <Row className="mb-3">
                          <Col md={6}>
                            <p className="mb-1">
                              <strong>Exam Type:</strong>{" "}
                              {examResult.exam_type || "N/A"}
                            </p>
                            <p className="mb-1">
                              <strong>Result Date:</strong>{" "}
                              {examResult.exam_date
                                ? new Date(
                                    examResult.exam_date
                                  ).toLocaleDateString()
                                : "N/A"}
                            </p>
                            <p className="mb-0">
                              <strong>Status:</strong>
                              <span
                                className={`badge ms-2 ${
                                  examResult.result_status === "Pass"
                                    ? "bg-success"
                                    : "bg-danger"
                                }`}
                              >
                                {examResult.result_status}
                              </span>
                            </p>
                          </Col>
                          <Col md={6}>
                            <p className="mb-0 text-end">
                              <strong>Grade:</strong>
                              <span className="fw-bold text-primary ms-2">
                                {examResult.grade}
                              </span>
                            </p>
                          </Col>
                        </Row>

                        <Table
                          striped
                          bordered
                          hover
                          responsive
                          className="text-center"
                        >
                          <thead className="table-primary">
                            <tr>
                              <th>Subject</th>
                              <th>Marks</th>
                              <th>Max Marks</th>
                              <th>Percentage</th>
                            </tr>
                          </thead>
                          <tbody>
                            {examResult.subjects &&
                            Array.isArray(examResult.subjects) &&
                            examResult.subjects.length > 0 ? (
                              examResult.subjects.map((subject, subIndex) => (
                                <tr key={subIndex}>
                                  <td className="fw-medium">
                                    {subject.name || subject.subject}
                                  </td>
                                  <td>
                                    <span className="">
                                      {subject.marks ||
                                        subject.obtained_marks ||
                                        0}
                                    </span>
                                  </td>
                                  <td>
                                    <span className="">
                                      {subject.max_marks || 100}
                                    </span>
                                  </td>
                                  <td>
                                    <span className="">
                                      {(
                                        ((subject.marks ||
                                          subject.obtained_marks ||
                                          0) /
                                          (subject.max_marks || 100)) *
                                        100
                                      ).toFixed(1)}
                                      %
                                    </span>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="4">No subjects found</td>
                              </tr>
                            )}
                            <tr className="table-active fw-bold">
                              <td>Total</td>
                              <td>
                                {examResult.subjects &&
                                Array.isArray(examResult.subjects)
                                  ? examResult.subjects.reduce(
                                      (sum, subject) =>
                                        sum +
                                        (subject.marks ||
                                          subject.obtained_marks ||
                                          0),
                                      0
                                    )
                                  : 0}
                              </td>
                              <td>
                                {examResult.subjects &&
                                Array.isArray(examResult.subjects)
                                  ? examResult.subjects.reduce(
                                      (sum, subject) =>
                                        sum + (subject.max_marks || 100),
                                      0
                                    )
                                  : examResult.subjects &&
                                    Array.isArray(examResult.subjects)
                                  ? examResult.subjects.length * 100
                                  : 0}
                              </td>
                              <td>
                                {examResult.subjects &&
                                Array.isArray(examResult.subjects) &&
                                examResult.subjects.length > 0
                                  ? (
                                      (examResult.subjects.reduce(
                                        (sum, subject) =>
                                          sum +
                                          (subject.marks ||
                                            subject.obtained_marks ||
                                            0),
                                        0
                                      ) /
                                        examResult.subjects.reduce(
                                          (sum, subject) =>
                                            sum + (subject.max_marks || 100),
                                          0
                                        )) *
                                      100
                                    ).toFixed(1)
                                  : "0.0%"}
                                %
                              </td>
                            </tr>
                          </tbody>
                        </Table>
                      </div>
                    ))}
                </div>
              </Card.Body>
              <div className="text-center m-4">
                <button
                  className="btn btn-primary btn-lg"
                  style={{ backgroundColor: '#4169E1', borderColor: '#4169E1' }}
                  onClick={generatePDF}
                >
                  Download Report Card (PDF)
                </button>
              </div>
            </Card>
          )}

          {/* Loading skeleton for results when they are being loaded */}
          {loading && showResults && (
            <Card className="shadow" data-aos="fade-up">
              <Card.Header
                as="h4"
                className="text-center bg-primary text-white py-3"
              >
                Result Details
              </Card.Header>
              <Card.Body>
                {/* Loading skeleton for student information */}
                <Row className="mb-4 g-4">
                  <Col md={6} data-aos="fade-right">
                    <div className="p-3 bg-light rounded">
                      <h5 className="text-primary mb-3">Student Information</h5>
                      <SkeletonLoader type="list-item" count={3} />
                    </div>
                  </Col>
                  <Col md={6} data-aos="fade-left">
                    <div className="p-3 bg-light rounded">
                      <h5 className="text-primary mb-3">Academic Details</h5>
                      <SkeletonLoader type="list-item" count={2} />
                    </div>
                  </Col>
                </Row>

                {/* Loading skeleton for overall metrics */}
                <Row className="mb-4 g-4">
                  <Col md={12}>
                    <div className="p-3 bg-success text-white rounded">
                      <h5 className="text-white mb-3">
                        Overall Performance Summary
                      </h5>
                      <SkeletonLoader type="list-item" count={4} />
                    </div>
                  </Col>
                </Row>

                <div className="mt-4" data-aos="fade-up">
                  <h5 className="text-center mb-4 pb-2 border-bottom">
                    Exam Results
                  </h5>

                  {/* Loading skeleton for exam results */}
                  <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom bg-light py-2">
                      <h5>Exam Details</h5>
                    </div>
                    <SkeletonLoader type="card" count={1} />
                    <div className="table-responsive">
                      <Table
                        striped
                        bordered
                        hover
                        responsive
                        className="text-center"
                      >
                        <thead className="table-primary">
                          <tr>
                            <th>Subject</th>
                            <th>Marks</th>
                            <th>Max Marks</th>
                            <th>Percentage</th>
                          </tr>
                        </thead>
                        <tbody>
                          <SkeletonLoader type="table-row" count={5} />
                        </tbody>
                      </Table>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default Result;
