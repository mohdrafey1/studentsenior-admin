import React, { useEffect, useId, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
    Button,
    Field,
    Input,
    Select,
    Sheet,
    Textarea,
} from '../../components/ui';

const PRIORITY_OPTIONS = [
    { value: 'Low', dot: 'bg-neutral' },
    { value: 'Medium', dot: 'bg-warn' },
    { value: 'High', dot: 'bg-bad' },
];
const STATUS_OPTIONS = [
    { value: 'Open', label: 'Open' },
    { value: 'In Progress', label: 'In progress' },
    { value: 'Completed', label: 'Completed' },
];

const EMPTY_FORM = {
    title: '',
    description: '',
    priority: 'Medium',
    dueDate: '',
    assignedTo: '',
    status: 'Open',
};

/** Side sheet for creating or editing a task. */
const TaskForm = ({
    isOpen,
    onClose,
    task,
    onSave,
    loading = false,
    users = [],
}) => {
    const { user: currentUser } = useAuth();
    const priorityLabelId = useId();
    const [formData, setFormData] = useState(EMPTY_FORM);
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
            setFormData(EMPTY_FORM);
        }
        setErrors({});
    }, [task, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.title.trim()) {
            setErrors({ title: 'Give the task a title.' });
            return;
        }
        // An empty assignee must go as null: the API can't store '' as a person.
        onSave({ ...formData, assignedTo: formData.assignedTo || null });
    };

    const assigneeOptions = users.map((u) => ({
        value: u._id,
        label:
            u._id === currentUser?.id
                ? `${u.name} (me)`
                : `${u.name}${u.email ? ` · ${u.email}` : ''}`,
    }));
    // Keep a current assignee who is no longer in the team list selectable.
    if (
        formData.assignedTo &&
        !users.some((u) => u._id === formData.assignedTo)
    ) {
        assigneeOptions.push({
            value: formData.assignedTo,
            label: task?.assignedTo?.name || 'Current assignee',
        });
    }

    return (
        <Sheet
            open={isOpen}
            onClose={onClose}
            busy={loading}
            width='max-w-[460px]'
            title={task ? 'Edit task' : 'New task'}
            footer={
                <>
                    <Button onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        type='submit'
                        form='task-form'
                        variant='primary'
                        disabled={loading}
                        icon={loading ? Loader2 : undefined}
                        className={loading ? '[&>svg]:animate-spin' : ''}
                    >
                        {loading
                            ? 'Saving…'
                            : task
                              ? 'Save changes'
                              : 'Create task'}
                    </Button>
                </>
            }
        >
            <form
                id='task-form'
                onSubmit={handleSubmit}
                noValidate
                className='flex flex-col gap-[18px]'
            >
                <Field label='Title' required error={errors.title}>
                    <Input
                        name='title'
                        value={formData.title}
                        onChange={handleChange}
                        placeholder='e.g. Add Sem 5 syllabus for BBD University'
                        disabled={loading}
                        className='h-10'
                    />
                </Field>

                <Field label='Description'>
                    <Textarea
                        name='description'
                        rows={4}
                        value={formData.description}
                        onChange={handleChange}
                        placeholder='What needs doing, and where to find what’s needed'
                        disabled={loading}
                    />
                </Field>

                <div className='flex flex-col gap-1.5'>
                    <span
                        id={priorityLabelId}
                        className='text-[13px] font-medium text-ink'
                    >
                        Priority
                    </span>
                    <div
                        role='radiogroup'
                        aria-labelledby={priorityLabelId}
                        className='grid grid-cols-3 p-[3px] rounded-[10px] bg-ground'
                    >
                        {PRIORITY_OPTIONS.map((option) => (
                            <label key={option.value} className='relative'>
                                <input
                                    type='radio'
                                    name='priority'
                                    value={option.value}
                                    checked={formData.priority === option.value}
                                    onChange={handleChange}
                                    disabled={loading}
                                    className='peer sr-only'
                                />
                                <span className='flex items-center justify-center gap-1.5 h-[34px] rounded-lg text-[13px] text-ink-2 cursor-pointer transition-colors hover:text-ink peer-checked:bg-sheet peer-checked:text-ink peer-checked:font-medium peer-checked:shadow-[0_1px_2px_rgba(28,27,24,0.08)] peer-focus-visible:ring-2 peer-focus-visible:ring-brand/40'>
                                    <span
                                        className={`w-[7px] h-[7px] rounded-full ${option.dot}`}
                                        aria-hidden='true'
                                    />
                                    {option.value}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

                <div
                    className={`grid gap-3 ${task ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}
                >
                    {/* The API sets a new task's status from its assignee, so
                        status is only editable once the task exists. */}
                    {task && (
                        <Field label='Status'>
                            <Select
                                name='status'
                                value={formData.status}
                                onChange={handleChange}
                                disabled={loading}
                                options={STATUS_OPTIONS}
                                className='h-10'
                            />
                        </Field>
                    )}
                    <Field label='Due date'>
                        <Input
                            type='date'
                            name='dueDate'
                            value={formData.dueDate}
                            onChange={handleChange}
                            disabled={loading}
                            className='h-10'
                        />
                    </Field>
                </div>

                <Field
                    label='Assign to'
                    hint={
                        task
                            ? 'Unassigned tasks appear under “Open to pick up”.'
                            : 'Unassigned tasks start as Open and appear under “Open to pick up”. Assigned ones start In progress.'
                    }
                >
                    <Select
                        name='assignedTo'
                        value={formData.assignedTo || ''}
                        onChange={handleChange}
                        disabled={loading}
                        placeholder='Nobody yet, anyone can pick it up'
                        options={assigneeOptions}
                        className='h-10'
                    />
                </Field>
            </form>
        </Sheet>
    );
};

export default TaskForm;
