import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const DeltaBadge = ({ value, lastViewedAt }) => {
    if (value === undefined || value === null || value === 0) {
        return null;
    }

    const isPositive = value > 0;
    const isNegative = value < 0;
    const absValue = Math.abs(value);

    // Format the last viewed time
    const formatLastViewed = (date) => {
        if (!date) return '';
        const now = new Date();
        const viewed = new Date(date);
        const diffMs = now - viewed;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 1) return 'yesterday';
        return `${diffDays}d ago`;
    };

    const getColorClasses = () => {
        if (isPositive) {
            return {
                bg: 'bg-green-100 dark:bg-green-900/30',
                text: 'text-green-700 dark:text-green-400',
                border: 'border-green-300 dark:border-green-700',
            };
        }
        if (isNegative) {
            return {
                bg: 'bg-red-100 dark:bg-red-900/30',
                text: 'text-red-700 dark:text-red-400',
                border: 'border-red-300 dark:border-red-700',
            };
        }
        return {
            bg: 'bg-gray-100 dark:bg-gray-800',
            text: 'text-gray-600 dark:text-gray-400',
            border: 'border-gray-300 dark:border-gray-600',
        };
    };

    const colors = getColorClasses();
    const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;

    return (
        <div
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border}`}
            title={
                lastViewedAt
                    ? `Since last view (${formatLastViewed(lastViewedAt)})`
                    : 'Since last view'
            }
        >
            <Icon className='w-3 h-3' />
            <span>
                {isPositive && '+'}
                {absValue.toLocaleString()}
            </span>
            {lastViewedAt && (
                <span className='opacity-75 ml-1'>
                    ({formatLastViewed(lastViewedAt)})
                </span>
            )}
        </div>
    );
};

export default DeltaBadge;
