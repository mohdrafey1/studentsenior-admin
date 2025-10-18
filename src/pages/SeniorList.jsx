import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { useSidebarLayout } from '../hooks/useSidebarLayout';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
    Users,
    ArrowLeft,
    Loader,
    Search,
    Edit2,
    Trash2,
    Eye,
    Calendar,
    User,
    Building,
    GraduationCap,
    Phone,
    Mail,
} from 'lucide-react';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';
import SeniorEditModal from '../components/SeniorEditModal';

const SeniorList = () => {
    const [seniors, setSeniors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [showModal, setShowModal] = useState(false);
    const [editingSenior, setEditingSenior] = useState(null);
    const { collegeslug } = useParams();
    const navigate = useNavigate();
    const { mainContentMargin } = useSidebarLayout();

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
                onConfirm: () => {
                    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                    resolve(true);
                },
            });
        });
    };

    const handleCloseConfirm = () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
    };

    useEffect(() => {
        fetchSeniors();
    }, [collegeslug]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchSeniors = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/senior/all/${collegeslug}`);
            setSeniors(response.data.data || []);
            setError(null);
        } catch (error) {
            console.error('Error fetching seniors:', error);
            setError('Failed to fetch seniors');
            toast.error('Failed to fetch seniors');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (senior) => {
        setEditingSenior(senior);
        setShowModal(true);
    };

    const handleDelete = async (senior) => {
        const confirmed = await showConfirm({
            title: 'Delete Senior',
            message: `Are you sure you want to delete "${senior.name}"? This action cannot be undone.`,
            variant: 'danger',
        });

        if (confirmed) {
            try {
                await api.delete(`/senior/delete/${senior._id}`);
                toast.success('Senior deleted successfully');
                fetchSeniors();
            } catch (error) {
                console.error('Error deleting senior:', error);
                toast.error('Failed to delete senior');
            }
        }
    };

    const handleView = (senior) => {
        navigate(`/${collegeslug}/seniors/${senior._id}`);
    };

    const handleModalClose = () => {
        setShowModal(false);
        setEditingSenior(null);
    };

    const handleModalSuccess = () => {
        fetchSeniors();
        handleModalClose();
    };

    // Filter seniors based on search
    const filteredSeniors = seniors.filter((senior) =>
        senior.name?.toLowerCase().includes(search.toLowerCase()),
    );

    // Pagination
    const totalItems = filteredSeniors.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const currentSeniors = filteredSeniors.slice(startIndex, endIndex);

    if (loading) {
        return (
            <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
                <Header />
                <Sidebar />
                <div className='flex items-center justify-center min-h-[60vh]'>
                    <div className='text-center'>
                        <Loader className='h-8 w-8 animate-spin text-blue-600 mx-auto mb-4' />
                        <p className='text-gray-600 dark:text-gray-400'>
                            Loading seniors...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
            <Header />
            <Sidebar />
            <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${mainContentMargin} transition-all duration-300`}>
                {/* Header Section */}
                <div className='mb-8'>
                    <button
                        onClick={() => navigate(-1)}
                        className='flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4 transition-colors'
                    >
                        <ArrowLeft className='h-4 w-4 mr-2' />
                        Back
                    </button>

                    <div className='flex items-center justify-between'>
                        <div>
                            <h1 className='text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3'>
                                <div className='p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl'>
                                    <Users className='h-8 w-8 text-white' />
                                </div>
                                Seniors
                            </h1>
                            <p className='text-gray-600 dark:text-gray-400 mt-2'>
                                Manage senior student profiles for this college
                            </p>
                        </div>
                    </div>
                </div>

                {/* Search and Stats */}
                <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6'>
                    <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
                        <div className='relative flex-1 max-w-md'>
                            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
                            <input
                                type='text'
                                placeholder='Search seniors by name...'
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                                className='w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                            />
                        </div>
                        <div className='text-sm text-gray-600 dark:text-gray-400'>
                            <span className='font-medium text-purple-600 dark:text-purple-400'>
                                {totalItems}
                            </span>{' '}
                            {totalItems === 1 ? 'senior' : 'seniors'} found
                        </div>
                    </div>
                </div>

                {/* Seniors Table */}
                {error ? (
                    <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12'>
                        <div className='text-center'>
                            <div className='w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4'>
                                <Users className='h-8 w-8 text-red-600 dark:text-red-400' />
                            </div>
                            <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2'>
                                Error Loading Seniors
                            </h3>
                            <p className='text-gray-600 dark:text-gray-400 mb-4'>
                                {error}
                            </p>
                            <button
                                onClick={fetchSeniors}
                                className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors'
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                ) : currentSeniors.length === 0 ? (
                    <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12'>
                        <div className='text-center'>
                            <div className='w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4'>
                                <Users className='h-8 w-8 text-gray-400' />
                            </div>
                            <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2'>
                                {search
                                    ? 'No seniors found'
                                    : 'No seniors available'}
                            </h3>
                            <p className='text-gray-600 dark:text-gray-400'>
                                {search
                                    ? 'Try adjusting your search criteria'
                                    : 'Senior profiles will appear here once they are added'}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden'>
                        <div className='overflow-x-auto'>
                            <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
                                <thead className='bg-gray-50 dark:bg-gray-700'>
                                    <tr>
                                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                                            Senior
                                        </th>
                                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                                            Contact
                                        </th>
                                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                                            Branch
                                        </th>
                                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                                            Year
                                        </th>
                                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                                            Date Added
                                        </th>
                                        <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className='bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700'>
                                    {currentSeniors.map((senior) => (
                                        <tr
                                            key={senior._id}
                                            onClick={() => handleView(senior)}
                                            className='hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors'
                                        >
                                            <td className='px-6 py-4 whitespace-nowrap'>
                                                <div className='flex items-center'>
                                                    <div className='flex-shrink-0 h-12 w-12'>
                                                        {senior.profilePicture ? (
                                                            <img
                                                                className='h-12 w-12 rounded-full object-cover'
                                                                src={
                                                                    senior.profilePicture
                                                                }
                                                                alt={
                                                                    senior.name
                                                                }
                                                            />
                                                        ) : (
                                                            <div className='h-12 w-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center'>
                                                                <User className='h-6 w-6 text-white' />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className='ml-4'>
                                                        <div className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                                                            {senior.name}
                                                        </div>
                                                        <div className='text-sm text-gray-500 dark:text-gray-400'>
                                                            {senior.currentPosition ||
                                                                'Student'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap'>
                                                <div className='space-y-1'>
                                                    {senior.socialMediaLinks.map(
                                                        (link) => (
                                                            <div
                                                                key={
                                                                    link.platform
                                                                }
                                                                className='flex items-center text-sm text-gray-500 dark:text-gray-400'
                                                            >
                                                                <span className='mr-2'>
                                                                    {
                                                                        link.platform
                                                                    }
                                                                    :
                                                                </span>
                                                                <a
                                                                    href={
                                                                        link.url
                                                                    }
                                                                    className='text-blue-500 hover:underline'
                                                                >
                                                                    {link.url}
                                                                </a>
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap'>
                                                <div className='flex items-center'>
                                                    <GraduationCap className='h-4 w-4 text-blue-500 mr-2' />
                                                    <span className='text-sm text-gray-900 dark:text-gray-100'>
                                                        {senior.branch
                                                            ?.branchCode ||
                                                            'Not specified'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap'>
                                                <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'>
                                                    {senior.year || 'N/A'}
                                                </span>
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap'>
                                                <div className='flex items-center text-sm text-gray-500 dark:text-gray-400'>
                                                    <Calendar className='h-4 w-4 mr-2' />
                                                    {new Date(
                                                        senior.createdAt,
                                                    ).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                                                <div className='flex items-center justify-end space-x-2'>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleView(senior);
                                                        }}
                                                        className='text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors p-1 rounded'
                                                        title='View Details'
                                                    >
                                                        <Eye className='h-4 w-4' />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEdit(senior);
                                                        }}
                                                        className='text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300 transition-colors p-1 rounded'
                                                        title='Edit Senior'
                                                    >
                                                        <Edit2 className='h-4 w-4' />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(
                                                                senior,
                                                            );
                                                        }}
                                                        className='text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors p-1 rounded'
                                                        title='Delete Senior'
                                                    >
                                                        <Trash2 className='h-4 w-4' />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className='bg-white dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700'>
                                <Pagination
                                    currentPage={page}
                                    totalPages={totalPages}
                                    onPageChange={setPage}
                                    pageSize={pageSize}
                                    onPageSizeChange={(newSize) => {
                                        setPageSize(newSize);
                                        setPage(1);
                                    }}
                                    totalItems={totalItems}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modals */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={handleCloseConfirm}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                variant={confirmModal.variant}
            />

            <SeniorEditModal
                isOpen={showModal}
                onClose={handleModalClose}
                senior={editingSenior}
                onSuccess={handleModalSuccess}
            />
        </div>
    );
};

export default SeniorList;
