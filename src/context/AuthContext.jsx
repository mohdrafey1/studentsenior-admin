import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for existing auth data on mount
        const savedToken = localStorage.getItem('admin_token');
        const savedUser = localStorage.getItem('admin_user');

        if (savedToken && savedUser) {
            setToken(savedToken);
            try {
                setUser(JSON.parse(savedUser));
            } catch (error) {
                console.error('Error parsing saved user data:', error);
                localStorage.removeItem('admin_user');
                localStorage.removeItem('admin_token');
            }
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            setLoading(true);
            const response = await authAPI.signin({ email, password });

            if (response.data.success) {
                const { token: newToken, user: userData } = response.data.data;

                setToken(newToken);
                setUser(userData);
                localStorage.setItem('admin_token', newToken);
                localStorage.setItem('admin_user', JSON.stringify(userData));
            } else {
                throw new Error(response.data.message || 'Login failed');
            }
        } catch (error) {
            const errorMessage =
                error.response?.data?.message ||
                error.message ||
                'Login failed';
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const signup = async (userData) => {
        try {
            setLoading(true);
            const response = await authAPI.signup(userData);

            if (response.data.success) {
                const { token: newToken, user: newUser } = response.data.data;

                setToken(newToken);
                setUser(newUser);
                localStorage.setItem('admin_token', newToken);
                localStorage.setItem('admin_user', JSON.stringify(newUser));
            } else {
                throw new Error(response.data.message || 'Signup failed');
            }
        } catch (error) {
            const errorMessage =
                error.response?.data?.message ||
                error.message ||
                'Signup failed';
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
    };

    const value = {
        user,
        token,
        loading,
        login,
        signup,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
};
