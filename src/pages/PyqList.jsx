import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import api from '../utils/api';
import { getStatusBadge } from '../utils/getStatusColor';
import toast from 'react-hot-toast';
import {
    FileText,
    ArrowLeft,
    Loader,
    Search,
    Edit2,
    Trash2,
    Calendar,
    BookOpen,
    Building,
} from 'lucide-react';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';
import PyqEditModal from '../components/PyqEditModal';

const PyqList = () => {
    const [pyqs, setPyqs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [showModal, setShowModal] = useState(false);
    const [editingPyq, setEditingPyq] = useState(null);
    const { collegeslug } = useParams();
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

    const fetchPyqs = async () => {
        try {
            setError(null);
            const response = await api.get(`/pyq/all/${collegeslug}`);
            setPyqs(response.data.data || []);
        } catch (e) {
            console.error(e);
            setError('Failed to load PYQs');
            toast.error('Failed to load PYQs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPyqs();
    }, [collegeslug]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleEdit = (pyq) => {
        setEditingPyq(pyq);
        setShowModal(true);
    };

    const handleDelete = async (pyq) => {
        const ok = await showConfirm({
            title: 'Delete PYQ',
            message: `Are you sure you want to delete this PYQ for ${pyq.subject?.subjectName}? This action cannot be undone.`,
            variant: 'danger',
        });
        if (!ok) return;

        try {
            await api.delete(`/pyq/delete/${pyq._id}`);
            setPyqs(pyqs.filter((p) => p._id !== pyq._id));
            toast.success('PYQ deleted successfully');
        } catch (e) {
            console.error(e);
            toast.error('Failed to delete PYQ');
        }
    };

    const handleView = (pyq) => {
        navigate(`/${collegeslug}/pyqs/${pyq._id}`);
    };

    const filtered = pyqs.filter((p) => {
        const q = search.trim().toLowerCase();
        return (
            !q ||
            p.subject?.subjectName?.toLowerCase().includes(q) ||
            p.subject?.subjectCode?.toLowerCase().includes(q) ||
            p.subject?.branch?.branchName?.toLowerCase().includes(q) ||
            p.subject?.branch?.course?.courseName?.toLowerCase().includes(q) ||
            p.year?.toString().includes(q) ||
            p.examType?.toLowerCase().includes(q) ||
            p.submissionStatus?.toLowerCase().includes(q)
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
                            Loading PYQs...
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
                                onClick={() => navigate(`/${collegeslug}`)}
                                className='mr-4 p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors'
                            >
                                <ArrowLeft className='w-5 h-5' />
                            </button>
                            <div className='flex items-center'>
                                <div className='bg-purple-600 text-white p-3 rounded-lg mr-4'>
                                    <FileText className='w-6 h-6' />
                                </div>
                                <div>
                                    <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>
                                        Previous Year Questions
                                    </h1>
                                    <p className='text-gray-600 dark:text-gray-400 mt-1'>
                                        Manage PYQs for {collegeslug}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Search */}
                    <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8'>
                        <div className='relative max-w-md'>
                            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
                            <input
                                type='text'
                                placeholder='Search by subject, course, branch, year, or exam type...'
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

                    {/* PYQs Table */}
                    <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden'>
                        <div className='overflow-x-auto'>
                            <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
                                <thead className='bg-gray-50 dark:bg-gray-700'>
                                    <tr>
                                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                            Subject Details
                                        </th>
                                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                            Year & Exam
                                        </th>
                                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                            Status
                                        </th>
                                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                            Price
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
                                    {current.map((pyq) => (
                                        <tr
                                            key={pyq._id}
                                            className='hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer'
                                            onClick={() => handleView(pyq)}
                                        >
                                            <td className='px-6 py-4 whitespace-nowrap'>
                                                <div className='flex items-center'>
                                                    <div className='flex-shrink-0 h-10 w-10'>
                                                        <div className='h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center'>
                                                            <BookOpen className='h-5 w-5 text-indigo-600 dark:text-indigo-400' />
                                                        </div>
                                                    </div>
                                                    <div className='ml-4'>
                                                        <div className='text-sm font-medium text-gray-900 dark:text-white'>
                                                            {pyq.subject
                                                                ?.subjectName ||
                                                                'N/A'}
                                                        </div>
                                                        <div className='text-sm text-gray-500 dark:text-gray-400'>
                                                            {
                                                                pyq.subject
                                                                    ?.subjectCode
                                                            }{' '}
                                                            • Sem{' '}
                                                            {
                                                                pyq.subject
                                                                    ?.semester
                                                            }
                                                        </div>
                                                        <div className='text-xs text-gray-400 dark:text-gray-500 flex items-center mt-1'>
                                                            <Building className='w-3 h-3 mr-1' />
                                                            {
                                                                pyq.subject
                                                                    ?.branch
                                                                    ?.branchCode
                                                            }{' '}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap'>
                                                <div className='flex items-center'>
                                                    <Calendar className='w-4 h-4 text-gray-400 mr-2' />
                                                    <div>
                                                        <div className='text-sm text-gray-900 dark:text-white'>
                                                            {pyq.year || 'N/A'}
                                                        </div>
                                                        <div className='text-sm text-gray-500 dark:text-gray-400'>
                                                            {pyq.examType ||
                                                                'N/A'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap'>
                                                <span
                                                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(
                                                        pyq.submissionStatus,
                                                    )}`}
                                                >
                                                    {pyq.submissionStatus ||
                                                        'pending'}
                                                </span>
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white'>
                                                <div className='text-sm text-gray-500 dark:text-gray-400'>
                                                    {pyq.price > 0
                                                        ? `₹${pyq.price / 5} `
                                                        : 'Free'}
                                                </div>
                                                <div className='text-xs text-gray-400 dark:text-gray-500 flex items-center mt-1'>
                                                    {pyq.solved
                                                        ? 'Solved'
                                                        : 'Unsolved'}{' '}
                                                </div>
                                            </td>

                                            <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white'>
                                                <div className='text-sm text-gray-500 dark:text-gray-400'>
                                                    {pyq.createdAt
                                                        ? new Date(
                                                              pyq.createdAt,
                                                          ).toLocaleString()
                                                        : 'N/A'}
                                                </div>
                                                <div className='text-xs text-gray-400 dark:text-gray-500 flex items-center mt-1'>
                                                    By-
                                                    {pyq.owner?.username ||
                                                        'N/A'}
                                                </div>
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                                                <div className='flex items-center justify-end space-x-2'>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEdit(pyq);
                                                        }}
                                                        className='text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 p-1 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded'
                                                        title='Edit PYQ'
                                                    >
                                                        <Edit2 className='w-4 h-4' />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(pyq);
                                                        }}
                                                        className='text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded'
                                                        title='Delete PYQ'
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

            <PyqEditModal
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    setEditingPyq(null);
                }}
                pyq={editingPyq}
                onSuccess={(updatedPyq) => {
                    setPyqs(
                        pyqs.map((p) =>
                            p._id === updatedPyq._id ? updatedPyq : p,
                        ),
                    );
                    setShowModal(false);
                    setEditingPyq(null);
                }}
            />

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

export default PyqList;
