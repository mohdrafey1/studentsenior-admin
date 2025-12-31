import React from 'react';

const LoadingSpinner = () => {
    return (
        <div className='flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900'>
            <div className='relative w-16 h-16'>
                <div className='absolute top-0 left-0 w-full h-full border-4 border-gray-200 dark:border-gray-700 rounded-full'></div>
                <div className='absolute top-0 left-0 w-full h-full border-4 border-blue-500 rounded-full animate-spin border-t-transparent'></div>
            </div>
        </div>
    );
};

export default LoadingSpinner;
