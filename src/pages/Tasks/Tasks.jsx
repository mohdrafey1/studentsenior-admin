import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
    ChevronDown,
    ChevronUp,
    ClipboardList,
    Minus,
    Pencil,
    Plus,
    Trash2,
} from 'lucide-react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/Common/Loader';
import ConfirmModal from '../../components/ConfirmModal';
import {
    Alert,
    Avatar,
    Button,
    EmptyState,
    PageHeader,
    Tabs,
} from '../../components/ui';
import TaskForm from './TaskForm';
import { TASK_COLUMNS, TASK_TABS, dueInfo, tasksForTab } from './tasksHelpers';

const PRIORITY = {
    High: { icon: ChevronUp, classes: 'bg-bad-soft text-bad-ink' },
    Medium: { icon: Minus, classes: 'bg-warn-soft text-warn-ink' },
    Low: { icon: ChevronDown, classes: 'bg-neutral-soft text-neutral-ink' },
};

const PriorityChip = ({ priority }) => {
    const meta = PRIORITY[priority] || PRIORITY.Medium;
    const Icon = meta.icon;
    return (
        <span
            className={`inline-flex items-center gap-1 h-[22px] pl-1.5 pr-2 rounded-md text-xs font-medium ${meta.classes}`}
        >
            <Icon className='w-3.5 h-3.5' aria-hidden='true' />
            {priority || 'Medium'}
            <span className='sr-only'> priority</span>
        </span>
    );
};

const EMPTY_COPY = {
    'my-tasks': {
        title: 'Nothing assigned to you',
        description:
            'Tasks assigned to you appear here. Pick one up from “Open to pick up” or create one.',
    },
    'open-tasks': {
        title: 'No open tasks',
        description: 'Unassigned tasks that anyone can pick up appear here.',
    },
    'all-tasks': {
        title: 'No tasks yet',
        description: 'Create a task to track work for the admin team.',
    },
};

