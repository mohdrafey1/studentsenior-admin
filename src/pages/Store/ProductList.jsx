import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import { useSidebarLayout } from '../../hooks/useSidebarLayout';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {
    ShoppingBag,
    Edit2,
    Trash2,
    Eye,
    Package,
    CheckCircle,
} from 'lucide-react';
import Pagination from '../../components/Pagination';
import ConfirmModal from '../../components/ConfirmModal';
import ProductEditModal from '../../components/ProductEditModal';
import FilterBar from '../../components/Common/FilterBar';
import BackButton from '../../components/Common/BackButton';
import {
    filterByTime,
    getTimeFilterLabel,
} from '../../components/Common/timeFilterUtils';
import Loader from '../../components/Common/Loader';

const ProductList = () => {
    const location = useLocation();
    const { collegeslug } = useParams();
    const navigate = useNavigate();

    // Read URL params
    const params = new URLSearchParams(location.search);
    const initialSearch = params.get('search') || '';
    const initialTimeFilter = params.get('time') || '';
    const initialPage = parseInt(params.get('page')) || 1;
    const initialSubmissionStatus = params.get('submissionStatus') || '';
    const initialAvailable = params.get('available') || '';
    const initialDeleted = params.get('deleted') || '';

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState(initialSearch);
    const [page, setPage] = useState(initialPage);
    const [pageSize, setPageSize] = useState(12);
    const [timeFilter, setTimeFilter] = useState(initialTimeFilter);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const { mainContentMargin } = useSidebarLayout();

    // View mode - responsive default (small screens = grid, large screens = table)
    const [viewMode, setViewMode] = useState(() => {
        return window.innerWidth >= 1024 ? 'table' : 'grid';
    });

    // Filters state
    const [filters, setFilters] = useState({
        submissionStatus: initialSubmissionStatus,
        available: initialAvailable,
        deleted: initialDeleted,
    });
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');

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
        fetchProducts();
    }, [collegeslug]); // eslint-disable-line react-hooks/exhaustive-deps

    // Persist filters in URL
    useEffect(() => {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (timeFilter) params.set('time', timeFilter);
        if (filters.submissionStatus)
            params.set('submissionStatus', filters.submissionStatus);
        if (filters.available) params.set('available', filters.available);
        if (filters.deleted) params.set('deleted', filters.deleted);
        if (page > 1) params.set('page', page.toString());
        navigate({ search: params.toString() }, { replace: true });
    }, [search, timeFilter, filters, page, navigate]);

    // Responsive view mode - always auto-switch based on screen size
    useEffect(() => {
        const handleResize = () => {
            const newMode = window.innerWidth >= 1024 ? 'table' : 'grid';
            setViewMode(newMode);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/store/all/${collegeslug}`);
            setProducts(response.data.data || []);
            setError(null);
        } catch (error) {
            console.error('Error fetching products:', error);
            setError('Failed to fetch products');
            toast.error('Failed to fetch products');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setShowModal(true);
    };

    const handleDelete = async (product) => {
        const confirmed = await showConfirm({
            title: 'Delete Product',
            message: `Are you sure you want to delete "${product.title}"? This action cannot be undone.`,
            variant: 'danger',
        });

        if (confirmed) {
            try {
                await api.delete(`/store/delete/${product._id}`);
                toast.success('Product deleted successfully');
                fetchProducts();
            } catch (error) {
                console.error('Error deleting product:', error);
                toast.error('Failed to delete product');
            }
        }
    };

    const handleView = (product) => {
        navigate(`/${collegeslug}/products/${product._id}`);
    };

    const handleModalClose = () => {
        setShowModal(false);
        setEditingProduct(null);
    };

    const handleModalSuccess = () => {
        fetchProducts();
        handleModalClose();
    };

    // Get unique values for filters
    const uniqueStatuses = ['pending', 'approved', 'rejected'];

    // Apply filters and sorting
    const filtered = products.filter((product) => {
        const q = search.trim().toLowerCase();
        const matchesSearch =
            !q ||
            product.name?.toLowerCase().includes(q) ||
            product.description?.toLowerCase().includes(q);

        const matchesStatus =
            !filters.submissionStatus ||
            product.submissionStatus === filters.submissionStatus;

        const matchesAvailable =
            filters.available === '' ||
            (filters.available === 'true'
                ? product.available
                : !product.available);

        const matchesDeleted =
            filters.deleted === '' ||
            (filters.deleted === 'true' ? product.deleted : !product.deleted);

        // Time filter using the utility
        const matchesTime = filterByTime(product, timeFilter);

        return (
            matchesSearch &&
            matchesStatus &&
            matchesAvailable &&
            matchesDeleted &&
            matchesTime
        );
    });

    // Sort
    const sorted = [...filtered].sort((a, b) => {
        if (sortBy === 'createdAt') {
            const dateA = new Date(a.createdAt);
            const dateB = new Date(b.createdAt);
            return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        }
        if (sortBy === 'clickCounts') {
            const countA = a.clickCounts || 0;
            const countB = b.clickCounts || 0;
            return sortOrder === 'asc' ? countA - countB : countB - countA;
        }
        return 0;
    });

    const start = (page - 1) * pageSize;
    const current = sorted.slice(start, start + pageSize);

    const totalItems = sorted.length;
    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    const totalProducts = sorted.length;

    const resetFilters = () => {
        setFilters({
            submissionStatus: '',
            available: '',
            deleted: '',
        });
        setSortBy('createdAt');
        setSortOrder('desc');
    };

    const clearAllFilters = () => {
        setSearch('');
        setTimeFilter('');
        resetFilters();
        setPage(1);
    };

    const activeFiltersCount = Object.values(filters).filter(Boolean).length;

    if (loading) {
        return <Loader />;
    }

    return (
        <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
            <Header />
            <Sidebar />
            <main className='pt-6 pb-12'>
                <div
                    className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${mainContentMargin} transition-all duration-300`}
                >
                    {/* Header */}
                    <BackButton
                        title={`Products for ${collegeslug}`}
                        TitleIcon={ShoppingBag}
                    />
                    <div className='bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-3 mb-3 space-y-3'>
                        <div className='flex items-center justify-between px-2 py-1.5 bg-gray-50 dark:bg-gray-900/50 rounded text-xs'>
                            <span className='text-gray-600 dark:text-gray-400'>
                                Total ({getTimeFilterLabel(timeFilter)}):
                            </span>
                            <span className='font-semibold text-gray-900 dark:text-white'>
                                {totalProducts}
                            </span>
                        </div>

                        {/* FilterBar */}
                        <FilterBar
                            search={search}
                            onSearch={setSearch}
                            searchPlaceholder='Search by name or description...'
                            filters={[
                                {
                                    label: 'Status',
                                    value: filters.submissionStatus,
                                    onChange: (v) =>
                                        setFilters({
                                            ...filters,
                                            submissionStatus: v,
                                        }),
                                    options: [
                                        { value: '', label: 'All Statuses' },
                                        ...uniqueStatuses.map((s) => ({
                                            value: s,
                                            label: s,
                                        })),
                                    ],
                                },
                                {
                                    label: 'Availability',
                                    value: filters.available,
                                    onChange: (v) =>
                                        setFilters({
                                            ...filters,
                                            available: v,
                                        }),
                                    options: [
                                        {
                                            value: '',
                                            label: 'All (Availability)',
                                        },
                                        { value: 'true', label: 'Available' },
                                        {
                                            value: 'false',
                                            label: 'Unavailable',
                                        },
                                    ],
                                },
                                {
                                    label: 'Deleted',
                                    value: filters.deleted,
                                    onChange: (v) =>
                                        setFilters({ ...filters, deleted: v }),
                                    options: [
                                        { value: '', label: 'All (Deleted)' },
                                        { value: 'true', label: 'Deleted' },
                                        {
                                            value: 'false',
                                            label: 'Not Deleted',
                                        },
                                    ],
                                },
                            ]}
                            timeFilter={{
                                value: timeFilter,
                                onChange: (v) => {
                                    setTimeFilter(v);
                                    setPage(1);
                                },
                            }}
                            sortBy={{
                                value: sortBy,
                                onChange: setSortBy,
                                options: [
                                    {
                                        value: 'createdAt',
                                        label: 'Sort by Date',
                                    },
                                    {
                                        value: 'clickCounts',
                                        label: 'Sort by Views',
                                    },
                                ],
                            }}
                            sortOrder={{
                                value: sortOrder,
                                onToggle: () =>
                                    setSortOrder(
                                        sortOrder === 'asc' ? 'desc' : 'asc',
                                    ),
                            }}
                            viewMode={{
                                value: viewMode,
                                onChange: setViewMode,
                            }}
                            onClear={clearAllFilters}
                            showClear={
                                !!(
                                    search ||
                                    timeFilter ||
                                    activeFiltersCount > 0
                                )
                            }
                        />
                    </div>

                    {error && (
                        <div className='bg-red-50 dark:bg-red-900/50 border-l-4 border-red-500 text-red-700 dark:text-red-400 p-4 rounded-lg mb-8'>
                            {error}
                        </div>
                    )}

                    {/* Products Table View */}
                    {viewMode === 'table' && !loading && (
                        <>
                            <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden'>
                                <div className='overflow-x-auto'>
                                    <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
                                        <thead className='bg-gray-50 dark:bg-gray-700'>
                                            <tr>
                                                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                                                    Product
                                                </th>
                                                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                                                    status
                                                </th>
                                                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                                                    Price
                                                </th>
                                                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                                                    Owner
                                                </th>

                                                <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className='bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700'>
                                            {current.map((product) => (
                                                <tr
                                                    key={product._id}
                                                    onClick={() =>
                                                        handleView(product)
                                                    }
                                                    className='hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer'
                                                >
                                                    <td className='px-6 py-4 whitespace-nowrap'>
                                                        <div className='flex items-center'>
                                                            <div className='flex-shrink-0 h-12 w-12'>
                                                                {product.image ? (
                                                                    <img
                                                                        className='h-12 w-12 rounded-lg object-cover'
                                                                        src={
                                                                            product.image
                                                                        }
                                                                        alt={
                                                                            product.name
                                                                        }
                                                                    />
                                                                ) : (
                                                                    <div className='h-12 w-12 bg-gray-100 dark:bg-gray-600 rounded-lg flex items-center justify-center'>
                                                                        <Package className='h-6 w-6 text-gray-400' />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className='ml-4'>
                                                                <div className='text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-xs'>
                                                                    {
                                                                        product.name
                                                                    }
                                                                </div>
                                                                <div className='text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs'>
                                                                    {
                                                                        product.description
                                                                    }
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className='px-6 py-4 whitespace-nowrap'>
                                                        <span
                                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                product.submissionStatus ===
                                                                'approved'
                                                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                                                    : product.submissionStatus ===
                                                                        'pending'
                                                                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                                                                      : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                                                            }`}
                                                        >
                                                            <CheckCircle className='w-3 h-3 mr-1' />
                                                            {product.submissionStatus ||
                                                                'Pending Review'}
                                                        </span>
                                                        {product.clickCounts >
                                                            0 && (
                                                            <div className='flex items-center gap-1 text-gray-500 dark:text-gray-400'>
                                                                <Eye className='w-4 h-4' />
                                                                <span className='text-xs'>
                                                                    {
                                                                        product.clickCounts
                                                                    }
                                                                </span>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className='px-6 py-4 whitespace-nowrap'>
                                                        <div className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                                                            ₹
                                                            {product.price || 0}
                                                        </div>
                                                    </td>

                                                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400'>
                                                        <div>
                                                            {product.owner
                                                                ?.username ||
                                                                'N/A'}
                                                        </div>
                                                        <div className='text-xs text-gray-400 dark:text-gray-500 mt-1'>
                                                            {product.createdAt
                                                                ? new Date(
                                                                      product.createdAt,
                                                                  ).toLocaleDateString()
                                                                : 'N/A'}
                                                        </div>
                                                    </td>
                                                    <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                                                        <div className='flex items-center justify-end space-x-2'>
                                                            <button
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.stopPropagation();
                                                                    handleEdit(
                                                                        product,
                                                                    );
                                                                }}
                                                                className='text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300 transition-colors p-1 rounded'
                                                                title='Edit Product'
                                                            >
                                                                <Edit2 className='h-4 w-4' />
                                                            </button>
                                                            <button
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.stopPropagation();
                                                                    handleDelete(
                                                                        product,
                                                                    );
                                                                }}
                                                                className='text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors p-1 rounded'
                                                                title='Delete Product'
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
                                            totalItems={sorted.length}
                                        />
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* Grid View */}
                    {viewMode === 'grid' && !loading && (
                        <>
                            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
                                {current.map((product) => (
                                    <div
                                        key={product._id}
                                        onClick={() => handleView(product)}
                                        className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow cursor-pointer'
                                    >
                                        {/* Product Image */}
                                        <div className='relative h-48 bg-gray-100 dark:bg-gray-700'>
                                            {product.image ? (
                                                <img
                                                    src={product.image}
                                                    alt={product.name}
                                                    className='w-full h-full object-cover'
                                                />
                                            ) : (
                                                <div className='w-full h-full flex items-center justify-center'>
                                                    <Package className='h-16 w-16 text-gray-400' />
                                                </div>
                                            )}
                                            <div className='absolute top-2 right-2'>
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        product.submissionStatus ===
                                                        'Approved'
                                                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                                            : product.submissionStatus ===
                                                                'Pending Review'
                                                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                                                              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                                                    }`}
                                                >
                                                    <CheckCircle className='w-3 h-3 mr-1' />
                                                    {product.submissionStatus ||
                                                        'Pending Review'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Product Details */}
                                        <div className='p-4'>
                                            <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 truncate'>
                                                {product.name}
                                            </h3>
                                            <p className='text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2'>
                                                {product.description}
                                            </p>

                                            {/* Price and Views */}
                                            <div className='flex items-center justify-between mb-3'>
                                                <div className='text-xl font-bold text-green-600 dark:text-green-400'>
                                                    ₹{product.price || 0}
                                                </div>
                                                <div className='flex items-center text-sm text-gray-500 dark:text-gray-400'>
                                                    <Eye className='w-4 h-4 mr-1' />
                                                    {product.clickCounts || 0}
                                                </div>
                                            </div>

                                            {/* Owner and Date */}
                                            <div className='text-xs text-gray-500 dark:text-gray-400 mb-3'>
                                                <div>
                                                    By{' '}
                                                    {product.owner?.username ||
                                                        'N/A'}
                                                </div>
                                                <div>
                                                    {product.createdAt
                                                        ? new Date(
                                                              product.createdAt,
                                                          ).toLocaleDateString()
                                                        : 'N/A'}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            {/* Actions */}
                                            <div className='flex items-center justify-end pt-3 border-t border-gray-200 dark:border-gray-700'>
                                                <div className='flex items-center space-x-2'>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEdit(product);
                                                        }}
                                                        className='text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300 transition-colors p-1 rounded'
                                                        title='Edit Product'
                                                    >
                                                        <Edit2 className='h-4 w-4' />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(
                                                                product,
                                                            );
                                                        }}
                                                        className='text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors p-1 rounded'
                                                        title='Delete Product'
                                                    >
                                                        <Trash2 className='h-4 w-4' />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination for Grid */}
                            {totalPages > 1 && (
                                <div className='mt-6 bg-white dark:bg-gray-800 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700'>
                                    <Pagination
                                        currentPage={page}
                                        totalPages={totalPages}
                                        onPageChange={setPage}
                                        pageSize={pageSize}
                                        onPageSizeChange={(newSize) => {
                                            setPageSize(newSize);
                                            setPage(1);
                                        }}
                                        totalItems={sorted.length}
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>

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
                product={editingProduct}
                onSuccess={handleModalSuccess}
            />
        </div>
    );
};

export default ProductList;
