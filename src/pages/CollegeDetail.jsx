import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Users,
    FileText,
    BookOpen,
    MessageSquare,
    Store,
    Briefcase,
    Search,
    Star,
    HelpCircle,
} from 'lucide-react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import DeltaBadge from '../components/DeltaBadge';
import { useSidebarLayout } from '../hooks/useSidebarLayout';
import { useStatsWithDelta } from '../hooks/useStatsWithDelta';
import api from '../utils/api';
import toast from 'react-hot-toast';

// Compact StatCard component
const StatCard = ({
    title,
    value,
    icon: IconComp,
    bgColor,
    textColor,
    iconColor,
    onClick,
    delta,
    lastViewedAt,
}) => {
    return (
        <button onClick={onClick} className='block group w-full text-left'>
            <div className='bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200'>
                {/* Stat Content */}
                <div className='p-3.5'>
                    <div className='flex items-start justify-between gap-2 mb-2'>
                        <div className='flex-1 min-w-0'>
                            <h3
                                className={`text-xs font-medium ${textColor} truncate leading-tight`}
                            >
                                {title}
                            </h3>
                        </div>
                        <div
                            className={`p-1.5 rounded-md ${bgColor} ${iconColor} flex-shrink-0`}
                        >
                            {IconComp &&
                                React.createElement(IconComp, {
                                    className: 'w-3.5 h-3.5',
                                })}
                        </div>
                    </div>

                    <div className='flex items-baseline gap-1.5'>
                        <p className='text-xl sm:text-2xl font-bold text-gray-900 dark:text-white'>
                            {value.toLocaleString()}
                        </p>
                        {delta !== undefined && (
                            <DeltaBadge
                                value={delta}
                                lastViewedAt={lastViewedAt}
                            />
                        )}
                    </div>
                </div>

                {/* Footer Action */}
                <div className='px-3.5 py-2 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700'>
                    <div className='text-xs text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center transition-colors'>
                        <span>View details</span>
                        <svg
                            className='ml-1 w-3 h-3 transition-transform group-hover:translate-x-0.5'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                        >
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth='2'
                                d='M9 5l7 7-7 7'
                            />
                        </svg>
                    </div>
                </div>
            </div>
        </button>
    );
};

