/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';

const SidebarContext = createContext();

export const useSidebar = () => {
    const context = useContext(SidebarContext);
    if (!context) {
        throw new Error('useSidebar must be used within a SidebarProvider');
    }
    return context;
};

export const SidebarProvider = ({ children }) => {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    // Load collapsed state from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('ss_admin_sidebar_collapsed');
        if (saved !== null) {
            setCollapsed(saved === '1');
        }
    }, []);

    // Save collapsed state to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem(
            'ss_admin_sidebar_collapsed',
            collapsed ? '1' : '0',
        );
    }, [collapsed]);

    const toggleSidebar = () => {
        setCollapsed((prev) => !prev);
    };

    const toggleMobileSidebar = () => {
        setMobileOpen((prev) => !prev);
    };

    const closeMobileSidebar = () => {
        setMobileOpen(false);
    };

    const value = {
        collapsed,
        setCollapsed,
        toggleSidebar,
        mobileOpen,
        setMobileOpen,
        toggleMobileSidebar,
        closeMobileSidebar,
    };

    return (
        <SidebarContext.Provider value={value}>
            {children}
        </SidebarContext.Provider>
    );
};
