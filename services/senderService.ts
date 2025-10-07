import { SenderProfile } from '../types';

const SENDER_PROFILE_KEY = 'sudi_sender_profile';

/**
 * Retrieves sender profile from localStorage.
 * @returns {SenderProfile | null} The current sender profile or null.
 */
export const getSenderProfile = (): SenderProfile | null => {
    try {
        const profileJson = localStorage.getItem(SENDER_PROFILE_KEY);
        return profileJson ? JSON.parse(profileJson) : null;
    } catch (error) {
        console.error("Failed to parse sender profile:", error);
        return null;
    }
};

/**
 * Saves the sender profile object to localStorage.
 * @param {SenderProfile | null} profile - The profile object to save.
 */
export const saveSenderProfile = (profile: SenderProfile | null) => {
    try {
        if (profile) {
            localStorage.setItem(SENDER_PROFILE_KEY, JSON.stringify(profile));
        } else {
            localStorage.removeItem(SENDER_PROFILE_KEY);
        }
    } catch (error) {
        console.error("Failed to save sender profile:", error);
    }
};
