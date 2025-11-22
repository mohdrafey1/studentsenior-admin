import React from 'react';
import { X, Loader } from 'lucide-react';

const SyllabusEditModal = ({
    showModal,
    formData,
    submitting,
    onClose,
    onSubmit,
    onFormChange,
}) => {
    if (!showModal) return null;

    return (
        <div className='fixed inset-0 bg-black/60 backdrop-blur-sm overflow-y-auto z-50'>
            <div className='flex items-center justify-center min-h-screen p-4'>
                <div
                    className='fixed inset-0'
                    onClick={onClose}
                ></div>
                
                <div className='relative bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl'>
                    {/* Header */}
                    <div className='flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700'>
                        <div>
                            <h2 className='text-lg font-semibold text-gray-900 dark:text-white'>
                                Edit Syllabus
                            </h2>
                            <p className='text-sm text-gray-500 dark:text-gray-400'>
                                {formData.subjectCode} - {formData.subjectName}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className='p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded'
                            disabled={submitting}
                        >
                            <X className='h-5 w-5' />
                        </button>
                    </div>

                    <form onSubmit={onSubmit}>
                        <div className='p-4 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto'>
                            {/* Status */}
                            <div>
                                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                    Status
                                </label>
                                <select
                                    value={formData.isActive}
                                    onChange={(e) =>
                                        onFormChange(
                                            'isActive',
                                            e.target.value === 'true',
                                        )
                                    }
                                    className='w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white border-gray-300 dark:border-gray-600'
                                >
                                    <option value='true'>Active</option>
                                    <option value='false'>Inactive</option>
                                </select>
                            </div>

                            {/* Subject Code (Read-only) */}
                            <div>
                                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                    Subject Code
                                </label>
                                <input
                                    type='text'
                                    value={formData.subjectCode}
                                    readOnly
                                    className='w-full px-3 py-2 border rounded-lg bg-gray-100 dark:bg-gray-800 dark:text-white border-gray-300 dark:border-gray-600'
                                />
                            </div>

                            {/* Subject Name (Read-only) */}
                            <div>
                                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                    Subject Name
                                </label>
                                <input
                                    type='text'
                                    value={formData.subjectName}
                                    readOnly
                                    className='w-full px-3 py-2 border rounded-lg bg-gray-100 dark:bg-gray-800 dark:text-white border-gray-300 dark:border-gray-600'
                                />
                            </div>

                            {/* Year and Semester */}
                            <div className='grid grid-cols-2 gap-4'>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                        Year
                                    </label>
                                    <select
                                        value={formData.year}
                                        onChange={(e) =>
                                            onFormChange(
                                                'year',
                                                parseInt(e.target.value),
                                            )
                                        }
                                        className='w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white border-gray-300 dark:border-gray-600'
                                    >
                                        {[1, 2, 3, 4, 5, 6].map((y) => (
                                            <option key={y} value={y}>
                                                Year {y}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                        Semester
                                    </label>
                                    <select
                                        value={formData.semester}
                                        onChange={(e) =>
                                            onFormChange(
                                                'semester',
                                                parseInt(e.target.value),
                                            )
                                        }
                                        className='w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white border-gray-300 dark:border-gray-600'
                                    >
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(
                                            (s) => (
                                                <option key={s} value={s}>
                                                    Semester {s}
                                                </option>
                                            ),
                                        )}
                                    </select>
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) =>
                                        onFormChange(
                                            'description',
                                            e.target.value,
                                        )
                                    }
                                    className='w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white resize-none border-gray-300 dark:border-gray-600'
                                    placeholder='Course description'
                                    rows='3'
                                />
                            </div>

                            {/* Units */}
                            <div>
                                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                    Course Units (JSON Format)
                                </label>
                                <textarea
                                    value={
                                        typeof formData.units === 'string'
                                            ? formData.units
                                            : JSON.stringify(
                                                  formData.units,
                                                  null,
                                                  2,
                                              )
                                    }
                                    onChange={(e) =>
                                        onFormChange(
                                            'units',
                                            e.target.value,
                                        )
                                    }
                                    className='w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white font-mono text-sm resize-none border-gray-300 dark:border-gray-600'
                                    placeholder='[{"unitNumber": 1, "title": "...", "content": "..."}]'
                                    rows='8'
                                />
                                <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
                                    Enter units as a JSON array. Each unit should have: unitNumber, title, and content.
                                </p>
                            </div>

                            {/* Reference Books */}
                            <div>
                                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                    Reference Books
                                </label>
                                <textarea
                                    value={formData.referenceBooks}
                                    onChange={(e) =>
                                        onFormChange(
                                            'referenceBooks',
                                            e.target.value,
                                        )
                                    }
                                    className='w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white resize-none border-gray-300 dark:border-gray-600'
                                    placeholder='Enter reference books (one per line)'
                                    rows='3'
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className='flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700'>
                            <button
                                type='button'
                                onClick={onClose}
                                disabled={submitting}
                                className='px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg disabled:opacity-50'
                            >
                                Cancel
                            </button>
                            <button
                                type='submit'
                                disabled={submitting}
                                className='px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 flex items-center gap-2'
                            >
                                {submitting ? (
                                    <>
                                        <Loader className='h-4 w-4 animate-spin' />
                                        Updating...
                                    </>
                                ) : (
                                    'Update Syllabus'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SyllabusEditModal;
