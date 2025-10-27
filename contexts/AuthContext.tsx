import React, { createContext, useState, useContext, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

interface User {
    id: number;
    username: string;
    role: string;
    firstName: string;
    lastName: string;
    email: string;
}

interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    isLoading: boolean;
    login: (token: string, remember: boolean) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
            const lastActivity = sessionStorage.getItem('lastActivity');
            if (lastActivity && !localStorage.getItem('token')) {
                const diff = Date.now() - parseInt(lastActivity, 10);
                if (diff > 30 * 60 * 1000) {
                    logout();
                }
            }
        }, 60 * 1000); // Check every minute

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            if (token && typeof token === 'string' && token !== 'undefined') { // Add check for "undefined"
                const decoded = jwtDecode<User>(token);
                setUser(decoded);
                setIsAuthenticated(true);
            }
        } catch (e) {
            console.error('Error decoding token:', e);
            // Token might be invalid, so log out the user
            logout();
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const events = ['mousemove', 'keydown', 'click'];
        const handleActivity = () => {
            if (sessionStorage.getItem('token')) {
                sessionStorage.setItem('lastActivity', Date.now().toString());
            }
        };

        events.forEach(event => window.addEventListener(event, handleActivity));

        return () => {
            events.forEach(event => window.removeEventListener(event, handleActivity));
        };
    }, []);

    const login = (token: string, remember: boolean) => {
        if (token && typeof token === 'string' && token !== 'undefined') {
            if (remember) {
                localStorage.setItem('token', token);
            } else {
                sessionStorage.setItem('token', token);
                sessionStorage.setItem('lastActivity', Date.now().toString());
            }
            try {
                const decoded = jwtDecode<User>(token);
                setUser(decoded);
                setIsAuthenticated(true);
            } catch (e) {
                console.error('Invalid token in storage', e);
                logout(); // This will clear all auth state
            }
        } else {
            // Handle the case where the token is invalid
            console.error('Attempted to login with an invalid token:', token);
            logout();
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('lastActivity');
        setUser(null);
        setIsAuthenticated(false);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
