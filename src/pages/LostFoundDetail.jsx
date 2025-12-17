import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
    ArrowLeft,
    Loader,
    Edit2,
    Trash2,
    Calendar,
    MapPin,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Clock,
    Package,
    Phone,
    Image,
    Code,
    Tag,
} from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import LostFoundEditModal from '../components/LostFoundEditModal';

const LostFoundDetail = () => {
    const { collegeslug, itemid } = useParams();
    const navigate = useNavigate();
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showRawData, setShowRawData] = useState(false);
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null,
        variant: 'danger',
    });

    useEffect(() => {
        fetchItemDetails();
    }, [itemid]);

    const fetchItemDetails = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/lostandfound/${itemid}`);
            setItem(response.data.data);
        } catch (error) {
            console.error('Error fetching item details:', error);
            toast.error('Failed to load item details');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = () => {
        setShowModal(true);
    };

    const handleDelete = async () => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Item',
            message: `Are you sure you want to delete "${item.title}"? This action cannot be undone.`,
            variant: 'danger',
            onConfirm: async () => {
                try {
                    await api.delete(`/lostandfound/delete/${item._id}`);
                    toast.success('Item deleted successfully');
                    navigate(`/${collegeslug}/lost-found`);
                } catch (error) {
                    console.error('Error deleting item:', error);
                    toast.error('Failed to delete item');
                } finally {
                    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                }
            },
        });
    };

    const handleCloseConfirm = () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
    };

    const handleModalClose = () => {
        setShowModal(false);
    };

    const handleModalSuccess = () => {
        fetchItemDetails();
        setShowModal(false);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved':
                return 'bg-green-500/20 text-green-200';
            case 'pending':
                return 'bg-yellow-500/20 text-yellow-200';
            case 'rejected':
                return 'bg-red-500/20 text-red-200';
            default:
                return 'bg-gray-500/20 text-gray-200';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'approved':
                return <CheckCircle className='h-3 w-3' />;
            case 'pending':
                return <Clock className='h-3 w-3' />;
            case 'rejected':
                return <XCircle className='h-3 w-3' />;
            default:
                return <Clock className='h-3 w-3' />;
        }
    };

    const getTypeColor = (type) => {
        return type === 'lost'
            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
            : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    };

    if (loading) {
        return (
            <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
                <Header />
                <div className='flex items-center justify-center min-h-[60vh]'>
                    <Loader className='h-8 w-8 animate-spin text-purple-600' />
                </div>
            </div>
        );
    }

    if (!item) {
        return (
            <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
                <Header />
                <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
                    <div className='text-center'>
                        <h2 className='text-xl font-semibold text-gray-900 dark:text-gray-100'>
                            Item not found
                        </h2>
                        <button
                            onClick={() => navigate(-1)}
                            className='mt-4 text-purple-600 hover:text-purple-500'
                        >
                            Go back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
            <Header />
            <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
                {/* Navigation */}
                <div className='mb-6'>
                    <button
                        onClick={() => navigate(-1)}
                        className='flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors'
                    >
                        <ArrowLeft className='h-4 w-4 mr-2' />
                        Back to List
                    </button>
                </div>

                {/* Header Card */}
                <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-6'>
                    <div className='bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 px-6 py-8'>
                        <div className='flex items-center justify-between'>
                            <div className='flex items-center space-x-6'>
                                <div className='w-24 h-24 bg-white/20 rounded-2xl flex items-center justify-center overflow-hidden'>
                                    {item.imageUrl ? (
                                        <img
                                            src={item.imageUrl}
                                            alt={item.title}
                                            className='w-full h-full object-cover'
                                        />
                                    ) : (
                                        <Package className='h-12 w-12 text-white' />
                                    )}
                                </div>
                                <div>
                                    <div className='flex items-center space-x-3 mb-2'>
                                        <h1 className='text-3xl font-bold text-white'>
                                            {item.title}
                                        </h1>
                                        <span
                                            className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                                                item.submissionStatus,
                                            )} border border-white/20`}
                                        >
                                            {getStatusIcon(item.submissionStatus)}
                                            <span className='capitalize'>
                                                {item.submissionStatus}
                                            </span>
                                        </span>
                                    </div>
                                    <div className='flex items-center space-x-4 text-white/90'>
                                        <div className='flex items-center space-x-1'>
                                            <Tag className='h-4 w-4' />
                                            <span className='capitalize'>{item.type}</span>
                                        </div>
                                        <div className='flex items-center space-x-1'>
                                            <MapPin className='h-4 w-4' />
                                            <span>{item.location}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className='flex space-x-2'>
                                <button
                                    onClick={handleEdit}
                                    className='p-3 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-white'
                                    title='Edit Item'
                                >
                                    <Edit2 className='h-5 w-5' />
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className='p-3 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-white'
                                    title='Delete Item'
                                >
                                    <Trash2 className='h-5 w-5' />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className='grid lg:grid-cols-3 gap-6'>
                    {/* Main Content */}
                    <div className='lg:col-span-2 space-y-6'>
                        
                        {/* Status Alert - Only if rejected */}
                        {item.submissionStatus === 'rejected' && (
                            <div className='bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-lg'>
                                <div className='flex'>
                                    <div className='flex-shrink-0'>
                                        <AlertTriangle className='h-5 w-5 text-red-500' />
                                    </div>
                                    <div className='ml-3'>
                                        <h3 className='text-sm font-medium text-red-800 dark:text-red-200'>
                                            Rejected
                                        </h3>
                                        <div className='mt-2 text-sm text-red-700 dark:text-red-300'>
                                            <p>{item.rejectionReason}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Details */}
                        <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6'>
                            <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2'>
                                <Package className='h-5 w-5 text-purple-500' />
                                Item Details
                            </h3>
                            <div className='space-y-4'>
                                <div className='grid grid-cols-2 gap-4'>
                                    <div>
                                        <label className='text-sm text-gray-500 dark:text-gray-400 block mb-1'>Type</label>
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full uppercase ${getTypeColor(item.type)}`}>
                                            {item.type}
                                        </span>
                                    </div>
                                    <div>
                                        <label className='text-sm text-gray-500 dark:text-gray-400 block mb-1'>Current Status</label>
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full uppercase ${
                                            item.currentStatus === 'open' 
                                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                                : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                                        }`}>
                                            {item.currentStatus}
                                        </span>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className='text-sm text-gray-500 dark:text-gray-400 block mb-1'>Description</label>
                                    <p className='text-gray-900 dark:text-gray-100 whitespace-pre-wrap'>
                                        {item.description}
                                    </p>
                                </div>

                                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                    <div>
                                        <label className='text-sm text-gray-500 dark:text-gray-400 block mb-1'>WhatsApp Contact</label>
                                        <div className='flex items-center gap-2 text-gray-900 dark:text-gray-100'>
                                            <Phone className='h-4 w-4 text-green-500' />
                                            {item.whatsapp}
                                        </div>
                                    </div>
                                    <div>
                                        <label className='text-sm text-gray-500 dark:text-gray-400 block mb-1'>Date</label>
                                        <div className='flex items-center gap-2 text-gray-900 dark:text-gray-100'>
                                            <Calendar className='h-4 w-4 text-gray-500' />
                                            {new Date(item.date).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Raw Data Toggle */}
                        <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6'>
                            <div className='flex items-center justify-between mb-4'>
                                <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2'>
                                    <Code className='h-5 w-5 text-gray-500' />
                                    Raw Data
                                </h3>
                                <button
                                    onClick={() => setShowRawData(!showRawData)}
                                    className='text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium'
                                >
                                    {showRawData ? 'Hide JSON' : 'Show JSON'}
                                </button>
                            </div>
                            
                            {showRawData && (
                                <div className='bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs font-mono'>
                                    <pre>{JSON.stringify(item, null, 2)}</pre>
                                </div>
                            )}
                        </div>

                    </div>

                    {/* Sidebar */}
                    <div className='space-y-6'>
                        
                        {/* Meta Information */}
                        <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6'>
                            <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4'>
                                Meta Information
                            </h3>
                            <div className='space-y-3'>
                                <div className='flex justify-between'>
                                    <span className='text-sm text-gray-600 dark:text-gray-400'>
                                        Item ID:
                                    </span>
                                    <span className='text-sm font-mono text-gray-900 dark:text-gray-100'>
                                        {item._id.slice(-6)}
                                    </span>
                                </div>
                                <div className='flex justify-between'>
                                    <span className='text-sm text-gray-600 dark:text-gray-400'>
                                        Created:
                                    </span>
                                    <span className='text-sm text-gray-900 dark:text-gray-100'>
                                        {new Date(
                                            item.createdAt,
                                        ).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className='flex justify-between'>
                                    <span className='text-sm text-gray-600 dark:text-gray-400'>
                                        Last Updated:
                                    </span>
                                    <span className='text-sm text-gray-900 dark:text-gray-100'>
                                        {new Date(
                                            item.updatedAt || item.createdAt,
                                        ).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className='flex justify-between'>
                                    <span className='text-sm text-gray-600 dark:text-gray-400'>
                                        Deleted:
                                    </span>
                                    <span className={`text-sm ${item.deleted ? 'text-red-500' : 'text-green-500'}`}>
                                        {item.deleted ? 'Yes' : 'No'}
                                    </span>
                                </div>
                                {item.owner && (
                                    <div className='flex justify-between'>
                                        <span className='text-sm text-gray-600 dark:text-gray-400'>
                                            Posted by:
                                        </span>
                                        <span className='text-sm text-gray-900 dark:text-gray-100'>
                                            {item.owner.username || 'Unknown'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Image Preview */}
                        {item.imageUrl && (
                            <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6'>
                                <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2'>
                                    <Image className='h-5 w-5 text-purple-500' />
                                    Image
                                </h3>
                                <div className='rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700'>
                                    <img 
                                        src={item.imageUrl} 
                                        alt={item.title} 
                                        className='w-full h-auto'
                                    />
                                </div>
                            </div>
                        )}

                    </div>
                </div>
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
                item={item}
                onSuccess={handleModalSuccess}
            />
        </div>
    );
};

export default LostFoundDetail;
