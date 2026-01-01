import { supabase } from './supabaseService';

/**
 * Fetches student results by roll number and class code
 * @param {string} rollNo - 6-digit roll number
 * @param {string} classCode - Class code
 * @returns {Promise<Array<object>|null>} Array of result objects or null if not found
 */
export const getResultByRollNoAndClassCode = async (rollNo, classCode) => {
    try {
        const { data, error } = await supabase
            .from('results')
            .select('*')
            .eq('roll_no', rollNo)
            .eq('class_code', classCode)
            .order('created_at', { ascending: false }); // Order by newest first

        if (error) {
            if (error.code === 'PGRST116') {
                // No rows found
                return null;
            }
            throw error;
        }

        // If no data found, return null
        if (!data || data.length === 0) {
            return null;
        }

        // Return all results for this student and class combination
        return data;
    } catch (error) {
        console.error('Error fetching result:', error.message);
        throw new Error('Failed to fetch result. Please try again.');
    }
};

/**
 * Fetches a result by its ID
 * @param {number} id - ID of the result to fetch
 * @returns {Promise<object|null>} Result object or null if not found
 */
export const getResultById = async (id) => {
    try {
        const { data, error } = await supabase
            .from('results')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // No row found
                return null;
            }
            throw error;
        }

        return data;
    } catch (error) {
        console.error('Error fetching result by ID:', error.message);
        throw new Error('Failed to fetch result. Please try again.');
    }
};

/**
 * Fetches all results
 * @returns {Promise<Array<object>>} Array of result objects
 */
export const getAllResults = async () => {
    try {
        const { data, error } = await supabase
            .from('results')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching results:', error.message);
        throw new Error('Failed to fetch results. Please try again.');
    }
};

/**
 * Adds a result manually
 * @param {object} resultData - Result data to add
 * @returns {Promise<object>} Response object with inserted data
 */
export const addResultManually = async (resultData) => {
    try {
        // Check if exam type already exists for this roll number and class code
        const { data: existingResult, error: checkError } = await supabase
            .from('results')
            .select('id')
            .eq('roll_no', resultData.roll_no)
            .eq('class_code', resultData.class_code)
            .eq('exam_type', resultData.exam_type)
            .single();

        if (checkError && checkError.code !== 'PGRST116') {
            throw checkError;
        }

        if (existingResult) {
            throw new Error(`Exam type "${resultData.exam_type}" already exists for this roll number and class code`);
        }

        const resultToInsert = {
            student_name: resultData.student_name,
            roll_no: resultData.roll_no,
            class: resultData.class,
            class_code: resultData.class_code,
            exam_type: resultData.exam_type, // Include exam_type
            result_status: resultData.result_status,
            grade: resultData.grade,
            subjects: resultData.subjects || [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('results')
            .insert([resultToInsert])
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('Error adding result:', error.message);
        throw new Error(error.message || 'Failed to add result. Please try again.');
    }
};

/**
 * Uploads results from a CSV file
 * @param {File} file - CSV file to upload
 * @returns {Promise<object>} Response object with count of uploaded results
 */
export const uploadResultsFromCSV = async (file) => {
    try {
        // Read the CSV file
        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim() !== '');

        if (lines.length <= 1) {
            throw new Error('CSV file is empty or invalid');
        }

        // Parse CSV header
        const headers = lines[0].split(',').map(header => header.trim());

        // Check if this is the complete template (includes subject and marks)
        const isCompleteTemplate = headers.includes('subject') && headers.includes('marks');

        // Required columns
        const requiredColumns = isCompleteTemplate
            ? ['student_name', 'roll_no', 'class', 'class_code', 'result_status', 'grade', 'subject', 'marks']
            : ['student_name', 'roll_no', 'class', 'class_code', 'result_status', 'grade'];

        const missingColumns = requiredColumns.filter(col => !headers.includes(col));

        if (missingColumns.length > 0) {
            throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
        }

        if (isCompleteTemplate) {
            // Handle complete template with subjects and marks
            return await uploadCompleteResultsFromCSV(headers, lines);
        } else {
            // Handle basic template (student info only)
            return await uploadBasicResultsFromCSV(headers, lines);
        }
    } catch (error) {
        console.error('Error uploading results from CSV:', error.message);
        throw new Error(error.message || 'Failed to upload results from CSV. Please check the file format.');
    }
};

/**
 * Uploads basic results from a CSV file (student info only)
 * @param {Array<string>} headers - CSV headers
 * @param {Array<string>} lines - CSV lines
 * @returns {Promise<object>} Response object with count of uploaded results
 */
const uploadBasicResultsFromCSV = async (headers, lines) => {
    // Parse data rows
    const results = [];
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(value => value.trim());
        if (values.length !== headers.length) continue;

        const result = {};
        headers.forEach((header, index) => {
            result[header] = values[index];
        });

        // Validate roll number
        if (result.roll_no && (result.roll_no.length !== 6 || isNaN(result.roll_no))) {
            throw new Error(`Invalid roll number "${result.roll_no}" on line ${i + 1}. Must be 6 digits.`);
        }

        // Set default values if not provided
        result.result_status = result.result_status || 'Pass';
        result.subjects = [];

        results.push(result);
    }

    // Insert results
    const resultsToInsert = results.map(result => ({
        ...result,
        subjects: result.subjects,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }));

    const { error } = await supabase
        .from('results')
        .insert(resultsToInsert);

    if (error) throw error;

    return { count: results.length };
};

