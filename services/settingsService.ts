import { AppSettings } from '../types';

const SETTINGS_STORAGE_KEY = 'sudi_app_settings';

const defaultSettings: AppSettings = {
    globalHeader: `<!-- Your global header HTML goes here. It will be automatically added to the top of every email. -->
<div style="text-align: center; padding-bottom: 20px;">
    <img src="https://storage.googleapis.com/aistudio-hosting/logo_light.png" alt="Company Logo" style="max-width: 150px;">
</div>`,
    globalFooter: `<!-- Your global footer HTML goes here. It will be automatically added to the bottom of every email. -->
<div style="text-align: center; padding-top: 20px; border-top: 1px solid #e2e8f0; margin-top: 20px; font-family: sans-serif; font-size: 12px; color: #64748b;">
    <p>SUDi HQ, Persiaran Perdana, 62502 Putrajaya</p>
    <p>&copy; 2025 FELDA. All rights reserved.</p>
    <p><a href="#" style="color: #9333ea;">Unsubscribe</a> | <a href="#" style="color: #9333ea;">Privacy Policy</a></p>
</div>`
};

/**
 * Retrieves app settings from localStorage.
 * Returns default settings if none are found.
 * @returns {AppSettings} The current application settings.
 */
export const getSettings = (): AppSettings => {
    try {
        const settingsJson = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (settingsJson) {
            return { ...defaultSettings, ...JSON.parse(settingsJson) };
        }
        return defaultSettings;
    } catch (error) {
        console.error("Failed to parse app settings:", error);
        return defaultSettings;
    }
};

/**
 * Saves the entire app settings object to localStorage.
 * @param {AppSettings} settings - The settings object to save.
 */
export const saveSettings = (settings: AppSettings) => {
    try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
        console.error("Failed to save app settings:", error);
    }
};
