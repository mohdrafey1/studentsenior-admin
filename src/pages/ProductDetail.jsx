import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
    Package,
    ArrowLeft,
    Loader,
    Edit2,
    Trash2,
    DollarSign,
    Tag,
    User,
    Calendar,
    Building,
    ExternalLink,
    CheckCircle2,
    Clock,
    XCircle,
    AlertTriangle,
    Eye,
    ImageIcon,
} from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import ProductEditModal from '../components/ProductEditModal';

const ProductDetail = () => {
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showRawData, setShowRawData] = useState(false);

    const { collegeslug, productid } = useParams();
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
        fetchProduct();
    }, [productid]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchProduct = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/store/${productid}`);
            setProduct(response.data.data);
            setError(null);
        } catch (error) {
            console.error('Error fetching product:', error);
            setError('Failed to fetch product details');
            toast.error('Failed to fetch product details');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = () => {
        setShowModal(true);
    };

    const handleDelete = async () => {
        const confirmed = await showConfirm({
            title: 'Delete Product',
            message: `Are you sure you want to delete "${product.title}"? This action cannot be undone.`,
            variant: 'danger',
        });

        if (confirmed) {
            try {
                await api.delete(`/store/delete/${product._id}`);
                toast.success('Product deleted successfully');
                navigate(`/${collegeslug}/products`);
            } catch (error) {
                console.error('Error deleting product:', error);
                toast.error('Failed to delete product');
            }
        }
    };

    const handleModalClose = () => {
        setShowModal(false);
    };

    const handleModalSuccess = () => {
        fetchProduct();
        handleModalClose();
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            available: {
                icon: <CheckCircle2 className='h-4 w-4' />,
                color: 'text-green-800 dark:text-green-300 bg-green-100 dark:bg-green-900/30',
                label: 'Available',
            },
            sold: {
                icon: <XCircle className='h-4 w-4' />,
                color: 'text-red-800 dark:text-red-300 bg-red-100 dark:bg-red-900/30',
                label: 'Sold',
            },
            pending: {
                icon: <Clock className='h-4 w-4' />,
                color: 'text-yellow-800 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900/30',
                label: 'Pending',
            },
        };

        const config = statusConfig[status] || statusConfig.available;
        return (
            <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
            >
                {config.icon}
                {config.label}
            </span>
        );
    };

    if (loading) {
        return (
            <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
                <Header />
                <div className='flex items-center justify-center min-h-[60vh]'>
                    <div className='text-center'>
                        <Loader className='h-8 w-8 animate-spin text-blue-600 mx-auto mb-4' />
                        <p className='text-gray-600 dark:text-gray-400'>
                            Loading product details...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
                <Header />
                <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
                    <button
                        onClick={() => navigate(-1)}
                        className='flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-6 transition-colors'
                    >
                        <ArrowLeft className='h-4 w-4 mr-2' />
                        Back
                    </button>

                    <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12'>
                        <div className='text-center'>
                            <div className='w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4'>
                                <AlertTriangle className='h-8 w-8 text-red-600 dark:text-red-400' />
                            </div>
                            <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2'>
                                Product Not Found
                            </h3>
                            <p className='text-gray-600 dark:text-gray-400 mb-4'>
                                {error ||
                                    'The requested product could not be found.'}
                            </p>
                            <button
                                onClick={() =>
                                    navigate(`/${collegeslug}/products`)
                                }
                                className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors'
                            >
                                Back to Products
                            </button>
                        </div>
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
                        Back to Products
                    </button>
                </div>

                {/* Product Header */}
                <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-6'>
                    <div className='bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 px-6 py-4'>
                        <div className='flex items-center justify-between'>
                            <div className='flex items-center space-x-3'>
                                <div className='p-2 bg-white/20 rounded-lg'>
                                    <Package className='h-6 w-6 text-white' />
                                </div>
                                <div>
                                    <h1 className='text-2xl font-bold text-white'>
                                        {product.title}
                                    </h1>
                                    <p className='text-green-100'>
                                        Product Details
                                    </p>
                                </div>
                            </div>
                            <div className='flex space-x-2'>
                                <button
                                    onClick={handleEdit}
                                    className='p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-white'
                                    title='Edit Product'
                                >
                                    <Edit2 className='h-5 w-5' />
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className='p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-white'
                                    title='Delete Product'
                                >
                                    <Trash2 className='h-5 w-5' />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className='p-6'>
                        <div className='grid lg:grid-cols-2 gap-8'>
                            {/* Product Images */}
                            <div className='space-y-4'>
                                <div className='aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden'>
                                    {product.image && (
                                        <img
                                            src={product.image}
                                            alt={product.title}
                                            className='w-full h-full object-cover'
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Product Info */}
                            <div className='space-y-6'>
                                <div>
                                    <div className='flex items-center justify-between mb-4'>
                                        <div className='flex items-center space-x-3'>
                                            <DollarSign className='h-6 w-6 text-green-500' />
                                            <span className='text-3xl font-bold text-gray-900 dark:text-gray-100'>
                                                ₹{product.price || 0}
                                            </span>
                                        </div>
                                        {getStatusBadge(
                                            product.submissionStatus,
                                        )}
                                    </div>

                                    <div className='prose prose-sm dark:prose-invert max-w-none'>
                                        <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2'>
                                            Description
                                        </h3>
                                        <p className='text-gray-600 dark:text-gray-400'>
                                            {product.description ||
                                                'No description available.'}
                                        </p>
                                    </div>
                                </div>

                                {/* Seller Information */}
                                <div className='bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4'>
                                    <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3'>
                                        Seller Information
                                    </h3>
                                    <div className='space-y-2'>
                                        <div className='flex items-center space-x-2'>
                                            <User className='h-4 w-4 text-gray-400' />
                                            <span className='text-sm text-gray-600 dark:text-gray-400'>
                                                {product.owner?.username ||
                                                    'Unknown'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Additional Details */}
                <div className='grid md:grid-cols-2 gap-6'>
                    <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6'>
                        <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4'>
                            Timestamps
                        </h3>
                        <div className='space-y-3'>
                            <div className='flex justify-between'>
                                <span className='text-gray-600 dark:text-gray-400'>
                                    Created:
                                </span>
                                <span className='text-gray-900 dark:text-gray-100'>
                                    {new Date(
                                        product.createdAt,
                                    ).toLocaleString()}
                                </span>
                            </div>
                            <div className='flex justify-between'>
                                <span className='text-gray-600 dark:text-gray-400'>
                                    Last Updated:
                                </span>
                                <span className='text-gray-900 dark:text-gray-100'>
                                    {new Date(
                                        product.updatedAt || product.createdAt,
                                    ).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Raw Data Toggle */}
                <div className='mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6'>
                    <button
                        onClick={() => setShowRawData(!showRawData)}
                        className='flex items-center justify-between w-full text-left'
                    >
                        <span className='text-sm font-medium text-gray-900 dark:text-white'>
                            Raw Data
                        </span>
                        <span className='text-xs text-blue-600 dark:text-blue-400 hover:underline'>
                            {showRawData ? 'Hide JSON' : 'Show JSON'}
                        </span>
                    </button>
                    {showRawData && (
                        <div className='mt-4'>
                            <pre className='bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto text-xs font-mono text-gray-700 dark:text-gray-300'>
                                {JSON.stringify(product, null, 2)}
                            </pre>
                        </div>
                    )}
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

            <ProductEditModal
                isOpen={showModal}
                onClose={handleModalClose}
                product={product}
                onSuccess={handleModalSuccess}
            />
        </div>
    );
};

export default ProductDetail;
