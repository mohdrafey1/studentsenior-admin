import React, { useState, useEffect } from 'react';
import {
    X,
    Save,
    Loader2,
    Calendar,
    User,
    Flag,
    Type,
    AlertCircle,
} from 'lucide-react';

const PRIORITY_OPTIONS = ['Low', 'Medium', 'High'];
const STATUS_OPTIONS = ['Open', 'In Progress', 'Completed'];

const TaskForm = ({
    isOpen,
    onClose,
    task,
    onSave,
    loading = false,
    users = [],
}) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'Medium',
        dueDate: '',
        assignedTo: '',
        status: 'Open',
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (task) {
            setFormData({
                title: task.title || '',
                description: task.description || '',
                priority: task.priority || 'Medium',
                dueDate: task.dueDate
                    ? new Date(task.dueDate).toISOString().split('T')[0]
                    : '',
                assignedTo: task.assignedTo?._id || task.assignedTo || '',
                status: task.status || 'Open',
            });
        } else {
            setFormData({
                title: '',
                description: '',
                priority: 'Medium',
                dueDate: '',
                assignedTo: '',
                status: 'Open',
            });
        }
        setErrors({});
    }, [task, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Title is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            onSave(formData);
        }
    };

    if (!isOpen) return null;

    return (
        <div className='fixed inset-0 z-[9999] overflow-y-auto'>
            <div className='flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0'>
                {/* Background overlay */}
                <div
                    className='fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity'
                    onClick={onClose}
                ></div>

                {/* Modal centering span */}
                <span
                    className='hidden sm:inline-block sm:align-middle sm:h-screen'
                    aria-hidden='true'
                >
                    &#8203;
                </span>

                {/* Modal */}
                <div className='relative inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full'>
                    {/* Header */}
                    <div className='bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700'>
                        <div className='flex items-center justify-between'>
                            <h3 className='text-lg font-medium text-gray-900 dark:text-white'>
                                {task ? 'Edit Task' : 'Create New Task'}
                            </h3>
                            <button
                                onClick={onClose}
                                className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                                disabled={loading}
                            >
                                <X className='h-6 w-6' />
                            </button>
                        </div>
                    </div>

                    {/* Form */}
                    <form
                        onSubmit={handleSubmit}
                        className='bg-white dark:bg-gray-800 px-6 py-4'
                    >
                        <div className='space-y-4'>
                            {/* Title */}
                            <div>
                                <label
                                    htmlFor='title'
                                    className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
                                >
                                    Task Title *
                                </label>
                                <div className='relative'>
                                    <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                                        <Type className='h-5 w-5 text-gray-400' />
                                    </div>
                                    <input
                                        type='text'
                                        id='title'
                                        name='title'
                                        value={formData.title}
                                        onChange={handleChange}
                                        className={`w-full pl-10 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                                            errors.title
                                                ? 'border-red-300 dark:border-red-600'
                                                : 'border-gray-300 dark:border-gray-600'
                                        }`}
                                        placeholder='Enter task title'
                                        disabled={loading}
                                    />
                                </div>
                                {errors.title && (
                                    <p className='mt-1 text-sm text-red-600'>
                                        {errors.title}
                                    </p>
                                )}
                            </div>

                            {/* Description */}
                            <div>
                                <label
                                    htmlFor='description'
                                    className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
                                >
                                    Description
                                </label>
                                <textarea
                                    id='description'
                                    name='description'
                                    rows={3}
                                    value={formData.description}
                                    onChange={handleChange}
                                    className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none'
                                    placeholder='Enter task details'
                                    disabled={loading}
                                />
                            </div>

                            <div className='grid grid-cols-2 gap-4'>
                                {/* Priority */}
                                <div>
                                    <label
                                        htmlFor='priority'
                                        className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
                                    >
                                        Priority
                                    </label>
                                    <div className='relative'>
                                        <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                                            <Flag className='h-5 w-5 text-gray-400' />
                                        </div>
                                        <select
                                            id='priority'
                                            name='priority'
                                            value={formData.priority}
                                            onChange={handleChange}
                                            className='w-full pl-10 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white appearance-none'
                                            disabled={loading}
                                        >
                                            {PRIORITY_OPTIONS.map((option) => (
                                                <option
                                                    key={option}
                                                    value={option}
                                                >
                                                    {option}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Status */}
                                <div>
                                    <label
                                        htmlFor='status'
                                        className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
                                    >
                                        Status
                                    </label>
                                    <div className='relative'>
                                        <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                                            <AlertCircle className='h-5 w-5 text-gray-400' />
                                        </div>
                                        <select
                                            id='status'
                                            name='status'
                                            value={formData.status}
                                            onChange={handleChange}
                                            className='w-full pl-10 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white appearance-none'
                                            disabled={loading}
                                        >
                                            {STATUS_OPTIONS.map((option) => (
                                                <option
                                                    key={option}
                                                    value={option}
                                                >
                                                    {option}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Due Date - Full Width */}
                            <div>
                                <label
                                    htmlFor='dueDate'
                                    className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
                                >
                                    Due Date
                                </label>
                                <div className='relative'>
                                    <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                                        <Calendar className='h-5 w-5 text-gray-400' />
                                    </div>
                                    <input
                                        type='date'
                                        id='dueDate'
                                        name='dueDate'
                                        value={formData.dueDate}
                                        onChange={handleChange}
                                        className='w-full pl-10 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            {/* Assignee */}
                            <div>
                                <label
                                    htmlFor='assignedTo'
                                    className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
                                >
                                    Assign To
                                </label>
                                <div className='relative'>
                                    <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                                        <User className='h-5 w-5 text-gray-400' />
                                    </div>
                                    <select
                                        id='assignedTo'
                                        name='assignedTo'
                                        value={formData.assignedTo}
                                        onChange={handleChange}
                                        className='w-full pl-10 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white appearance-none'
                                        disabled={loading}
                                    >
                                        <option value=''>
                                            Unassigned (Open Task)
                                        </option>
                                        {users.map((user) => (
                                            <option
                                                key={user._id}
                                                value={user._id}
                                            >
                                                {user.name} ({user.email})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
                                    Leave empty to create an open task that can
                                    be picked up by anyone.
                                </p>
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className='mt-6 flex justify-end space-x-3'>
                            <button
                                type='button'
                                onClick={onClose}
                                className='px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors'
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                type='submit'
                                className='inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                                disabled={loading}
                            >
                                {loading && (
                                    <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                                )}
                                <Save className='h-4 w-4 mr-2' />
                                {task ? 'Update Task' : 'Create Task'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default TaskForm;
