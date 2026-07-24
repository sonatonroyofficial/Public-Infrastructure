import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../utils/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token'));

    useEffect(() => {
        // Check if user is logged in on mount
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            try {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
            } catch (error) {
                console.error('Error parsing stored user:', error);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
        setIsLoading(false);
    }, []);

    const login = async (email, password) => {
        const toastId = toast.loading('Logging in...');
        try {
            const response = await authAPI.login({ email, password });
            const { token, user } = response.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            setToken(token);
            setUser(user);

            toast.success(`Welcome back, ${user.name}!`, { id: toastId });
            return { success: true, user };
        } catch (error) {
            console.error('Login error:', error);
            const errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
            toast.error(errorMessage, { id: toastId });
            return {
                success: false,
                error: errorMessage
            };
        }
    };

    const googleLogin = async (firebaseIdToken) => {
        const toastId = toast.loading('Verifying Google Account...');
        try {
            const response = await authAPI.googleLogin(firebaseIdToken);
            const { token, user } = response.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            setToken(token);
            setUser(user);

            toast.success(`Welcome back, ${user.name}!`, { id: toastId });
            return { success: true, user };
        } catch (error) {
            console.error('Google Login error:', error);
            const errorMessage = error.response?.data?.message || 'Google Login failed.';
            toast.error(errorMessage, { id: toastId });
            return {
                success: false,
                error: errorMessage
            };
        }
    };

    const register = async (userData) => {
        const toastId = toast.loading('Creating account...');
        try {
            const response = await authAPI.register(userData);
            const { token, user } = response.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            setToken(token);
            setUser(user);

            toast.success('Account created successfully!', { id: toastId });
            return { success: true, user };
        } catch (error) {
            console.error('Registration error:', error);
            const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
            toast.error(errorMessage, { id: toastId });
            return {
                success: false,
                error: errorMessage
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        toast.success('Logged out successfully');
    };

    const updateUser = (updatedUser) => {
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    };

    const isAuthenticated = !!token && !!user;
    const isAdmin = user?.role === 'admin';
    const isStaff = user?.role === 'staff';
    const isCitizen = user?.role === 'citizen';
    const isPremium = user?.isPremium === true;

    const value = {
        user,
        token,
        isLoading,
        isAuthenticated,
        isAdmin,
        isStaff,
        isCitizen,
        isPremium,
        login,
        googleLogin,
        register,
        logout,
        updateUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
