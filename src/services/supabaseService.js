import { createClient } from '@supabase/supabase-js';
import { clearAdminSession } from '../utils/sessionManager';

// Create a single supabase client for interacting with your database
const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Simple cache implementation for analytics data
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getCachedData = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
};

const setCachedData = (key, data) => {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
  
  // Clean up old cache entries periodically
  if (cache.size > 50) {
    const now = Date.now();
    for (const [cacheKey, cacheValue] of cache.entries()) {
      if (now - cacheValue.timestamp > CACHE_TTL * 2) {
        cache.delete(cacheKey);
      }
    }
  }
};

// --- Authentication Functions ---

/**
 * Logs in an admin user.
 * @param {string} email - Admin's email.
 * @param {string} password - Admin's password.
 * @returns {Promise<object>} Response object with user data or error.
 */
export const adminLogin = async (email, password) => {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;

        return data;
    } catch (error) {
        console.error("Admin login error:", error.message);
        throw error;
    }
};

/**
 * Logs out the current user.
 * @returns {Promise<object>} Response object.
 */
export const adminLogout = async () => {
    try {
        // Clear custom admin session
        clearAdminSession();
        
        // Sign out from Supabase
        const { error } = await supabase.auth.signOut();

        if (error) throw error;

        return { success: true };
    } catch (error) {
        console.error("Admin logout error:", error.message);
        throw error;
    }
};

// --- Database Functions ---

/**
 * Submits a contact form entry to the database.
 * @param {object} formData - Data from the contact form.
 * @returns {Promise<object>} Response object with inserted data or error.
 */
export const submitContactForm = async (formData) => {
    try {
        const { data, error } = await supabase
            .from('contact_forms')
            .insert([
                {
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    subject: formData.subject,
                    message: formData.message,
                    submitted_at: new Date().toISOString()
                }
            ])
            .select();

        if (error) throw error;

        return data[0];
    } catch (error) {
        console.error("Error submitting contact form:", error.message);
        throw error;
    }
};

/**
 * Submits an admission enquiry to the database.
 * @param {object} enquiryData - Data from the admission form.
 * @returns {Promise<object>} Response object with inserted data or error.
 */
export const submitAdmissionEnquiry = async (enquiryData) => {
    try {

        const { data, error } = await supabase
            .from('admission_enquiries')
            .insert([
                {
                    student_name: enquiryData.studentName || 'Not provided',
                    parent_name: enquiryData.parentName || 'Not provided',
                    email: enquiryData.email || 'No email provided',
                    phone: enquiryData.phone || 'Not provided',
                    class_interested: enquiryData.classInterested || 'Not specified',
                    message: enquiryData.message || 'No message provided',
                    submitted_at: new Date().toISOString()
                }
            ])
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error("Error submitting admission enquiry:", error.message);
        throw error;
    }
};

/**
 * Submits a newsletter subscription email.
 * @param {string} email - Email address to subscribe.
 * @returns {Promise<object>} Response object with inserted data or error.
 */
export const submitNewsletterSubscription = async (email) => {
    try {
        const { data, error } = await supabase
            .from('newsletter_subscriptions')
            .insert([
                {
                    email: email,
                    subscribed_at: new Date().toISOString()
                }
            ])
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error("Error submitting newsletter subscription:", error.message);
        throw error;
    }
};

/**
 * Fetches all contact form submissions.
 * @returns {Promise<Array<object>>} Array of contact form objects.
 */
export const getContactForms = async () => {
    try {

        // Try to fetch with common column variations
        let { data, error } = await supabase
            .from('contact_forms')
            .select('*');

        // If we get a column error, try to fetch with '*' only
        if (error && error.message.includes('column')) {
            console.warn('Column error detected in contact_forms, trying alternative query');
            ({ data, error } = await supabase
                .from('contact_forms')
                .select('*'));
        }

        // Sort data manually if we can't sort in the query
        if (data) {
            // Try different possible date column names
            const dateColumns = ['submitted_at', 'created_at', 'date'];
            const dateColumn = dateColumns.find(col => data.length > 0 && col in data[0]) || 'submitted_at';

            data.sort((a, b) => {
                const dateA = new Date(a[dateColumn]);
                const dateB = new Date(b[dateColumn]);
                return dateB - dateA; // Descending order
            });
        }

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error("Error fetching contact forms:", error.message);
        throw error;
    }
};

