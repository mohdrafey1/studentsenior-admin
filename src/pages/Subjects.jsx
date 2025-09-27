import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
    BookOpen,
    ArrowLeft,
    Loader,
    Search,
    Plus,
    Edit2,
    Trash2,
    X,
} from 'lucide-react';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';

const Subjects = () => {
    const [subjects, setSubjects] = useState([]);
    const [courses, setCourses] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [showModal, setShowModal] = useState(false);
    const [editingSubject, setEditingSubject] = useState(null);
    const [formData, setFormData] = useState({
        subjectName: '',
        subjectCode: '',
        course: '',
        branch: '',
        semester: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();

    // Confirmation modal state
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null,
        variant: 'danger',
    });

    const showConfirm = (config) => {
        return new Promise((resolve) => {
            setConfirmModal({
                isOpen: true,
                title: config.title || 'Confirm Action',
                message: config.message,
                variant: config.variant || 'danger',
                onConfirm: () => resolve(true),
            });
        });
    };

    const closeConfirm = () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
    };

    const fetchData = async () => {
        try {
            setError(null);
            const [subjectsRes, coursesRes, branchesRes] = await Promise.all([
                api.get('/resource/subjects'),
                api.get('/resource/courses'),
                api.get('/resource/branches'),
            ]);
            setSubjects(subjectsRes.data.data || []);
            setCourses(coursesRes.data.data || []);
            setBranches(branchesRes.data.data || []);
        } catch (e) {
            console.error(e);
            setError('Failed to load data');
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Filter branches based on selected course
    const filteredBranches = branches.filter(
        (branch) => !formData.course || branch.course?._id === formData.course,
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (
            !formData.subjectName.trim() ||
            !formData.subjectCode.trim() ||
            !formData.course ||
            !formData.branch ||
            !formData.semester
        ) {
            toast.error('Please fill in all fields');
            return;
        }

        setSubmitting(true);
        try {
            if (editingSubject) {
                await api.put(
                    `/resource/subjects/${editingSubject._id}`,
                    formData,
                );
                toast.success('Subject updated successfully');
                fetchData(); // Refresh to get updated data
            } else {
                await api.post('/resource/subjects', formData);
                toast.success('Subject created successfully');
                fetchData(); // Refresh to get updated data
            }
            handleCloseModal();
        } catch (e) {
            console.error(e);
            toast.error(e.response?.data?.message || 'Operation failed');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (subject) => {
        setEditingSubject(subject);
        setFormData({
            subjectName: subject.subjectName,
            subjectCode: subject.subjectCode,
            course: subject.course?._id || '',
            branch: subject.branch?._id || '',
            semester: subject.semester || '',
        });
        setShowModal(true);
    };

    const handleDelete = async (subject) => {
        const ok = await showConfirm({
            title: 'Delete Subject',
            message: `Are you sure you want to delete "${subject.subjectName}"? This action cannot be undone.`,
            variant: 'danger',
        });
        if (!ok) return;

        try {
            await api.delete(`/resource/subjects/${subject._id}`);
            setSubjects(subjects.filter((s) => s._id !== subject._id));
            toast.success('Subject deleted successfully');
        } catch (e) {
            console.error(e);
            toast.error('Failed to delete subject');
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingSubject(null);
        setFormData({
            subjectName: '',
            subjectCode: '',
            course: '',
            branch: '',
            semester: '',
        });
    };

    const handleCourseChange = (courseId) => {
        setFormData({ ...formData, course: courseId, branch: '' }); // Reset branch when course changes
    };

    const filtered = subjects.filter((s) => {
        const q = search.trim().toLowerCase();
        return (
            !q ||
            s.subjectName?.toLowerCase().includes(q) ||
            s.subjectCode?.toLowerCase().includes(q) ||
            s.course?.courseName?.toLowerCase().includes(q) ||
            s.branch?.branchName?.toLowerCase().includes(q) ||
            s.semester?.toString().includes(q)
        );
    });

    const start = (page - 1) * pageSize;
    const current = filtered.slice(start, start + pageSize);

    if (loading) {
        return (
            <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
                <Header />
                <div className='flex items-center justify-center py-20'>
                    <div className='flex items-center space-x-2'>
                        <Loader className='w-6 h-6 animate-spin text-blue-600' />
                        <span className='text-gray-600 dark:text-gray-400'>
                            Loading subjects...
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
            <Header />
            <main className='pt-6 pb-12'>
                <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
                    {/* Header */}
                    <div className='flex items-center justify-between mb-8'>
                        <div className='flex items-center'>
                            <button
                                onClick={() => navigate('/reports')}
                                className='mr-4 p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors'
                            >
                                <ArrowLeft className='w-5 h-5' />
                            </button>
                            <div className='flex items-center'>
                                <div className='bg-blue-600 text-white p-3 rounded-lg mr-4'>
                                    <BookOpen className='w-6 h-6' />
                                </div>
                                <div>
                                    <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>
                                        Subjects
                                    </h1>
                                    <p className='text-gray-600 dark:text-gray-400 mt-1'>
                                        Manage course subjects
                                    </p>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowModal(true)}
                            className='inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                        >
                            <Plus className='w-4 h-4 mr-2' />
                            Add Subject
                        </button>
                    </div>

                    {/* Search */}
                    <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8'>
                        <div className='relative max-w-md'>
                            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
                            <input
                                type='text'
                                placeholder='Search by subject name, code, course, branch, or semester...'
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className='w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                            />
                        </div>
                    </div>

                    {error && (
                        <div className='bg-red-50 dark:bg-red-900/50 border-l-4 border-red-500 text-red-700 dark:text-red-400 p-4 rounded-lg mb-8'>
                            {error}
                        </div>
                    )}

                    {/* Subjects Table */}
                    <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden'>
                        <div className='overflow-x-auto'>
                            <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
                                <thead className='bg-gray-50 dark:bg-gray-700'>
                                    <tr>
                                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                            Subject Name
                                        </th>
                                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                            Subject Code
                                        </th>
                                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                            Course
                                        </th>
                                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                            Branch
                                        </th>
                                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                            Semester
                                        </th>
                                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                            Created
                                        </th>
                                        <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className='bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700'>
                                    {current.map((subject) => (
                                        <tr
                                            key={subject._id}
                                            className='hover:bg-gray-50 dark:hover:bg-gray-700'
                                        >
                                            <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white'>
                                                {subject.subjectName}
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white'>
                                                {subject.subjectCode}
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white'>
                                                {subject.course?.courseName ||
                                                    'N/A'}
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white'>
                                                {subject.branch?.branchName ||
                                                    'N/A'}
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white'>
                                                Semester{' '}
                                                {subject.semester || 'N/A'}
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white'>
                                                {subject.createdAt
                                                    ? new Date(
                                                          subject.createdAt,
                                                      ).toLocaleDateString()
                                                    : 'N/A'}
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                                                <div className='flex items-center justify-end space-x-2'>
                                                    <button
                                                        onClick={() =>
                                                            handleEdit(subject)
                                                        }
                                                        className='text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 p-1 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded'
                                                    >
                                                        <Edit2 className='w-4 h-4' />
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            handleDelete(
                                                                subject,
                                                            )
                                                        }
                                                        className='text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded'
                                                    >
                                                        <Trash2 className='w-4 h-4' />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className='px-4 py-3 border-t border-gray-200 dark:border-gray-700'>
                            <Pagination
                                currentPage={page}
                                pageSize={pageSize}
                                totalItems={filtered.length}
                                onPageChange={setPage}
                                onPageSizeChange={(s) => {
                                    setPageSize(s);
                                    setPage(1);
                                }}
                            />
                        </div>
                    </div>
                </div>
            </main>

            {/* Subject Modal */}
            {showModal && (
                <div className='fixed inset-0 z-50 overflow-y-auto'>
                    <div className='flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0'>
                        <div
                            className='fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75'
                            onClick={handleCloseModal}
                        ></div>
                        <span
                            className='hidden sm:inline-block sm:align-middle sm:h-screen'
                            aria-hidden='true'
                        >
                            &#8203;
                        </span>
                        <div className='inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-10'>
                            <form onSubmit={handleSubmit}>
                                <div className='bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4'>
                                    <div className='flex items-center justify-between mb-4'>
                                        <h3 className='text-lg font-medium text-gray-900 dark:text-white'>
                                            {editingSubject
                                                ? 'Edit Subject'
                                                : 'Add New Subject'}
                                        </h3>
                                        <button
                                            type='button'
                                            onClick={handleCloseModal}
                                            className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                                        >
                                            <X className='w-5 h-5' />
                                        </button>
                                    </div>
                                    <div className='space-y-4'>
                                        <div>
                                            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                                Subject Name
                                            </label>
                                            <input
                                                type='text'
                                                value={formData.subjectName}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        subjectName:
                                                            e.target.value,
                                                    })
                                                }
                                                className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                                                placeholder='Enter subject name'
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                                Subject Code
                                            </label>
                                            <input
                                                type='text'
                                                value={formData.subjectCode}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        subjectCode:
                                                            e.target.value,
                                                    })
                                                }
                                                className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                                                placeholder='Enter subject code'
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                                Course
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
                                                    Select a course
                                                </option>
                                                {courses.map((course) => (
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
                                        <div>
                                            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                                Branch
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
                                                    Select a branch
                                                </option>
                                                {filteredBranches.map(
                                                    (branch) => (
                                                        <option
                                                            key={branch._id}
                                                            value={branch._id}
                                                        >
                                                            {branch.branchName}{' '}
                                                            ({branch.branchCode}
                                                            )
                                                        </option>
                                                    ),
                                                )}
                                            </select>
                                        </div>
                                        <div>
                                            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                                Semester
                                            </label>
                                            <select
                                                value={formData.semester}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        semester:
                                                            e.target.value,
                                                    })
                                                }
                                                className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                                                required
                                            >
                                                <option value=''>
                                                    Select semester
                                                </option>
                                                {[1, 2, 3, 4, 5, 6, 7, 8].map(
                                                    (sem) => (
                                                        <option
                                                            key={sem}
                                                            value={sem}
                                                        >
                                                            Semester {sem}
                                                        </option>
                                                    ),
                                                )}
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
                                        {submitting
                                            ? 'Saving...'
                                            : editingSubject
                                              ? 'Update'
                                              : 'Create'}
                                    </button>
                                    <button
                                        type='button'
                                        onClick={handleCloseModal}
                                        className='mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm'
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={closeConfirm}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                variant={confirmModal.variant}
            />
        </div>
    );
};

export default Subjects;
