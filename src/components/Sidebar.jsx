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
} from 'lucide-react';
import { useSidebar } from '../context/SidebarContext';

// Fixed, responsive sidebar for dashboard/college pages
function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { collegeslug } = useParams();
    const { collapsed, toggleSidebar } = useSidebar();

    // Items mirror the stats cards
    const items = useMemo(() => {
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
        ];
    }, [collegeslug]);

    const isRouteActive = (to) =>
        to && (location.pathname === to || location.pathname.startsWith(to + '/'));

    // Always visible on md+ screens, fixed position
    return (
        <>
            <aside
                className={`hidden md:flex fixed top-16 left-0 h-[calc(100vh-4rem)] z-30 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ${
                    collapsed ? 'w-20' : 'w-72'
                }`}
                aria-label='Sidebar navigation'
            >
            <div className='flex flex-col w-full h-full'>
                {/* Toggle */}
                <div className='flex items-center justify-between px-3 py-3 border-b border-gray-200 dark:border-gray-800'>
                    <span className={`text-sm font-semibold text-gray-700 dark:text-gray-200 ${collapsed ? 'sr-only' : ''}`}>
                        Quick Sections
                    </span>
                    <button
                        onClick={toggleSidebar}
                        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        className='p-2 rounded-md text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                    >
                        {collapsed ? <ChevronsRight className='w-5 h-5' /> : <ChevronsLeft className='w-5 h-5' />}
                    </button>
                </div>

                {/* Nav */}
                <nav className='flex-1 overflow-y-auto py-2'>
                    <ul className='space-y-1 px-2'>
                        {items.map((item) => {
                            const Icon = item.icon;
                            const disabled = !collegeslug;
                            const active = !disabled && isRouteActive(item.to);
                            return (
                                <li key={item.id}>
                                    <button
                                        disabled={disabled}
                                        onClick={() => !disabled && navigate(item.to)}
                                        className={`group w-full flex items-center ${
                                            collapsed ? 'justify-center px-0' : 'justify-start px-3'
                                        } py-2 rounded-md text-sm font-medium transition-colors ${
                                            active
                                                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                                : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
                                        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <Icon className={`w-5 h-5 mr-0 ${!collapsed ? 'mr-3' : ''} ${item.colors}`} />
                                        <span className={`${collapsed ? 'sr-only' : ''}`}>{item.label}</span>
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
