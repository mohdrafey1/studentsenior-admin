import { useState, useEffect, useMemo } from 'react';
import { X, Loader2 } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const AddSubjectModal = ({
    showModal,
    editingSubject,
    branch, // Optional - when provided, branch/course selection is hidden
    colleges = [],
    courses = [], // Optional - when provided, show course dropdown
    branches = [], // Optional - when provided, show branch dropdown
    onClose,
    onSuccess,
}) => {
    const [formData, setFormData] = useState({
        subjectName: '',
        subjectCode: '',
        semester: 1,
        college: '',
        course: '',
        branch: '',
    });
    const [saving, setSaving] = useState(false);

    // Filter branches based on selected course
    const filteredBranches = useMemo(() => {
        if (!formData.course || !branches.length) return branches;
        return branches.filter(
            (b) =>
                b.course?._id === formData.course ||
                b.course === formData.course,
        );
    }, [formData.course, branches]);

    // Determine if we're in "full mode" (need course/branch selection) or "branch mode"
    const isFullMode = !branch && courses.length > 0;

    useEffect(() => {
        if (editingSubject) {
            setFormData({
                subjectName: editingSubject.subjectName || '',
                subjectCode: editingSubject.subjectCode || '',
                semester: editingSubject.semester || 1,
                college:
                    editingSubject.college?._id || editingSubject.college || '',
                course:
                    editingSubject.branch?.course?._id ||
                    editingSubject.branch?.course ||
                    '',
                branch:
                    editingSubject.branch?._id || editingSubject.branch || '',
            });
        } else {
            setFormData({
                subjectName: '',
                subjectCode: '',
                semester: 1,
                college: colleges?.[0]?._id || '',
                course: '',
                branch: branch?._id || '',
            });
        }
    }, [editingSubject, colleges, branch]);

    // When course changes, reset branch selection
    const handleCourseChange = (courseId) => {
        setFormData({
            ...formData,
            course: courseId,
            branch: '', // Reset branch when course changes
        });
    };

    if (!showModal) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.subjectName.trim() || !formData.subjectCode.trim()) {
            toast.error('Subject name and code are required');
            return;
        }

        // Determine branch ID to use
        const branchId = isFullMode ? formData.branch : branch?._id;
        if (!branchId) {
            toast.error('Please select a branch');
            return;
        }

        // Get course ID (from branch object or form selection)
        const courseId = isFullMode
            ? formData.course
            : branch?.course?._id || branch?.course;

        setSaving(true);
        try {
            if (editingSubject) {
                await api.put(`/resource/subjects/${editingSubject._id}`, {
                    subjectName: formData.subjectName,
                    subjectCode: formData.subjectCode,
                    semester: formData.semester,
                    college: formData.college,
                    branch: branchId,
                });
                toast.success('Subject updated successfully');
            } else {
                await api.post('/resource/subjects', {
                    subjectName: formData.subjectName,
                    subjectCode: formData.subjectCode,
                    semester: formData.semester,
                    college: formData.college,
                    branch: branchId,
                    course: courseId,
                });
                toast.success('Subject added successfully');
            }
            onSuccess?.();
            onClose();
        } catch (error) {
            console.error('Save error:', error);
            toast.error(
                error.response?.data?.message || 'Failed to save subject',
            );
        } finally {
            setSaving(false);
        }
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
                <div className='inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full relative z-10'>
                    <form onSubmit={handleSubmit}>
                        <div className='bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4'>
                            <div className='flex items-center justify-between mb-4'>
                                <h3 className='text-lg font-medium text-gray-900 dark:text-white'>
                                    {editingSubject
                                        ? 'Edit Subject'
                                        : 'Add Subject'}
                                </h3>
                                <button
                                    type='button'
                                    onClick={onClose}
                                    className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                                >
                                    <X className='w-5 h-5' />
                                </button>
                            </div>

                            <div className='space-y-4'>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                        Subject Name *
                                    </label>
                                    <input
                                        type='text'
                                        value={formData.subjectName}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                subjectName: e.target.value,
                                            })
                                        }
                                        className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                                        placeholder='e.g., Data Structures and Algorithms'
                                        required
                                    />
                                </div>

                                <div>
                                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                        Subject Code *
                                    </label>
                                    <input
                                        type='text'
                                        value={formData.subjectCode}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                subjectCode: e.target.value,
                                            })
                                        }
                                        className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                                        placeholder='e.g., KCS301'
                                        required
                                    />
                                </div>

                                {/* College dropdown */}
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                        College
                                    </label>
                                    <select
                                        value={formData.college}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                college: e.target.value,
                                            })
                                        }
                                        className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                                    >
                                        <option value=''>Select College</option>
                                        {colleges?.map((college) => (
                                            <option
                                                key={college._id}
                                                value={college._id}
                                            >
                                                {college.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Course dropdown - only show in full mode */}
                                {isFullMode && (
                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                            Course *
                                        </label>
                                        <select
                                            value={formData.course}
                                            onChange={(e) =>
                                                handleCourseChange(
                                                    e.target.value,
                                                )
                                            }
                                            className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                                            required
                                        >
                                            <option value=''>
                                                Select Course
                                            </option>
                                            {courses?.map((course) => (
                                                <option
                                                    key={course._id}
                                                    value={course._id}
                                                >
                                                    {course.courseName} (
                                                    {course.courseCode})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Branch dropdown - only show in full mode */}
                                {isFullMode && (
                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                            Branch *
                                        </label>
                                        <select
                                            value={formData.branch}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    branch: e.target.value,
                                                })
                                            }
                                            className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                                            required
                                            disabled={!formData.course}
                                        >
                                            <option value=''>
                                                {formData.course
                                                    ? 'Select Branch'
                                                    : 'Select course first'}
                                            </option>
                                            {filteredBranches?.map((b) => (
                                                <option
                                                    key={b._id}
                                                    value={b._id}
                                                >
                                                    {b.branchName} (
                                                    {b.branchCode})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Semester dropdown */}
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                        Semester
                                    </label>
                                    <select
                                        value={formData.semester}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                semester: parseInt(
                                                    e.target.value,
                                                ),
                                            })
                                        }
                                        className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                                    >
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                                            <option key={sem} value={sem}>
                                                Semester {sem}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className='bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse'>
                            <button
                                type='submit'
                                disabled={saving}
                                className='w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed'
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                                        Saving...
                                    </>
                                ) : editingSubject ? (
                                    'Update Subject'
                                ) : (
                                    'Add Subject'
                                )}
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

export default AddSubjectModal;
