import React, { createContext, useState, useContext, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

interface User {
    id: number;
    username: string;
    role: string;
}

interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    login: (token: string, remember: boolean) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<User | null>(null);

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
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
            const decoded = jwtDecode<User>(token);
            setUser(decoded);
            setIsAuthenticated(true);
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
                localStorage.removeItem('token');
                sessionStorage.removeItem('token');
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
        <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
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
