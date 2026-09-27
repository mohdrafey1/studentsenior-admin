import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import { useSidebarLayout } from '../../hooks/useSidebarLayout';

/**
 * Page chrome for the Blog section.
 *
 * This admin has no shared route layout — every page renders <Header /> and
 * <Sidebar /> itself and offsets its content with useSidebarLayout(). The blog
 * pages arrived from ss-blog-dashboard, which nested its routes under a Layout
 * with an <Outlet />, so they render bare content and had no chrome at all.
 *
 * Applied once in App.jsx around each blog route rather than repeated in the
 * four pages, so the pages stay as close to their original form as possible.
 */
export default function BlogShell({ children }) {
    const { mainContentMargin } = useSidebarLayout();

    return (
        <div className='min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100'>
            <Header />
            <Sidebar />
            <main className='pt-6 pb-12'>
                <div
                    className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${mainContentMargin} transition-all duration-300`}
                >
                    {children}
                </div>
            </main>
        </div>
    );
}
