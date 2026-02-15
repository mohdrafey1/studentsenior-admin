import React, { useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
    Star,
    BookOpen,
    Store,
    Users,
    MessageSquare,
    Briefcase,
    Search,
    FileText,
    ChevronsLeft,
    ChevronsRight,
    X,
    CreditCard,
    Phone,
    RotateCcw,
    DollarSign,
    UserCheck,
    GraduationCap,
    GitBranch,
    BookOpenCheck,
    ShoppingBag,
    BookMarked,
    Crown,
    ShoppingCart,
    Tag,
} from 'lucide-react';
import { useSidebar } from '../context/SidebarContext';
import { Link } from 'react-router-dom';

// Fixed, responsive sidebar for dashboard/college pages
function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { collegeslug } = useParams();
    const { collapsed, toggleSidebar, mobileOpen, closeMobileSidebar } =
        useSidebar();

    // Check if sidebar should be shown (not on /dashboard, but show on /reports)
    const shouldShowSidebar = location.pathname !== '/dashboard';
    const isReportsSection = location.pathname.startsWith('/reports');

    // Items mirror the stats cards
    const items = useMemo(() => {
        // If in reports section, show reports navigation
        if (isReportsSection) {
            return [
                {
                    id: 'payments',
                    label: 'Payments',
                    icon: CreditCard,
                    to: '/reports/payments',
                    colors: 'text-green-600 dark:text-green-400',
                },
                {
                    id: 'transactions',
                    label: 'Transactions',
                    icon: DollarSign,
                    to: '/reports/transactions',
                    colors: 'text-yellow-600 dark:text-yellow-400',
                },
                {
                    id: 'orders',
                    label: 'Orders',
                    icon: ShoppingBag,
                    to: '/reports/orders',
                    colors: 'text-yellow-600 dark:text-yellow-400',
                },
                {
                    id: 'redemptions',
                    label: 'Redemptions',
                    icon: RotateCcw,
                    to: '/reports/redemptions',
                    colors: 'text-purple-600 dark:text-purple-400',
                },
                {
                    id: 'subscriptions',
                    label: 'Subscriptions',
                    icon: Crown,
                    to: '/reports/subscriptions',
                    colors: 'text-amber-600 dark:text-amber-400',
                },
                {
                    id: 'content-purchases',
                    label: 'Content Purchases',
                    icon: ShoppingCart,
                    to: '/reports/content-purchases',
                    colors: 'text-pink-600 dark:text-pink-400',
                },
                {
                    id: 'contacts',
                    label: 'Contacts',
                    icon: Phone,
                    to: '/reports/contacts',
                    colors: 'text-blue-600 dark:text-blue-400',
                },
                {
                    id: 'clients',
                    label: 'Users',
                    icon: Users,
                    to: '/reports/clients',
                    colors: 'text-indigo-600 dark:text-indigo-400',
                },
                {
                    id: 'dashboard-users',
                    label: 'Dashboard Users',
                    icon: UserCheck,
                    to: '/reports/dashboard-users',
                    colors: 'text-cyan-600 dark:text-cyan-400',
                },
                {
                    id: 'courses',
                    label: 'Courses',
                    icon: GraduationCap,
                    to: '/reports/courses',
                    colors: 'text-teal-600 dark:text-teal-400',
                },
                {
                    id: 'branches',
                    label: 'Branches',
                    icon: GitBranch,
                    to: '/reports/branches',
                    colors: 'text-orange-600 dark:text-orange-400',
                },
                {
                    id: 'subjects',
                    label: 'Subjects',
                    icon: BookOpenCheck,
                    to: '/reports/subjects',
                    colors: 'text-red-600 dark:text-red-400',
                },
                {
                    id: 'affiliate-products',
                    label: 'Affiliate Products',
                    icon: Tag,
                    to: '/affiliate-products',
                    colors: 'text-pink-600 dark:text-pink-400',
                },
            ];
        }

        // Default college navigation
        const base = collegeslug ? `/${collegeslug}` : '';
        return [
            {
                id: 'pyqs',
                label: 'PYQs',
                icon: Star,
                to: `${base}/pyqs`,
                colors: 'text-yellow-600 dark:text-yellow-400',
            },
            {
                id: 'notes',
                label: 'Notes',
                icon: BookOpen,
                to: `${base}/notes`,
                colors: 'text-green-600 dark:text-green-400',
            },

            {
                id: 'products',
                label: 'Store Products',
                icon: Store,
                to: `${base}/products`,
                colors: 'text-purple-600 dark:text-purple-400',
            },
            {
                id: 'seniors',
                label: 'Total Seniors',
                icon: Users,
                to: `${base}/seniors`,
                colors: 'text-blue-600 dark:text-blue-400',
            },
            {
                id: 'groups',
                label: 'WhatsApp Groups',
                icon: MessageSquare,
                to: `${base}/groups`,
                colors: 'text-indigo-600 dark:text-indigo-400',
            },
            {
                id: 'opportunities',
                label: 'Opportunities',
                icon: Briefcase,
                to: `${base}/opportunities`,
                colors: 'text-cyan-600 dark:text-cyan-400',
            },
            {
                id: 'lost-found',
                label: 'Lost & Found',
                icon: Search,
                to: `${base}/lost-found`,
                colors: 'text-red-600 dark:text-red-400',
            },
            {
                id: 'videos',
                label: 'Videos',
                icon: FileText,
                to: `${base}/videos`,
                colors: 'text-teal-600 dark:text-teal-400',
            },
            {
                id: 'syllabus',
                label: 'Syllabus',
                icon: BookMarked,
                to: `${base}/syllabus`,
                colors: 'text-orange-600 dark:text-orange-400',
            },
            {
                id: 'pyqs-solutions',
                label: 'PYQs Solutions',
                icon: Star,
                to: `${base}/pyqs-solutions`,
                colors: 'text-yellow-600 dark:text-yellow-400',
            },
            {
                id: 'quick-notes',
                label: 'Quick Notes',
                icon: FileText,
                to: `${base}/quick-notes`,
                colors: 'text-yellow-600 dark:text-yellow-400',
            },
        ];
    }, [collegeslug, isReportsSection]);

    const isRouteActive = (to) =>
        to &&
        (location.pathname === to || location.pathname.startsWith(to + '/'));

    // Don't render sidebar if it shouldn't be shown
    if (!shouldShowSidebar) {
        return null;
    }

    return (
        <>
            {/* Mobile backdrop */}
            {mobileOpen && (
                <div
                    className='fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden'
                    onClick={closeMobileSidebar}
                />
            )}

            {/* Desktop Sidebar - Always visible on md+ screens, fixed position */}
            <aside
                className={`hidden md:flex fixed top-16 left-0 h-[calc(100vh-4rem)] z-30 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ${
                    collapsed ? 'w-20' : 'w-72'
                }`}
                aria-label='Sidebar navigation'
            >
                <div className='flex flex-col w-full h-full'>
                    {/* Toggle */}
                    <div className='flex items-center justify-between px-3 py-3 border-b border-gray-200 dark:border-gray-800'>
                        <Link
                            to={`${isReportsSection ? '/reports' : collegeslug ? `/${collegeslug}` : '/dashboard'}`}
                            className={`text-sm font-semibold text-gray-700 dark:text-gray-200 ${collapsed ? 'sr-only' : ''}`}
                        >
                            {isReportsSection
                                ? 'REPORTS'
                                : collegeslug
                                  ? collegeslug.toLocaleUpperCase()
                                  : 'Dashboard'}
                        </Link>
                        <button
                            onClick={toggleSidebar}
                            aria-label={
                                collapsed
                                    ? 'Expand sidebar'
                                    : 'Collapse sidebar'
                            }
                            className='p-2 rounded-md text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                        >
                            {collapsed ? (
                                <ChevronsRight className='w-5 h-5' />
                            ) : (
                                <ChevronsLeft className='w-5 h-5' />
                            )}
                        </button>
                    </div>

                    {/* Nav */}
                    <nav className='flex-1 overflow-y-auto py-2'>
                        <ul className='space-y-1 px-2'>
                            {items.map((item) => {
                                const Icon = item.icon;
                                const disabled =
                                    !isReportsSection && !collegeslug;
                                const active =
                                    !disabled && isRouteActive(item.to);
                                return (
                                    <li key={item.id}>
                                        <button
                                            disabled={disabled}
                                            onClick={() =>
                                                !disabled && navigate(item.to)
                                            }
                                            className={`group w-full flex items-center ${
                                                collapsed
                                                    ? 'justify-center px-0'
                                                    : 'justify-start px-3'
                                            } py-2 rounded-md text-sm font-medium transition-colors ${
                                                active
                                                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                                    : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
                                            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            <Icon
                                                className={`w-5 h-5 mr-0 ${!collapsed ? 'mr-3' : ''} ${item.colors}`}
                                            />
                                            <span
                                                className={`${collapsed ? 'sr-only' : ''}`}
                                            >
                                                {item.label}
                                            </span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>
                </div>
            </aside>

            {/* Mobile Sidebar - Overlay style */}
            <aside
                className={`fixed top-0 left-0 h-full w-72 z-50 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-300 md:hidden ${
                    mobileOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
                aria-label='Mobile sidebar navigation'
            >
                <div className='flex flex-col w-full h-full'>
                    {/* Mobile Header */}
                    <div className='flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800'>
                        <span className='text-sm font-semibold text-gray-700 dark:text-gray-200'>
                            {isReportsSection
                                ? 'REPORTS'
                                : collegeslug
                                  ? collegeslug.toLocaleUpperCase()
                                  : 'Quick Sections'}
                        </span>
                        <button
                            onClick={closeMobileSidebar}
                            aria-label='Close sidebar'
                            className='p-2 rounded-md text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                        >
                            <X className='w-5 h-5' />
                        </button>
                    </div>

                    {/* Mobile Nav */}
                    <nav className='flex-1 overflow-y-auto py-2'>
                        <ul className='space-y-1 px-2'>
                            {items.map((item) => {
                                const Icon = item.icon;
                                const disabled =
                                    !isReportsSection && !collegeslug;
                                const active =
                                    !disabled && isRouteActive(item.to);
                                return (
                                    <li key={item.id}>
                                        <button
                                            disabled={disabled}
                                            onClick={() => {
                                                if (!disabled) {
                                                    navigate(item.to);
                                                    closeMobileSidebar();
                                                }
                                            }}
                                            className={`group w-full flex items-center justify-start px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                                active
                                                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                                    : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
                                            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            <Icon
                                                className={`w-5 h-5 mr-3 ${item.colors}`}
                                            />
                                            <span>{item.label}</span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>
                </div>
            </aside>
        </>
    );
}

export default Sidebar;
