// New-content alerts: pure helpers shared by the approval, quick note, import
// and notification pages. The API sends at most one alert per branch and
// semester for each request, and never announces an item twice.
import { formatNumber, formatShortDateTime } from './format.js';

/** Each admin's last "Notify students" choice, per browser. On by default. */
export const NOTIFY_PREF_KEY = 'ss_admin_notify_on_approve';

/** The API accepts up to this many items per request. */
export const MAX_ALERT_ITEMS = 200;

const plural = (n, one, many = `${one}s`) =>
    `${formatNumber(n)} ${n === 1 ? one : many}`;

const defaultStorage = () => {
    try {
        return globalThis.localStorage;
    } catch {
        return undefined;
    }
};

export function readNotifyPref(storage = defaultStorage()) {
    try {
        return storage?.getItem(NOTIFY_PREF_KEY) !== 'false';
    } catch {
        return true;
    }
}

export function storeNotifyPref(on, storage = defaultStorage()) {
    try {
        storage?.setItem(NOTIFY_PREF_KEY, on ? 'true' : 'false');
    } catch {
        // Private mode: the choice just isn't remembered.
    }
}

/** `[{ type, id }]` for the API, without blanks or repeats. */
export function alertItems(type, ids = []) {
    const seen = new Set();
    const items = [];
    for (const raw of ids) {
        const id = raw ? String(raw) : '';
        if (!id || seen.has(id)) continue;
        seen.add(id);
        items.push({ type, id });
    }
    return items;
}

export const alertKey = ({ type, id }) => `${type}:${id}`;

export function chunkItems(items = [], size = MAX_ALERT_ITEMS) {
    const chunks = [];
    for (let i = 0; i < items.length; i += size)
        chunks.push(items.slice(i, i + size));
    return chunks;
}

/** Adds up /content-alerts/reach answers for several chunks. */
export function mergeReach(parts = []) {
    return parts.reduce(
        (total, part) => ({
            enabled: total.enabled && part?.enabled !== false,
            students: total.students + (part?.students || 0),
            devices: total.devices + (part?.devices || 0),
            alreadySent: total.alreadySent + (part?.alreadySent || 0),
            groups: [...total.groups, ...(part?.groups || [])],
        }),
        { enabled: true, students: 0, devices: 0, alreadySent: 0, groups: [] },
    );
}

/** Adds up POST /content-alerts answers for several chunks. */
export function mergeSend(parts = []) {
    return parts.reduce(
        (total, part) => ({
            sent: [...total.sent, ...(part?.sent || [])],
            alreadySent: total.alreadySent + (part?.alreadySent || 0),
            unavailable: total.unavailable + (part?.unavailable || 0),
            noRecipients: total.noRecipients + (part?.noRecipients || 0),
        }),
        { sent: [], alreadySent: 0, unavailable: 0, noRecipients: 0 },
    );
}

const listLabels = (groups, shown = 2) => {
    const labels = [...new Set(groups.map((group) => group.label))];
    const rest = labels.length - shown;
    return rest > 0
        ? `${labels.slice(0, shown).join(', ')} and ${rest} more`
        : labels.join(', ');
};

/**
 * Words for the "Notify students" switch: the label carries the reach
 * ("Notify 23 students"), the description says where it goes or why not.
 */
export function reachSummary(reach, { loading = false, error = '' } = {}) {
    const fallback = { label: 'Notify students', description: '' };
    if (error)
        return {
            ...fallback,
            description: 'Couldn’t count followers. Alerts still go out.',
        };
    if (!reach)
        return loading
            ? { ...fallback, description: 'Counting followers…' }
            : fallback;
    if (reach.enabled === false)
        return {
            ...fallback,
            description:
                'Alerts are switched off on the server, so nothing is sent.',
        };
    const groups = reach.groups || [];
    if (!groups.length && reach.alreadySent > 0)
        return {
            label: 'Students already notified',
            description:
                reach.alreadySent === 1
                    ? 'This was announced before, so it won’t be sent again.'
                    : 'These were announced before, so they won’t be sent again.',
        };
    if (!groups.length)
        return {
            ...fallback,
            description: 'Its branch isn’t linked yet, so no one can be told.',
        };
    if (!reach.students)
        return {
            label: 'No students to notify',
            description: `No one follows ${listLabels(groups)} with alerts on yet.`,
        };
    const already =
        reach.alreadySent > 0
            ? ` · ${formatNumber(reach.alreadySent)} already announced`
            : '';
    return {
        label: `Notify ${plural(reach.students, 'student')}`,
        description: `${groups.length > 1 ? `${groups.length} alerts: ` : ''}${listLabels(groups)} · ${plural(reach.devices, 'device')}${already}`,
    };
}

const groupStudents = (sent) =>
    sent.reduce((sum, group) => sum + (group.students || 0), 0);

/**
 * What to tell the admin after POST /content-alerts. `retry` is true when
 * nothing reached a phone and sending again could help.
 */
export function sendOutcome(data = {}, message = '') {
    const sent = data.sent || [];
    if (sent.length) {
        const delivered = sent.reduce(
            (sum, group) => sum + (group.successCount || 0),
            0,
        );
        if (!delivered)
            return {
                tone: 'bad',
                text: 'The alert couldn’t reach any phone',
                retry: true,
            };
        const students = groupStudents(sent);
        const base = message || `Sent to ${plural(students, 'student')}`;
        return {
            tone: 'ok',
            text:
                sent.length === 1
                    ? `${base} (${sent[0].label})`
                    : `${base} in ${formatNumber(sent.length)} alerts`,
            retry: false,
        };
    }
    if (data.alreadySent && !data.noRecipients && !data.unavailable)
        return {
            tone: 'neutral',
            text: 'Students were already notified about this',
            retry: false,
        };
    if (data.unavailable && !data.noRecipients && !data.alreadySent)
        return {
            tone: 'neutral',
            text: 'Nothing sent: it isn’t live or has no branch',
            retry: false,
        };
    return {
        tone: 'neutral',
        text: message || 'No students to notify',
        retry: false,
    };
}

