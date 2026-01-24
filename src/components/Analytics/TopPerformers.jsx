import { TrendingUp, Eye } from 'lucide-react';

function TopPerformers({ topPerformers }) {
    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    return (
        <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6'>
            <div className='flex items-center justify-between mb-4 md:mb-6'>
                <h2 className='text-lg md:text-xl font-semibold text-gray-900 dark:text-white'>
                    Top Performing Content
                </h2>
                <TrendingUp className='w-4 h-4 md:w-5 md:h-5 text-green-500' />
            </div>

            <div className='space-y-3 md:space-y-4'>
                {topPerformers && topPerformers.length > 0 ? (
                    topPerformers.slice(0, 5).map((item, index) => (
                        <div
                            key={item.id}
                            className='flex items-center justify-between p-3 md:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'
                        >
                            <div className='flex items-center space-x-2 md:space-x-3 flex-1 min-w-0'>
                                <div className='flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs md:text-sm'>
                                    {index + 1}
                                </div>
                                <div className='flex-1 min-w-0'>
                                    <p className='text-xs md:text-sm truncate font-medium text-gray-900 dark:text-white'>
                                        {item.title}
                                    </p>
                                    <p className='text-xs text-gray-500 dark:text-gray-400'>
                                        {item.type}
                                    </p>
                                </div>
                            </div>
                            <div className='flex items-center space-x-1 text-gray-600 dark:text-gray-400 ml-2'>
                                <Eye className='w-3 h-3 md:w-4 md:h-4' />
                                <span className='text-xs md:text-sm font-medium'>
                                    {formatNumber(item.views)}
                                </span>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className='text-center text-sm text-gray-500 dark:text-gray-400 py-4'>
                        No top performers data available
                    </p>
                )}
            </div>
        </div>
    );
}

export default TopPerformers;
