import { TrendingUp, TrendingDown } from 'lucide-react';

function ContentCard({ card, totalContent }) {
    const Icon = card.icon;
    const ChangeIcon =
        card.changeType === 'increase' ? TrendingUp : TrendingDown;

    return (
        <div className='group relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-6 hover:shadow-lg transition-all duration-300 cursor-pointer'>
            {/* Gradient Background */}
            <div
                className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-5 group-hover:opacity-10 transition-opacity`}
            ></div>

            {/* Content */}
            <div className='relative'>
                <div className='flex items-center justify-between mb-3 md:mb-4'>
                    <div className={`p-2 md:p-3 rounded-lg ${card.bgColor}`}>
                        <Icon
                            className={`w-5 h-5 md:w-6 md:h-6 ${card.iconColor}`}
                        />
                    </div>
                    <div
                        className={`flex items-center space-x-1 text-xs md:text-sm font-medium ${
                            card.changeType === 'increase'
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                        }`}
                    >
                        <ChangeIcon className='w-3 h-3 md:w-4 md:h-4' />
                        <span>{card.change}</span>
                    </div>
                </div>

                <div>
                    <p className='text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1'>
                        {card.title}
                    </p>
                    <p className='text-2xl md:text-3xl font-bold text-gray-900 dark:text-white'>
                        {card.value.toLocaleString()}
                    </p>
                </div>

                {/* Progress Bar */}
                <div className='mt-3 md:mt-4'>
                    <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
                        <div
                            className={`bg-gradient-to-r ${card.color} h-2 rounded-full transition-all duration-300`}
                            style={{
                                width: `${Math.min((card.value / totalContent) * 100, 100)}%`,
                            }}
                        ></div>
                    </div>
                    <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                        {((card.value / totalContent) * 100).toFixed(1)}% of
                        total content
                    </p>
                </div>
            </div>
        </div>
    );
}

export default ContentCard;
