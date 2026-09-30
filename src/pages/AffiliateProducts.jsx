import React, { useState, useEffect } from 'react';
import {
    ExternalLink,
    ImageOff,
    Pencil,
    Plus,
    Search,
    ShoppingBag,
    Trash2,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../utils/api';
import { formatINR, formatNumber } from '../utils/format';
import AffiliateProductModal from '../components/AffiliateProductModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import {
    Alert,
    Button,
    EmptyState,
    PageHeader,
    Skeleton,
    StatusBadge,
} from '../components/ui';

const CATEGORIES = [
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

// The admin endpoint pages its results; ask for big pages and keep going.
const PAGE_LIMIT = 100;

function ProductImage({ src, name }) {
    const [broken, setBroken] = useState(false);
    if (!src || broken) {
        return (
            <div className='w-full h-full flex items-center justify-center text-muted'>
                <ImageOff className='w-6 h-6' aria-hidden='true' />
                <span className='sr-only'>No image for {name}</span>
            </div>
        );
    }
    return (
        <img
            src={src}
            alt={name}
            loading='lazy'
            className='w-full h-full object-cover'
            onError={() => setBroken(true)}
        />
    );
}

function StatTile({ label, value, note }) {
    return (
        <div className='flex flex-col gap-2 px-5 sm:px-[22px] py-4'>
            <span className='text-[13px] text-ink-2'>{label}</span>
            <span className='font-serif font-bold text-[24px] sm:text-[26px] leading-none text-ink truncate'>
                {value}
            </span>
            {note && <span className='text-[12.5px] text-muted'>{note}</span>}
        </div>
    );
}

const AffiliateProducts = () => {
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
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
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await api.get('/affiliate-products', {
                params: { page: 1, limit: PAGE_LIMIT },
            });
            if (response.data.success) {
                let all = response.data.data.data || [];
                const pages = response.data.data.totalPages || 1;
                for (let page = 2; page <= pages; page++) {
                    const next = await api.get('/affiliate-products', {
                        params: { page, limit: PAGE_LIMIT },
                    });
                    all = all.concat(next.data.data?.data || []);
                }
                setProducts(all);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            setError(
                'Couldn’t load products. Check your connection and try again.',
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateProduct = async (formData) => {
        try {
            setIsSubmitting(true);
            const response = await api.post('/affiliate-products', formData);
            if (response.data.success) {
                toast.success('Product added');
                fetchProducts();
                setIsModalOpen(false);
            }
        } catch (error) {
            console.error('Error creating product:', error);
            toast.error(
                error.response?.data?.message ||
                    'Couldn’t add the product. Try again.',
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
                toast.success('Product saved');
                fetchProducts();
                setIsModalOpen(false);
                setEditingProduct(null);
            }
        } catch (error) {
            console.error('Error updating product:', error);
            toast.error(
                error.response?.data?.message ||
                    'Couldn’t save the product. Try again.',
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteProduct = async () => {
        try {
            setDeleting(true);
            const response = await api.delete(
                `/affiliate-products/${deleteModal.productId}`,
            );
            if (response.data.success) {
                toast.success('Product deleted');
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
            toast.error('Couldn’t delete the product. Try again.');
        } finally {
            setDeleting(false);
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
        const q = searchTerm.toLowerCase();
        const matchesSearch =
            (product.name || '').toLowerCase().includes(q) ||
            (product.description || '').toLowerCase().includes(q);
        const matchesCategory =
            selectedCategory === 'All' || product.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    // Categories used by products but missing from the fixed list (e.g. "General").
    const categories = [
        ...CATEGORIES,
        ...[...new Set(products.map((p) => p.category))].filter(
            (cat) => cat && !CATEGORIES.includes(cat),
        ),
    ];

    const activeCount = products.filter((p) => p.isActive).length;
    const totalClicks = products.reduce((n, p) => n + (p.clicks || 0), 0);
    const clicksByCategory = products.reduce((acc, p) => {
        const cat = p.category || 'Other';
        acc[cat] = (acc[cat] || 0) + (p.clicks || 0);
        return acc;
    }, {});
    const [topCategory, topClicks] = Object.entries(clicksByCategory).sort(
        (a, b) => b[1] - a[1],
    )[0] || [null, 0];

    const openCreate = () => {
        setEditingProduct(null);
        setIsModalOpen(true);
    };

    const filtersActive = Boolean(searchTerm || selectedCategory !== 'All');

    return (
        <div className='min-h-full px-4 sm:px-10 pt-8 pb-12'>
            <PageHeader
                title='Affiliate products'
                description='Products recommended to students. A click is counted each time a student opens the buy link.'
                actions={
                    <Button variant='primary' icon={Plus} onClick={openCreate}>
                        Add product
                    </Button>
                }
            />

            {error && (
                <Alert
                    tone='bad'
                    className='mb-5'
                    action={
                        <Button size='sm' onClick={fetchProducts}>
                            Try again
                        </Button>
                    }
                >
                    {error}
                </Alert>
            )}

            {!error && (
                <div className='grid grid-cols-1 sm:grid-cols-3 bg-sheet border border-line rounded-xl overflow-hidden divide-y sm:divide-y-0 sm:divide-x divide-line-soft mb-5'>
                    {isLoading ? (
                        [0, 1, 2].map((i) => (
                            <div
                                key={i}
                                className='flex flex-col gap-2.5 px-[22px] py-4'
                            >
                                <Skeleton className='h-3 w-24' />
                                <Skeleton className='h-6 w-16' />
                                <Skeleton className='h-3 w-28' />
                            </div>
                        ))
                    ) : (
                        <>
                            <StatTile
                                label='Products'
                                value={formatNumber(products.length)}
                                note={`${formatNumber(activeCount)} shown · ${formatNumber(products.length - activeCount)} hidden`}
                            />
                            <StatTile
                                label='Link clicks'
                                value={formatNumber(totalClicks)}
                                note='All time'
                            />
                            <StatTile
                                label='Most clicked category'
                                value={topClicks > 0 ? topCategory : '—'}
                                note={
                                    topClicks > 0
                                        ? `${formatNumber(topClicks)} clicks`
                                        : 'No clicks yet'
                                }
                            />
                        </>
                    )}
                </div>
            )}

            <div className='flex flex-wrap items-center gap-2.5 mb-5'>
                <div
                    role='group'
                    aria-label='Category'
                    className='flex flex-wrap gap-1.5 flex-1 min-w-0'
                >
                    {categories.map((cat) => {
                        const pressed = selectedCategory === cat;
                        return (
                            <button
                                key={cat}
                                type='button'
                                aria-pressed={pressed}
                                onClick={() => setSelectedCategory(cat)}
                                className={`h-[30px] px-3 rounded-full border text-[13px] cursor-pointer transition-colors ${
                                    pressed
                                        ? 'bg-inverse text-on-inverse border-inverse font-medium'
                                        : 'bg-sheet text-ink-2 border-line-strong hover:text-ink hover:bg-sunken'
                                }`}
                            >
                                {cat}
                            </button>
                        );
                    })}
                </div>
                <label className='flex items-center gap-2 w-full sm:w-64 h-9 px-3 rounded-lg border border-line-strong bg-sheet text-muted focus-within:ring-2 focus-within:ring-brand/30'>
                    <Search
                        className='w-[15px] h-[15px] shrink-0'
                        aria-hidden='true'
                    />
                    <input
                        type='search'
                        placeholder='Search products'
                        aria-label='Search products'
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className='flex-1 min-w-0 bg-transparent outline-none text-[13.5px] text-ink placeholder:text-muted'
                    />
                </label>
            </div>

            {isLoading ? (
                <div
                    role='status'
                    aria-label='Loading'
                    className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[18px]'
                >
                    {[0, 1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className='flex flex-col gap-3 bg-sheet border border-line rounded-xl overflow-hidden'
                        >
                            <Skeleton className='aspect-[4/3] rounded-none' />
                            <div className='flex flex-col gap-2 px-3.5 pb-4'>
                                <Skeleton className='h-3 w-4/5' />
                                <Skeleton className='h-3 w-1/2' />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className='bg-sheet border border-line rounded-xl'>
                    <EmptyState
                        icon={ShoppingBag}
                        title={
                            products.length === 0
                                ? 'No products yet'
                                : 'No products match'
                        }
                        description={
                            products.length === 0
                                ? 'Products you add appear here and in the student app.'
                                : 'Try another category or search.'
                        }
                        action={
                            products.length === 0 ? (
                                <Button
                                    variant='primary'
                                    icon={Plus}
                                    onClick={openCreate}
                                >
                                    Add product
                                </Button>
                            ) : filtersActive ? (
                                <Button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setSelectedCategory('All');
                                    }}
                                >
                                    Clear filters
                                </Button>
                            ) : undefined
                        }
                    />
                </div>
            ) : (
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[18px]'>
                    {filteredProducts.map((product) => (
                        <article
                            key={product._id}
                            className={`flex sm:flex-col bg-sheet border border-line rounded-xl overflow-hidden ${
                                product.isActive ? '' : 'opacity-75'
                            }`}
                        >
                            <div className='relative w-28 sm:w-full shrink-0 aspect-square sm:aspect-[4/3] bg-sunken'>
                                <ProductImage
                                    src={product.image}
                                    name={product.name}
                                />
                                <span className='absolute top-2 left-2 sm:top-2.5 sm:left-2.5'>
                                    {product.isActive ? (
                                        <StatusBadge tone='ok'>
                                            Shown
                                        </StatusBadge>
                                    ) : (
                                        <StatusBadge tone='outline'>
                                            Hidden
                                        </StatusBadge>
                                    )}
                                </span>
                            </div>
                            <div className='flex-1 min-w-0 flex flex-col'>
                                <div className='flex-1 flex flex-col gap-1.5 px-3.5 pt-3 pb-1.5'>
                                    <div className='flex items-baseline gap-2'>
                                        <h2 className='flex-1 min-w-0 text-[14px] font-medium leading-snug text-ink line-clamp-2'>
                                            {product.name}
                                        </h2>
                                        <span className='font-mono font-medium text-[14px] text-ink whitespace-nowrap'>
                                            {formatINR(product.price)}
                                        </span>
                                    </div>
                                    <div className='flex flex-wrap items-center gap-2 text-[12.5px] text-muted'>
                                        <span className='px-[7px] py-0.5 rounded-[5px] bg-ground text-ink-2'>
                                            {product.category}
                                        </span>
                                        <span>
                                            {formatNumber(product.clicks)} click
                                            {product.clicks === 1 ? '' : 's'}
                                        </span>
                                    </div>
                                </div>
                                <div className='flex items-center gap-0.5 px-2 pt-1 pb-2'>
                                    <a
                                        href={product.buyLink || product.link}
                                        target='_blank'
                                        rel='noopener noreferrer'
                                        className='flex-1 inline-flex items-center gap-1.5 h-[30px] px-2 rounded-[7px] text-[12.5px] font-medium text-link hover:bg-sunken'
                                    >
                                        Open buy link
                                        <ExternalLink
                                            className='w-3.5 h-3.5'
                                            aria-hidden='true'
                                        />
                                        <span className='sr-only'>
                                            for {product.name} (opens in a new
                                            tab)
                                        </span>
                                    </a>
                                    <Button
                                        variant='ghost'
                                        size='sm'
                                        iconOnly
                                        icon={Pencil}
                                        aria-label={`Edit ${product.name}`}
                                        onClick={() => openEditModal(product)}
                                    />
                                    <Button
                                        variant='ghost'
                                        size='sm'
                                        iconOnly
                                        icon={Trash2}
                                        aria-label={`Delete ${product.name}`}
                                        className='text-bad-ink hover:text-bad-ink'
                                        onClick={() => openDeleteModal(product)}
                                    />
                                </div>
                            </div>
                        </article>
                    ))}
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
                title='Delete this product?'
                message='Students stop seeing it straight away, and its click count is lost.'
                itemName={deleteModal.productName}
                loading={deleting}
            />
        </div>
    );
};

export default AffiliateProducts;
