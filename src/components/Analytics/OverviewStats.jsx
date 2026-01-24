import { BarChart3, Eye, Activity } from 'lucide-react';
import StatCard from './StatCard';

function OverviewStats({ totalContent, totalViews, engagementRate }) {
    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    const overviewStats = [
        {
            label: 'Total Content',
            value: totalContent,
            icon: BarChart3,
            color: 'text-blue-600 dark:text-blue-400',
            bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        },
        {
            label: 'Total Views',
            value: formatNumber(totalViews),
            icon: Eye,
            color: 'text-purple-600 dark:text-purple-400',
            bgColor: 'bg-purple-100 dark:bg-purple-900/30',
        },
        {
            label: 'Engagement Rate',
            value: engagementRate,
            icon: Activity,
            color: 'text-orange-600 dark:text-orange-400',
            bgColor: 'bg-orange-100 dark:bg-orange-900/30',
        },
    ];

    return (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8'>
            {overviewStats.map((stat, index) => (
                <StatCard key={index} {...stat} />
            ))}
        </div>
    );
}

export default OverviewStats;