/** Words for a failed POST /content-alerts. */
export function alertFailure(error, { afterApproval = false } = {}) {
    if (error?.response?.status === 409)
        return {
            text: afterApproval
                ? 'Approved. Alerts are switched off on the server.'
                : 'Alerts are switched off on the server.',
            retry: false,
        };
    return {
        text: afterApproval
            ? 'Approved, but the alert wasn’t sent'
            : 'Couldn’t send the alert',
        retry: true,
    };
}

/** One record from /content-alerts/status, in words, for detail pages. */
export function alertStatusText(record) {
    switch (record?.status) {
        case 'sent':
            return [
                'Students notified',
                formatNumber(record.recipients),
                record.sentAt && formatShortDateTime(record.sentAt),
            ]
                .filter(Boolean)
                .join(' · ');
        case 'sending':
            return 'Sending to students…';
        case 'skipped':
            return 'No students were following when it was announced';
        case 'failed':
            return 'The last alert couldn’t reach any phone';
        default:
            return 'Students haven’t been notified';
    }
}

/** Approved items can be announced unless an alert went out or is going. */
export const canNotify = (record) =>
    !record || !['sent', 'sending'].includes(record.status);

// Notification history ------------------------------------------------------

export const isContentAlert = (notification) =>
    notification?.kind === 'content_alert';

/** "Content alert · Computer Science · Sem 5" (no semester when branch-wide). */
/** The short branch name alerts use: the stored label, else name if short, else code. */
export function shortBranchName(audience = {}) {
    if (audience.shortBranch) return audience.shortBranch;
    return audience.branchName && audience.branchName.length <= 24
        ? audience.branchName
        : audience.branch || audience.branchName || '';
}

export function contentAlertLabel(audience = {}) {
    const branch = shortBranchName(audience);
    return [
        'Content alert',
        branch,
        audience.semester ? `Sem ${audience.semester}` : '',
    ]
        .filter(Boolean)
        .join(' · ');
}

/** "12 opened · 8.4%" — unique students who tapped, against delivered. */
export function alertOpensText(notification) {
    const opens = notification?.opens;
    if (opens == null) return '';
    const delivered = notification.successCount || 0;
    const rate = delivered
        ? `${Math.round((opens / delivered) * 1000) / 10}%`
        : '';
    return [`${formatNumber(opens)} opened`, rate].filter(Boolean).join(' · ');
}

/** Content alerts that reached no phone can be sent again for their items. */
export const canRetryAlert = (notification) =>
    isContentAlert(notification) &&
    !notification.successCount &&
    (notification.items?.length || 0) > 0;

// Drive bulk import ---------------------------------------------------------

const SUMMARY_WAIT_MS = 3 * 60_000;
const LIVE = ['queued', 'running'];

/**
 * True while a finished import that should notify students has no
 * alertSummary yet (the server writes it just after the job finishes).
 */
export function awaitingAlerts(job, now = Date.now()) {
    if (!job?.notifyStudents || job.alertSummary) return false;
    if (LIVE.includes(job.status) || !(job.counts?.succeeded > 0)) return false;
    const finished = Date.parse(job.finishedAt || job.updatedAt || '');
    return Number.isFinite(finished) && now - finished < SUMMARY_WAIT_MS;
}

/** What the import view says about its alerts, or null when it has none. */
export function importAlertState(job, now = Date.now()) {
    if (!job?.notifyStudents) return null;
    if (LIVE.includes(job.status))
        return {
            tone: 'info',
            title: 'Students will be notified when the import finishes',
            text: 'Followers of each branch get one alert per branch and semester.',
        };
    const summary = job.alertSummary;
    if (summary?.error)
        return {
            tone: 'bad',
            title: 'Alerts weren’t sent',
            text: summary.error,
        };
    if (summary?.skipped)
        return {
            tone: 'warn',
            title: 'Alerts weren’t sent',
            text: summary.skipped,
        };
    if (summary) {
        const sent = summary.sent || [];
        const extra = [
            summary.noRecipients &&
                `${plural(summary.noRecipients, 'paper')} had no followers`,
            summary.alreadySent &&
                `${plural(summary.alreadySent, 'paper')} announced before`,
            summary.unavailable &&
                `${plural(summary.unavailable, 'paper')} not live`,
        ]
            .filter(Boolean)
            .join(' · ');
        if (!sent.length)
            return {
                tone: 'neutral',
                title: 'No students to notify',
                text: extra || 'No one follows these branches yet.',
            };
        const outcome = sendOutcome(summary);
        return {
            tone: outcome.tone === 'ok' ? 'ok' : 'bad',
            title: outcome.text,
            text: extra,
            groups: sent,
        };
    }
    if (!(job.counts?.succeeded > 0))
        return {
            tone: 'neutral',
            title: 'No alerts sent',
            text: 'Nothing new was imported.',
        };
    if (awaitingAlerts(job, now))
        return {
            tone: 'info',
            title: 'Sending alerts to students…',
            pending: true,
        };
    return {
        tone: 'neutral',
        title: 'No alert summary was recorded',
        text: 'Check the notification history for this import’s alerts.',
    };
}