/**
 * Uploads complete results from a CSV file (student info with subjects and marks)
 * @param {Array<string>} headers - CSV headers
 * @param {Array<string>} lines - CSV lines
 * @returns {Promise<object>} Response object with count of uploaded results
 */
const uploadCompleteResultsFromCSV = async (headers, lines) => {
    // Group rows by student (roll_no and class_code)
    const studentGroups = {};

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(value => value.trim());
        if (values.length !== headers.length) continue;

        const row = {};
        headers.forEach((header, index) => {
            row[header] = values[index];
        });

        // Validate roll number
        if (row.roll_no && (row.roll_no.length !== 6 || isNaN(row.roll_no))) {
            throw new Error(`Invalid roll number "${row.roll_no}" on line ${i + 1}. Must be 6 digits.`);
        }

        // Create a unique key for each student
        const studentKey = `${row.roll_no}-${row.class_code}`;

        if (!studentGroups[studentKey]) {
            studentGroups[studentKey] = {
                student_name: row.student_name,
                roll_no: row.roll_no,
                class: row.class,
                class_code: row.class_code,
                result_status: row.result_status || 'Pass',
                grade: row.grade,
                subjects: []
            };
        }

        // Add subject if present
        if (row.subject && row.marks) {
            studentGroups[studentKey].subjects.push({
                name: row.subject,
                marks: parseInt(row.marks) || 0
            });
        }
    }

    // Convert to array
    const results = Object.values(studentGroups);

    // Insert results
    const resultsToInsert = results.map(result => ({
        ...result,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }));

    const { error } = await supabase
        .from('results')
        .insert(resultsToInsert);

    if (error) throw error;

    return { count: results.length };
};

/**
 * Updates an existing result
 * @param {number} id - ID of the result to update
 * @param {object} resultData - Updated result data
 * @returns {Promise<object>} Response object with updated data
 */
