import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export type UserRole = 'student' | 'recruiter' | 'admin';

export interface User {
    _id: string;
    name: string;
    email: string;
    role: UserRole;
    avatarUrl?: string;
    company?: string; // For recruiters
    isProfileComplete?: boolean;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    role: UserRole | null;
    login: (token: string, userData: User) => void;
    logout: () => void;
    updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'evolved_token';
const USER_KEY = 'evolved_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Initialize auth state from localStorage
    useEffect(() => {
        const storedToken = localStorage.getItem(TOKEN_KEY);
        const storedUser = localStorage.getItem(USER_KEY);

        if (storedToken && storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setToken(storedToken);
                setUser(parsedUser);
            } catch {
                // Invalid stored data, clear it
                localStorage.removeItem(TOKEN_KEY);
                localStorage.removeItem(USER_KEY);
            }
        }
        setIsLoading(false);
    }, []);

    const login = useCallback((newToken: string, userData: User) => {
        localStorage.setItem(TOKEN_KEY, newToken);
        localStorage.setItem(USER_KEY, JSON.stringify(userData));
        setToken(newToken);
        setUser(userData);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        // Also clear legacy keys if any
        localStorage.removeItem('authToken');
        localStorage.removeItem('studentData');
        localStorage.removeItem('recruiterData');
        localStorage.removeItem('adminData');
        setToken(null);
        setUser(null);
    }, []);

    const updateUser = useCallback((userData: Partial<User>) => {
        setUser(prev => {
            if (!prev) return null;
            const updated = { ...prev, ...userData };
            localStorage.setItem(USER_KEY, JSON.stringify(updated));
            return updated;
        });
    }, []);

    const value: AuthContextType = {
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        role: user?.role || null,
        login,
        logout,
        updateUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// Protected route wrapper component
export function RequireAuth({
    children,
    allowedRoles
}: {
    children: React.ReactNode;
    allowedRoles?: UserRole[];
}) {
    const { isAuthenticated, isLoading, role } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) {
                navigate('/login', { replace: true });
            } else if (allowedRoles && role && !allowedRoles.includes(role)) {
                // Redirect to appropriate dashboard based on role
                const dashboardRoutes: Record<UserRole, string> = {
                    student: '/student',
                    recruiter: '/recruiter',
                    admin: '/admin',
                };
                navigate(dashboardRoutes[role], { replace: true });
            }
        }
    }, [isAuthenticated, isLoading, role, allowedRoles, navigate]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    if (allowedRoles && role && !allowedRoles.includes(role)) {
        return null;
    }

    return <>{children}</>;
}
