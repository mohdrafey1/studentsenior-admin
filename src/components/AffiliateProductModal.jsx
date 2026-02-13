import { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';

const AffiliateProductModal = ({
    isOpen,
    onClose,
    onSubmit,
    initialData = null,
    isLoading,
}) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        image: '',
        buyLink: '',
        category: 'General',
        tags: [],
        isActive: true,
    });
    const [tagInput, setTagInput] = useState('');

    const CATEGORIES = [
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
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                description: initialData.description || '',
                price: initialData.price || '',
                image: initialData.image || '',
                buyLink: initialData.buyLink || initialData.link || '',
                category: initialData.category || 'General',
                tags: initialData.tags || [],
                isActive:
                    initialData.isActive !== undefined
                        ? initialData.isActive
                        : true,
            });
        } else {
            setFormData({
                name: '',
                description: '',
                price: '',
                image: '',
                buyLink: '',
                category: 'General',
                tags: [],
                isActive: true,
            });
        }
    }, [initialData, isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const handleAddTag = (e) => {
        e.preventDefault();
        if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
            setFormData({
                ...formData,
                tags: [...formData.tags, tagInput.trim()],
            });
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove) => {
        setFormData({
            ...formData,
            tags: formData.tags.filter((tag) => tag !== tagToRemove),
        });
    };

    if (!isOpen) return null;

    return (
        <div className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto'>
            <div className='bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh]'>
                <div className='flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700'>
                    <h2 className='text-xl font-bold text-gray-900 dark:text-white'>
                        {initialData ? 'Edit Product' : 'Add New Product'}
                    </h2>
                    <button
                        onClick={onClose}
                        className='p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors'
                    >
                        <X size={20} className='text-gray-500' />
                    </button>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className='flex-1 overflow-y-auto p-6 space-y-6'
                >
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        {/* Name */}
                        <div className='space-y-2 md:col-span-2'>
                            <label className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                                Product Name
                            </label>
                            <input
                                required
                                type='text'
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        name: e.target.value,
                                    })
                                }
                                className='w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                                placeholder='e.g., Engineering Physics Textbook'
                            />
                        </div>

                        {/* Description */}
                        <div className='space-y-2 md:col-span-2'>
                            <label className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                                Description
                            </label>
                            <textarea
                                required
                                rows={3}
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        description: e.target.value,
                                    })
                                }
                                className='w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none'
                                placeholder='Product description...'
                            />
                        </div>

                        {/* Price */}
                        <div className='space-y-2'>
                            <label className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                                Price (₹)
                            </label>
                            <div className='relative'>
                                <span className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-500'>
                                    ₹
                                </span>
                                <input
                                    required
                                    type='number'
                                    min='0'
                                    value={formData.price}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            price: e.target.value,
                                        })
                                    }
                                    className='w-full pl-8 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                                    placeholder='0.00'
                                />
                            </div>
                        </div>

                        {/* Category */}
                        <div className='space-y-2'>
                            <label className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                                Category
                            </label>
                            <select
                                value={formData.category}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        category: e.target.value,
                                    })
                                }
                                className='w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                            >
                                {CATEGORIES.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {cat}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Image URL */}
                        <div className='space-y-2 md:col-span-2'>
                            <label className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                                Image URL
                            </label>
                            <div className='flex gap-2'>
                                <input
                                    required
                                    type='url'
                                    value={formData.image}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            image: e.target.value,
                                        })
                                    }
                                    className='flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                                    placeholder='https://example.com/image.jpg'
                                />
                                {formData.image && (
                                    <div className='w-12 h-12 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex-shrink-0'>
                                        <img
                                            src={formData.image}
                                            alt='Preview'
                                            className='w-full h-full object-cover'
                                            onError={(e) =>
                                                (e.target.style.display =
                                                    'none')
                                            }
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Affiliate Link */}
                        <div className='space-y-2 md:col-span-2'>
                            <label className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                                Affiliate / Buy Link
                            </label>
                            <input
                                required
                                type='url'
                                value={formData.buyLink}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        buyLink: e.target.value,
                                    })
                                }
                                className='w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                                placeholder='https://amazon.com/...'
                            />
                        </div>

                        {/* Tags */}
                        <div className='space-y-2 md:col-span-2'>
                            <label className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                                Tags
                            </label>
                            <div className='flex gap-2 mb-2'>
                                <input
                                    type='text'
                                    value={tagInput}
                                    onChange={(e) =>
                                        setTagInput(e.target.value)
                                    }
                                    onKeyDown={(e) =>
                                        e.key === 'Enter' && handleAddTag(e)
                                    }
                                    className='flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                                    placeholder='Add tags (press Enter)...'
                                />
                                <button
                                    type='button'
                                    onClick={handleAddTag}
                                    className='px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors'
                                >
                                    <Plus size={20} />
                                </button>
                            </div>
                            <div className='flex flex-wrap gap-2'>
                                {formData.tags.map((tag, index) => (
                                    <span
                                        key={index}
                                        className='inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                    >
                                        #{tag}
                                        <button
                                            type='button'
                                            onClick={() => removeTag(tag)}
                                            className='hover:text-blue-900 dark:hover:text-blue-100'
                                        >
                                            <X size={14} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Status Toggle */}
                        <div className='flex items-center gap-3 md:col-span-2'>
                            <label className='relative inline-flex items-center cursor-pointer'>
                                <input
                                    type='checkbox'
                                    checked={formData.isActive}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            isActive: e.target.checked,
                                        })
                                    }
                                    className='sr-only peer'
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                            <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                                Active (Visible to users)
                            </span>
                        </div>
                    </div>
                </form>

                <div className='p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3'>
                    <button
                        type='button'
                        onClick={onClose}
                        className='px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors'
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className='px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
                    >
                        {isLoading ? (
                            <>
                                <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                                Saving...
                            </>
                        ) : (
                            <>Save Product</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AffiliateProductModal;
