import React, { useState, useRef } from "react";
import {
  Card,
  Button,
  Form,
  Badge,
  Alert,
  Spinner,
  Modal,
} from "react-bootstrap";
import {
  FaUpload,
  FaDownload,
  FaUser,
  FaInfoCircle,
} from "react-icons/fa";
import { supabase } from "../../services/supabaseService";
import { uploadBulkResultsFromCSV, fetchStudentInfo } from "../../services/resultService";

const BulkResultUpload = ({ onUploadSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showTemplate, setShowTemplate] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  
  const fileInputRef = useRef(null);

  // Handle CSV upload for bulk results
  const handleBulkCSVUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Store the file reference
    setSelectedFile(file);

    setLoading(true);
    setError("");
    setSuccess("");
    setPreviewData(null);

    try {
      if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
        throw new Error("Please upload a valid CSV file");
      }

      // Read file for preview
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim() !== '');
      
      if (lines.length <= 1) {
        throw new Error('CSV file is empty or invalid');
      }

      // Parse and validate CSV structure
      const headers = lines[0].split(',').map(h => h.trim());
      const requiredColumns = ['class_code', 'roll_no', 'exam_type', 'subject', 'obtained_marks', 'maximum_marks'];
      
      const missingColumns = requiredColumns.filter(col => !headers.includes(col));
      if (missingColumns.length > 0) {
        throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
      }

      // Parse and process data for preview (simulate actual upload process)
      const previewRows = [];
      const studentExamGroups = {};
      
      for (let i = 1; i <= Math.min(5, lines.length - 1); i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length !== headers.length) continue;

        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });

        // Auto-pad roll number to 6 digits
        if (row.roll_no) {
          const cleanRollNo = row.roll_no.replace(/\D/g, '');
          row.roll_no = cleanRollNo.padStart(6, '0');
        }

        // Validate marks
        const obtainedMarks = parseInt(row.obtained_marks);
        const maximumMarks = parseInt(row.maximum_marks);
        
        if (isNaN(obtainedMarks) || isNaN(maximumMarks)) {
          throw new Error(`Invalid marks on line ${i + 1}. Both obtained_marks and maximum_marks must be numeric.`);
        }

        if (obtainedMarks < 0 || maximumMarks < 0) {
          throw new Error(`Marks cannot be negative on line ${i + 1}.`);
        }

        if (obtainedMarks > maximumMarks) {
          throw new Error(`Obtained marks cannot exceed maximum marks on line ${i + 1}.`);
        }

        // Create unique key for student-exam combination
        const studentExamKey = `${row.roll_no}-${row.class_code}-${row.exam_type}`;

        if (!studentExamGroups[studentExamKey]) {
          studentExamGroups[studentExamKey] = {
            roll_no: row.roll_no,
            class_code: row.class_code,
            exam_type: row.exam_type,
            subjects: [],
            total_obtained: 0,
            total_maximum: 0
          };
        }

        // Add subject with marks
        studentExamGroups[studentExamKey].subjects.push({
          name: row.subject,
          obtained_marks: obtainedMarks,
          maximum_marks: maximumMarks
        });

        studentExamGroups[studentExamKey].total_obtained += obtainedMarks;
        studentExamGroups[studentExamKey].total_maximum += maximumMarks;
      }

      // Convert grouped data to preview format
      for (const [studentKey, group] of Object.entries(studentExamGroups)) {
        // Calculate percentage and grade
        const percentage = (group.total_obtained / group.total_maximum) * 100;
        let grade = '';
        
        if (percentage >= 90) grade = 'A+';
        else if (percentage >= 80) grade = 'A';
        else if (percentage >= 70) grade = 'B+';
        else if (percentage >= 60) grade = 'B';
        else if (percentage >= 50) grade = 'C';
        else if (percentage >= 40) grade = 'D';
        else grade = 'F';

        // Determine pass/fail status
        const resultStatus = percentage >= 40 ? 'Pass' : 'Fail';

        // Try to fetch student information using the comprehensive fetchStudentInfo function
        let studentName = `Student ${group.roll_no}`;
        let className = group.class_code;

        try {
          const studentInfo = await fetchStudentInfo(group.roll_no, group.class_code);
          if (studentInfo.student_name) {
            studentName = studentInfo.student_name;
          }
          if (studentInfo.class && studentInfo.class !== group.class_code) {
            className = studentInfo.class;
          }
          console.log('Preview student data fetched:', { studentName, className, rollNo: group.roll_no, classCode: group.class_code });
        } catch (studentError) {
          console.log('Could not fetch student data:', studentError.message);
          // Keep default values if fetch fails
        }

        previewRows.push({
          student_name: studentName,
          roll_no: group.roll_no,
          class: className,
          class_code: group.class_code,
          exam_type: group.exam_type,
          result_status: resultStatus,
          grade: grade,
          total_obtained: group.total_obtained,
          total_maximum: group.total_maximum,
          percentage: percentage.toFixed(1),
          subjects: group.subjects
        });
      }

      setPreviewData({
        headers,
        rows: previewRows,
        totalRows: lines.length - 1
      });
      setShowPreview(true);

    } catch (err) {
      setError(err.message || "Failed to process CSV file");
      // Clear file on error
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } finally {
      setLoading(false);
    }
  };

  // Confirm and upload the CSV
  const confirmUpload = async () => {
    if (!selectedFile) {
      throw new Error("No file selected");
    }
    if (!previewData) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await uploadBulkResultsFromCSV(selectedFile);
      setSuccess(`Successfully uploaded ${result.count} result records`);
      setShowPreview(false);
      setPreviewData(null);
      setSelectedFile(null);
      
      // Clear file input after successful upload
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      
      if (onUploadSuccess) {
        onUploadSuccess();
      }

    } catch (err) {
      setError(err.message || "Failed to upload results");
    } finally {
      setLoading(false);
    }
  };

  // Download CSV template
  const downloadTemplate = () => {
    const csvContent = `class_code,roll_no,exam_type,subject,obtained_marks,maximum_marks
10A,123456,Final Exam,Mathematics,85,100
10A,123456,Final Exam,Science,78,100
10A,123456,Final Exam,English,92,100
10B,654321,Final Exam,Mathematics,76,100
10B,654321,Final Exam,Science,88,100`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk_results_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <>
      <Card className="mb-4">
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Bulk Result Upload</h5>
            <div>
              <Button
                variant="outline-info"
                size="sm"
                onClick={() => setShowTemplate(true)}
                className="me-2"
              >
                <FaInfoCircle className="me-1" />
                Format Guide
              </Button>
            </div>
          </div>
        </Card.Header>
        <Card.Body>
          <div className="text-center mb-3">
            <p className="text-muted">
              Upload results in bulk using CSV format with class code, roll number, exam type, subject, obtained marks, and maximum marks.
            </p>
            
            <input
              type="file"
              accept=".csv"
              ref={fileInputRef}
              onChange={handleBulkCSVUpload}
              style={{ display: "none" }}
            />
            <Button
              variant="primary"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              size="lg"
            >
              {loading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Processing...
                </>
              ) : (
                <>
                  <FaUpload className="me-2" />
                  Upload Bulk Results CSV
                </>
              )}
            </Button>
          </div>

          {error && (
            <Alert variant="danger" onClose={() => setError("")} dismissible>
              {error}
            </Alert>
          )}

          {success && (
            <Alert variant="success" onClose={() => setSuccess("")} dismissible>
              {success}
            </Alert>
          )}
        </Card.Body>
      </Card>

      {/* Preview Modal */}
      <Modal show={showPreview} onHide={() => {
        setShowPreview(false);
        setPreviewData(null);
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Preview CSV Data</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {previewData && (
            <>
              <Alert variant="info">
                Found {previewData.totalRows} records in CSV. Showing first 5 records:
              </Alert>
              <div className="table-responsive">
                <table className="table table-striped table-sm">
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Class</th>
                      <th>Roll Number</th>
                      <th>Class Code</th>
                      <th>Exam Type</th>
                      <th>Status</th>
                      <th>Grade</th>
                      <th>Total Marks</th>
                      <th>Percentage</th>
                      <th>Subjects</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.rows.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        <td>
                          <div className="d-flex align-items-center">
                            <FaUser className="me-2 text-muted" style={{ fontSize: '14px' }} />
                            {row.student_name}
                          </div>
                        </td>
                        <td>{row.class}</td>
                        <td>
                          <code>{row.roll_no}</code>
                        </td>
                        <td>
                          <Badge variant="secondary">{row.class_code}</Badge>
                        </td>
                        <td>{row.exam_type}</td>
                        <td>
                          <Badge variant={row.result_status === 'Pass' ? 'success' : 'danger'}>
                            {row.result_status}
                          </Badge>
                        </td>
                        <td>
                          <Badge variant={
                            row.grade === 'A+' ? 'success' :
                            row.grade === 'A' ? 'primary' :
                            row.grade === 'B+' ? 'info' :
                            row.grade === 'B' ? 'info' :
                            row.grade === 'C' ? 'warning' :
                            row.grade === 'D' ? 'warning' :
                            row.grade === 'F' ? 'danger' : 'secondary'
                          }>
                            {row.grade}
                          </Badge>
                        </td>
                        <td>
                          <strong>{row.total_obtained}/{row.total_maximum}</strong>
                        </td>
                        <td>
                          <strong>{row.percentage}%</strong>
                        </td>
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => {
                              // Show subjects details in a simple alert for now
                              const subjectsList = row.subjects.map(subject => 
                                `${subject.name}: ${subject.obtained_marks}/${subject.maximum_marks} (${((subject.obtained_marks / subject.maximum_marks) * 100).toFixed(1)}%)`
                              ).join('\n');
                              alert(`Subjects for ${row.student_name} (${row.roll_no}):\n\n${subjectsList}`);
                            }}
                          >
                            View Subjects
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => {
            setShowPreview(false);
            setPreviewData(null);
            setSelectedFile(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }
          }}>
            Cancel
          </Button>
          <Button variant="primary" onClick={confirmUpload} disabled={loading}>
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Uploading...
              </>
            ) : (
              "Confirm Upload"
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Template Guide Modal */}
      <Modal show={showTemplate} onHide={() => setShowTemplate(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>CSV Format Guide</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <h6>Required Columns:</h6>
          <ul>
            <li><strong>class_code:</strong> Class identifier (e.g., 10A, 9B)</li>
            <li><strong>roll_no:</strong> Roll number (automatically padded to 6 digits, e.g., 1 becomes 000001)</li>
            <li><strong>exam_type:</strong> Type of exam (e.g., Final Exam, Mid Term, Unit Test)</li>
            <li><strong>subject:</strong> Subject name (e.g., Mathematics, Science, English)</li>
            <li><strong>obtained_marks:</strong> Marks obtained by student (numeric)</li>
            <li><strong>maximum_marks:</strong> Maximum possible marks for the subject (numeric)</li>
          </ul>

          <h6>Roll Number Auto-Padding:</h6>
          <div className="bg-light p-3 rounded mb-3">
            <p className="mb-2">
              <strong>Automatic Zero-Padding:</strong> The system automatically adds leading zeros to roll numbers to ensure they are exactly 6 digits long.
            </p>
            <ul className="mb-0">
              <li><code>1</code> becomes <code>000001</code></li>
              <li><code>123</code> becomes <code>000123</code></li>
              <li><code>4567</code> becomes <code>004567</code></li>
              <li><code>123456</code> remains <code>123456</code></li>
            </ul>
          </div>

          <h6>Example Format:</h6>
          <div className="bg-light p-3 rounded">
            <code>
              class_code,roll_no,exam_type,subject,obtained_marks,maximum_marks<br/>
              10A,123456,Final Exam,Mathematics,85,100<br/>
              10A,123456,Final Exam,Science,78,100<br/>
              10A,123456,Final Exam,English,92,100
            </code>
          </div>

          <h6 className="mt-3">Important Notes:</h6>
          <ul>
            <li>Each row represents one subject for one student in one exam</li>
            <li>Multiple subjects for the same student should be in separate rows</li>
            <li><strong>Roll numbers are automatically padded to 6 digits</strong> (e.g., "1" becomes "000001")</li>
            <li>All marks must be numeric values</li>
            <li>The system will automatically group subjects by student and exam type</li>
            <li>Excel users can enter roll numbers as plain text to preserve leading zeros, but auto-padding handles this automatically</li>
          </ul>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={downloadTemplate}>
            <FaDownload className="me-2" />
            Download Template
          </Button>
          <Button variant="secondary" onClick={() => setShowTemplate(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default BulkResultUpload;
