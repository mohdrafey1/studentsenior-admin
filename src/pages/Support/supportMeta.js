// Labels for support tickets, shared by the inbox and the ticket pane.
// Ticket statuses read differently from the console-wide ones ("Pending"
// means "needs a reply" here), so they don't go through statusMeta.

export const TICKET_STATUS = {
    pending: { tone: 'warn', label: 'Needs reply' },
    'in-progress': { tone: 'info', label: 'In progress' },
    'awaiting-user': { tone: 'neutral', label: 'Waiting on student' },
    resolved: { tone: 'ok', label: 'Resolved' },
    closed: { tone: 'outline', label: 'Closed' },
};

export const STATUS_OPTIONS = Object.entries(TICKET_STATUS).map(
    ([value, { label }]) => ({ value, label }),
);

// The inbox opens on the work queue.
export const STATUS_TABS = [
    ['pending', 'Needs reply'],
    ['awaiting-user', 'Waiting on student'],
    ['in-progress', 'In progress'],
    ['resolved', 'Resolved'],
    ['closed', 'Closed'],
    ['all', 'All'],
];

export const CATEGORY_LABELS = {
    account: 'Account & sign-in',
    payment: 'Payments, wallet & premium',
    'content-report': 'Problem with content',
    'content-request': 'Content request',
    bug: 'App or website bug',
    feedback: 'Idea or feedback',
    other: 'Other',
};

export const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(
    ([value, label]) => ({ value, label }),
);

export const PRIORITY_OPTIONS = [
    { value: 'normal', label: 'Normal' },
    { value: 'high', label: 'High' },
];

export const SOURCE_LABELS = {
    web: 'Website',
    app: 'App',
    legacy: 'Old contact form',
};

export const SOURCE_OPTIONS = Object.entries(SOURCE_LABELS).map(
    ([value, label]) => ({ value, label }),
);

export const REPORT_REASON_LABELS = {
    broken: 'Broken link or file',
    incorrect: 'Incorrect or outdated',
    'poor-quality': 'Poor quality or unreadable',
    copyright: 'Copyright or privacy',
    inappropriate: 'Inappropriate content',
    spam: 'Spam',
    other: 'Other',
};

// Students see every staff reply under this name.
export const SUPPORT_TEAM_NAME = 'StudentSenior Support';

export const ticketRef = (ticket) =>
    ticket?.ticketNumber ? `#${ticket.ticketNumber}` : 'Ticket';

/** "@username" for students, the address for guests. */
export const requesterName = (ticket) =>
    ticket.user?.username
        ? `@${ticket.user.username}`
        : ticket.email || 'Anonymous guest';

export const describeTicketStatus = (status) =>
    TICKET_STATUS[status] || { tone: 'neutral', label: status || 'Unknown' };
