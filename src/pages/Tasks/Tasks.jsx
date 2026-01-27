import React, { useState, useEffect, useMemo } from 'react';
import Header from '../../components/Header';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {
    CheckSquare,
    Plus,
    User,
    Calendar,
    Trash2,
    Edit2,
    Hand,
} from 'lucide-react';
import TaskForm from './TaskForm';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/Common/Loader';

const Tasks = () => {
    const { user: currentUser } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [activeTab, setActiveTab] = useState('my-tasks'); // 'my-tasks', 'open-tasks', 'all-tasks'
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const response = await api.get('/tasks');
            if (response.data.success) {
                setTasks(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching tasks:', error);
            toast.error('Failed to fetch tasks');
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await api.get('/user/dashboard-users');
            if (response.data.success) {
                setUsers(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    useEffect(() => {
        fetchTasks();
        fetchUsers();
    }, []);

    const filteredTasks = useMemo(() => {
        if (!currentUser) return [];
        switch (activeTab) {
            case 'my-tasks':
                return tasks.filter(
                    (task) =>
                        task.assignedTo?._id === currentUser.id ||
                        task.assignedTo === currentUser.id,
                );
            case 'open-tasks':
                return tasks.filter(
                    (task) => !task.assignedTo && task.status === 'Open',
                );
            case 'all-tasks':
                return tasks;
            default:
                return tasks;
        }
    }, [tasks, activeTab, currentUser]);

    const handleCreateClick = () => {
        setEditingTask(null);
        setIsFormOpen(true);
    };

    const handleEditClick = (task) => {
        setEditingTask(task);
        setIsFormOpen(true);
    };

    const handleDeleteClick = async (taskId) => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            try {
                const response = await api.delete(`/tasks/${taskId}`);
                if (response.data.success) {
                    toast.success('Task deleted successfully');
                    fetchTasks();
                }
            } catch (error) {
                console.error('Error deleting task:', error);
                toast.error('Failed to delete task');
            }
        }
    };

    const handlePickUpClick = async (taskId) => {
        try {
            const response = await api.put(`/tasks/${taskId}/pick`);
            if (response.data.success) {
                toast.success('Task picked up successfully');
                fetchTasks();
            }
        } catch (error) {
            console.error('Error picking up task:', error);
            toast.error(
                error.response?.data?.message || 'Failed to pick up task',
            );
        }
    };

    const handleSaveTask = async (formData) => {
        try {
            setIsSubmitting(true);
            let response;
            if (editingTask) {
                response = await api.put(`/tasks/${editingTask._id}`, formData);
            } else {
                response = await api.post('/tasks', formData);
            }

            if (response.data.success) {
                toast.success(
                    `Task ${editingTask ? 'updated' : 'created'} successfully`,
                );
                setIsFormOpen(false);
                fetchTasks();
            }
        } catch (error) {
            console.error('Error saving task:', error);
            toast.error(error.response?.data?.message || 'Failed to save task');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'High':
                return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
            case 'Medium':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
            case 'Low':
                return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
        }
    };

    if (loading && !tasks.length) return <Loader />;

    return (
        <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
            <Header />

            <main className={`pt-6 pb-12  transition-all duration-300`}>
                <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
                    <div className='flex justify-between items-center mb-6'>
                        <div>
                            <h1 className='text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2'>
                                <CheckSquare className='w-8 h-8 text-blue-600' />
                                Task Management
                            </h1>
                            <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
                                Manage assignments and track work progress.
                            </p>
                        </div>
                        <button
                            onClick={handleCreateClick}
                            className='inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                        >
                            <Plus className='w-4 h-4 mr-2' />
                            Create Task
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className='border-b border-gray-200 dark:border-gray-700 mb-6'>
                        <nav className='-mb-px flex space-x-8'>
                            {['My Tasks', 'Open Tasks', 'All Tasks'].map(
                                (tab) => {
                                    const tabKey = tab
                                        .toLowerCase()
                                        .replace(' ', '-');
                                    const isActive = activeTab === tabKey;
                                    return (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tabKey)}
                                            className={`${
                                                isActive
                                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                                        >
                                            {tab}
                                        </button>
                                    );
                                },
                            )}
                        </nav>
                    </div>

                    {/* Task List */}
                    {filteredTasks.length === 0 ? (
                        <div className='text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700'>
                            <CheckSquare className='mx-auto h-12 w-12 text-gray-400' />
                            <h3 className='mt-2 text-sm font-medium text-gray-900 dark:text-white'>
                                No tasks found
                            </h3>
                            <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
                                {activeTab === 'my-tasks'
                                    ? "You don't have any assigned tasks."
                                    : 'No tasks available in this category.'}
                            </p>
                        </div>
                    ) : (
                        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                            {filteredTasks.map((task) => (
                                <div
                                    key={task._id}
                                    className={`group bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden relative ${
                                        task.priority === 'High'
                                            ? 'border-l-4 border-l-red-500'
                                            : task.priority === 'Medium'
                                              ? 'border-l-4 border-l-yellow-500'
                                              : 'border-l-4 border-l-green-500'
                                    }`}
                                >
                                    <div className='p-6 flex-grow'>
                                        <div className='flex justify-between items-start mb-4'>
                                            <div className='flex items-center gap-2'>
                                                <span
                                                    className={`px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide uppercase ${
                                                        task.status ===
                                                        'Completed'
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                            : task.status ===
                                                                'In Progress'
                                                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                                                    }`}
                                                >
                                                    {task.status || 'Open'}
                                                </span>
                                            </div>
                                            {task.priority && (
                                                <span
                                                    className={`text-xs font-bold uppercase tracking-wider ${
                                                        task.priority === 'High'
                                                            ? 'text-red-600 dark:text-red-400'
                                                            : task.priority ===
                                                                'Medium'
                                                              ? 'text-yellow-600 dark:text-yellow-400'
                                                              : 'text-green-600 dark:text-green-400'
                                                    }`}
                                                >
                                                    {task.priority}
                                                </span>
                                            )}
                                        </div>

                                        <h3 className='text-xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors'>
                                            {task.title}
                                        </h3>

                                        <p className='text-sm text-gray-600 dark:text-gray-300 mb-6 line-clamp-3 leading-relaxed'>
                                            {task.description ||
                                                'No description provided.'}
                                        </p>

                                        <div className='flex items-center text-xs text-gray-500 dark:text-gray-400 mt-auto'>
                                            <Calendar className='w-4 h-4 mr-1.5' />
                                            <span className='font-medium'>
                                                Due:{' '}
                                                {task.dueDate
                                                    ? new Date(
                                                          task.dueDate,
                                                      ).toLocaleDateString(
                                                          undefined,
                                                          {
                                                              year: 'numeric',
                                                              month: 'short',
                                                              day: 'numeric',
                                                          },
                                                      )
                                                    : 'No due date'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className='bg-gray-50 dark:bg-gray-700/30 px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center'>
                                        <div className='flex items-center'>
                                            {task.assignedTo ? (
                                                <div
                                                    className='flex items-center group/user'
                                                    title={task.assignedTo.name}
                                                >
                                                    <div className='h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center text-xs font-bold ring-2 ring-white dark:ring-gray-800'>
                                                        {task.assignedTo.name?.charAt(
                                                            0,
                                                        ) || 'U'}
                                                    </div>
                                                    <span className='ml-2 text-sm font-medium text-gray-700 dark:text-gray-200 truncate max-w-[100px] group-hover/user:text-blue-600 transition-colors'>
                                                        {task.assignedTo.name}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className='flex items-center text-gray-400 italic text-sm'>
                                                    <div className='h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center'>
                                                        <User className='w-4 h-4' />
                                                    </div>
                                                    <span className='ml-2'>
                                                        Unassigned
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className='flex space-x-1'>
                                            {!task.assignedTo &&
                                                activeTab === 'open-tasks' && (
                                                    <button
                                                        onClick={() =>
                                                            handlePickUpClick(
                                                                task._id,
                                                            )
                                                        }
                                                        className='p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/40 rounded-lg transition-all duration-200'
                                                        title='Pick Up Task'
                                                    >
                                                        <Hand className='w-5 h-5' />
                                                    </button>
                                                )}
                                            <button
                                                onClick={() =>
                                                    handleEditClick(task)
                                                }
                                                className='p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition-all duration-200'
                                                title='Edit Task'
                                            >
                                                <Edit2 className='w-5 h-5' />
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleDeleteClick(task._id)
                                                }
                                                className='p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-all duration-200'
                                                title='Delete Task'
                                            >
                                                <Trash2 className='w-5 h-5' />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <TaskForm
                        isOpen={isFormOpen}
                        onClose={() => setIsFormOpen(false)}
                        task={editingTask}
                        onSave={handleSaveTask}
                        loading={isSubmitting}
                        users={users}
                    />
                </div>
            </main>
        </div>
    );
};

export default Tasks;
