import { supabase } from './supabaseService';

/**
 * Fetches all classes.
 * @returns {Promise<Array<object>>} Array of class objects.
 */
export const getClasses = async () => {
    try {
        let { data, error } = await supabase
            .from('classes')
            .select('*')
            .order('class_number', { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error("Error fetching classes:", error.message);
        throw error;
    }
};

/**
 * Adds a new class.
 * @param {object} classData - Data for the new class.
 * @returns {Promise<object>} Response object with inserted data or error.
 */
export const addClass = async (classData) => {
    try {
        const classToInsert = {
            class_number: classData.classNumber,
            class_code: classData.classCode,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('classes')
            .insert([classToInsert])
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error("Error adding class:", error.message);
        throw error;
    }
};

/**
 * Updates an existing class.
 * @param {number} id - ID of the class to update.
 * @param {object} classData - Updated data for the class.
 * @returns {Promise<object>} Response object with updated data or error.
 */
export const updateClass = async (id, classData) => {
    try {
        const classToUpdate = {
            class_number: classData.classNumber,
            class_code: classData.classCode,
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('classes')
            .update(classToUpdate)
            .eq('id', id)
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error("Error updating class:", error.message);
        throw error;
    }
};

/**
 * Deletes a class.
 * @param {number} id - ID of the class to delete.
 * @returns {Promise<object>} Response object.
 */
export const deleteClass = async (id) => {
    try {
        const { error } = await supabase
            .from('classes')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error("Error deleting class:", error.message);
        throw error;
    }
};

/**
 * Fetches all sessions.
 * @returns {Promise<Array<object>>} Array of session objects.
 */
export const getSessions = async () => {
    try {
        let { data, error } = await supabase
            .from('sessions')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error("Error fetching sessions:", error.message);
        throw error;
    }
};

/**
 * Adds a new session.
 * @param {object} sessionData - Data for the new session.
 * @returns {Promise<object>} Response object with inserted data or error.
 */
export const addSession = async (sessionData) => {
    try {
        const sessionToInsert = {
            start_year: sessionData.startYear,
            start_month: sessionData.startMonth,
            end_year: sessionData.endYear,
            end_month: sessionData.endMonth,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('sessions')
            .insert([sessionToInsert])
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error("Error adding session:", error.message);
        throw error;
    }
};

/**
 * Updates an existing session.
 * @param {number} id - ID of the session to update.
 * @param {object} sessionData - Updated data for the session.
 * @returns {Promise<object>} Response object with updated data or error.
 */
export const updateSession = async (id, sessionData) => {
    try {
        const sessionToUpdate = {
            start_year: sessionData.startYear,
            start_month: sessionData.startMonth,
            end_year: sessionData.endYear,
            end_month: sessionData.endMonth,
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('sessions')
            .update(sessionToUpdate)
            .eq('id', id)
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error("Error updating session:", error.message);
        throw error;
    }
};

/**
 * Deletes a session.
 * @param {number} id - ID of the session to delete.
 * @returns {Promise<object>} Response object.
 */
export const deleteSession = async (id) => {
    try {
        const { error } = await supabase
            .from('sessions')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error("Error deleting session:", error.message);
        throw error;
    }
};

/**
 * Fetches all students.
 * @returns {Promise<Array<object>>} Array of student objects.
 */
export const getStudents = async () => {
    try {
        let { data, error } = await supabase
            .from('students')
            .select('id, student_name, father_name, mother_name, date_of_birth, mobile_number, email, registration_number, image_url, registration_datetime, created_at, updated_at, street, city_town_village, district, state, country, pin_code')
            .order('student_name', { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error("Error fetching students:", error.message);
        throw error;
    }
};

/**
 * Adds a new student.
 * @param {object} studentData - Data for the new student.
 * @returns {Promise<object>} Response object with inserted data or error.
 */
export const addStudent = async (studentData) => {
    try {
        const studentToInsert = {
            student_name: studentData.studentName,
            father_name: studentData.fatherName,
            mother_name: studentData.motherName,
            date_of_birth: studentData.dob,
            mobile_number: studentData.mobileNumber,
            email: studentData.email,
            registration_number: studentData.registrationNumber,
            image_url: studentData.imageUrl,
            street: studentData.street,
            city_town_village: studentData.cityTownVillage,
            district: studentData.district,
            state: studentData.state,
            country: studentData.country,
            pin_code: studentData.pinCode,
            registration_datetime: studentData.registrationDatetime || new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('students')
            .insert([studentToInsert])
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error("Error adding student:", error.message);
        throw error;
    }
};

/**
 * Updates an existing student.
 * @param {number} id - ID of the student to update.
 * @param {object} studentData - Updated data for the student.
 * @returns {Promise<object>} Response object with updated data or error.
 */
export const updateStudent = async (id, studentData) => {
    try {
        const studentToUpdate = {
            student_name: studentData.studentName,
            father_name: studentData.fatherName,
            mother_name: studentData.motherName,
            date_of_birth: studentData.dob,
            mobile_number: studentData.mobileNumber,
            email: studentData.email,
            registration_number: studentData.registrationNumber,
            image_url: studentData.imageUrl,
            street: studentData.street,
            city_town_village: studentData.cityTownVillage,
            district: studentData.district,
            state: studentData.state,
            country: studentData.country,
            pin_code: studentData.pinCode,
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('students')
            .update(studentToUpdate)
            .eq('id', id)
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error("Error updating student:", error.message);
        throw error;
    }
};

/**
 * Deletes a student.
 * @param {number} id - ID of the student to delete.
 * @returns {Promise<object>} Response object.
 */
export const deleteStudent = async (id) => {
    try {
        const { error } = await supabase
            .from('students')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error("Error deleting student:", error.message);
        throw error;
    }
};

/**
 * Fetches student class assignments.
 * @returns {Promise<Array<object>>} Array of student class assignment objects.
 */
export const getStudentClasses = async () => {
    try {
        let { data, error } = await supabase
            .from('student_classes')
            .select(`
        *,
        students(id, student_name, father_name, registration_number, image_url),
        classes(class_number, class_code),
        sessions(start_year, start_month, end_year, end_month)
      `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error("Error fetching student classes:", error.message);
        throw error;
    }
};

/**
 * Fetches student class assignments by student ID.
 * @param {number} studentId - ID of the student.
 * @returns {Promise<Array<object>>} Array of student class assignment objects.
 */
export const getStudentClassesByStudentId = async (studentId) => {
    try {
        let { data, error } = await supabase
            .from('student_classes')
            .select(`
        *,
        classes(class_number, class_code),
        sessions(start_year, start_month, end_year, end_month)
      `)
            .eq('student_id', studentId)
            .order('class_id', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error("Error fetching student classes by student ID:", error.message);
        throw error;
    }
};

/**
 * Fetches student information by roll number and class code.
 * @param {string} rollNumber - The roll number of the student
 * @param {string} classCode - The class code
 * @returns {Promise<object|null>} Student object with name and class info or null if not found
 */
export const getStudentByRollNumberAndClassCode = async (rollNumber, classCode) => {
    try {
        // First, get the class ID based on the class code
        const { data: classData, error: classError } = await supabase
            .from('classes')
            .select('id')
            .eq('class_code', classCode)
            .single();

        if (classError) {
            if (classError.code === 'PGRST116') {
                // Class not found
                console.log('Class not found for class code:', classCode);
                return null;
            }
            throw classError;
        }

        if (!classData) {
            console.log('No class found for class code:', classCode);
            return null;
        }

        // Now find the student assignment with the roll number and class ID
        const { data: assignmentData, error: assignmentError } = await supabase
            .from('student_classes')
            .select(`
                roll_number,
                students(
                    id,
                    student_name,
                    father_name,
                    mother_name,
                    date_of_birth,
                    registration_number
                ),
                sessions(
                    start_year,
                    start_month,
                    end_year,
                    end_month
                )
            `)
            .eq('roll_number', rollNumber)
            .eq('class_id', classData.id)
            .single();

        if (assignmentError) {
            if (assignmentError.code === 'PGRST116') {
                // Student assignment not found
                console.log('Student assignment not found for roll number:', rollNumber, 'and class ID:', classData.id);
                return null;
            }
            throw assignmentError;
        }

        if (assignmentData && assignmentData.students) {
            // Now get the class details to get the class number
            const { data: classDetails, error: classDetailsError } = await supabase
                .from('classes')
                .select('class_number')
                .eq('id', classData.id)
                .single();

            if (classDetailsError) {
                console.error('Error fetching class details:', classDetailsError);
                // We can still return the student info without class number
                return {
                    student_name: assignmentData.students.student_name,
                    father_name: assignmentData.students.father_name,
                    mother_name: assignmentData.students.mother_name,
                    date_of_birth: assignmentData.students.date_of_birth,
                    registration_number: assignmentData.students.registration_number,
                    student_id: assignmentData.students.id,
                    session: assignmentData.sessions,
                    class: classCode, // Use class code as fallback
                    class_code: classCode,
                    roll_number: assignmentData.roll_number
                };
            }

            return {
                student_name: assignmentData.students.student_name,
                father_name: assignmentData.students.father_name,
                mother_name: assignmentData.students.mother_name,
                date_of_birth: assignmentData.students.date_of_birth,
                registration_number: assignmentData.students.registration_number,
                student_id: assignmentData.students.id,
                session: assignmentData.sessions,
                class: classDetails.class_number,
                class_code: classCode,
                roll_number: assignmentData.roll_number
            };
        }

        return null;
    } catch (error) {
        console.error("Error fetching student by roll number and class code:", error.message);
        throw error;
    }
};

/**
 * Checks if a session is in the past based on its end date.
 * @param {object} session - Session object with start and end dates.
 * @returns {boolean} True if the session is in the past, false otherwise.
 */
export const isSessionInPast = (session) => {
    if (!session) return true; // If no session, consider it as past

    // Create a date object for the end of the session
    const sessionEndDate = new Date(session.end_year, session.end_month - 1, 1);
    const currentDate = new Date();

    // Set the session end date to the last day of the end month
    const lastDayOfMonth = new Date(session.end_year, session.end_month, 0);
    sessionEndDate.setDate(lastDayOfMonth.getDate());

    return sessionEndDate < currentDate;
};

/**
 * Assigns a student to a class for a session with a roll number.
 * @param {object} assignmentData - Data for the student class assignment.
 * @returns {Promise<object>} Response object with inserted data or error.
 */
export const assignStudentToClass = async (assignmentData) => {
    try {
        // Check if student is already assigned to this class/session combination
        const { data: existingAssignment, error: checkError } = await supabase
            .from('student_classes')
            .select('*')
            .eq('student_id', assignmentData.studentId)
            .eq('class_id', assignmentData.classId)
            .eq('session_id', assignmentData.sessionId)
            .single();

        if (checkError && checkError.code !== 'PGRST116') {
            // PGRST116 means no rows found, which is what we want
            throw checkError;
        }

        if (existingAssignment) {
            throw new Error('Student is already assigned to this class for this session');
        }

        const assignmentToInsert = {
            student_id: assignmentData.studentId,
            class_id: assignmentData.classId,
            session_id: assignmentData.sessionId,
            roll_number: assignmentData.rollNumber,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('student_classes')
            .insert([assignmentToInsert])
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error("Error assigning student to class:", error.message);
        throw error;
    }
};

/**
 * Updates a student class assignment.
 * @param {number} id - ID of the assignment to update.
 * @param {object} assignmentData - Updated data for the assignment.
 * @returns {Promise<object>} Response object with updated data or error.
 */
export const updateStudentClassAssignment = async (id, assignmentData) => {
    try {
        const assignmentToUpdate = {
            student_id: assignmentData.studentId,
            class_id: assignmentData.classId,
            session_id: assignmentData.sessionId,
            roll_number: assignmentData.rollNumber,
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('student_classes')
            .update(assignmentToUpdate)
            .eq('id', id)
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error("Error updating student class assignment:", error.message);
        throw error;
    }
};

/**
 * Deletes a student class assignment.
 * @param {number} id - ID of the assignment to delete.
 * @returns {Promise<object>} Response object.
 */
export const deleteStudentClassAssignment = async (id) => {
    try {
        const { error } = await supabase
            .from('student_classes')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error("Error deleting student class assignment:", error.message);
        throw error;
    }
};