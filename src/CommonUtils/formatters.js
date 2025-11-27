/**
 * Common formatting utility functions
 * These functions can be used across the application for consistent formatting
 */

/**
 * Format a date string to DD/MM/YYYY format
 * @param {string|Date} dateString - The date to format
 * @returns {string} Formatted date string or "N/A" if invalid
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "N/A";
  
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Format a date string to DD/MM/YYYY HH:MM format
 * @param {string|Date} dateString - The date to format
 * @returns {string} Formatted date-time string or "N/A" if invalid
 */
export const formatDateTimeWithTime = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "N/A";
  
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

/**
 * Convert text to camelCase
 * @param {string} text - Text to convert
 * @returns {string} camelCase text
 */
export const toCamelCase = (text) => {
  if (!text) return "";
  return text
    .toLowerCase()
    .split(/[\s_-]+/)
    .map((word, index) => 
      index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join("");
};

/**
 * Convert text to Title Case for display
 * @param {string} text - Text to convert
 * @returns {string} Title Case text
 */
export const toTitleCase = (text) => {
  if (!text) return "";
  return text
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
    .trim() // Remove leading/trailing spaces
    .split(/[\s_-]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

/**
 * Generate initials from a full name
 * @param {string} name - Full name to generate initials from
 * @returns {string} Initials (max 2 characters)
 */
export const generateInitials = (name) => {
  if (!name || name === "Unknown") return "?";
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }
  return words.slice(0, 2).map(word => word.charAt(0).toUpperCase()).join('');
};

/**
 * Truncate text to a maximum length with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} Truncated text with ellipsis if needed
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text || "";
  return text.substring(0, maxLength) + "...";
};
