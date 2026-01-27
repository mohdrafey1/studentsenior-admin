import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Menu,
    X,
    LogOut,
    BarChart3,
    GraduationCap,
    Home,
    Sun,
    Moon,
    BarChart2,
    Bell,
    CheckSquare,
} from 'lucide-react';

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const { user, logout } = useAuth();
    const { toggleMobileSidebar } = useSidebar();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const toggleDarkMode = () => {
        setIsDarkMode(!isDarkMode);
        // You can implement dark mode logic here
        document.documentElement.classList.toggle('dark');
    };

    const navigationItems = [
        { path: '/dashboard', label: 'Dashboard', icon: Home },
        { path: '/reports', label: 'Reports', icon: BarChart2 },
        { path: '/analytics', label: 'Analytics', icon: BarChart3 },
        { path: '/notifications', label: 'Notifications', icon: Bell },
        { path: '/tasks', label: 'Tasks', icon: CheckSquare },
    ];

    const getRoleColor = (role) => {
        switch (role) {
            case 'Admin':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
            case 'Moderator':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    const isActivePath = (path) => {
        return (
            location.pathname === path ||
            location.pathname.startsWith(path + '/')
        );
    };

    // Check if sidebar should be shown (not on /dashboard)
    const shouldShowSidebar = location.pathname !== '/dashboard';

    return (
        <header className='bg-white dark:bg-gray-800 shadow-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40'>
            <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
                <div className='flex justify-between items-center py-4'>
                    {/* Logo and Brand */}
                    <div className='flex items-center'>
                        {/* Mobile sidebar toggle button - only show when sidebar should be visible */}
                        {shouldShowSidebar && (
                            <button
                                onClick={toggleMobileSidebar}
                                className='lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 mr-2'
                                aria-label='Toggle sidebar'
                            >
                                <Menu className='w-6 h-6' />
                            </button>
                        )}

                        <div className='flex-shrink-0 flex items-center'>
                            <GraduationCap className='h-8 w-8 text-blue-600 dark:text-blue-400' />
                            <h1 className='ml-2 text-xl sm:text-2xl font-bold text-gray-900 dark:text-white'>
                                <span className='hidden sm:inline'>
                                    SS Admin
                                </span>
                                <span className='sm:hidden'>SS Admin</span>
                            </h1>
                        </div>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className='hidden lg:flex items-center space-x-4'>
                        {navigationItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.path}
                                    onClick={() => navigate(item.path)}
                                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                        isActivePath(item.path)
                                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                            : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    <Icon className='h-4 w-4 mr-2' />
                                    {item.label}
                                </button>
                            );
                        })}
                    </nav>

                    {/* Right side - User info, theme toggle, logout */}
                    <div className='hidden lg:flex items-center space-x-4'>
                        {/* Theme Toggle */}
                        <button
                            onClick={toggleDarkMode}
                            className='p-2 rounded-md text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                        >
                            {isDarkMode ? (
                                <Sun className='h-5 w-5' />
                            ) : (
                                <Moon className='h-5 w-5' />
                            )}
                        </button>

                        {/* User Info */}
                        <div className='flex items-center space-x-3'>
                            <div className='text-right'>
                                <p className='text-sm font-medium text-gray-900 dark:text-white'>
                                    {user?.name || 'User'}
                                </p>
                                {/* <p className='text-xs text-gray-500 dark:text-gray-400'>
                                    {user?.email}
                                </p> */}
                                <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(
                                        user?.role,
                                    )}`}
                                >
                                    {user?.role}
                                </span>
                            </div>
                        </div>

                        {/* Logout Button */}
                        <button
                            onClick={handleLogout}
                            className='inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors'
                        >
                            <LogOut className='h-4 w-4 mr-2' />
                            Logout
                        </button>
                    </div>

                    {/* Mobile menu button */}
                    <div className='md:hidden'>
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className='inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500'
                        >
                            {isMenuOpen ? (
                                <X className='h-6 w-6' />
                            ) : (
                                <Menu className='h-6 w-6' />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation Menu */}
                {isMenuOpen && (
                    <div className='md:hidden'>
                        <div className='px-2 pt-2 pb-3 space-y-1 border-t border-gray-200 dark:border-gray-700'>
                            {navigationItems.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <button
                                        key={item.path}
                                        onClick={() => {
                                            navigate(item.path);
                                            setIsMenuOpen(false);
                                        }}
                                        className={`flex items-center w-full px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                            isActivePath(item.path)
                                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                                : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                                        }`}
                                    >
                                        <Icon className='h-4 w-4 mr-2' />
                                        {item.label}
                                    </button>
                                );
                            })}

                            {/* Mobile User Info */}
                            <div className='pt-4 border-t border-gray-200 dark:border-gray-700'>
                                <div className='px-3 py-2'>
                                    <p className='text-sm font-medium text-gray-900 dark:text-white'>
                                        {user?.name || 'User'}
                                    </p>
                                    <p className='text-xs text-gray-500 dark:text-gray-400'>
                                        {user?.email}
                                    </p>
                                    <span
                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${getRoleColor(
                                            user?.role,
                                        )}`}
                                    >
                                        {user?.role}
                                    </span>
                                </div>

                                <button
                                    onClick={toggleDarkMode}
                                    className='flex items-center w-full px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md'
                                >
                                    {isDarkMode ? (
                                        <>
                                            <Sun className='h-4 w-4 mr-2' />
                                            Light Mode
                                        </>
                                    ) : (
                                        <>
                                            <Moon className='h-4 w-4 mr-2' />
                                            Dark Mode
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={handleLogout}
                                    className='flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md'
                                >
                                    <LogOut className='h-4 w-4 mr-2' />
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;
