/* eslint-disable react-refresh/only-export-components */
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import api from '../utils/api';

const LAST_COLLEGE_KEY = 'ss_admin_last_college';

// First URL segments that belong to the console itself, not to a college.
const RESERVED_SEGMENTS = new Set([
    'dashboard',
    'analytics', // Reserves every /analytics/* report and content resolver.
    'tasks',
    'notifications',
    'affiliate-products',
    'blog',
    'reports',
    'community',
    'users',
    'support',
    'login',
    'signup',
]);

/** The college slug in the current URL, or null on console-wide pages. */
export const collegeSlugFromPath = (pathname) => {
    const first = pathname.split('/')[1];
    return first && !RESERVED_SEGMENTS.has(first)
        ? decodeURIComponent(first)
        : null;
};

const CollegeContext = createContext(null);

/**
 * Loads the college list once for the whole console and tracks which college
 * the admin is working in: the one in the URL, or the last one they opened.
 */
export function CollegeProvider({ children }) {
    const { user } = useAuth();
    const { pathname } = useLocation();
    const [colleges, setColleges] = useState([]);
    const [loading, setLoading] = useState(false);
    const [lastSlug, setLastSlug] = useState(() => {
        try {
            return localStorage.getItem(LAST_COLLEGE_KEY);
        } catch {
            return null;
        }
    });

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get('/college');
            if (response.data.success) setColleges(response.data.data || []);
        } catch (error) {
            console.error('Error fetching colleges:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (user) refresh();
    }, [user, refresh]);

    const urlSlug = collegeSlugFromPath(pathname);

    useEffect(() => {
        if (!urlSlug) return;
        setLastSlug(urlSlug);
        try {
            localStorage.setItem(LAST_COLLEGE_KEY, urlSlug);
        } catch {
            // Storage blocked: the switcher just won't remember across visits.
        }
    }, [urlSlug]);

    const value = useMemo(() => {
        const currentSlug = urlSlug || lastSlug;
        return {
            colleges,
            loading,
            refresh,
            urlSlug,
            currentSlug,
            currentCollege:
                colleges.find((c) => c.slug === currentSlug) || null,
        };
    }, [colleges, loading, refresh, urlSlug, lastSlug]);

    return (
        <CollegeContext.Provider value={value}>
            {children}
        </CollegeContext.Provider>
    );
}

export const useColleges = () => {
    const context = useContext(CollegeContext);
    if (!context) {
        throw new Error('useColleges must be used within a CollegeProvider');
    }
    return context;
};
