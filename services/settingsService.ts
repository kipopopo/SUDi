import api from './api';
import { AppSettings } from '../types';

const defaultGlobalSettings: AppSettings = {
    globalHeader: `<!-- Your global header HTML goes here. It will be automatically added to the top of every email. -->`,
    globalFooter: `<!-- Your global footer HTML goes here. It will be automatically added to the bottom of every email. -->
<div style="text-align: center; padding-top: 20px; border-top: 1px solid #e2e8f0; margin-top: 20px; font-family: sans-serif; font-size: 12px; color: #64748b;">
    <p>SUDi HQ, Persiaran Perdana, 62502 Putrajaya</p>
    <p>&copy; 2025 FELDA. All rights reserved.</p>
    <p><a href="#" style="color: #9333ea;">Unsubscribe</a> | <a href="#" style="color: #9333ea;">Privacy Policy</a></p>
</div>`
};

const defaultUserSettings: AppSettings = {
  globalHeader: '', // User-specific header, if any
  globalFooter: '', // User-specific footer, if any
};

/**
 * Retrieves user-specific app settings from the backend.
 * @returns {Promise<AppSettings>} A promise that resolves to the current user-specific application settings.
 */
export const getUserSettings = async (): Promise<AppSettings> => {
    try {
        const response = await api.get(`/user/settings`);
        return { ...defaultUserSettings, ...response.data };
    } catch (error) {
        console.error("Failed to fetch user settings from backend:", error);
        return defaultUserSettings;
    }
};

/**
 * Saves the user-specific app settings object to the backend.
 * @param {AppSettings} settings - The settings object to save.
 * @returns {Promise<AppSettings>} A promise that resolves to the saved user-specific application settings.
 */
export const saveUserSettings = async (settings: AppSettings): Promise<AppSettings> => {
    try {
        const response = await api.put(`/user/settings`, settings);
        return response.data;
    } catch (error) {
        console.error("Failed to save user settings to backend:", error);
        throw error; // Re-throw to allow calling component to handle
    }
};

/**
 * Retrieves global app settings from the backend.
 * @returns {Promise<AppSettings>} A promise that resolves to the current global application settings.
 */
export const getGlobalSettings = async (): Promise<AppSettings> => {
    try {
        const response = await api.get(`/global-settings`);
        return { ...defaultGlobalSettings, ...response.data };
    } catch (error) {
        console.error("Failed to fetch global settings from backend:", error);
        return defaultGlobalSettings;
    }
};

/**
 * Saves the global app settings object to the backend.
 * @param {AppSettings} settings - The settings object to save.
 * @returns {Promise<AppSettings>} A promise that resolves to the saved global application settings.
 */
export const saveGlobalSettings = async (settings: AppSettings): Promise<AppSettings> => {
    try {
        const response = await api.put(`/global-settings`, settings);
        return response.data;
    } catch (error) {
        console.error("Failed to save global settings to backend:", error);
        throw error; // Re-throw to allow calling component to handle
    }
};