/**
 * Fetches all admission enquiries.
 * @returns {Promise<Array<object>>} Array of admission enquiry objects.
 */
export const getAdmissionEnquiries = async () => {
    try {

        // Try to fetch with common column variations
        let { data, error } = await supabase
            .from('admission_enquiries')
            .select('*');

        // If we get a column error, try to fetch with '*' only
        if (error && error.message.includes('column')) {
            console.warn('Column error detected in admission_enquiries, trying alternative query');
            ({ data, error } = await supabase
                .from('admission_enquiries')
                .select('*'));
        }

        // Sort data manually if we can't sort in the query
        if (data) {
            // Try different possible date column names
            const dateColumns = ['submitted_at', 'created_at', 'date'];
            const dateColumn = dateColumns.find(col => data.length > 0 && col in data[0]) || 'submitted_at';

            data.sort((a, b) => {
                const dateA = new Date(a[dateColumn]);
                const dateB = new Date(b[dateColumn]);
                return dateB - dateA; // Descending order
            });
        }

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error("Error fetching admission enquiries:", error.message);
        throw error;
    }
};

/**
 * Fetches all newsletter subscriptions.
 * @returns {Promise<Array<object>>} Array of newsletter subscription objects.
 */
export const getNewsletterSubscriptions = async () => {
    try {

        // Try to fetch with common column variations
        let { data, error } = await supabase
            .from('newsletter_subscriptions')
            .select('*');

        // If we get a column error, try to fetch with '*' only
        if (error && error.message.includes('column')) {
            console.warn('Column error detected in newsletter_subscriptions, trying alternative query');
            ({ data, error } = await supabase
                .from('newsletter_subscriptions')
                .select('*'));
        }

        // Sort data manually if we can't sort in the query
        if (data) {
            // Try different possible date column names
            const dateColumns = ['subscribed_at', 'created_at', 'date'];
            const dateColumn = dateColumns.find(col => data.length > 0 && col in data[0]) || 'subscribed_at';

            data.sort((a, b) => {
                const dateA = new Date(a[dateColumn]);
                const dateB = new Date(b[dateColumn]);
                return dateB - dateA; // Descending order
            });
        }

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error("Error fetching newsletter subscriptions:", error.message);
        throw error;
    }
};

/**
 * Fetches all staff members.
 * @returns {Promise<Array<object>>} Array of staff member objects.
 */
export const getStaffMembers = async () => {
    try {

        // Try to fetch with common column variations
        let { data, error } = await supabase
            .from('staff')
            .select('*');

        // If we get a column error, try to fetch with '*' only
        if (error && error.message.includes('column')) {
            console.warn('Column error detected in staff, trying alternative query');
            ({ data, error } = await supabase
                .from('staff')
                .select('*'));
        }

        // Sort data manually if we can't sort in the query
        if (data) {
            // Try different possible name column names
            const nameColumns = ['name', 'full_name', 'staff_name'];
            const nameColumn = nameColumns.find(col => data.length > 0 && col in data[0]) || 'name';

            data.sort((a, b) => {
                return (a[nameColumn] || '').localeCompare(b[nameColumn] || '');
            });
        }

        if (error) {
            // Provide more user-friendly error messages for common issues
            if (error.message && error.message.includes('row-level security')) {
                throw new Error('You do not have permission to view staff members. Please contact your administrator.');
            } else if (error.message && error.message.includes('403')) {
                throw new Error('Access denied. Please check your authentication and permissions.');
            }
            throw error;
        }
        return data || [];
    } catch (error) {
        console.error("Error fetching staff members:", error.message);
        // Re-throw with more context if it's a permission issue
        if (error.message && (error.message.includes('row-level security') || error.message.includes('403'))) {
            throw error;
        }
        throw new Error(`Failed to fetch staff members: ${error.message}`);
    }
};

/**
 * Adds a new staff member.
 * @param {object} staffData - Data for the new staff member.
 * @returns {Promise<object>} Response object with inserted data or error.
 */
