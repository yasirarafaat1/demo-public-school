/**
 * Session Management Utility
 * Handles admin login sessions with 24-hour expiration
 */

const SESSION_KEY = 'admin_session_data';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Creates a new admin session with 24-hour expiration
 * @param {object} userData - User data from authentication
 * @param {string} userData.email - User email
 * @param {string} userData.id - User ID
 * @param {string} userData.role - User role (optional)
 */
export const createAdminSession = (userData) => {
  const sessionData = {
    user: userData,
    loginTime: Date.now(),
    expiresAt: Date.now() + SESSION_DURATION,
    isActive: true
  };

  localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
  return sessionData;
};

/**
 * Gets the current admin session if valid and not expired
 * @returns {object|null} Session data or null if invalid/expired
 */
export const getAdminSession = () => {
  try {
    const sessionData = localStorage.getItem(SESSION_KEY);
    if (!sessionData) return null;

    const session = JSON.parse(sessionData);
    
    // Check if session is expired
    if (Date.now() > session.expiresAt) {
      clearAdminSession();
      return null;
    }

    // Check if session is marked as inactive
    if (!session.isActive) {
      clearAdminSession();
      return null;
    }

    return session;
  } catch (error) {
    console.error('Error parsing session data:', error);
    clearAdminSession();
    return null;
  }
};

/**
 * Checks if admin session is valid and not expired
 * @returns {boolean} True if session is valid
 */
export const isAdminSessionValid = () => {
  const session = getAdminSession();
  return session !== null;
};

/**
 * Updates session expiration time (extends by 24 hours)
 * @returns {object|null} Updated session data or null if no active session
 */
export const extendAdminSession = () => {
  const session = getAdminSession();
  if (!session) return null;

  session.expiresAt = Date.now() + SESSION_DURATION;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
};

/**
 * Clears the admin session (logout)
 */
export const clearAdminSession = () => {
  localStorage.removeItem(SESSION_KEY);
};

/**
 * Gets session time remaining in human-readable format
 * @returns {string|null} Time remaining or null if no session
 */
export const getSessionTimeRemaining = () => {
  const session = getAdminSession();
  if (!session) return null;

  const remaining = session.expiresAt - Date.now();
  if (remaining <= 0) return 'Expired';

  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  } else {
    return `${minutes}m remaining`;
  }
};

/**
 * Checks if session will expire soon (within 1 hour)
 * @returns {boolean} True if session expires within 1 hour
 */
export const isSessionExpiringSoon = () => {
  const session = getAdminSession();
  if (!session) return false;

  const oneHour = 60 * 60 * 1000;
  return (session.expiresAt - Date.now()) <= oneHour;
};
