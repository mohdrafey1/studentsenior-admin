import { useEffect, useState } from 'react';

/**
 * Tracks the `dark` class the header toggles on <html>.
 *
 * The admin has no theme context — Header.jsx flips the class directly — so
 * components that need the boolean (rather than a `dark:` utility) observe it.
 */
export default function useIsDark() {
    const [isDark, setIsDark] = useState(
        () =>
            typeof document !== 'undefined' &&
            document.documentElement.classList.contains('dark'),
    );

    useEffect(() => {
        const root = document.documentElement;
        const observer = new MutationObserver(() =>
            setIsDark(root.classList.contains('dark')),
        );
        observer.observe(root, {
            attributes: true,
            attributeFilter: ['class'],
        });
        return () => observer.disconnect();
    }, []);

    return isDark;
}
