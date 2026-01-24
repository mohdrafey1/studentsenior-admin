import {
    Calendar,
    FileText,
    BookOpen,
    Store,
    MessageSquare,
    Briefcase,
} from 'lucide-react';

function RecentActivity({ recentActivity }) {
    const getTimeAgo = (timestamp) => {
        const now = new Date();
        const then = new Date(timestamp);
        const diffMs = now - then;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60)
            return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24)
            return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    };

    const iconMap = {
        PYQ: FileText,
        Note: BookOpen,
        Product: Store,
        Group: MessageSquare,
        Opportunity: Briefcase,
    };

    const colorMap = {
        PYQ: 'text-yellow-600',
        Note: 'text-blue-600',
        Product: 'text-green-600',
        Group: 'text-indigo-600',
        Opportunity: 'text-red-600',
    };

    return (
        <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6'>
            <div className='flex items-center justify-between mb-4 md:mb-6'>
                <h2 className='text-lg md:text-xl font-semibold text-gray-900 dark:text-white'>
                    Recent Activity
                </h2>
                <Calendar className='w-4 h-4 md:w-5 md:h-5 text-gray-400' />
            </div>

            <div className='space-y-3 md:space-y-4'>
                {recentActivity && recentActivity.length > 0 ? (
                    recentActivity.slice(0, 5).map((activity) => {
                        const Icon = iconMap[activity.type] || FileText;
                        const color =
                            colorMap[activity.type] || 'text-gray-600';
                        const timeAgo = getTimeAgo(activity.timestamp);

                        return (
                            <div
                                key={activity.id}
                                className='flex items-center space-x-3 md:space-x-4 p-2 md:p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors'
                            >
                                <div className='p-2 rounded-lg bg-gray-100 dark:bg-gray-700 flex-shrink-0'>
                                    <Icon
                                        className={`w-4 h-4 md:w-5 md:h-5 ${color}`}
                                    />
                                </div>
                                <div className='flex-1 min-w-0'>
                                    <p className='text-xs md:text-sm font-medium text-gray-900 dark:text-white truncate'>
                                        {activity.action}
                                    </p>
                                    <p className='text-xs text-gray-500 dark:text-gray-400 truncate'>
                                        by {activity.user}
                                    </p>
                                </div>
                                <span className='text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap flex-shrink-0'>
                                    {timeAgo}
                                </span>
                            </div>
                        );
                    })
                ) : (
                    <p className='text-center text-sm text-gray-500 dark:text-gray-400 py-4'>
                        No recent activity
                    </p>
                )}
            </div>
        </div>
    );
}

export default RecentActivity;
