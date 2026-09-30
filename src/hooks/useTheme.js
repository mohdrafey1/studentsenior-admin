import { useCallback } from 'react';
import useIsDark from './useIsDark';

const STORAGE_KEY = 'ss_admin_theme';

const readStoredTheme = () => {
    try {
        return localStorage.getItem(STORAGE_KEY);
    } catch {
        return null;
    }
};

/** Applies the saved theme to <html> before React renders, so the page never flashes. */
export const applyStoredTheme = () => {
    document.documentElement.classList.toggle(
        'dark',
        readStoredTheme() === 'dark',
    );
};

/**
 * Light/dark switch for the whole console. The `.dark` class on <html> swaps
 * the colour tokens in index.css; the choice is remembered per browser.
 */
export default function useTheme() {
    const isDark = useIsDark();

    const toggleTheme = useCallback(() => {
        const next = !document.documentElement.classList.contains('dark');
        document.documentElement.classList.toggle('dark', next);
        try {
            localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
        } catch {
            // Private mode or blocked storage: the switch still works for this visit.
        }
    }, []);

    return { isDark, toggleTheme };
}
