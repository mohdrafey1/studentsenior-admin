import React, { useState, useMemo } from 'react';
import { Search, Filter, Eye, EyeOff } from 'lucide-react';
import CollegeCard from './CollegeCard';

const CollegeList = ({
    colleges = [],
    onEdit,
    onDelete,
    onView,
    loading = false,
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showInactive, setShowInactive] = useState(false);

    const filteredColleges = useMemo(() => {
        return colleges
            .filter((college) => (showInactive ? true : college.status))
            .filter(
                (college) =>
                    college.name
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                    college.location
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                    college.slug
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()),
            );
    }, [colleges, searchTerm, showInactive]);

    const activeCount = colleges.filter((college) => college.status).length;
    const inactiveCount = colleges.filter((college) => !college.status).length;

    if (loading) {
        return (
            <div className='space-y-6'>
                {/* Loading skeleton */}
                <div className='bg-white dark:bg-gray-800 rounded-xl shadow-md p-6'>
                    <div className='animate-pulse'>
                        <div className='flex justify-between items-center mb-4'>
                            <div className='h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-96'></div>
                            <div className='flex space-x-2'>
                                <div className='h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-32'></div>
                                <div className='h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-24'></div>
                            </div>
                        </div>
                        <div className='flex space-x-4'>
                            <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-20'></div>
                            <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-24'></div>
                        </div>
                    </div>
                </div>

                <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
                    {[...Array(8)].map((_, index) => (
                        <div
                            key={index}
                            className='bg-white dark:bg-gray-800 rounded-lg shadow-md p-6'
                        >
                            <div className='animate-pulse'>
                                <div className='h-6 bg-gray-200 dark:bg-gray-700 rounded mb-3'></div>
                                <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2'></div>
                                <div className='h-16 bg-gray-200 dark:bg-gray-700 rounded mb-4'></div>
                                <div className='flex justify-between'>
                                    <div className='h-6 bg-gray-200 dark:bg-gray-700 rounded w-16'></div>
                                    <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-12'></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className='space-y-6'>
            {/* Search and Filter Controls */}
            <div className='bg-white dark:bg-gray-800 rounded-xl shadow-md p-6'>
                <div className='flex flex-col lg:flex-row gap-4 items-center justify-between'>
                    {/* Search Bar */}
                    <div className='relative w-full lg:w-96'>
                        <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                            <Search className='h-5 w-5 text-gray-400' />
                        </div>
                        <input
                            type='text'
                            placeholder='Search colleges by name, location, or slug...'
                            className='pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400'
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className='flex flex-wrap gap-2 w-full lg:w-auto'>
                        {/* Toggle Button for Inactive Colleges */}
                        <button
                            onClick={() => setShowInactive(!showInactive)}
                            className={`px-4 py-2 rounded-lg border flex items-center gap-2 transition-colors ${
                                showInactive
                                    ? 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
                            }`}
                        >
                            {showInactive ? (
                                <EyeOff className='h-4 w-4' />
                            ) : (
                                <Eye className='h-4 w-4' />
                            )}
                            <span className='text-sm'>
                                {showInactive
                                    ? 'Hide Inactive'
                                    : 'Show Inactive'}
                            </span>
                        </button>

                        {/* Filter Info */}
                        <div className='flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600'>
                            <Filter className='h-4 w-4 text-gray-500 dark:text-gray-400' />
                            <span className='text-sm text-gray-600 dark:text-gray-300'>
                                {filteredColleges.length} of {colleges.length}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className='mt-4 flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-300'>
                    <span className='flex items-center gap-2'>
                        <div className='w-3 h-3 bg-green-500 rounded-full'></div>
                        Active: {activeCount}
                    </span>
                    <span className='flex items-center gap-2'>
                        <div className='w-3 h-3 bg-red-500 rounded-full'></div>
                        Inactive: {inactiveCount}
                    </span>
                </div>
            </div>

            {/* Results Summary */}
            {searchTerm && (
                <div className='text-sm text-gray-600 dark:text-gray-300'>
                    {filteredColleges.length > 0 ? (
                        <>
                            Showing {filteredColleges.length} result
                            {filteredColleges.length !== 1 ? 's' : ''} for
                            <span className='font-semibold'>
                                {' '}
                                "{searchTerm}"
                            </span>
                        </>
                    ) : (
                        <>
                            No colleges found matching
                            <span className='font-semibold'>
                                {' '}
                                "{searchTerm}"
                            </span>
                        </>
                    )}
                </div>
            )}

            {/* College Grid */}
            {filteredColleges.length > 0 ? (
                <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
                    {filteredColleges.map((college) => (
                        <CollegeCard
                            key={college._id || college.id}
                            college={college}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onView={onView}
                        />
                    ))}
                </div>
            ) : (
                <div className='text-center py-12'>
                    <div className='text-gray-400 dark:text-gray-500 mb-4'>
                        <Search className='h-12 w-12 mx-auto mb-4' />
                    </div>
                    <h3 className='text-lg font-medium text-gray-900 dark:text-white mb-2'>
                        No colleges found
                    </h3>
                    <p className='text-gray-500 dark:text-gray-400 mb-4'>
                        {searchTerm
                            ? `No colleges match your search for "${searchTerm}"`
                            : showInactive
                              ? 'No colleges available'
                              : 'No active colleges found. Try showing inactive colleges.'}
                    </p>
                </div>
            )}
        </div>
    );
};

export default CollegeList;
