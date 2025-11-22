import React, { useState, useEffect } from 'react';
import {
    X,
    Loader,
    AlertTriangle,
} from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const LostFoundEditModal = ({ isOpen, onClose, item, onSuccess }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'lost',
        location: '',
        date: '',
        currentStatus: 'open',
        imageUrl: '',
        whatsapp: '',
    });
    const [loading, setLoading] = useState(false);
    const [imageLoading, setImageLoading] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (item) {
            setFormData({
                title: item.title || '',
                description: item.description || '',
                type: item.type || 'lost',
                location: item.location || '',
                date: item.date
                    ? new Date(item.date).toISOString().split('T')[0]
                    : '',
                currentStatus: item.currentStatus || 'open',
                imageUrl: item.imageUrl || '',
                whatsapp: item.whatsapp || '',
            });
        } else {
            setFormData({
                title: '',
                description: '',
                type: 'lost',
                location: '',
                date: new Date().toISOString().split('T')[0],
                currentStatus: 'open',
                imageUrl: '',
                whatsapp: '',
            });
        }
        setErrors({});
    }, [item]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: '',
            }));
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size must be less than 5MB');
            return;
        }

        setImageLoading(true);
        try {
            const reader = new FileReader();
            reader.onload = (e) => {
                setFormData((prev) => ({
                    ...prev,
                    imageUrl: e.target.result,
                }));
                setImageLoading(false);
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Error uploading image:', error);
            toast.error('Failed to upload image');
            setImageLoading(false);
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Title is required';
        }

        if (!formData.description.trim()) {
            newErrors.description = 'Description is required';
        }

        if (!formData.location.trim()) {
            newErrors.location = 'Location is required';
        }

        if (!formData.date) {
            newErrors.date = 'Date is required';
        }

        if (!formData.whatsapp.trim()) {
            newErrors.whatsapp = 'WhatsApp number is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            if (item) {
                // Update existing item
                await api.put(`/lostandfound/edit/${item._id}`, formData);
                toast.success('Item updated successfully');
            } else {
                // Create new item
                await api.post('/lostandfound/create', formData);
                toast.success('Item created successfully');
            }
            onSuccess();
        } catch (error) {
            console.error('Error saving item:', error);
            const errorMessage =
                error.response?.data?.message || 'Failed to save item';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className='fixed inset-0 bg-black/60 backdrop-blur-sm overflow-y-auto z-50'>
            <div className='flex items-center justify-center min-h-screen p-4'>
                <div
                    className='fixed inset-0'
                    onClick={onClose}
                ></div>
                
                <div className='relative bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl'>
                    {/* Header */}
                    <div className='flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700'>
                        <div>
                            <h2 className='text-lg font-semibold text-gray-900 dark:text-white'>
                                {item ? 'Edit Lost & Found Item' : 'Create Lost & Found Item'}
                            </h2>
                            <p className='text-sm text-gray-500 dark:text-gray-400'>
                                {item?.college?.collegeName || 'Lost & Found'}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className='p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded'
                            disabled={loading}
                        >
                            <X className='h-5 w-5' />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit}>
                        <div className='p-4 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto'>
                            {/* Type and Status */}
                            <div className='grid grid-cols-2 gap-4'>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                        Type <span className='text-red-500'>*</span>
                                    </label>
                                    <select
                                        name='type'
                                        value={formData.type}
                                        onChange={handleChange}
                                        className='w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white border-gray-300 dark:border-gray-600'
                                    >
                                        <option value='lost'>Lost</option>
                                        <option value='found'>Found</option>
                                    </select>
                                </div>

                                <div>
                                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                        Status
                                    </label>
                                    <select
                                        name='currentStatus'
                                        value={formData.currentStatus}
                                        onChange={handleChange}
                                        className='w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white border-gray-300 dark:border-gray-600'
                                    >
                                        <option value='open'>Open</option>
                                        <option value='closed'>Closed</option>
                                    </select>
                                </div>
                            </div>

                            {/* Title */}
                            <div>
                                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                    Item Title <span className='text-red-500'>*</span>
                                </label>
                                <input
                                    type='text'
                                    name='title'
                                    value={formData.title}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white ${
                                        errors.title
                                            ? 'border-red-300'
                                            : 'border-gray-300 dark:border-gray-600'
                                    }`}
                                    placeholder='e.g., Black iPhone 13, Blue water bottle'
                                />
                                {errors.title && (
                                    <p className='text-xs text-red-600 mt-1 flex items-center gap-1'>
                                        <AlertTriangle className='h-3 w-3' />
                                        {errors.title}
                                    </p>
                                )}
                            </div>

                            {/* Description */}
                            <div>
                                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                    Description <span className='text-red-500'>*</span>
                                </label>
                                <textarea
                                    name='description'
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={3}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white resize-none ${
                                        errors.description
                                            ? 'border-red-300'
                                            : 'border-gray-300 dark:border-gray-600'
                                    }`}
                                    placeholder='Provide detailed description...'
                                />
                                {errors.description && (
                                    <p className='text-xs text-red-600 mt-1 flex items-center gap-1'>
                                        <AlertTriangle className='h-3 w-3' />
                                        {errors.description}
                                    </p>
                                )}
                            </div>

                            {/* Location and Date */}
                            <div className='grid grid-cols-2 gap-4'>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                        Location <span className='text-red-500'>*</span>
                                    </label>
                                    <input
                                        type='text'
                                        name='location'
                                        value={formData.location}
                                        onChange={handleChange}
                                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white ${
                                            errors.location
                                                ? 'border-red-300'
                                                : 'border-gray-300 dark:border-gray-600'
                                        }`}
                                        placeholder='e.g., Library 2nd floor'
                                    />
                                    {errors.location && (
                                        <p className='text-xs text-red-600 mt-1 flex items-center gap-1'>
                                            <AlertTriangle className='h-3 w-3' />
                                            {errors.location}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                        Date <span className='text-red-500'>*</span>
                                    </label>
                                    <input
                                        type='date'
                                        name='date'
                                        value={formData.date}
                                        onChange={handleChange}
                                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white ${
                                            errors.date
                                                ? 'border-red-300'
                                                : 'border-gray-300 dark:border-gray-600'
                                        }`}
                                    />
                                    {errors.date && (
                                        <p className='text-xs text-red-600 mt-1 flex items-center gap-1'>
                                            <AlertTriangle className='h-3 w-3' />
                                            {errors.date}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* WhatsApp Number */}
                            <div>
                                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                    WhatsApp Number <span className='text-red-500'>*</span>
                                </label>
                                <input
                                    type='text'
                                    name='whatsapp'
                                    value={formData.whatsapp}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white ${
                                        errors.whatsapp
                                            ? 'border-red-300'
                                            : 'border-gray-300 dark:border-gray-600'
                                    }`}
                                    placeholder='+1234567890'
                                />
                                {errors.whatsapp && (
                                    <p className='text-xs text-red-600 mt-1 flex items-center gap-1'>
                                        <AlertTriangle className='h-3 w-3' />
                                        {errors.whatsapp}
                                    </p>
                                )}
                            </div>

                            {/* Image URL */}
                            <div>
                                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                    Image URL
                                </label>
                                <input
                                    type='text'
                                    name='imageUrl'
                                    value={formData.imageUrl}
                                    onChange={handleChange}
                                    className='w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white border-gray-300 dark:border-gray-600'
                                    placeholder='https://example.com/image.jpg'
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className='flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700'>
                            <button
                                type='button'
                                onClick={onClose}
                                disabled={loading}
                                className='px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg disabled:opacity-50'
                            >
                                Cancel
                            </button>
                            <button
                                type='submit'
                                disabled={loading}
                                className='px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 flex items-center gap-2'
                            >
                                {loading ? (
                                    <>
                                        <Loader className='h-4 w-4 animate-spin' />
                                        Saving...
                                    </>
                                ) : (
                                    item ? 'Update' : 'Create'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LostFoundEditModal;
