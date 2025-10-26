import { useNavigate } from 'react-router-dom';
import { MapPin, Eye, Edit, Trash2 } from 'lucide-react';

const CollegeCard = ({ college, onEdit, onDelete, onView }) => {
    const navigate = useNavigate();

    const handleCardClick = (e) => {
        // Don't navigate if clicking on action buttons
        if (e.target.closest('button')) {
            return;
        }
        navigate(`/${college.slug}`);
    };

    return (
        <div
            className='bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden group cursor-pointer'
            onClick={handleCardClick}
        >
            {/* Card Content */}
            <div className='p-6'>
                {/* Header with title and actions */}
                <div className='flex justify-between items-start mb-3'>
                    <h3 className='text-lg font-semibold text-gray-900 dark:text-white line-clamp-2 flex-1 mr-2'>
                        {college.name}
                    </h3>

                    {/* Action buttons - visible on hover */}
                    <div className='opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-1'>
                        <button
                            onClick={() => onView(college)}
                            className='p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors'
                            title='View Details'
                        >
                            <Eye className='h-4 w-4' />
                        </button>
                        <button
                            onClick={() => onEdit(college)}
                            className='p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors'
                            title='Edit College'
                        >
                            <Edit className='h-4 w-4' />
                        </button>
                        <button
                            onClick={() => onDelete(college)}
                            className='p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors'
                            title='Delete College'
                        >
                            <Trash2 className='h-4 w-4' />
                        </button>
                    </div>
                </div>

                {/* Location */}
                <div className='flex items-center text-gray-600 dark:text-gray-300 mb-3'>
                    <MapPin className='h-4 w-4 mr-2 flex-shrink-0' />
                    <span className='text-sm line-clamp-1'>
                        {college.location}
                    </span>
                </div>

                {/* Description */}
                <p className='text-gray-700 dark:text-gray-200 text-sm line-clamp-3 mb-4'>
                    {college.description}
                </p>

                {/* Stats */}
                <div className='flex items-center justify-between'>
                    {/* Status */}
                    <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            college.status
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                        }`}
                    >
                        {college.status ? 'Active' : 'Inactive'}
                    </span>

                    {/* User count (if available) */}
                    {college.clickCounts !== undefined && (
                        <div className='flex items-center text-gray-500 dark:text-gray-400'>
                            <Eye className='h-4 w-4 mr-1' />
                            <span className='text-sm'>
                                {college.clickCounts}
                            </span>
                        </div>
                    )}
                </div>

                {/* Slug info */}
                <div className='mt-3 pt-3 border-t border-gray-200 dark:border-gray-700'>
                    <span className='text-xs text-gray-500 dark:text-gray-400'>
                        Slug:{' '}
                        <code className='font-mono bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded'>
                            {college.slug}
                        </code>
                    </span>
                </div>
            </div>
        </div>
    );
};

export default CollegeCard;
