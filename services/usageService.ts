import { AiUsage } from '../types';

const AI_USAGE_KEY = 'sudi_ai_usage';
const USAGE_LIMIT = 10;
const RESET_PERIOD = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface StoredUsage {
    count: number;
    resetTimestamp: number;
}

/**
 * Retrieves the current AI usage statistics from localStorage.
 * It automatically handles resetting the count if the 24-hour period has elapsed.
 * @returns {AiUsage} An object containing the current count, limit, and whether the limit is exceeded.
 */
export const getAiUsage = (): AiUsage => {
    const storedData = localStorage.getItem(AI_USAGE_KEY);
    let usage: StoredUsage;

    if (storedData) {
        usage = JSON.parse(storedData);
        // Check if the reset period has passed
        if (Date.now() > usage.resetTimestamp) {
            const now = new Date();
            const nextMidnight = new Date(now);
            nextMidnight.setDate(now.getDate() + 1);
            nextMidnight.setHours(0, 0, 0, 0); // Set to 00:00:00.000 of the next day

            usage = {
                count: 0,
                resetTimestamp: nextMidnight.getTime(),
            };
            localStorage.setItem(AI_USAGE_KEY, JSON.stringify(usage));
        }
    } else {
        // Initialize for a new user
        const now = new Date();
        const nextMidnight = new Date(now);
        nextMidnight.setDate(now.getDate() + 1);
        nextMidnight.setHours(0, 0, 0, 0); // Set to 00:00:00.000 of the next day

        usage = {
            count: 0,
            resetTimestamp: nextMidnight.getTime(),
        };
        localStorage.setItem(AI_USAGE_KEY, JSON.stringify(usage));
    }

    return {
        count: usage.count,
        limit: USAGE_LIMIT,
        isExceeded: usage.count >= USAGE_LIMIT,
        resetTimestamp: usage.resetTimestamp,
    };
};

/**
 * Records a single use of an AI feature.
 * It increments the usage count if the limit has not been exceeded.
 * This should be called *before* making an AI API call.
 * @returns {boolean} True if the usage was successfully recorded, false if the limit was already exceeded.
 */
export const recordAiUsage = (): boolean => {
    const currentUsage = getAiUsage();

    if (currentUsage.isExceeded) {
        return false; // Cannot record usage if already exceeded
    }

    const newUsage: StoredUsage = {
        count: currentUsage.count + 1,
        // The resetTimestamp is not changed here, only the count
        resetTimestamp: JSON.parse(localStorage.getItem(AI_USAGE_KEY)!).resetTimestamp,
    };

    localStorage.setItem(AI_USAGE_KEY, JSON.stringify(newUsage));
    return true;
};