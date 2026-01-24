import { RefreshCw, Download } from 'lucide-react';

function AnalyticsHeader({
    timeRange,
    setTimeRange,
    onRefresh,
    onExport,
    refreshing,
}) {
    return (
        <div className='mb-6 md:mb-8'>
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                <div>
                    <h1 className='text-2xl md:text-3xl font-bold text-gray-900 dark:text-white'>
                        Analytics Dashboard
                    </h1>
                    <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
                        Track your platform's performance and growth
                    </p>
                </div>

                <div className='flex flex-wrap items-center gap-2 md:gap-3'>
                    {/* Time Range Filter */}
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        className='flex-1 sm:flex-none px-3 md:px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all'
                    >
                        <option value='1'>Last 24 Hours</option>
                        <option value='7'>Last 7 Days</option>
                        <option value='14'>Last 14 Days</option>
                        <option value='30'>Last 30 Days</option>
                        <option value='60'>Last 60 Days</option>
                        <option value='90'>Last 90 Days</option>
                        <option value='180'>Last 6 Months</option>
                        <option value='365'>Last Year</option>
                        <option value='all'>All Time</option>
                    </select>

                    {/* Refresh Button */}
                    <button
                        onClick={onRefresh}
                        disabled={refreshing}
                        className='inline-flex items-center px-3 md:px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all'
                    >
                        <RefreshCw
                            className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`}
                        />
                        <span className='hidden sm:inline'>Refresh</span>
                    </button>

                    {/* Export Button */}
                    <button
                        onClick={onExport}
                        className='inline-flex items-center px-3 md:px-4 py-2 text-sm border border-transparent rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all'
                    >
                        <Download className='w-4 h-4 mr-2' />
                        <span className='hidden sm:inline'>Export</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AnalyticsHeader;
