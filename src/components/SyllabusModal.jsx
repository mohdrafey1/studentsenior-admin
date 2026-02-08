import { useState } from 'react';
import { X, Sparkles, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const SyllabusModal = ({
    showModal,
    selectedSubject,
    formData,
    submitting,
    onClose,
    onSubmit,
    onFormChange,
    onBatchUpdate,
}) => {
    const [rawSyllabusText, setRawSyllabusText] = useState('');
    const [showAiSection, setShowAiSection] = useState(true);
    const [parsing, setParsing] = useState(false);

    if (!showModal) return null;

    const handleAutoFillWithAI = async () => {
        if (!rawSyllabusText.trim()) {
            toast.error('Please paste syllabus data first');
            return;
        }

        if (rawSyllabusText.trim().length < 50) {
            toast.error('Syllabus text is too short');
            return;
        }

        setParsing(true);
        try {
            const response = await api.post('/syllabus/parse-with-ai', {
                rawText: rawSyllabusText,
            });

            if (response.data.success) {
                const { description, units, referenceBooks } =
                    response.data.data;

                // Batch update all form fields at once to avoid stale closure issues
                const updates = {};
                if (description) {
                    updates.description = description;
                }
                if (units && Array.isArray(units)) {
                    updates.units = JSON.stringify(units, null, 2);
                }
                if (referenceBooks) {
                    updates.referenceBooks = referenceBooks;
                }

                onBatchUpdate(updates);

                toast.success('Form auto-filled successfully!');
                setShowAiSection(false); // Collapse AI section after success
            } else {
                toast.error(
                    response.data.message || 'Failed to parse syllabus',
                );
            }
        } catch (error) {
            console.error('AI Parse Error:', error);
            toast.error(
                error.response?.data?.message ||
                    'Failed to parse syllabus with AI',
            );
        } finally {
            setParsing(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Parse units JSON before submitting
        let parsedUnits = formData.units;
        if (typeof formData.units === 'string') {
            try {
                parsedUnits = JSON.parse(formData.units);
                // Validate that it's an array
                if (!Array.isArray(parsedUnits)) {
                    alert('Units must be an array');
                    return;
                }
                // Validate each unit has required fields
                parsedUnits.forEach((unit, idx) => {
                    if (!unit.unitNumber || !unit.title || !unit.content) {
                        throw new Error(
                            `Unit ${idx + 1} is missing required fields (unitNumber, title, content)`,
                        );
                    }
                });
            } catch (err) {
                alert(`Invalid JSON format for units: ${err.message}`);
                return;
            }
        }

        // Temporarily update formData.units with parsed array
        const originalUnits = formData.units;
        formData.units = parsedUnits;

        // Call the original onSubmit
        await onSubmit(e);

        // Restore original units in case of error (though form might be reset anyway)
        formData.units = originalUnits;
    };

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
                    <form onSubmit={handleSubmit}>
                        <div className='bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4'>
                            <div className='flex items-center justify-between mb-4'>
                                <h3 className='text-lg font-medium text-gray-900 dark:text-white'>
                                    Add Syllabus for{' '}
                                    {selectedSubject?.subjectName}
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
                                {/* AI Auto-Fill Section */}
                                <div className='border border-purple-200 dark:border-purple-800 rounded-lg overflow-hidden'>
                                    <button
                                        type='button'
                                        onClick={() =>
                                            setShowAiSection(!showAiSection)
                                        }
                                        className='w-full flex items-center justify-between px-4 py-3 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors'
                                    >
                                        <div className='flex items-center gap-2'>
                                            <Sparkles className='w-5 h-5 text-purple-600 dark:text-purple-400' />
                                            <span className='font-medium text-purple-700 dark:text-purple-300'>
                                                Auto Fill with AI
                                            </span>
                                        </div>
                                        {showAiSection ? (
                                            <ChevronUp className='w-5 h-5 text-purple-600 dark:text-purple-400' />
                                        ) : (
                                            <ChevronDown className='w-5 h-5 text-purple-600 dark:text-purple-400' />
                                        )}
                                    </button>
                                    {showAiSection && (
                                        <div className='p-4 bg-purple-50/50 dark:bg-purple-900/20'>
                                            <p className='text-sm text-gray-600 dark:text-gray-400 mb-3'>
                                                Paste your raw syllabus data
                                                below and let AI extract the
                                                information automatically.
                                            </p>
                                            <textarea
                                                value={rawSyllabusText}
                                                onChange={(e) =>
                                                    setRawSyllabusText(
                                                        e.target.value,
                                                    )
                                                }
                                                className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white text-sm'
                                                placeholder='Paste your syllabus data here...

Example:
Course Code: PY101
Title: Physics
Unit 1: Wave Optics
Topics: Interference, Diffraction...
Reference Books:
1. Fundamentals of Optics by Jenkins'
                                                rows='6'
                                            />
                                            <button
                                                type='button'
                                                onClick={handleAutoFillWithAI}
                                                disabled={
                                                    parsing ||
                                                    !rawSyllabusText.trim()
                                                }
                                                className='mt-3 inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                                            >
                                                {parsing ? (
                                                    <>
                                                        <Loader2 className='w-4 h-4 animate-spin' />
                                                        Parsing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Sparkles className='w-4 h-4' />
                                                        Auto Fill with AI
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Subject Code (Auto-filled, Read-only) */}
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
                            </div>
                        </div>
                        <div className='bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse'>
                            <button
                                type='submit'
                                disabled={submitting}
                                className='w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50'
                            >
                                {submitting ? 'Creating...' : 'Create Syllabus'}
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

export default SyllabusModal;
