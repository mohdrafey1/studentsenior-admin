// Every status string the API returns, mapped to one of five meanings:
// needs a person (warn), done (ok), refused or failed (bad),
// in progress (info), and finished or neutral (neutral/outline).
const STATUS_MAP = {
    pending: ['warn', 'Pending'],
    requested: ['warn', 'Requested'],
    approved: ['ok', 'Approved'],
    rejected: ['bad', 'Rejected'],
    captured: ['ok', 'Captured'],
    completed: ['ok', 'Completed'],
    active: ['ok', 'Active'],
    published: ['ok', 'Published'],
    resolved: ['ok', 'Resolved'],
    refunded: ['outline', 'Refunded'],
    failed: ['bad', 'Failed'],
    cancelled: ['outline', 'Cancelled'],
    expired: ['neutral', 'Expired'],
    inactive: ['neutral', 'Inactive'],
    draft: ['outline', 'Draft'],
    initiated: ['neutral', 'Initiated'],
    authorized: ['info', 'Authorized'],
    processing: ['info', 'Processing'],
    trial: ['info', 'Trial'],
    reviewing: ['info', 'Reviewing'],
    'in-progress': ['info', 'In progress'],
    'in progress': ['info', 'In progress'],
    running: ['info', 'Running'],
    queued: ['neutral', 'Queued'],
    provider_pending: ['neutral', 'Waiting for provider'],
    needs_reconciliation: ['bad', 'Needs reconciliation'],
    open: ['info', 'Open'],
    closed: ['neutral', 'Closed'],
    blocked: ['bad', 'Blocked'],
};

/** Tone and human label for an API status string. */
export const describeStatus = (status) => {
    const key = String(status || 'pending').toLowerCase();
    const [tone, label] = STATUS_MAP[key] || [
        'neutral',
        key.charAt(0).toUpperCase() + key.slice(1).replace(/[_-]/g, ' '),
    ];
    return { tone, label };
};
