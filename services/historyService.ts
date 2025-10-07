import { BlastHistoryItem } from '../types';

// The key used to store the blast history in the browser's localStorage.
const HISTORY_STORAGE_KEY = 'sudi_blast_history';

// ================================================================
// NOTE FOR DEPLOYMENT OUTSIDE GOOGLE AI STUDIO
// ================================================================
// This service uses the browser's `localStorage` to persist the email
// blast history. This is for demonstration purposes only.
//
// `localStorage` has limitations:
// - It's tied to a specific browser on a specific device. The user's
//   history will not sync across devices.
// - It can be cleared by the user.
// - It has limited storage capacity.
//
// For a production application, you should replace this with a backend
// service that saves and retrieves history data from a persistent database.
// These functions (`getHistory`, `saveHistory`) would be replaced with
// API calls (e.g., `fetch('/api/history')`).
// ================================================================

/**
 * Retrieves the blast history from localStorage.
 * It safely parses the JSON data and returns an array of history items.
 * @returns {BlastHistoryItem[]} An array of blast history items, or an empty array if none exists or an error occurs.
 */
export const getHistory = (): BlastHistoryItem[] => {
  try {
    const historyJson = localStorage.getItem(HISTORY_STORAGE_KEY);
    return historyJson ? JSON.parse(historyJson) : [];
  } catch (error) {
    console.error("Failed to parse blast history:", error);
    return [];
  }
};

/**
 * Saves the entire blast history array to localStorage.
 * @param {BlastHistoryItem[]} history - The array of history items to save.
 */
export const saveHistory = (history: BlastHistoryItem[]) => {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.error("Failed to save blast history:", error);
  }
};