const Tasks = () => {
    const { user: currentUser } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [users, setUsers] = useState([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [activeTab, setActiveTab] = useState('my-tasks');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [pickingId, setPickingId] = useState(null);
    const [deleting, setDeleting] = useState(null);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get('/tasks');
            if (response.data.success) {
                setTasks(response.data.data);
            }
        } catch (e) {
            console.error('Error fetching tasks:', e);
            setError(
                'Couldn’t load tasks. Check your connection and try again.',
            );
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
        } catch (e) {
            console.error('Error fetching users:', e);
        }
    };

    useEffect(() => {
        fetchTasks();
        fetchUsers();
    }, []);

    const counts = useMemo(
        () =>
            Object.fromEntries(
                TASK_TABS.map((t) => [
                    t.value,
                    currentUser
                        ? tasksForTab(tasks, t.value, currentUser.id).length
                        : 0,
                ]),
            ),
        [tasks, currentUser],
    );

    const filteredTasks = useMemo(
        () =>
            currentUser ? tasksForTab(tasks, activeTab, currentUser.id) : [],
        [tasks, activeTab, currentUser],
    );

    const handleCreateClick = () => {
        setEditingTask(null);
        setIsFormOpen(true);
    };

    const handleEditClick = (task) => {
        setEditingTask(task);
        setIsFormOpen(true);
    };

    const handleDelete = async (task) => {
        try {
            const response = await api.delete(`/tasks/${task._id}`);
            if (response.data.success) {
                toast.success('Task deleted');
                fetchTasks();
            }
        } catch (e) {
            console.error('Error deleting task:', e);
            toast.error('Couldn’t delete the task. Try again.');
        }
    };

    const handlePickUpClick = async (taskId) => {
        setPickingId(taskId);
        try {
            const response = await api.put(`/tasks/${taskId}/pick`);
            if (response.data.success) {
                toast.success('Task picked up');
                fetchTasks();
            }
        } catch (e) {
            console.error('Error picking up task:', e);
            toast.error(
                e.response?.data?.message ||
                    'Couldn’t pick up the task. Try again.',
            );
        } finally {
            setPickingId(null);
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
                toast.success(editingTask ? 'Task saved' : 'Task created');
                setIsFormOpen(false);
                fetchTasks();
            }
        } catch (e) {
            console.error('Error saving task:', e);
            toast.error(
                e.response?.data?.message ||
                    'Couldn’t save the task. Try again.',
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading && !tasks.length && !error) return <Loader />;

    const taskCard = (task) => {
        const due = dueInfo(task);
        const completed = task.status === 'Completed';
        const canPick = !task.assignedTo && task.status === 'Open';
        return (
            <article
                key={task._id}
                className={`flex flex-col gap-2.5 p-3.5 rounded-[10px] bg-sheet border border-line ${
                    completed ? 'opacity-75' : ''
                }`}
            >
                <div className='flex items-center gap-2'>
                    <PriorityChip priority={task.priority} />
                    <span className='flex-1' />
                    <span
                        className={`text-xs ${
                            due.urgent
                                ? 'font-semibold text-bad-ink'
                                : 'text-muted'
                        }`}
                    >
                        {due.text}
                    </span>
                </div>
                <h3
                    className={`text-sm font-medium leading-snug text-ink break-words ${
                        completed ? 'line-through' : ''
                    }`}
                >
                    {task.title}
                </h3>
                {task.description && (
                    <p className='text-[12.5px] leading-normal text-muted line-clamp-3 break-words'>
                        {task.description}
                    </p>
                )}
                <div className='flex items-center gap-2 pt-1'>
                    {task.assignedTo ? (
                        <>
                            <Avatar
                                name={task.assignedTo.name}
                                size='sm'
                                className='!w-6 !h-6 !text-[10px]'
                            />
                            <span className='flex-1 min-w-0 truncate text-[12.5px] text-ink-2'>
                                {task.assignedTo.name || 'Assigned'}
                            </span>
                        </>
                    ) : (
                        <span className='flex-1 text-[12.5px] text-muted'>
                            Unassigned
                        </span>
                    )}
                    {canPick && (
                        <Button
                            size='sm'
                            className='!h-7'
                            disabled={pickingId === task._id}
                            onClick={() => handlePickUpClick(task._id)}
                        >
                            {pickingId === task._id ? 'Picking up…' : 'Pick up'}
                        </Button>
                    )}
                    <Button
                        variant='ghost'
                        size='sm'
                        iconOnly
                        icon={Pencil}
                        aria-label={`Edit ${task.title}`}
                        className='!w-7 !h-7'
                        onClick={() => handleEditClick(task)}
                    />
                    <Button
                        variant='ghost'
                        size='sm'
                        iconOnly
                        icon={Trash2}
                        aria-label={`Delete ${task.title}`}
                        className='!w-7 !h-7 text-bad-ink hover:text-bad-ink'
                        onClick={() => setDeleting(task)}
                    />
                </div>
            </article>
        );
    };

    return (
        <div className='min-h-full px-4 sm:px-10 pt-8 pb-12'>
            <PageHeader
                title='Tasks'
                description='Work for the admin team. Unassigned tasks can be picked up by anyone.'
                actions={
                    <Button
                        variant='primary'
                        icon={Plus}
                        onClick={handleCreateClick}
                    >
                        New task
                    </Button>
                }
            />

            <Tabs
                label='Whose tasks'
                className='mb-5'
                value={activeTab}
                onChange={setActiveTab}
                items={TASK_TABS.map((t) => ({
                    ...t,
                    count: counts[t.value],
                }))}
            />

            {error && (
                <Alert
                    tone='bad'
                    className='mb-4'
                    action={
                        <Button size='sm' onClick={fetchTasks}>
                            Try again
                        </Button>
                    }
                >
                    {error}
                </Alert>
            )}

            {filteredTasks.length === 0 ? (
                !error && (
                    <div className='bg-sheet border border-line rounded-xl'>
                        <EmptyState
                            icon={ClipboardList}
                            title={EMPTY_COPY[activeTab].title}
                            description={EMPTY_COPY[activeTab].description}
                            action={
                                <Button icon={Plus} onClick={handleCreateClick}>
                                    New task
                                </Button>
                            }
                        />
                    </div>
                )
            ) : (
                <div className='grid grid-cols-1 lg:grid-cols-3 gap-4 items-start'>
                    {TASK_COLUMNS.map((column) => {
                        const cards = filteredTasks.filter(
                            (task) => (task.status || 'Open') === column.status,
                        );
                        const headingId = `tasks-${column.status
                            .replace(' ', '-')
                            .toLowerCase()}`;
                        return (
                            <section
                                key={column.status}
                                aria-labelledby={headingId}
                                className='flex flex-col gap-2.5 p-3 rounded-[14px] bg-sunken border border-line-soft lg:min-h-[480px]'
                            >
                                <div className='flex items-center gap-2 px-1 pt-0.5 pb-1'>
                                    <span
                                        className={`w-2 h-2 rounded-full ${column.dot}`}
                                        aria-hidden='true'
                                    />
                                    <h2
                                        id={headingId}
                                        className='flex-1 text-sm font-semibold text-ink'
                                    >
                                        {column.title}
                                    </h2>
                                    <span className='font-mono text-xs text-muted'>
                                        {cards.length}
                                    </span>
                                </div>
                                {cards.length ? (
                                    cards.map(taskCard)
                                ) : (
                                    <p className='px-3 py-6 text-center text-[13px] text-muted'>
                                        Nothing here
                                    </p>
                                )}
                            </section>
                        );
                    })}
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

            <ConfirmModal
                isOpen={Boolean(deleting)}
                onClose={() => setDeleting(null)}
                onConfirm={() => handleDelete(deleting)}
                title='Delete this task?'
                message={`“${deleting?.title || ''}” is removed for the whole team. This can’t be undone.`}
                confirmText='Delete task'
                variant='danger'
            />
        </div>
    );
};

export default Tasks;
