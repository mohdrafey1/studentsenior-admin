import { Activity } from 'lucide-react';

function EngagementMetrics({ engagement }) {
    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    if (!engagement || Object.keys(engagement).length === 0) {
        return null;
    }

    const maxViews = Math.max(
        ...Object.values(engagement).map((e) => e.totalViews),
    );
    const colors = [
        'from-blue-500 to-cyan-500',
        'from-green-500 to-emerald-500',
        'from-purple-500 to-pink-500',
        'from-orange-500 to-red-500',
    ];

    return (
        <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6'>
            <div className='flex items-center justify-between mb-4 md:mb-6'>
                <h2 className='text-lg md:text-xl font-semibold text-gray-900 dark:text-white'>
                    Engagement Metrics
                </h2>
                <Activity className='w-4 h-4 md:w-5 md:h-5 text-gray-400' />
            </div>

            <div className='space-y-4 md:space-y-6'>
                {Object.entries(engagement)
                    .slice(0, 10)
                    .map(([key, value], index) => {
                        const percentage =
                            maxViews > 0
                                ? (value.totalViews / maxViews) * 100
                                : 0;
                        return (
                            <div key={key}>
                                <div className='flex items-center justify-between mb-2'>
                                    <span className='text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400'>
                                        {key} Views
                                    </span>
                                    <span className='text-xs md:text-sm font-bold text-gray-900 dark:text-white'>
                                        {formatNumber(value.totalViews)}
                                    </span>
                                </div>
                                <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 md:h-3'>
                                    <div
                                        className={`bg-gradient-to-r ${colors[index % 4]} h-2 md:h-3 rounded-full transition-all duration-300`}
                                        style={{ width: `${percentage}%` }}
                                    ></div>
                                </div>
                            </div>
                        );
                    })}
            </div>
        </div>
    );
}

export default EngagementMetrics;