export const updateResult = async (id, resultData) => {
    try {
        const resultToUpdate = {
            student_name: resultData.student_name,
            roll_no: resultData.roll_no,
            class: resultData.class,
            class_code: resultData.class_code,
            exam_type: resultData.exam_type, // Include exam_type
            result_status: resultData.result_status,
            grade: resultData.grade,
            subjects: resultData.subjects || [],
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('results')
            .update(resultToUpdate)
            .eq('id', id)
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('Error updating result:', error.message);
        throw new Error('Failed to update result. Please try again.');
    }
};

/**
 * Deletes a result
 * @param {number} id - ID of the result to delete
 * @returns {Promise<object>} Response object
 */
export const deleteResult = async (id) => {
    try {
        const { error } = await supabase
            .from('results')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error deleting result:', error.message);
        throw new Error('Failed to delete result. Please try again.');
    }
};

/**
 * Helper function to fetch student information by roll number and class code
 * Used by bulk upload to get student names and classes like single student upload
 * @param {string} rollNumber - The roll number
 * @param {string} classCode - The class code
 * @returns {Promise<object>} Student information with name and class
 */
export const fetchStudentInfo = async (rollNumber, classCode) => {
    try {
        let studentName = '';
        
        // First try to find student through student_classes table with both roll_number AND class
        try {
            const { data: studentClassData, error: studentClassError } = await supabase
                .from('student_classes')
                .select(`
                    student_id,
                    class_id,
                    classes!inner (
                        class_code
                    ),
                    students!inner (
                        id,
                        student_name,
                        registration_number
                    )
                `)
                .eq('roll_number', rollNumber)
                .eq('classes.class_code', classCode)
                .limit(1);

            if (!studentClassError && studentClassData && studentClassData.length > 0) {
                const student = studentClassData[0].students;
                studentName = student.student_name;
                console.log('Found student via student_classes:', student.student_name, 'with roll_number:', rollNumber, 'and class_code:', classCode);
            } else {
                console.log('No student found in student_classes with roll_number:', rollNumber, 'and class_code:', classCode);
                
                // Try without class filter (fallback for debugging)
                const { data: allStudentClassData, error: allStudentClassError } = await supabase
                    .from('student_classes')
                    .select(`
                        student_id,
                        classes!inner (
                            class_code
                        ),
                        students!inner (
                            student_name
                        )
                    `)
                    .eq('roll_number', rollNumber);

                if (!allStudentClassError && allStudentClassData && allStudentClassData.length > 0) {
                    console.log('Found', allStudentClassData.length, 'students with roll_number:', rollNumber);
                    allStudentClassData.forEach(sc => {
                        console.log('- Student:', sc.students.student_name, 'in class:', sc.classes.class_code);
                    });
                }
                
                // Fallback: Try direct registration number matching (for cases where roll_no = registration_number)
                const { data: allStudents, error: allError } = await supabase
                    .from('students')
                    .select('id, student_name, registration_number')
                    .limit(1000);

                if (!allError && allStudents) {
                    console.log('Trying fallback registration number matching for roll number:', rollNumber);
                    
                    // Try multiple matching approaches
                    let matchingStudent = null;
                    
                    // 1. Exact match with registration_number
                    matchingStudent = allStudents.find(student => 
                        student.registration_number === rollNumber
                    );
                    
                    // 2. Try matching without leading zeros
                    if (!matchingStudent && rollNumber.startsWith('0')) {
                        const cleanRollNo = rollNumber.replace(/^0+/, '');
                        matchingStudent = allStudents.find(student => 
                            student.registration_number === cleanRollNo
                        );
                    }
                    
                    // 3. Try matching with leading zeros
                    if (!matchingStudent && !rollNumber.startsWith('0')) {
                        const paddedRollNo = rollNumber.padStart(6, '0');
                        matchingStudent = allStudents.find(student => 
                            student.registration_number === paddedRollNo
                        );
                    }
                    
                    if (matchingStudent) {
                        studentName = matchingStudent.student_name;
                        console.log('Found student via registration fallback:', matchingStudent.student_name);
                    } else {
                        console.log('No student found with any matching method for roll number:', rollNumber);
                        console.log('Sample registration numbers:', allStudents.slice(0, 3).map(s => s.registration_number));
                    }
                }
            }
        } catch (error) {
            console.log('Error in student lookup:', error.message);
        }

        // Get class information
        let className = classCode;
        try {
            const { data: classData, error: classError } = await supabase
                .from('classes')
                .select('class_number')
                .eq('class_code', classCode)
                .limit(1);

            if (classData && classData.length > 0 && !classError) {
                className = classData[0].class_number;
            }
        } catch (classError) {
            // Keep default class code if fetch fails
        }

        return {
            student_name: studentName,
            class: className,
            class_code: classCode
        };

    } catch (error) {
        console.error('Error fetching student info:', error.message);
        // Return default values if fetch fails
        return {
            student_name: '',
            class: classCode,
            class_code: classCode
        };
    }
};

// ... (rest of the code remains the same)

/**
 * Uploads bulk results from CSV with specific format (class_code, roll_no, exam_type, subject, obtained_marks, maximum_marks)
 */
export const uploadBulkResultsFromCSV = async (file) => {
    try {
        // Read the CSV file
        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim() !== '');

        if (lines.length <= 1) {
            throw new Error('CSV file is empty or invalid');
        }

        // Parse CSV header
        const headers = lines[0].split(',').map(header => header.trim());

        // Required columns for bulk upload
        const requiredColumns = ['class_code', 'roll_no', 'exam_type', 'subject', 'obtained_marks', 'maximum_marks'];
        const missingColumns = requiredColumns.filter(col => !headers.includes(col));

        if (missingColumns.length > 0) {
            throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
        }

        // Group data by student and exam type
        const studentExamGroups = {};

        // First, collect all unique student-exam combinations from CSV
        const csvExamCombinations = new Set();
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(value => value.trim());
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

            // Add to CSV combinations set
            const examKey = `${row.roll_no}-${row.class_code}-${row.exam_type}`;
            csvExamCombinations.add(examKey);
        }

        // Check for existing exam types in database
        if (csvExamCombinations.size > 0) {
            const { data: existingResults, error: existingError } = await supabase
                .from('results')
                .select('roll_no, class_code, exam_type')
                .or(Array.from(csvExamCombinations).map(key => {
                    const [rollNo, classCode, examType] = key.split('-');
                    return `and(roll_no.eq.${rollNo},class_code.eq.${classCode},exam_type.eq.${examType})`;
                }).join(','));

            if (!existingError && existingResults && existingResults.length > 0) {
                const duplicateEntries = existingResults.map(result => 
                    `Roll No: ${result.roll_no}, Class: ${result.class_code}, Exam: ${result.exam_type}`
                );
                throw new Error(`Duplicate exam types found in database:\n${duplicateEntries.join('\n')}\n\nThese exam types already exist. Please use different exam types or delete existing results first.`);
            }
        }

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(value => value.trim());
            if (values.length !== headers.length) continue;

            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index];
            });

            // Auto-pad roll number to 6 digits
            if (row.roll_no) {
                // Remove any non-digit characters first
                const cleanRollNo = row.roll_no.replace(/\D/g, '');
                
                // Pad with leading zeros to make it 6 digits
                row.roll_no = cleanRollNo.padStart(6, '0');
                
                // Validate that it's now exactly 6 digits
                if (row.roll_no.length !== 6) {
                    throw new Error(`Invalid roll number "${row.roll_no}" on line ${i + 1}. Must be 6 digits after padding.`);
                }
            } else {
                throw new Error(`Missing roll number on line ${i + 1}.`);
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

        // Convert grouped data to result records
        const resultRecords = [];
        
        for (const group of Object.values(studentExamGroups)) {
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

            // Determine result status
            const resultStatus = percentage >= 40 ? 'Pass' : 'Fail';

            // Fetch student information
            const studentInfo = await fetchStudentInfo(group.roll_no, group.class_code);

            // Create result record
            resultRecords.push({
                student_name: studentInfo.student_name,
                roll_no: group.roll_no,
                class: studentInfo.class,
                class_code: group.class_code,
                exam_type: group.exam_type,
                result_status: resultStatus,
                grade: grade,
                subjects: group.subjects,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });
        }
        if (resultRecords.length > 0) {
            const { error: insertError } = await supabase
                .from('results')
                .insert(resultRecords);

            if (insertError) throw insertError;
        }

        return { 
            count: Object.keys(studentExamGroups).length,
            updated: resultRecords.length === 0 ? Object.keys(studentExamGroups).length : 0,
            inserted: resultRecords.length
        };

    } catch (error) {
        console.error('Error uploading bulk results from CSV:', error.message);
        throw new Error(error.message || 'Failed to upload bulk results. Please check the file format.');
    }
};

