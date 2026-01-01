import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Card,
  Button,
  Alert,
  Spinner,
  Table,
  Badge,
  Pagination,
  InputGroup,
  FormControl,
  Form,
  Row,
  Col,
} from "react-bootstrap";
import {
  FaArrowLeft,
  FaEye,
  FaSearch,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaFilter,
} from "react-icons/fa";
import { supabase } from "../services/supabaseService";

const ClassStudentList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get class info from URL params
  const classCode = searchParams.get('class') || '';
  const className = searchParams.get('className') || '';
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [students, setStudents] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("roll_no");
  const [sortOrder, setSortOrder] = useState("asc");
  const [resultStatusFilter, setResultStatusFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");

  const studentsPerPage = 20;

  // Fetch real student data directly from database
  useEffect(() => {
    if (classCode) {
      fetchStudents();
    }
  }, [classCode, searchTerm, sortBy, sortOrder, currentPage, resultStatusFilter, gradeFilter]);

  const fetchStudents = async () => {
    setLoading(true);
    setError("");
    try {
      // Calculate offset for pagination
      const offset = (currentPage - 1) * studentsPerPage;

      let query = supabase
        .from('results')
        .select('roll_no, student_name, class_code, class, result_status, grade', { count: 'exact' })
        .eq('class_code', classCode);

      // Apply search filter
      if (searchTerm) {
        query = query.or(`roll_no.ilike.%${searchTerm}%,student_name.ilike.%${search}%`);
      }

      // Apply sorting
      const ascending = sortOrder === 'asc';
      query = query.order(sortBy, { ascending });

      // Apply pagination
      query = query.range(offset, offset + studentsPerPage - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      // Get unique students
      const uniqueStudents = [];
      const seen = new Set();

      if (data) {
        data.forEach(result => {
          const key = `${result.roll_no}-${result.student_name}`;
          if (!seen.has(key)) {
            seen.add(key);
            uniqueStudents.push(result);
          }
        });
      }

      // Apply additional filters for result status and grade
      let filteredStudents = uniqueStudents;
      
      if (resultStatusFilter !== "all") {
        filteredStudents = filteredStudents.filter(student => 
          student.result_status === resultStatusFilter
        );
      }
      
      if (gradeFilter !== "all") {
        filteredStudents = filteredStudents.filter(student => 
          student.grade === gradeFilter
        );
      }

      setStudents(filteredStudents);
      setTotalCount(count || 0);
      setTotalPages(Math.ceil((count || 0) / studentsPerPage));
    } catch (err) {
      console.error("Error fetching students:", err);
      setError(`Failed to load students: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToClasses = () => {
    navigate("/admin/dashboard");
  };

  const navigateToStudentResult = (student) => {
    navigate(`/admin/result/${student.roll_no}/${student.class_code}`);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return <FaSort />;
    return sortOrder === "asc" ? <FaSortUp /> : <FaSortDown />;
  };

  if (!classCode) {
    return (
      <Card>
        <Card.Body>
          <Alert variant="warning">
            No class specified. Please go back and select a class.
          </Alert>
          <Button variant="primary" onClick={handleBackToClasses}>
            <FaArrowLeft className="me-2" />
            Back to Classes
          </Button>
        </Card.Body>
      </Card>
    );
  }

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4>Students - {className || classCode}</h4>
          <p className="text-muted mb-0">Class Code: {classCode}</p>
        </div>
        <Button
          variant="outline-secondary"
          onClick={handleBackToClasses}
        >
          <FaArrowLeft className="me-2" />
          Back to Classes
        </Button>
      </div>

      {error && (
        <Alert variant="danger">
          {error}
        </Alert>
      )}

      <Card>
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Student List ({totalCount} students)</h5>
          </div>
        </Card.Header>
        <Card.Body>
          {/* Search and Filter Controls */}
          <div className="mb-4">
            <Row className="g-3">
              {/* Search */}
              <Col md={4}>
                <InputGroup>
                  <InputGroup.Text>
                    <FaSearch />
                  </InputGroup.Text>
                  <FormControl
                    placeholder="Search by roll number or student name..."
                    value={searchTerm}
                    onChange={handleSearch}
                  />
                </InputGroup>
              </Col>

              {/* Grade Filter */}
              <Col md={2}>
                <InputGroup>
                  <InputGroup.Text>
                    <FaFilter />
                  </InputGroup.Text>
                  <Form.Select
                    value={gradeFilter}
                    onChange={(e) => {
                      setGradeFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="all">All Grades</option>
                    <option value="A+">A+</option>
                    <option value="A">A</option>
                    <option value="B+">B+</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                    <option value="F">F</option>
                  </Form.Select>
                </InputGroup>
              </Col>

              {/* Sort Controls */}
              <Col md={3}>
                <InputGroup>
                  <InputGroup.Text>
                    <FaSort />
                  </InputGroup.Text>
                  <Form.Select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [field, order] = e.target.value.split('-');
                      setSortBy(field);
                      setSortOrder(order);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="roll_no-asc">Roll No (Low to High)</option>
                    <option value="roll_no-desc">Roll No (High to Low)</option>
                    <option value="student_name-asc">Student Name (A to Z)</option>
                    <option value="student_name-desc">Student Name (Z to A)</option>
                    <option value="result_status-asc">Result Status (Pass to Fail)</option>
                    <option value="result_status-desc">Result Status (Fail to Pass)</option>
                    <option value="grade-asc">Grade (A to F)</option>
                    <option value="grade-desc">Grade (F to A)</option>
                  </Form.Select>
                </InputGroup>
              </Col>
            </Row>
          </div>

          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" />
              <p className="mt-2">Loading students...</p>
            </div>
          ) : error ? (
            <Alert variant="danger">
              {error}
            </Alert>
          ) : students.length > 0 ? (
            <>
              <div className="table-responsive">
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>Roll No</th>
                      <th>Student Name</th>
                      <th>Class Code</th>
                      <th>Result Status</th>
                      <th>Grade</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr
                        key={`${student.roll_no}-${student.class_code}`}
                      >
                        <td>{student.roll_no}</td>
                        <td>{student.student_name}</td>
                        <td>{student.class_code}</td>
                        <td>
                          <Badge 
                            bg={student.result_status === 'Pass' ? 'success' : 'danger'}
                          >
                            {student.result_status || 'N/A'}
                          </Badge>
                        </td>
                        <td>
                          <Badge 
                            bg={
                              student.grade === 'A+' ? 'success' :
                              student.grade === 'A' ? 'primary' :
                              student.grade === 'B+' ? 'info' :
                              student.grade === 'B' ? 'info' :
                              student.grade === 'C' ? 'warning' :
                              student.grade === 'D' ? 'warning' :
                              student.grade === 'F' ? 'danger' : 'secondary'
                            }
                          >
                            {student.grade || 'N/A'}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => navigateToStudentResult(student)}
                          >
                            <FaEye className="me-1" />
                            View Result
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div className="text-muted">
                    Showing {((currentPage - 1) * studentsPerPage) + 1} to{' '}
                    {Math.min(currentPage * studentsPerPage, totalCount)} of {totalCount} students
                  </div>
                  <Pagination>
                    <Pagination.Prev
                      disabled={currentPage === 1}
                      onClick={() => handlePageChange(currentPage - 1)}
                    />
                    {[...Array(totalPages)].map((_, index) => {
                      const page = index + 1;
                      return (
                        <Pagination.Item
                          key={page}
                          active={page === currentPage}
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </Pagination.Item>
                      );
                    })}
                    <Pagination.Next
                      disabled={currentPage === totalPages}
                      onClick={() => handlePageChange(currentPage + 1)}
                    />
                  </Pagination>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-4">
              <p>No students found matching your criteria.</p>
              <div className="d-flex gap-2 justify-content-center">
                {searchTerm && (
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => {
                      setSearchTerm("");
                      setCurrentPage(1);
                    }}
                  >
                    Clear Search
                  </Button>
                )}
                {(resultStatusFilter !== "all" || gradeFilter !== "all") && (
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => {
                      setResultStatusFilter("all");
                      setGradeFilter("all");
                      setCurrentPage(1);
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default ClassStudentList;
