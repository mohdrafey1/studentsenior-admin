import { BarChart3 } from 'lucide-react';

function AnalyticsInsights() {
    return (
        <div className='mt-6 md:mt-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 md:p-6 border border-blue-200 dark:border-blue-800'>
            <div className='flex flex-col sm:flex-row items-start space-y-3 sm:space-y-0 sm:space-x-4'>
                <div className='flex-shrink-0'>
                    <BarChart3 className='w-6 h-6 md:w-8 md:h-8 text-blue-600 dark:text-blue-400' />
                </div>
                <div className='flex-1'>
                    <h3 className='text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-2'>
                        Analytics Insights
                    </h3>
                    <p className='text-gray-600 dark:text-gray-400 text-xs md:text-sm leading-relaxed'>
                        Your platform is showing strong growth across all
                        content categories. PYQs and Opportunities are the most
                        engaged content types. Consider promoting more
                        interactive features to boost community participation.
                        The engagement rate has increased by 32% in the last
                        month, indicating healthy platform activity.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default AnalyticsInsights;
