import { PieChart } from 'lucide-react';
import ContentCard from './ContentCard';

function ContentDistribution({ analyticsCards, totalContent }) {
    return (
        <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6 mb-6 md:mb-8'>
            <div className='flex items-center justify-between mb-4 md:mb-6'>
                <h2 className='text-lg md:text-xl font-semibold text-gray-900 dark:text-white'>
                    Content Distribution
                </h2>
                <PieChart className='w-4 h-4 md:w-5 md:h-5 text-gray-400' />
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6'>
                {analyticsCards.map((card) => (
                    <ContentCard
                        key={card.id}
                        card={card}
                        totalContent={totalContent}
                    />
                ))}
            </div>
        </div>
    );
}

export default ContentDistribution;