/**
 * Fetches all unique results by student (grouped by roll_no and class_code)
 * @returns {Promise<Array<object>>} Array of unique result objects
 */
export const getUniqueStudentResults = async () => {
    try {
        const { data, error } = await supabase
            .from('results')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Group results by roll number and class code to show unique students
        const uniqueStudents = [];
        const seen = new Set();

        if (data) {
            data.forEach(result => {
                const key = `${result.roll_no}-${result.class_code}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    uniqueStudents.push(result);
                }
            });
        }

        return uniqueStudents || [];
    } catch (error) {
        console.error('Error fetching unique results:', error.message);
        throw new Error('Failed to fetch unique results. Please try again.');
    }
};

/**
 * Fetches classes with results for a specific session
 * @param {string} sessionFilter - Session filter (current, all, or specific session)
 * @returns {Promise<Array<object>>} Array of class objects with student counts
 */
export const getClassesWithResults = async (sessionFilter = 'current') => {
    try {
        let query = supabase
            .from('results')
            .select('class_code, class');

        // Apply session filter if needed
        if (sessionFilter !== 'all') {
            // For now, we'll handle basic filtering. More complex session logic can be added later
            // This assumes results have session information or we filter by creation date
        }

        const { data, error } = await query;

        if (error) throw error;

        // Group by class and count unique students
        const classGroups = {};
        if (data) {
            data.forEach(result => {
                const classCode = result.class_code;
                const className = result.class;
                const key = `${classCode}-${className}`;
                
                if (!classGroups[key]) {
                    classGroups[key] = {
                        class_code: classCode,
                        class: className,
                        student_count: 0,
                        students: new Set()
                    };
                }
                
                // Count unique students by roll number
                const studentKey = `${result.roll_no}`;
                if (!classGroups[key].students.has(studentKey)) {
                    classGroups[key].students.add(studentKey);
                    classGroups[key].student_count++;
                }
            });
        }

        // Convert to array and sort by class number
        const classesWithResults = Object.values(classGroups)
            .map(({ students, ...classInfo }) => classInfo)
            .sort((a, b) => {
                // Extract numeric part for proper sorting
                const aNum = parseInt(a.class.replace(/\D/g, '')) || 0;
                const bNum = parseInt(b.class.replace(/\D/g, '')) || 0;
                return aNum - bNum;
            });

        return classesWithResults;
    } catch (error) {
        console.error('Error fetching classes with results:', error.message);
        throw new Error('Failed to fetch classes with results. Please try again.');
    }
};

/**
 * Fetches students with results for a specific class
 * @param {string} classCode - Class code to filter by
 * @param {number} page - Page number for pagination
 * @param {number} limit - Number of students per page
 * @param {string} search - Search term for student names or roll numbers
 * @param {string} sortBy - Sort field (roll_no, student_name)
 * @param {string} sortOrder - Sort order (asc, desc)
 * @returns {Promise<object>} Object with students array and total count
 */
export const getStudentsWithResultsByClass = async (
    classCode, 
    page = 1, 
    limit = 20, 
    search = '', 
    sortBy = 'roll_no', 
    sortOrder = 'asc'
) => {
    try {
        // Calculate offset for pagination
        const offset = (page - 1) * limit;

        let query = supabase
            .from('results')
            .select('roll_no, student_name, class_code, class, result_status, grade', { count: 'exact' })
            .eq('class_code', classCode);

        // Apply search filter
        if (search) {
            query = query.or(`roll_no.ilike.%${search}%,student_name.ilike.%${search}%`);
        }

        // Apply sorting
        const ascending = sortOrder === 'asc';
        query = query.order(sortBy, { ascending });

        // Apply pagination
        query = query.range(offset, offset + limit - 1);

        const { data, error, count } = await query;

        if (error) throw error;

        // Get unique students with their latest result status and grade
        const uniqueStudents = [];
        const seen = new Set();

        if (data) {
            data.forEach(result => {
                const key = `${result.roll_no}-${result.student_name}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    uniqueStudents.push({
                        roll_no: result.roll_no,
                        student_name: result.student_name,
                        class_code: result.class_code,
                        class: result.class,
                        result_status: result.result_status,
                        grade: result.grade
                    });
                }
            });
        }

        return {
            students: uniqueStudents,
            totalCount: count || 0,
            currentPage: page,
            totalPages: Math.ceil((count || 0) / limit)
        };
    } catch (error) {
        console.error('Error fetching students by class:', error.message);
        throw new Error('Failed to fetch students. Please try again.');
    }
};

/**
 * Fetches available sessions from results
 * @returns {Promise<Array<object>>} Array of session options
 */
export const getAvailableSessions = async () => {
    try {
        // For now, return basic session options
        // This can be enhanced to extract actual session data from results
        const sessions = [
            { value: 'current', label: 'Current Session' },
            { value: 'all', label: 'All Sessions' }
        ];

        // You can extend this to query actual session data from the database
        // based on result creation dates or session information in results

        return sessions;
    } catch (error) {
        console.error('Error fetching available sessions:', error.message);
        throw new Error('Failed to fetch sessions. Please try again.');
    }
};