const CollegeDetail = () => {
    const { collegeslug } = useParams();
    const navigate = useNavigate();
    const [collegeData, setCollegeData] = useState(null);
    const [loading, setLoading] = useState(true);
    const { mainContentMargin } = useSidebarLayout();
    const { deltaStats, lastViewedAt, setStats, acknowledgeStat } =
        useStatsWithDelta(collegeslug);

    // Fetch college data and stats
    const fetchCollegeData = async () => {
        try {
            setLoading(true);

            // Fetch college data using the existing backend endpoint
            const response = await api.get(`/college-data/${collegeslug}`);
            if (response.data.success) {
                const data = response.data.data;
                setCollegeData(data);
                // Update the hook with current stats
                setStats(data);
            } else {
                throw new Error(
                    response.data.message || 'College data not found',
                );
            }
        } catch (error) {
            console.error('Error fetching college data:', error);
            if (error.response?.status === 404) {
                toast.error('College not found');
                navigate('/dashboard');
            } else if (error.response?.status !== 403) {
                toast.error('Failed to load college data');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (collegeslug) {
            fetchCollegeData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [collegeslug]);

    if (loading) {
        return (
            <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
                <Header />
                <Sidebar />
                <main
                    className={`max-w-7xl mx-auto py-4 px-3 sm:px-4 lg:px-6 ${mainContentMargin} transition-all duration-300`}
                >
                    <div className='animate-pulse'>
                        <div className='flex items-center mb-4'>
                            <div className='h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded mr-2'></div>
                            <div className='h-6 bg-gray-200 dark:bg-gray-700 rounded w-40'></div>
                        </div>
                        <div className='grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3'>
                            {[...Array(8)].map((_, index) => (
                                <div
                                    key={index}
                                    className='bg-white dark:bg-gray-800 rounded-lg shadow p-4'
                                >
                                    <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2'></div>
                                    <div className='h-6 bg-gray-200 dark:bg-gray-700 rounded'></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    if (!collegeData) {
        return (
            <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
                <Header />
                <Sidebar />
                <main
                    className={`max-w-7xl mx-auto py-4 px-3 sm:px-4 lg:px-6 ${mainContentMargin} transition-all duration-300`}
                >
                    <div className='text-center py-12'>
                        <h2 className='text-xl font-bold text-gray-900 dark:text-white mb-3'>
                            College Data Not Found
                        </h2>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className='text-sm text-blue-600 hover:text-blue-500 transition-colors'
                        >
                            ← Back to Dashboard
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    // Define the stats cards based on backend data structure
    const statsCards = [
        {
            id: 'pyqs',
            title: 'PYQs',
            value: collegeData.totalNewPyqs || 0,
            icon: Star,
            bgColor: 'bg-yellow-100 dark:bg-yellow-900',
            textColor: 'text-yellow-600 dark:text-yellow-400',
            iconColor: 'text-yellow-500 dark:text-yellow-300',
            href: `/${collegeslug}/pyqs`,
            statKey: 'totalNewPyqs',
        },
        {
            id: 'notes',
            title: 'Notes',
            value: collegeData.totalNotes || 0,
            icon: BookOpen,
            bgColor: 'bg-green-100 dark:bg-green-900',
            textColor: 'text-green-600 dark:text-green-400',
            iconColor: 'text-green-500 dark:text-green-300',
            href: `/${collegeslug}/notes`,
            statKey: 'totalNotes',
        },
        {
            id: 'products',
            title: 'Store Products',
            value: collegeData.totalProduct || 0,
            icon: Store,
            bgColor: 'bg-purple-100 dark:bg-purple-900',
            textColor: 'text-purple-600 dark:text-purple-400',
            iconColor: 'text-purple-500 dark:text-purple-300',
            href: `/${collegeslug}/products`,
            statKey: 'totalProduct',
        },
        {
            id: 'seniors',
            title: 'Total Seniors',
            value: collegeData.totalSeniors || 0,
            icon: Users,
            bgColor: 'bg-blue-100 dark:bg-blue-900',
            textColor: 'text-blue-600 dark:text-blue-400',
            iconColor: 'text-blue-500 dark:text-blue-300',
            href: `/${collegeslug}/seniors`,
            statKey: 'totalSeniors',
        },
        {
            id: 'groups',
            title: 'WhatsApp Groups',
            value: collegeData.totalGroups || 0,
            icon: MessageSquare,
            bgColor: 'bg-indigo-100 dark:bg-indigo-900',
            textColor: 'text-indigo-600 dark:text-indigo-400',
            iconColor: 'text-indigo-500 dark:text-indigo-300',
            href: `/${collegeslug}/groups`,
            statKey: 'totalGroups',
        },
        {
            id: 'opportunities',
            title: 'Opportunities',
            value: collegeData.totalGiveOpportunity || 0,
            icon: Briefcase,
            bgColor: 'bg-cyan-100 dark:bg-cyan-900',
            textColor: 'text-cyan-600 dark:text-cyan-400',
            iconColor: 'text-cyan-500 dark:text-cyan-300',
            href: `/${collegeslug}/opportunities`,
            statKey: 'totalGiveOpportunity',
        },
        {
            id: 'lost-found',
            title: 'Lost & Found',
            value: collegeData.totalLostFound || 0,
            icon: Search,
            bgColor: 'bg-red-100 dark:bg-red-900',
            textColor: 'text-red-600 dark:text-red-400',
            iconColor: 'text-red-500 dark:text-red-300',
            href: `/${collegeslug}/lost-found`,
            statKey: 'totalLostFound',
        },
        {
            id: 'videos',
            title: 'Videos',
            value: collegeData.totalVideos || 0,
            icon: FileText,
            bgColor: 'bg-teal-100 dark:bg-teal-900',
            textColor: 'text-teal-600 dark:text-teal-400',
            iconColor: 'text-teal-500 dark:text-teal-300',
            href: `/${collegeslug}/videos`,
            statKey: 'totalVideos',
        },
        {
            id: 'syllabus',
            title: 'Syllabus',
            value: collegeData.totalSyllabus || 0,
            icon: HelpCircle,
            bgColor: 'bg-orange-100 dark:bg-orange-900',
            textColor: 'text-orange-600 dark:text-orange-400',
            iconColor: 'text-orange-500 dark:text-orange-300',
            href: `/${collegeslug}/syllabus`,
            statKey: 'totalSyllabus',
        },
    ];

    return (
        <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
            <Header />
            <Sidebar />

            <main
                className={`max-w-7xl mx-auto px-3 py-4 sm:px-4 lg:px-6 ${mainContentMargin} transition-all duration-300`}
            >
                {/* Back Button */}
                <div className='mb-4'>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className='inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors'
                    >
                        <ArrowLeft className='h-4 w-4 mr-1.5' />
                        Back to Dashboard
                    </button>
                </div>

                {/* Statistics Cards Grid */}
                <div className='grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3'>
                    {statsCards.map((stat) => (
                        <StatCard
                            key={stat.id}
                            title={stat.title}
                            value={stat.value}
                            icon={stat.icon}
                            bgColor={stat.bgColor}
                            textColor={stat.textColor}
                            iconColor={stat.iconColor}
                            onClick={() => {
                                if (stat.statKey) {
                                    acknowledgeStat(stat.statKey);
                                }
                                navigate(stat.href);
                            }}
                            delta={
                                stat.statKey
                                    ? deltaStats[stat.statKey]
                                    : undefined
                            }
                            lastViewedAt={lastViewedAt}
                        />
                    ))}
                </div>
            </main>
        </div>
    );
};

export default CollegeDetail;