export const addStaffMember = async (staffData) => {
    try {
        // Map staff data to handle potential column name variations
        const staffToInsert = {
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        // Handle different possible column names
        if ('name' in staffData) staffToInsert.name = staffData.name;
        else if ('full_name' in staffData) staffToInsert.full_name = staffData.full_name;
        else if ('staff_name' in staffData) staffToInsert.staff_name = staffData.staff_name;

        if ('role' in staffData) staffToInsert.role = staffData.role;
        if ('qualification' in staffData) staffToInsert.qualification = staffData.qualification;
        if ('contact' in staffData) staffToInsert.contact = staffData.contact;
        if ('email' in staffData) staffToInsert.email = staffData.email;
        if ('image_url' in staffData) staffToInsert.image_url = staffData.image_url;
        else if ('image' in staffData) staffToInsert.image_url = staffData.image;
        if ('status' in staffData) staffToInsert.status = staffData.status;

        const { data, error } = await supabase
            .from('staff')
            .insert([staffToInsert])
            .select();

        if (error) {
            // Provide more user-friendly error messages for common issues
            if (error.message && error.message.includes('row-level security')) {
                throw new Error('You do not have permission to add staff members. Please contact your administrator.');
            } else if (error.message && error.message.includes('403')) {
                throw new Error('Access denied. Please check your authentication and permissions.');
            }
            throw error;
        }
        return data[0];
    } catch (error) {
        console.error("Error adding staff member:", error.message);
        throw error;
    }
};

/**
 * Updates an existing staff member.
 * @param {number} id - ID of the staff member to update.
 * @param {object} staffData - Updated data for the staff member.
 * @returns {Promise<object>} Response object with updated data or error.
 */
export const updateStaffMember = async (id, staffData) => {
    try {
        // Map staff data to handle potential column name variations
        const staffToUpdate = {
            updated_at: new Date().toISOString()
        };

        // Handle different possible column names
        if ('name' in staffData) staffToUpdate.name = staffData.name;
        else if ('full_name' in staffData) staffToUpdate.full_name = staffData.full_name;
        else if ('staff_name' in staffData) staffToUpdate.staff_name = staffData.staff_name;

        if ('role' in staffData) staffToUpdate.role = staffData.role;
        if ('qualification' in staffData) staffToUpdate.qualification = staffData.qualification;
        if ('contact' in staffData) staffToUpdate.contact = staffData.contact;
        if ('email' in staffData) staffToUpdate.email = staffData.email;
        if ('image_url' in staffData) staffToUpdate.image_url = staffData.image_url || '/logo.png';
        else if ('image' in staffData) staffToUpdate.image_url = staffData.image || '/logo.png';
        if ('status' in staffData) staffToUpdate.status = staffData.status;

        const { data, error } = await supabase
            .from('staff')
            .update(staffToUpdate)
            .eq('id', id)
            .select();

        if (error) {
            // Provide more user-friendly error messages for common issues
            if (error.message && error.message.includes('row-level security')) {
                throw new Error('You do not have permission to update staff members. Please contact your administrator.');
            } else if (error.message && error.message.includes('403')) {
                throw new Error('Access denied. Please check your authentication and permissions.');
            }
            throw error;
        }
        return data[0];
    } catch (error) {
        console.error("Error updating staff member:", error.message);
        throw error;
    }
};

/**
 * Deletes a staff member.
 * @param {number} id - ID of the staff member to delete.
 * @returns {Promise<object>} Response object.
 */
export const deleteStaffMember = async (id) => {
    try {
        // Try to delete with error handling
        const { error } = await supabase
            .from('staff')
            .delete()
            .eq('id', id);

        // If we get a column error, it might be due to schema issues
        if (error && error.message.includes('column')) {
            console.warn('Column error detected in staff delete, trying alternative approach');
            // Try a more generic delete approach
            const { error: altError } = await supabase
                .from('staff')
                .delete()
                .eq('id', id);
            if (altError) throw altError;
        }

        if (error) {
            // Provide more user-friendly error messages for common issues
            if (error.message && error.message.includes('row-level security')) {
                throw new Error('You do not have permission to delete staff members. Please contact your administrator.');
            } else if (error.message && error.message.includes('403')) {
                throw new Error('Access denied. Please check your authentication and permissions.');
            }
            throw error;
        }
        return { success: true };
    } catch (error) {
        console.error("Error deleting staff member:", error.message);
        throw error;
    }
};

/**
 * Fetches gallery images grouped by category.
 * @returns {Promise<Array<object>>} Array of gallery category objects with images.
 */
export const getGalleryImages = async () => {
    try {

        const { data, error } = await supabase
            .from('gallery')
            .select('*')
            .order('uploaded_at', { ascending: false });

        if (error) throw error;

        // Group images by category
        const categories = {};
        data.forEach(image => {
            if (!categories[image.category]) {
                categories[image.category] = {
                    category: image.category,
                    images: []
                };
            }

            categories[image.category].images.push({
                id: image.id,
                url: image.image_url,
                uploadedAt: image.uploaded_at
            });
        });

        const result = Object.values(categories);
        return result;
    } catch (error) {
        console.error("Error fetching gallery images:", error.message);
        throw error;
    }
};

/**
 * Adds a gallery image.
 * @param {object} imageData - Image data to add.
 * @returns {Promise<object>} Response object with inserted data or error.
 */
export const addGalleryImage = async (imageData) => {
    try {
        // Use the actual column names that exist in the database
        const imageRecord = {
            category: imageData.category,
            image_url: imageData.url,
            uploaded_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('gallery')
            .insert([imageRecord])
            .select();

        if (error) throw error;

        return data[0];
    } catch (error) {
        console.error("Error adding gallery image:", error.message);
        throw error;
    }
};

/**
 * Removes a gallery image.
 * @param {number} id - ID of the image to remove.
 * @returns {Promise<object>} Response object.
 */
export const removeGalleryImage = async (id) => {
    try {
        const { error } = await supabase
            .from('gallery')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error("Error removing gallery image:", error.message);
        throw error;
    }
};

/**
 * Fetches all fee structure records.
 * @returns {Promise<Array<object>>} Array of fee structure objects.
 */
export const getFeeStructure = async () => {
    try {
        let { data, error } = await supabase
            .from('fee_structure')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error("Error fetching fee structure:", error.message);
        throw error;
    }
};

/**
 * Adds a new fee structure record.
 * @param {object} feeData - Data for the new fee structure record.
 * @returns {Promise<object>} Response object with inserted data or error.
 */
export const addFeeStructure = async (feeData) => {
    try {
        const feeToInsert = {
            class_name: feeData.className,
            admission_fee: feeData.admissionFee || 0,
            annual_fee: feeData.annualFee || 0,
            monthly_fee: feeData.monthlyFee || 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('fee_structure')
            .insert([feeToInsert])
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error("Error adding fee structure:", error.message);
        throw error;
    }
};

/**
 * Updates an existing fee structure record.
 * @param {number} id - ID of the fee structure record to update.
 * @param {object} feeData - Updated data for the fee structure record.
 * @returns {Promise<object>} Response object with updated data or error.
 */
export const updateFeeStructure = async (id, feeData) => {
    try {
        const feeToUpdate = {
            class_name: feeData.className,
            admission_fee: feeData.admissionFee || 0,
            annual_fee: feeData.annualFee || 0,
            monthly_fee: feeData.monthlyFee || 0,
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('fee_structure')
            .update(feeToUpdate)
            .eq('id', id)
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error("Error updating fee structure:", error.message);
        throw error;
    }
};

/**
 * Deletes a fee structure record.
 * @param {number} id - ID of the fee structure record to delete.
 * @returns {Promise<object>} Response object.
 */
export const deleteFeeStructure = async (id) => {
    try {
        const { error } = await supabase
            .from('fee_structure')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error("Error deleting fee structure:", error.message);
        throw error;
    }
};

/**
 * Fetches all important dates records.
 * @returns {Promise<Array<object>>} Array of important dates objects.
 */
export const getImportantDates = async () => {
    try {
        let { data, error } = await supabase
            .from('important_dates')
            .select('*')
            .order('start_date', { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error("Error fetching important dates:", error.message);
        throw error;
    }
};

/**
 * Adds a new important date record.
 * @param {object} dateData - Data for the new important date record.
 * @returns {Promise<object>} Response object with inserted data or error.
 */
export const addImportantDate = async (dateData) => {
    try {
        const dateToInsert = {
            event_name: dateData.eventName,
            start_date: dateData.startDate,
            end_date: dateData.endDate || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('important_dates')
            .insert([dateToInsert])
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error("Error adding important date:", error.message);
        throw error;
    }
};

/**
 * Updates an existing important date record.
 * @param {number} id - ID of the important date record to update.
 * @param {object} dateData - Updated data for the important date record.
 * @returns {Promise<object>} Response object with updated data or error.
 */
export const updateImportantDate = async (id, dateData) => {
    try {
        const dateToUpdate = {
            event_name: dateData.eventName,
            start_date: dateData.startDate,
            end_date: dateData.endDate || null,
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('important_dates')
            .update(dateToUpdate)
            .eq('id', id)
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error("Error updating important date:", error.message);
        throw error;
    }
};

/**
 * Deletes an important date record.
 * @param {number} id - ID of the important date record to delete.
 * @returns {Promise<object>} Response object.
 */
export const deleteImportantDate = async (id) => {
    try {
        const { error } = await supabase
            .from('important_dates')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error("Error deleting important date:", error.message);
        throw error;
    }
};

/**
 * Fetches all notices.
 * @returns {Promise<Array<object>>} Array of notice objects.
 */
export const getNotices = async () => {
    try {
        let { data, error } = await supabase
            .from('notices')
            .select('*')
            .order('is_important', { ascending: false })
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error("Error fetching notices:", error.message);
        throw error;
    }
};

/**
 * Adds a new notice.
 * @param {object} noticeData - Data for the new notice.
 * @returns {Promise<object>} Response object with inserted data or error.
 */
export const addNotice = async (noticeData) => {
    try {
        const noticeToInsert = {
            title: noticeData.title,
            content: noticeData.content || null,
            link: noticeData.link || null,
            is_important: noticeData.isImportant || false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('notices')
            .insert([noticeToInsert])
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error("Error adding notice:", error.message);
        throw error;
    }
};

/**
 * Updates an existing notice.
 * @param {number} id - ID of the notice to update.
 * @param {object} noticeData - Updated data for the notice.
 * @returns {Promise<object>} Response object with updated data or error.
 */
export const updateNotice = async (id, noticeData) => {
    try {
        const noticeToUpdate = {
            title: noticeData.title,
            content: noticeData.content || null,
            link: noticeData.link || null,
            is_important: noticeData.isImportant || false,
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('notices')
            .update(noticeToUpdate)
            .eq('id', id)
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error("Error updating notice:", error.message);
        throw error;
    }
};

/**
 * Deletes a notice.
 * @param {number} id - ID of the notice to delete.
 * @returns {Promise<object>} Response object.
 */
export const deleteNotice = async (id) => {
    try {
        const { error } = await supabase
            .from('notices')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error("Error deleting notice:", error.message);
        throw error;
    }
};

/**
 * Uploads a file to Supabase Storage.
 * @param {File} file - File to upload.
 * @param {string} bucket - Storage bucket name.
 * @param {string} path - Path within the bucket.
 * @returns {Promise<object>} Response object with file URL or error.
 */
export const uploadFile = async (file, bucket = 'gallery', path = '') => {
    try {
        if (!file) {
            throw new Error('No file provided');
        }

        // Create a unique file name
        const fileName = `${Date.now()}_${file.name}`;
        const filePath = path ? `${path}/${fileName}` : fileName;

        // Upload the file
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(filePath, file);

        if (error) throw error;

        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        return {
            success: true,
            downloadURL: publicUrl,
            fileName: file.name,
            path: filePath
        };
    } catch (error) {
        console.error('Error uploading file:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Fetches update history records.
 * @param {string} tableName - Name of the table to filter by.
 * @param {number} recordId - ID of the record to filter by.
 * @returns {Promise<Array<object>>} Array of update history objects.
 */
export const getUpdateHistory = async (tableName = null, recordId = null) => {
    try {
        let query = supabase
            .from('update_history')
            .select('*')
            .order('updated_at', { ascending: false });

        if (tableName) {
            query = query.eq('table_name', tableName);
        }

        if (recordId) {
            query = query.eq('record_id', recordId);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error("Error fetching update history:", error.message);
        throw error;
    }
};

// --- Visitor Analytics Functions ---

/**
 * Records a visitor session or updates an existing one.
 * @param {object} visitorData - Visitor tracking data.
 * @returns {Promise<object>} Response object with visitor data or error.
 */
export const trackVisitor = async (visitorData = {}) => {
    try {
        // Generate or get session ID from localStorage
        let sessionId = localStorage.getItem('visitor_session_id');
        const isNewSession = !sessionId;

        // If no session ID exists, create one
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('visitor_session_id', sessionId);
        }

        // Determine page type based on current URL
        const currentPath = window.location.pathname;
        let pageType = 'other';
        
        if (currentPath === '/' || currentPath === '/home') {
            pageType = 'home';
        } else if (currentPath.includes('/result')) {
            pageType = 'result';
        } else if (currentPath.includes('/admission')) {
            pageType = 'admission';
        } else if (currentPath.includes('/contact')) {
            pageType = 'contact';
        } else if (currentPath.includes('/about')) {
            pageType = 'about';
        } else if (currentPath.includes('/gallery')) {
            pageType = 'gallery';
        } else if (currentPath.includes('/class')) {
            pageType = 'class';
        } else if (currentPath.includes('/fee')) {
            pageType = 'fee';
        }

        // Get current date and time
        const now = new Date();
        const visitDate = now.toISOString().split('T')[0]; // YYYY-MM-DD format

        // Prepare visitor data
        const visitorRecord = {
            session_id: sessionId,
            ip_address: visitorData.ipAddress || null,
            user_agent: navigator.userAgent || null,
            referrer: document.referrer || null,
            landing_page: window.location.href || null,
            page_type: pageType,
            page_views: 1,
            duration_seconds: 0,
            is_return_visitor: !isNewSession,
            visit_date: visitDate,
            visit_time: now.toISOString()
        };

        // Try to insert new visitor record
        const { data, error } = await supabase
            .from('visitor_analytics')
            .insert([visitorRecord])
            .select()
            .single();

        if (error) {
            // If it's a duplicate session ID (23505, 409, or duplicate key error), update existing record
            if (error.code === '23505' || error.status === 409 || error.message.includes('duplicate key') || error.message.includes('Conflict')) {
                // First get current values to increment them properly
                const { data: currentData, error: fetchError } = await supabase
                    .from('visitor_analytics')
                    .select('page_views, duration_seconds')
                    .eq('session_id', sessionId)
                    .single();

                if (fetchError) throw fetchError;

                const { data: updatedData, error: updateError } = await supabase
                    .from('visitor_analytics')
                    .update({
                        page_views: (currentData.page_views || 0) + 1,
                        exit_page: window.location.href,
                        duration_seconds: (currentData.duration_seconds || 0) + (visitorData.durationSeconds || 0),
                        updated_at: now.toISOString()
                    })
                    .eq('session_id', sessionId)
                    .select()
                    .single();

                if (updateError) throw updateError;
                return updatedData;
            }
            throw error;
        }

        return data;
    } catch (error) {
        console.error("Error tracking visitor:", error.message);
        // Don't throw error for visitor tracking to avoid breaking user experience
        return null;
    }
};

/**
 * Fetches visitor analytics data.
 * @param {object} options - Query options (dateRange, etc.).
 * @returns {Promise<object>} Visitor analytics data.
 */
export const getVisitorAnalytics = async (options = {}) => {
    try {
        let query = supabase
            .from('visitor_analytics')
            .select('*');

        // Apply date range filter if provided
        if (options.startDate && options.endDate) {
            query = query
                .gte('visit_date', options.startDate)
                .lte('visit_date', options.endDate);
        } else if (options.startDate) {
            query = query.gte('visit_date', options.startDate);
        } else if (options.endDate) {
            query = query.lte('visit_date', options.endDate);
        }

        // Order by visit time descending
        query = query.order('visit_time', { ascending: false });

        const { data, error } = await query;

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error("Error fetching visitor analytics:", error.message);
        // Return empty array instead of throwing to prevent UI crashes
        return [];
    }
};

/**
 * Gets visitor statistics summary.
 * @returns {Promise<object>} Visitor statistics.
 */
export const getVisitorStatistics = async () => {
    try {
        // Check cache first
        const cacheKey = 'visitor_stats';
        const cachedData = getCachedData(cacheKey);
        if (cachedData) {
            return cachedData;
        }

        const today = new Date().toISOString().split('T')[0];
        
        // Helper function to safely execute queries with fallback
        const safeQuery = async (queryFn) => {
            try {
                const result = await queryFn();
                return { data: result.data, error: null };
            } catch (error) {
                console.warn('Query failed, using empty fallback:', error.message);
                return { data: [], error: error };
            }
        };
        
        // Get total visitors
        const { data: totalData, error: totalError } = await safeQuery(async () => {
            return await supabase
                .from('visitor_analytics')
                .select('session_id')
                .eq('is_return_visitor', false);
        });

        // Get today's visitors
        const { data: todayData, error: todayError } = await safeQuery(async () => {
            return await supabase
                .from('visitor_analytics')
                .select('session_id')
                .eq('visit_date', today)
                .eq('is_return_visitor', false);
        });

        // Get return visitors
        const { data: returnData, error: returnError } = await safeQuery(async () => {
            return await supabase
                .from('visitor_analytics')
                .select('session_id')
                .eq('is_return_visitor', true);
        });

        // Get daily visitor counts for the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const startDate = thirtyDaysAgo.toISOString().split('T')[0];

        const { data: dailyData, error: dailyError } = await safeQuery(async () => {
            return await supabase
                .from('visitor_analytics')
                .select('visit_date, session_id, is_return_visitor')
                .gte('visit_date', startDate)
                .order('visit_date', { ascending: true });
        });

        // Get page-specific data
        const { data: pageData, error: pageError } = await safeQuery(async () => {
            return await supabase
                .from('visitor_analytics')
                .select('page_type, session_id, visit_date')
                .gte('visit_date', startDate)
                .order('visit_date', { ascending: true });
        });

        // Log errors for debugging but don't fail the entire function
        if (totalError || todayError || returnError || dailyError || pageError) {
            console.warn('Some visitor statistics queries failed, using available data');
        }

        // Process daily data for chart with cumulative totals
        const dailyStats = {};
        const cumulativeStats = {
            totalVisitors: 0,
            newVisitors: 0,
            returnVisitors: 0
        };
        
        if (dailyData) {
            dailyData.forEach(visit => {
                if (!dailyStats[visit.visit_date]) {
                    dailyStats[visit.visit_date] = {
                        date: visit.visit_date,
                        totalVisitors: 0,
                        newVisitors: 0,
                        returnVisitors: 0
                    };
                }
                
                dailyStats[visit.visit_date].totalVisitors++;
                if (visit.is_return_visitor) {
                    dailyStats[visit.visit_date].returnVisitors++;
                } else {
                    dailyStats[visit.visit_date].newVisitors++;
                }
            });
        }

        // Convert to array and calculate cumulative values
        const dailyStatsArray = Object.values(dailyStats);
        dailyStatsArray.forEach((day, index) => {
            if (index === 0) {
                cumulativeStats.totalVisitors = day.totalVisitors;
                cumulativeStats.newVisitors = day.newVisitors;
                cumulativeStats.returnVisitors = day.returnVisitors;
            } else {
                cumulativeStats.totalVisitors += day.totalVisitors;
                cumulativeStats.newVisitors += day.newVisitors;
                cumulativeStats.returnVisitors += day.returnVisitors;
            }
            
            // Update with cumulative values
            day.cumulativeTotalVisitors = cumulativeStats.totalVisitors;
            day.cumulativeNewVisitors = cumulativeStats.newVisitors;
            day.cumulativeReturnVisitors = cumulativeStats.returnVisitors;
        });

        // Process page-specific data
        const pageStats = {};
        if (pageData) {
            pageData.forEach(visit => {
                if (!pageStats[visit.page_type]) {
                    pageStats[visit.page_type] = new Set();
                }
                pageStats[visit.page_type].add(visit.session_id);
            });
        }

        const pageVisitors = {};
        Object.keys(pageStats).forEach(pageType => {
            pageVisitors[pageType] = pageStats[pageType].size;
        });

        const result = {
            totalVisitors: new Set(totalData?.map(d => d.session_id) || []).size,
            todayVisitors: new Set(todayData?.map(d => d.session_id) || []).size,
            returnVisitors: new Set(returnData?.map(d => d.session_id) || []).size,
            newVisitors: (new Set(totalData?.map(d => d.session_id) || []).size) - (new Set(returnData?.map(d => d.session_id) || []).size),
            dailyStats: dailyStatsArray,
            pageVisitors: pageVisitors
        };

        // Cache the result
        setCachedData(cacheKey, result);
        
        return result;
    } catch (error) {
        console.error("Error getting visitor statistics:", error.message);
        throw error;
    }
};

// Export supabase client for use elsewhere
export { supabase };