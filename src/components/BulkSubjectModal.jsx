import { useState, useRef } from 'react';
import {
    X,
    Sparkles,
    ChevronDown,
    ChevronUp,
    Loader2,
    Upload,
    Trash2,
    AlertCircle,
} from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const BulkSubjectModal = ({
    showModal,
    branch,
    college,
    colleges = [],
    onClose,
    onSuccess,
}) => {
    const [rawText, setRawText] = useState('');
    const [showAiSection, setShowAiSection] = useState(true);
    const [parsing, setParsing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [subjects, setSubjects] = useState([]);
    const [selectedCollege, setSelectedCollege] = useState(
        college || colleges[0]?._id || '',
    );
    const fileInputRef = useRef(null);

    if (!showModal) return null;

    const handleParseWithAI = async () => {
        if (!rawText.trim()) {
            toast.error('Please paste subject data first');
            return;
        }

        if (rawText.trim().length < 20) {
            toast.error('Subject text is too short');
            return;
        }

        setParsing(true);
        try {
            const response = await api.post(
                '/resource/subjects/parse-with-ai',
                {
                    rawText: rawText,
                },
            );

            if (response.data.success) {
                const parsedSubjects = response.data.data.subjects || [];
                setSubjects(parsedSubjects);
                if (parsedSubjects.length > 0) {
                    toast.success(`Parsed ${parsedSubjects.length} subjects`);
                    setShowAiSection(false);
                } else {
                    toast.error('No valid subjects found in the text');
                }
            } else {
                toast.error(
                    response.data.message || 'Failed to parse subjects',
                );
            }
        } catch (error) {
            console.error('AI Parse Error:', error);
            toast.error(
                error.response?.data?.message ||
                    'Failed to parse subjects with AI',
            );
        } finally {
            setParsing(false);
        }
    };

    const handlePDFUpload = async (event) => {
        const files = Array.from(event.target.files || []);
        if (files.length === 0) return;

        // Validate file count
        if (files.length > 10) {
            toast.error('Maximum 10 files allowed');
            return;
        }

        // Validate all files are PDFs
        const nonPdfFiles = files.filter(
            (file) => file.type !== 'application/pdf',
        );
        if (nonPdfFiles.length > 0) {
            toast.error('Only PDF files are allowed');
            return;
        }

        // Validate total size (10MB)
        const totalSize = files.reduce((sum, file) => sum + file.size, 0);
        if (totalSize > 10 * 1024 * 1024) {
            toast.error(
                `Total file size (${(totalSize / 1024 / 1024).toFixed(1)}MB) exceeds 10MB limit`,
            );
            return;
        }

        setParsing(true);
        try {
            const formData = new FormData();
            files.forEach((file) => {
                formData.append('pdf', file);
            });

            const response = await api.post(
                '/resource/subjects/parse-with-ai',
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' },
                },
            );

            if (response.data.success) {
                const parsedSubjects = response.data.data.subjects || [];
                setSubjects(parsedSubjects);
                if (parsedSubjects.length > 0) {
                    toast.success(
                        `Parsed ${parsedSubjects.length} subjects from ${files.length} PDF${files.length > 1 ? 's' : ''}`,
                    );
                    setShowAiSection(false);
                } else {
                    toast.error('No valid subjects found in the PDF(s)');
                }
            } else {
                toast.error(response.data.message || 'Failed to parse PDF');
            }
        } catch (error) {
            console.error('PDF Parse Error:', error);
            toast.error(error.response?.data?.message || 'Failed to parse PDF');
        } finally {
            setParsing(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleSubjectChange = (index, field, value) => {
        const newSubjects = [...subjects];
        newSubjects[index] = { ...newSubjects[index], [field]: value };
        setSubjects(newSubjects);
    };

    const handleDeleteSubject = (index) => {
        setSubjects(subjects.filter((_, i) => i !== index));
    };

    const handleRemoveInvalid = () => {
        const validSubjects = subjects.filter(
            (s) =>
                s.subjectName?.trim() &&
                s.subjectCode?.trim() &&
                s.semester >= 1 &&
                s.semester <= 8,
        );
        const removed = subjects.length - validSubjects.length;
        setSubjects(validSubjects);
        if (removed > 0) {
            toast.success(`Removed ${removed} invalid subjects`);
        } else {
            toast.error('All subjects are valid');
        }
    };

    const handleSaveAll = async () => {
        if (subjects.length === 0) {
            toast.error('No subjects to save');
            return;
        }

        const validSubjects = subjects.filter(
            (s) =>
                s.subjectName?.trim() &&
                s.subjectCode?.trim() &&
                s.semester >= 1 &&
                s.semester <= 8,
        );

        if (validSubjects.length === 0) {
            toast.error('No valid subjects to save');
            return;
        }

        setSaving(true);
        try {
            const response = await api.post('/resource/subjects/bulk', {
                subjects: validSubjects,
                branch: branch._id,
                college: selectedCollege,
            });

            if (response.data.success) {
                const { created, skipped } = response.data.data;
                toast.success(
                    `Created ${created} subjects${skipped > 0 ? `, skipped ${skipped} duplicates` : ''}`,
                );
                onSuccess?.();
                handleClose();
            } else {
                toast.error(
                    response.data.message || 'Failed to create subjects',
                );
            }
        } catch (error) {
            console.error('Bulk Save Error:', error);
            toast.error(
                error.response?.data?.message || 'Failed to save subjects',
            );
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
        setRawText('');
        setSubjects([]);
        setShowAiSection(true);
        onClose();
    };

    return (
        <div className='fixed inset-0 z-50 overflow-y-auto'>
            <div className='flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0'>
                <div
                    className='fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75'
                    onClick={handleClose}
                ></div>
                <span
                    className='hidden sm:inline-block sm:align-middle sm:h-screen'
                    aria-hidden='true'
                >
                    &#8203;
                </span>
                <div className='inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full relative z-10'>
                    <div className='bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4'>
                        <div className='flex items-center justify-between mb-4'>
                            <h3 className='text-lg font-medium text-gray-900 dark:text-white'>
                                Bulk Add Subjects - {branch?.branchName}
                            </h3>
                            <button
                                type='button'
                                onClick={handleClose}
                                className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                            >
                                <X className='w-5 h-5' />
                            </button>
                        </div>

                        <div className='space-y-4 max-h-[70vh] overflow-y-auto'>
                            {/* AI Input Section */}
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
                                            AI Subject Parser
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
                                            Paste subject data or upload a PDF
                                            and let AI extract the subjects
                                            automatically.
                                        </p>

                                        {/* College Selector */}
                                        <div className='mb-3'>
                                            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                                Select College *
                                            </label>
                                            <select
                                                value={selectedCollege}
                                                onChange={(e) =>
                                                    setSelectedCollege(
                                                        e.target.value,
                                                    )
                                                }
                                                className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white text-sm'
                                            >
                                                <option value=''>
                                                    Select a college
                                                </option>
                                                {colleges.map((c) => (
                                                    <option
                                                        key={c._id}
                                                        value={c._id}
                                                    >
                                                        {c.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <textarea
                                            value={rawText}
                                            onChange={(e) =>
                                                setRawText(e.target.value)
                                            }
                                            className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white text-sm'
                                            placeholder={`Paste your subject data here...

Example:
Data Structures and Algorithms KCS301 Semester 3
Operating Systems KCS401 Semester 4
Database Management System KCS501 5th Sem
Computer Networks KCS601 Semester 6`}
                                            rows='6'
                                        />
                                        <div className='mt-3 flex flex-wrap gap-2'>
                                            <button
                                                type='button'
                                                onClick={handleParseWithAI}
                                                disabled={
                                                    parsing || !rawText.trim()
                                                }
                                                className='inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                                            >
                                                {parsing ? (
                                                    <>
                                                        <Loader2 className='w-4 h-4 animate-spin' />
                                                        Parsing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Sparkles className='w-4 h-4' />
                                                        Parse with AI
                                                    </>
                                                )}
                                            </button>
                                            <input
                                                ref={fileInputRef}
                                                type='file'
                                                accept='.pdf'
                                                multiple
                                                onChange={handlePDFUpload}
                                                className='hidden'
                                            />
                                            <button
                                                type='button'
                                                onClick={() =>
                                                    fileInputRef.current?.click()
                                                }
                                                disabled={parsing}
                                                className='inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                                            >
                                                <Upload className='w-4 h-4' />
                                                Upload PDFs (max 10)
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Preview Table */}
                            {subjects.length > 0 && (
                                <div className='border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden'>
                                    <div className='flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-900'>
                                        <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                                            Parsed Subjects ({subjects.length})
                                        </span>
                                        <button
                                            type='button'
                                            onClick={handleRemoveInvalid}
                                            className='text-xs text-red-600 hover:text-red-700 dark:text-red-400'
                                        >
                                            Remove Invalid
                                        </button>
                                    </div>
                                    <div className='overflow-x-auto'>
                                        <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
                                            <thead className='bg-gray-100 dark:bg-gray-800'>
                                                <tr>
                                                    <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400'>
                                                        Subject Name
                                                    </th>
                                                    <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400'>
                                                        Code
                                                    </th>
                                                    <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400'>
                                                        Semester
                                                    </th>
                                                    <th className='px-3 py-2 w-10'></th>
                                                </tr>
                                            </thead>
                                            <tbody className='bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700'>
                                                {subjects.map(
                                                    (subject, index) => {
                                                        const isInvalid =
                                                            !subject.subjectName?.trim() ||
                                                            !subject.subjectCode?.trim() ||
                                                            subject.semester <
                                                                1 ||
                                                            subject.semester >
                                                                8;
                                                        return (
                                                            <tr
                                                                key={index}
                                                                className={
                                                                    isInvalid
                                                                        ? 'bg-red-50 dark:bg-red-900/20'
                                                                        : ''
                                                                }
                                                            >
                                                                <td className='px-3 py-2'>
                                                                    <div className='flex items-center gap-1'>
                                                                        {isInvalid && (
                                                                            <AlertCircle className='w-4 h-4 text-red-500 flex-shrink-0' />
                                                                        )}
                                                                        <input
                                                                            type='text'
                                                                            value={
                                                                                subject.subjectName ||
                                                                                ''
                                                                            }
                                                                            onChange={(
                                                                                e,
                                                                            ) =>
                                                                                handleSubjectChange(
                                                                                    index,
                                                                                    'subjectName',
                                                                                    e
                                                                                        .target
                                                                                        .value,
                                                                                )
                                                                            }
                                                                            className='w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 dark:bg-gray-700 dark:text-white'
                                                                        />
                                                                    </div>
                                                                </td>
                                                                <td className='px-3 py-2'>
                                                                    <input
                                                                        type='text'
                                                                        value={
                                                                            subject.subjectCode ||
                                                                            ''
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            handleSubjectChange(
                                                                                index,
                                                                                'subjectCode',
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            )
                                                                        }
                                                                        className='w-24 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 dark:bg-gray-700 dark:text-white'
                                                                    />
                                                                </td>
                                                                <td className='px-3 py-2'>
                                                                    <select
                                                                        value={
                                                                            subject.semester ||
                                                                            1
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            handleSubjectChange(
                                                                                index,
                                                                                'semester',
                                                                                parseInt(
                                                                                    e
                                                                                        .target
                                                                                        .value,
                                                                                ),
                                                                            )
                                                                        }
                                                                        className='w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 dark:bg-gray-700 dark:text-white'
                                                                    >
                                                                        {[
                                                                            1,
                                                                            2,
                                                                            3,
                                                                            4,
                                                                            5,
                                                                            6,
                                                                            7,
                                                                            8,
                                                                        ].map(
                                                                            (
                                                                                sem,
                                                                            ) => (
                                                                                <option
                                                                                    key={
                                                                                        sem
                                                                                    }
                                                                                    value={
                                                                                        sem
                                                                                    }
                                                                                >
                                                                                    Sem{' '}
                                                                                    {
                                                                                        sem
                                                                                    }
                                                                                </option>
                                                                            ),
                                                                        )}
                                                                    </select>
                                                                </td>
                                                                <td className='px-3 py-2'>
                                                                    <button
                                                                        type='button'
                                                                        onClick={() =>
                                                                            handleDeleteSubject(
                                                                                index,
                                                                            )
                                                                        }
                                                                        className='text-red-500 hover:text-red-700'
                                                                    >
                                                                        <Trash2 className='w-4 h-4' />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    },
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className='bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse'>
                        <button
                            type='button'
                            onClick={handleSaveAll}
                            disabled={saving || subjects.length === 0}
                            className='w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed'
                        >
                            {saving ? (
                                <>
                                    <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                                    Saving...
                                </>
                            ) : (
                                `Save All (${subjects.length})`
                            )}
                        </button>
                        <button
                            type='button'
                            onClick={handleClose}
                            className='mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm'
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BulkSubjectModal;
