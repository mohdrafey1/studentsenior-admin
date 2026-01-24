import { TrendingUp, TrendingDown } from 'lucide-react';

function GrowthTrends({ percentageChanges }) {
    if (!percentageChanges || Object.keys(percentageChanges).length === 0) {
        return null;
    }

    const colors = [
        'from-green-500 to-emerald-500',
        'from-blue-500 to-cyan-500',
        'from-purple-500 to-pink-500',
        'from-orange-500 to-red-500',
    ];

    return (
        <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6'>
            <div className='flex items-center justify-between mb-4 md:mb-6'>
                <h2 className='text-lg md:text-xl font-semibold text-gray-900 dark:text-white'>
                    Growth Trends (Last 7 Days)
                </h2>
                <TrendingUp className='w-4 h-4 md:w-5 md:h-5 text-green-500' />
            </div>

            <div className='space-y-4 md:space-y-6'>
                {Object.entries(percentageChanges)
                    .slice(0, 4)
                    .map(([key, trend], idx) => {
                        const index = idx % 4;
                        const TrendIcon =
                            trend.trend === 'up' ? TrendingUp : TrendingDown;
                        const trendColor =
                            trend.trend === 'up'
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400';

                        return (
                            <div key={key}>
                                <div className='flex items-center justify-between mb-2'>
                                    <span className='text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400 capitalize'>
                                        {key}
                                    </span>
                                    <div className='flex items-center space-x-2'>
                                        <span
                                            className={`text-base md:text-lg font-bold ${trendColor}`}
                                        >
                                            {trend.percentChange > 0 ? '+' : ''}
                                            {trend.percentChange}%
                                        </span>
                                        <TrendIcon
                                            className={`w-3 h-3 md:w-4 md:h-4 ${trendColor}`}
                                        />
                                    </div>
                                </div>
                                <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 md:h-3'>
                                    <div
                                        className={`bg-gradient-to-r ${colors[index]} h-2 md:h-3 rounded-full transition-all duration-300`}
                                        style={{
                                            width: `${Math.min(Math.abs(trend.percentChange), 100)}%`,
                                        }}
                                    ></div>
                                </div>
                                <div className='flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1'>
                                    <span>Previous: {trend.previous}</span>
                                    <span>Current: {trend.current}</span>
                                </div>
                            </div>
                        );
                    })}
            </div>
        </div>
    );
}

export default GrowthTrends;
