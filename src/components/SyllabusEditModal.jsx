import React from 'react';
import { X } from 'lucide-react';

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
        <div className='fixed inset-0 z-50 overflow-y-auto'>
            <div className='flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0'>
                <div
                    className='fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75'
                    onClick={onClose}
                ></div>
                <span
                    className='hidden sm:inline-block sm:align-middle sm:h-screen'
                    aria-hidden='true'
                >
                    &#8203;
                </span>
                <div className='inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full relative z-10'>
                    <form onSubmit={onSubmit}>
                        <div className='bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4'>
                            <div className='flex items-center justify-between mb-4'>
                                <h3 className='text-lg font-medium text-gray-900 dark:text-white'>
                                    Edit Syllabus
                                </h3>
                                <button
                                    type='button'
                                    onClick={onClose}
                                    className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                                >
                                    <X className='w-5 h-5' />
                                </button>
                            </div>
                            <div className='space-y-4 max-h-[70vh] overflow-y-auto'>
                                {/* Subject Code (Read-only) */}
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                        Subject Code
                                    </label>
                                    <input
                                        type='text'
                                        value={formData.subjectCode}
                                        readOnly
                                        className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 dark:text-white'
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
                                        className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 dark:text-white'
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
                                            className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
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
                                            className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
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
                                        className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                                        placeholder='Course description'
                                        rows='3'
                                    />
                                </div>

                                {/* Units */}
                                <div>
                                    <div className='flex items-center justify-between mb-2'>
                                        <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
                                            Course Units (JSON Format)
                                        </label>
                                    </div>
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
                                        className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white font-mono text-sm'
                                        placeholder={`[
  {
    "unitNumber": 1,
    "title": "Introduction to Programming",
    "content": "Overview of programming concepts, variables, data types, and control structures."
  },
  {
    "unitNumber": 2,
    "title": "Object-Oriented Programming",
    "content": "Classes, objects, inheritance, polymorphism, and encapsulation."
  },
  {
    "unitNumber": 3,
    "title": "Data Structures",
    "content": "Arrays, linked lists, stacks, queues, trees, and graphs."
  }
]`}
                                        rows='12'
                                    />
                                    <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
                                        Enter units as a JSON array. Each unit
                                        should have: unitNumber, title, and
                                        content.
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
                                        className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                                        placeholder='Enter reference books (one per line)'
                                        rows='4'
                                    />
                                </div>

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
                                        className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                                    >
                                        <option value='true'>Active</option>
                                        <option value='false'>Inactive</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className='bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse'>
                            <button
                                type='submit'
                                disabled={submitting}
                                className='w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50'
                            >
                                {submitting ? 'Updating...' : 'Update Syllabus'}
                            </button>
                            <button
                                type='button'
                                onClick={onClose}
                                className='mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm'
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SyllabusEditModal;
