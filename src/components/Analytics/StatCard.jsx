function StatCard({ label, value, icon: Icon, color, bgColor }) {
    return (
        <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6 hover:shadow-md transition-all'>
            <div className='flex items-center justify-between'>
                <div className='flex-1'>
                    <p className='text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1'>
                        {label}
                    </p>
                    <p className='text-2xl md:text-3xl font-bold text-gray-900 dark:text-white'>
                        {typeof value === 'number'
                            ? value.toLocaleString()
                            : value}
                    </p>
                </div>
                <div
                    className={`p-2 md:p-3 rounded-lg ${bgColor} flex-shrink-0`}
                >
                    {Icon && (
                        <Icon className={`w-5 h-5 md:w-6 md:h-6 ${color}`} />
                    )}
                </div>
            </div>
        </div>
    );
}

export default StatCard;
