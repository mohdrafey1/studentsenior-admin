import React, { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    ExternalLink,
    Tag,
    BarChart2,
} from 'lucide-react';
import AffiliateProductModal from '../components/AffiliateProductModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import { toast } from 'react-hot-toast';
import api from '../utils/api';

const AffiliateProducts = () => {
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deleteModal, setDeleteModal] = useState({
        isOpen: false,
        productId: null,
        productName: '',
    });

    const categories = [
        'All',
        'Books',
        'Electronics',
        'Stationery',
        'Courses',
        'Gadgets',
        'Accessories',
        'Software',
        'Other',
    ];

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/affiliate-products');
            if (response.data.success) {
                setProducts(response.data.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            toast.error('Failed to fetch products');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateProduct = async (formData) => {
        try {
            setIsSubmitting(true);
            const response = await api.post('/affiliate-products', formData);
            if (response.data.success) {
                toast.success('Product created successfully');
                fetchProducts();
                setIsModalOpen(false);
            }
        } catch (error) {
            console.error('Error creating product:', error);
            toast.error(
                error.response?.data?.message || 'Failed to create product',
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateProduct = async (formData) => {
        try {
            setIsSubmitting(true);
            const response = await api.put(
                `/affiliate-products/${editingProduct._id}`,
                formData,
            );
            if (response.data.success) {
                toast.success('Product updated successfully');
                fetchProducts();
                setIsModalOpen(false);
                setEditingProduct(null);
            }
        } catch (error) {
            console.error('Error updating product:', error);
            toast.error(
                error.response?.data?.message || 'Failed to update product',
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteProduct = async () => {
        try {
            const response = await api.delete(
                `/affiliate-products/${deleteModal.productId}`,
            );
            if (response.data.success) {
                toast.success('Product deleted successfully');
                setProducts(
                    products.filter((p) => p._id !== deleteModal.productId),
                );
                setDeleteModal({
                    isOpen: false,
                    productId: null,
                    productName: '',
                });
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            toast.error('Failed to delete product');
        }
    };

    const openEditModal = (product) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    const openDeleteModal = (product) => {
        setDeleteModal({
            isOpen: true,
            productId: product._id,
            productName: product.name,
        });
    };

    const filteredProducts = products.filter((product) => {
        const matchesSearch =
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.description
                .toLowerCase()
                .includes(searchTerm.toLowerCase());
        const matchesCategory =
            selectedCategory === 'All' || product.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className='bg-gray-50 dark:bg-gray-900 min-h-screen p-6'>
            <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8'>
                <div>
                    <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>
                        Affiliate Products
                    </h1>
                    <p className='text-gray-500 dark:text-gray-400 mt-1'>
                        Manage your recommended products and track performance
                    </p>
                </div>
                <button
                    onClick={() => {
                        setEditingProduct(null);
                        setIsModalOpen(true);
                    }}
                    className='flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                >
                    <Plus size={20} />
                    Add Product
                </button>
            </div>

            {/* Filters */}
            <div className='bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6 flex flex-col md:flex-row gap-4'>
                <div className='relative flex-1'>
                    <Search
                        className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'
                        size={20}
                    />
                    <input
                        type='text'
                        placeholder='Search products...'
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className='w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                    />
                </div>
                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className='px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                >
                    {categories.map((cat) => (
                        <option key={cat} value={cat}>
                            {cat}
                        </option>
                    ))}
                </select>
            </div>

            {/* Grid */}
            {isLoading ? (
                <div className='flex justify-center items-center h-64 bg-white dark:bg-gray-800 rounded-xl'>
                    <div className='w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin' />
                </div>
            ) : (
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
                    {filteredProducts.map((product) => (
                        <div
                            key={product._id}
                            className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow group'
                        >
                            {/* Image */}
                            <div className='aspect-video w-full overflow-hidden relative bg-gray-100 dark:bg-gray-900'>
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    className='w-full h-full object-cover transition-transform group-hover:scale-105'
                                    onError={(e) => {
                                        e.target.src =
                                            'https://via.placeholder.com/300x200?text=No+Image';
                                    }}
                                />
                                <div className='absolute top-2 right-2'>
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            product.isActive
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                        }`}
                                    >
                                        {product.isActive
                                            ? 'Active'
                                            : 'Inactive'}
                                    </span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className='p-4'>
                                <div className='flex items-start justify-between gap-2 mb-2'>
                                    <h3 className='font-semibold text-gray-900 dark:text-white line-clamp-1'>
                                        {product.name}
                                    </h3>
                                    <span className='font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap'>
                                        ₹{product.price}
                                    </span>
                                </div>

                                <p className='text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 h-10'>
                                    {product.description}
                                </p>

                                <div className='flex flex-wrap gap-2 mb-4'>
                                    <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'>
                                        <Tag size={12} />
                                        {product.category}
                                    </span>
                                    <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'>
                                        <BarChart2 size={12} />
                                        {product.clicks} clicks
                                    </span>
                                </div>

                                {/* Actions */}
                                <div className='flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700'>
                                    <a
                                        href={product.buyLink || product.link}
                                        target='_blank'
                                        rel='noopener noreferrer'
                                        className='text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors'
                                        title='View Link'
                                    >
                                        <ExternalLink size={18} />
                                    </a>
                                    <div className='flex items-center gap-2'>
                                        <button
                                            onClick={() =>
                                                openEditModal(product)
                                            }
                                            className='p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all'
                                            title='Edit'
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() =>
                                                openDeleteModal(product)
                                            }
                                            className='p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all'
                                            title='Delete'
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredProducts.length === 0 && (
                        <div className='col-span-full py-12 text-center text-gray-500 dark:text-gray-400'>
                            No products found matching your filters.
                        </div>
                    )}
                </div>
            )}

            <AffiliateProductModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={
                    editingProduct ? handleUpdateProduct : handleCreateProduct
                }
                initialData={editingProduct}
                isLoading={isSubmitting}
            />

            <DeleteConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() =>
                    setDeleteModal({
                        isOpen: false,
                        productId: null,
                        productName: '',
                    })
                }
                onConfirm={handleDeleteProduct}
                itemName={deleteModal.productName}
                itemType='Product'
            />
        </div>
    );
};

export default AffiliateProducts;
