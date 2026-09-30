import { formatShortDate } from '../../utils/format';

export const TASK_COLUMNS = [
    { status: 'Open', title: 'Open', dot: 'bg-neutral' },
    { status: 'In Progress', title: 'In progress', dot: 'bg-brand' },
    { status: 'Completed', title: 'Completed', dot: 'bg-ok' },
];

export const TASK_TABS = [
    { value: 'my-tasks', label: 'My tasks' },
    { value: 'open-tasks', label: 'Open to pick up' },
    { value: 'all-tasks', label: 'All tasks' },
];

export const assigneeId = (task) => task.assignedTo?._id || task.assignedTo;

/** Tasks shown on each tab, matching the old tab rules. */
export const tasksForTab = (tasks, tab, userId) => {
    switch (tab) {
        case 'my-tasks':
            return tasks.filter((task) => assigneeId(task) === userId);
        case 'open-tasks':
            return tasks.filter(
                (task) => !task.assignedTo && task.status === 'Open',
            );
        default:
            return tasks;
    }
};

const DAY = 24 * 60 * 60 * 1000;

/**
 * "Due today", "Overdue · 28 Sep", "Due 2 Oct" or "No due date". Due dates
 * are stored as midnight UTC of the chosen day, so compare calendar days.
 */
export const dueInfo = (task) => {
    if (!task.dueDate) return { text: 'No due date', urgent: false };
    const due = new Date(task.dueDate);
    if (Number.isNaN(due.getTime()))
        return { text: 'No due date', urgent: false };
    const now = new Date();
    const dueDay = Date.UTC(
        due.getUTCFullYear(),
        due.getUTCMonth(),
        due.getUTCDate(),
    );
    const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const days = Math.round((dueDay - today) / DAY);
    const label = formatShortDate(
        new Date(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate()),
    );

    if (task.status === 'Completed')
        return { text: `Due ${label}`, urgent: false };
    if (days < 0) return { text: `Overdue · ${label}`, urgent: true };
    if (days === 0) return { text: 'Due today', urgent: true };
    if (days === 1) return { text: 'Due tomorrow', urgent: false };
    return { text: `Due ${label}`, urgent: false };
};
