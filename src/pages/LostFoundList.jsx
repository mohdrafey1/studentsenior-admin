import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { useSidebarLayout } from '../hooks/useSidebarLayout';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
    Search as SearchIcon,
    ArrowLeft,
    Loader,
    Search,
    Edit2,
    Trash2,
    Eye,
    Calendar,
    User,
    MapPin,
    CheckCircle,
    XCircle,
    Phone,
    Clock,
} from 'lucide-react';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';
import LostFoundEditModal from '../components/LostFoundEditModal';

const LostFoundList = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
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
        fetchItems();
    }, [collegeslug]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchItems = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/lostandfound/${collegeslug}`);
            setItems(response.data.data || []);
            setError(null);
        } catch (error) {
            console.error('Error fetching lost & found items:', error);
            setError('Failed to fetch lost & found items');
            toast.error('Failed to fetch lost & found items');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setShowModal(true);
    };

    const handleDelete = async (item) => {
        const confirmed = await showConfirm({
            title: 'Delete Item',
            message: `Are you sure you want to delete "${item.title}"? This action cannot be undone.`,
            variant: 'danger',
        });

        if (confirmed) {
            try {
                await api.delete(`/lostandfound/delete/${item._id}`);
                toast.success('Item deleted successfully');
                fetchItems();
            } catch (error) {
                console.error('Error deleting item:', error);
                toast.error('Failed to delete item');
            }
        }
    };

    const handleView = (item) => {
        navigate(`/${collegeslug}/lost-found/${item._id}`);
    };

    const handleModalClose = () => {
        setShowModal(false);
        setEditingItem(null);
    };

    const handleModalSuccess = () => {
        fetchItems();
        handleModalClose();
    };

    const getTypeColor = (type) => {
        return type === 'lost'
            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
            : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    };

    const getStatusColor = (status) => {
        return status === 'open'
            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    };

    const getStatusIcon = (status) => {
        return status === 'open' ? (
            <Clock className='h-4 w-4' />
        ) : (
            <CheckCircle className='h-4 w-4' />
        );
    };

    // Filter items based on search, type, and status
    const filteredItems = items.filter((item) => {
        const matchesSearch =
            item.title?.toLowerCase().includes(search.toLowerCase()) ||
            item.description?.toLowerCase().includes(search.toLowerCase()) ||
            item.location?.toLowerCase().includes(search.toLowerCase()) ||
            item.owner?.username?.toLowerCase().includes(search.toLowerCase());

        const matchesType = typeFilter === 'all' || item.type === typeFilter;
        const matchesStatus =
            statusFilter === 'all' || item.currentStatus === statusFilter;

        return matchesSearch && matchesType && matchesStatus;
    });

    // Pagination
    const totalItems = filteredItems.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const currentItems = filteredItems.slice(startIndex, endIndex);

    if (loading) {
        return (
            <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
                <Header />
                <Sidebar />
                <div className='flex items-center justify-center min-h-[60vh]'>
                    <div className='text-center'>
                        <Loader className='h-8 w-8 animate-spin text-blue-600 mx-auto mb-4' />
                        <p className='text-gray-600 dark:text-gray-400'>
                            Loading lost & found items...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
                <Header />
                <Sidebar />
                <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${mainContentMargin} transition-all duration-300`}>
                    <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-8 text-center'>
                        <div className='text-red-600 dark:text-red-400 text-lg font-medium mb-2'>
                            Error Loading Items
                        </div>
                        <p className='text-red-500 dark:text-red-300 mb-4'>
                            {error}
                        </p>
                        <button
                            onClick={fetchItems}
                            className='bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors'
                        >
                            Try Again
                        </button>
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
                                    <SearchIcon className='h-8 w-8 text-white' />
                                </div>
                                Lost & Found
                            </h1>
                            <p className='text-gray-600 dark:text-gray-400 mt-2'>
                                Manage lost and found items for this college
                            </p>
                        </div>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6'>
                    <div className='flex flex-col lg:flex-row lg:items-center gap-4'>
                        <div className='relative flex-1 max-w-md'>
                            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
                            <input
                                type='text'
                                placeholder='Search by title, description, location...'
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                                className='w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                            />
                        </div>

                        <div className='flex flex-col sm:flex-row gap-3'>
                            <select
                                value={typeFilter}
                                onChange={(e) => {
                                    setTypeFilter(e.target.value);
                                    setPage(1);
                                }}
                                className='px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                            >
                                <option value='all'>All Types</option>
                                <option value='lost'>Lost Items</option>
                                <option value='found'>Found Items</option>
                            </select>

                            <select
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    setPage(1);
                                }}
                                className='px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                            >
                                <option value='all'>All Status</option>
                                <option value='open'>Open</option>
                                <option value='closed'>Closed</option>
                            </select>
                        </div>

                        <div className='flex items-center space-x-4 text-sm'>
                            <div className='bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg'>
                                <span className='text-blue-600 dark:text-blue-400 font-medium'>
                                    Total: {items.length}
                                </span>
                            </div>
                            <div className='bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg'>
                                <span className='text-green-600 dark:text-green-400 font-medium'>
                                    Showing: {currentItems.length}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden'>
                    {currentItems.length === 0 ? (
                        <div className='p-12 text-center'>
                            <SearchIcon className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                            <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100 mb-2'>
                                No items found
                            </h3>
                            <p className='text-gray-600 dark:text-gray-400'>
                                {search ||
                                typeFilter !== 'all' ||
                                statusFilter !== 'all'
                                    ? 'Try adjusting your search criteria'
                                    : 'No lost & found items have been submitted yet'}
                            </p>
                        </div>
                    ) : (
                        <div className='overflow-x-auto'>
                            <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
                                <thead className='bg-gray-50 dark:bg-gray-700'>
                                    <tr>
                                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                                            Item
                                        </th>
                                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                                            Type & Status
                                        </th>
                                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                                            Location & Date
                                        </th>
                                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                                            Contact
                                        </th>
                                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                                            Posted By
                                        </th>
                                        <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className='bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700'>
                                    {currentItems.map((item) => (
                                        <tr
                                            key={item._id}
                                            className='hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors'
                                            onClick={() => handleView(item)}
                                        >
                                            <td className='px-6 py-4 whitespace-nowrap'>
                                                <div className='flex items-center'>
                                                    <div className='flex-shrink-0 h-12 w-12'>
                                                        {item.imageUrl ? (
                                                            <img
                                                                src={
                                                                    item.imageUrl
                                                                }
                                                                alt={item.title}
                                                                className='h-12 w-12 rounded-lg object-cover'
                                                            />
                                                        ) : (
                                                            <div
                                                                className={`h-12 w-12 rounded-lg ${
                                                                    item.type ===
                                                                    'lost'
                                                                        ? 'bg-gradient-to-r from-red-400 to-pink-400'
                                                                        : 'bg-gradient-to-r from-green-400 to-teal-400'
                                                                } flex items-center justify-center`}
                                                            >
                                                                <SearchIcon className='h-6 w-6 text-white' />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className='ml-4'>
                                                        <div className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                                                            {item.title}
                                                        </div>
                                                        <div className='text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs'>
                                                            {item.description ||
                                                                'No description'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap'>
                                                <div className='space-y-2'>
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(
                                                            item.type,
                                                        )}`}
                                                    >
                                                        {item.type === 'lost'
                                                            ? 'Lost'
                                                            : 'Found'}
                                                    </span>
                                                    <br />
                                                    <span
                                                        className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                                            item.currentStatus,
                                                        )}`}
                                                    >
                                                        {getStatusIcon(
                                                            item.currentStatus,
                                                        )}
                                                        <span className='capitalize'>
                                                            {item.currentStatus}
                                                        </span>
                                                    </span>
                                                </div>
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap'>
                                                <div className='space-y-1'>
                                                    <div className='flex items-center text-sm text-gray-900 dark:text-gray-100'>
                                                        <MapPin className='h-4 w-4 text-blue-500 mr-2' />
                                                        <span className='truncate max-w-xs'>
                                                            {item.location ||
                                                                'Not specified'}
                                                        </span>
                                                    </div>
                                                    <div className='flex items-center text-sm text-gray-500 dark:text-gray-400'>
                                                        <Calendar className='h-4 w-4 text-gray-400 mr-2' />
                                                        {new Date(
                                                            item.date ||
                                                                item.createdAt,
                                                        ).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap'>
                                                {item.whatsapp && (
                                                    <div className='flex items-center text-sm text-gray-900 dark:text-gray-100'>
                                                        <Phone className='h-4 w-4 text-green-500 mr-2' />
                                                        <span className='truncate max-w-xs'>
                                                            {item.whatsapp}
                                                        </span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap'>
                                                <div className='flex items-center text-sm text-gray-900 dark:text-gray-100'>
                                                    <User className='h-4 w-4 text-gray-400 mr-2' />
                                                    {item.owner?.username ||
                                                        'Unknown'}
                                                </div>
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                                                <div className='flex items-center justify-end space-x-2'>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleView(item);
                                                        }}
                                                        className='text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors p-1 rounded'
                                                        title='View Details'
                                                    >
                                                        <Eye className='h-4 w-4' />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEdit(item);
                                                        }}
                                                        className='text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300 transition-colors p-1 rounded'
                                                        title='Edit Item'
                                                    >
                                                        <Edit2 className='h-4 w-4' />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(item);
                                                        }}
                                                        className='text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors p-1 rounded'
                                                        title='Delete Item'
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
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className='mt-6'>
                        <Pagination
                            currentPage={page}
                            totalPages={totalPages}
                            onPageChange={setPage}
                            pageSize={pageSize}
                            onPageSizeChange={setPageSize}
                            totalItems={totalItems}
                        />
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

            <LostFoundEditModal
                isOpen={showModal}
                onClose={handleModalClose}
                item={editingItem}
                onSuccess={handleModalSuccess}
            />
        </div>
    );
};

export default LostFoundList;
