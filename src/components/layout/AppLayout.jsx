import { Suspense, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useSidebar } from '../../context/SidebarContext';
import AppSidebar from './AppSidebar';
import CommandPalette from './CommandPalette';
import TopBar from './TopBar';
import { SkeletonRows } from '../ui';

function PageFallback() {
    return (
        <div className='px-4 sm:px-10 py-8'>
            <div className='h-8 w-48 rounded-md bg-line-soft animate-pulse mb-8' />
            <div className='border border-line rounded-xl overflow-hidden'>
                <SkeletonRows rows={6} />
            </div>
        </div>
    );
}

/**
 * Shell for every signed-in page: the sidebar on the ground colour and the
 * page on a white sheet with the top bar. Pages render inside <Outlet />.
 */
export default function AppLayout() {
    const { mobileOpen, toggleMobileSidebar, closeMobileSidebar } =
        useSidebar();
    const [paletteOpen, setPaletteOpen] = useState(false);
    const { pathname } = useLocation();

    useEffect(() => {
        const onKey = (event) => {
            if (
                (event.metaKey || event.ctrlKey) &&
                event.key.toLowerCase() === 'k'
            ) {
                event.preventDefault();
                setPaletteOpen((value) => !value);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    // Close the phone drawer after navigating.
    useEffect(() => {
        closeMobileSidebar();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname]);

    return (
        <div className='min-h-screen bg-ground flex'>
            <a
                href='#page-content'
                className='sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[70] focus:px-3 focus:py-2 focus:rounded-lg focus:bg-sheet focus:text-ink focus:shadow'
            >
                Skip to content
            </a>

            <aside className='hidden md:block w-64 shrink-0 sticky top-0 h-screen'>
                <AppSidebar />
            </aside>

            {mobileOpen && (
                <div className='fixed inset-0 z-50 md:hidden'>
                    <div
                        className='absolute inset-0 bg-black/40'
                        onClick={closeMobileSidebar}
                        aria-hidden='true'
                    />
                    <aside className='relative w-72 max-w-[85vw] h-full bg-ground shadow-xl'>
                        <AppSidebar onNavigate={closeMobileSidebar} />
                    </aside>
                </div>
            )}

            <div className='flex-1 min-w-0 md:py-2 md:pr-2'>
                <div className='min-h-screen md:min-h-[calc(100vh-16px)] bg-sheet md:border md:border-line md:rounded-[14px] flex flex-col'>
                    <TopBar
                        onOpenMenu={toggleMobileSidebar}
                        onOpenSearch={() => setPaletteOpen(true)}
                    />
                    <div id='page-content' className='flex-1 min-w-0'>
                        <Suspense fallback={<PageFallback />}>
                            <Outlet />
                        </Suspense>
                    </div>
                </div>
            </div>

            <CommandPalette
                open={paletteOpen}
                onClose={() => setPaletteOpen(false)}
            />
        </div>
    );
}
