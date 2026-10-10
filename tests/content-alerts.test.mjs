import test from 'node:test';
import assert from 'node:assert/strict';
import {
    MAX_ALERT_ITEMS,
    NOTIFY_PREF_KEY,
    alertFailure,
    alertItems,
    alertKey,
    alertOpensText,
    alertStatusText,
    awaitingAlerts,
    canNotify,
    canRetryAlert,
    chunkItems,
    contentAlertLabel,
    importAlertState,
    mergeReach,
    mergeSend,
    reachSummary,
    readNotifyPref,
    sendOutcome,
    storeNotifyPref,
} from '../src/utils/contentAlerts.js';
import {
    describeAudience,
    describeTarget,
} from '../src/components/Notifications/notificationTargets.js';

const memoryStorage = () => {
    const values = new Map();
    return {
        getItem: (key) => (values.has(key) ? values.get(key) : null),
        setItem: (key, value) => values.set(key, String(value)),
        values,
    };
};

test('notify-on-approve starts on and remembers the last choice', () => {
    const storage = memoryStorage();
    assert.equal(readNotifyPref(storage), true);
    storeNotifyPref(false, storage);
    assert.equal(storage.values.get(NOTIFY_PREF_KEY), 'false');
    assert.equal(NOTIFY_PREF_KEY, 'ss_admin_notify_on_approve');
    assert.equal(readNotifyPref(storage), false);
    storeNotifyPref(true, storage);
    assert.equal(readNotifyPref(storage), true);
});

test('blocked storage falls back to on without throwing', () => {
    const broken = {
        getItem() {
            throw new Error('denied');
        },
        setItem() {
            throw new Error('denied');
        },
    };
    assert.equal(readNotifyPref(broken), true);
    assert.doesNotThrow(() => storeNotifyPref(false, broken));
});

test('alert items drop blanks and repeats and split into API-sized chunks', () => {
    assert.deepEqual(alertItems('pyq', ['a', 'b', 'a', '', null]), [
        { type: 'pyq', id: 'a' },
        { type: 'pyq', id: 'b' },
    ]);
    assert.equal(alertKey({ type: 'note', id: 'x' }), 'note:x');
    const many = alertItems(
        'note',
        Array.from({ length: 450 }, (_, i) => `id${i}`),
    );
    const chunks = chunkItems(many);
    assert.equal(MAX_ALERT_ITEMS, 200);
    assert.deepEqual(
        chunks.map((chunk) => chunk.length),
        [200, 200, 50],
    );
    assert.deepEqual(chunkItems([]), []);
});

test('reach and send answers from several chunks add up', () => {
    const reach = mergeReach([
        {
            enabled: true,
            students: 3,
            devices: 4,
            alreadySent: 1,
            groups: [{ label: 'CSE · Sem 5' }],
        },
        {
            enabled: true,
            students: 2,
            devices: 2,
            alreadySent: 0,
            groups: [{ label: 'ECE · Sem 3' }],
        },
    ]);
    assert.equal(reach.students, 5);
    assert.equal(reach.devices, 6);
    assert.equal(reach.alreadySent, 1);
    assert.equal(reach.groups.length, 2);
    assert.equal(mergeReach([{ enabled: false }]).enabled, false);

    const sent = mergeSend([
        {
            sent: [{ label: 'A' }],
            alreadySent: 1,
            unavailable: 0,
            noRecipients: 2,
        },
        { sent: [], alreadySent: 0, unavailable: 3, noRecipients: 0 },
    ]);
    assert.deepEqual(sent, {
        sent: [{ label: 'A' }],
        alreadySent: 1,
        unavailable: 3,
        noRecipients: 2,
    });
});

test('the notify switch shows who an approval reaches', () => {
    const groups = [{ label: 'CSE · Sem 5' }];
    assert.deepEqual(
        reachSummary(
            {
                enabled: true,
                students: 23,
                devices: 25,
                alreadySent: 0,
                groups,
            },
            {},
        ),
        {
            label: 'Notify 23 students',
            description: 'CSE · Sem 5 · 25 devices',
        },
    );
    assert.equal(
        reachSummary({ enabled: true, students: 1, devices: 1, groups }).label,
        'Notify 1 student',
    );
    const several = reachSummary({
        enabled: true,
        students: 9,
        devices: 9,
        alreadySent: 2,
        groups: [{ label: 'A' }, { label: 'B' }, { label: 'C' }],
    });
    assert.equal(
        several.description,
        '3 alerts: A, B and 1 more · 9 devices · 2 already announced',
    );
    assert.equal(
        reachSummary({ enabled: true, students: 0, devices: 0, groups }).label,
        'No students to notify',
    );
    assert.match(
        reachSummary({ enabled: false, students: 5, groups }).description,
        /switched off on the server/,
    );
    assert.equal(
        reachSummary({ enabled: true, students: 0, alreadySent: 1, groups: [] })
            .label,
        'Students already notified',
    );
    assert.equal(
        reachSummary(null, { loading: true }).description,
        'Counting followers…',
    );
    assert.equal(reachSummary(null, { error: 'x' }).label, 'Notify students');
});

test('send results become one toast, with retry only when it can help', () => {
    const group = {
        label: 'CSE · Sem 5',
        students: 23,
        successCount: 25,
    };
    assert.deepEqual(sendOutcome({ sent: [group] }, 'Sent to 23 students'), {
        tone: 'ok',
        text: 'Sent to 23 students (CSE · Sem 5)',
        retry: false,
    });
    assert.equal(
        sendOutcome({ sent: [group, { ...group, label: 'B' }] }).text,
        'Sent to 46 students in 2 alerts',
    );
    assert.equal(
        sendOutcome({ sent: [{ ...group, successCount: 0 }] }).retry,
        true,
    );
    assert.equal(
        sendOutcome({ sent: [], alreadySent: 1 }).text,
        'Students were already notified about this',
    );
    assert.equal(
        sendOutcome({ sent: [], unavailable: 1 }).text,
        'Nothing sent: it isn’t live or has no branch',
    );
    assert.equal(
        sendOutcome({ sent: [], noRecipients: 2 }, 'No students to notify')
            .text,
        'No students to notify',
    );
});

test('failed sends after approval explain the switch-off and offer retry', () => {
    const off = { response: { status: 409 } };
    assert.deepEqual(alertFailure(off, { afterApproval: true }), {
        text: 'Approved. Alerts are switched off on the server.',
        retry: false,
    });
    assert.equal(
        alertFailure(off).text,
        'Alerts are switched off on the server.',
    );
    assert.deepEqual(
        alertFailure({ response: { status: 500 } }, { afterApproval: true }),
        { text: 'Approved, but the alert wasn’t sent', retry: true },
    );
    assert.equal(alertFailure(new Error('Network Error')).retry, true);
});

test('detail pages say whether students were notified', () => {
    const sentAt = new Date(2026, 9, 11, 18, 42).toISOString();
    const thisYear = new Date().getFullYear() === 2026;
    assert.equal(
        alertStatusText({ status: 'sent', recipients: 23, sentAt }),
        `Students notified · 23 · 11 Oct${thisYear ? '' : ' 2026'}, 18:42`,
    );
    assert.equal(alertStatusText(undefined), 'Students haven’t been notified');
    assert.equal(canNotify(undefined), true);
    assert.equal(canNotify({ status: 'failed' }), true);
    assert.equal(canNotify({ status: 'skipped' }), true);
    assert.equal(canNotify({ status: 'sent' }), false);
    assert.equal(canNotify({ status: 'sending' }), false);
});

test('history labels content alerts, counts opens and allows retry of failed ones', () => {
    const audience = {
        type: 'branch',
        college: 'iul',
        collegeName: 'Integral University',
        branch: 'CSE',
        branchName: 'Computer Science',
        semester: 5,
    };
    assert.equal(
        contentAlertLabel(audience),
        'Content alert · Computer Science · Sem 5',
    );
    assert.equal(
        contentAlertLabel({ ...audience, semester: null }),
        'Content alert · Computer Science',
    );
    assert.equal(
        describeAudience(audience),
        'Followers of Computer Science · Sem 5 at Integral University',
    );
    assert.equal(
        alertOpensText({ opens: 12, successCount: 80 }),
        '12 opened · 15%',
    );
    assert.equal(alertOpensText({ opens: 0, successCount: 0 }), '0 opened');
    assert.equal(alertOpensText({ opens: null, successCount: 9 }), '');

    const failed = {
        kind: 'content_alert',
        successCount: 0,
        items: [{ type: 'pyq', id: 'a' }],
    };
    assert.equal(canRetryAlert(failed), true);
    assert.equal(canRetryAlert({ ...failed, successCount: 3 }), false);
    assert.equal(canRetryAlert({ ...failed, items: [] }), false);
    assert.equal(canRetryAlert({ ...failed, kind: 'manual' }), false);

    assert.equal(
        describeTarget(
            {
                screen: 'quicknotes',
                params: { college: 'iul', slug: 'unit-1' },
            },
            () => 'Integral University',
        ),
        'Quick notes · Integral University · unit-1',
    );
});

test('imports show their alert summary and wait briefly for it', () => {
    const now = Date.parse('2026-10-11T10:00:00Z');
    const finished = {
        notifyStudents: true,
        status: 'completed',
        counts: { succeeded: 4 },
        finishedAt: '2026-10-11T09:59:30Z',
    };
    assert.equal(
        importAlertState({ ...finished, notifyStudents: false }),
        null,
    );
    assert.equal(awaitingAlerts(finished, now), true);
    assert.equal(importAlertState(finished, now).pending, true);
    assert.equal(
        awaitingAlerts(
            { ...finished, finishedAt: '2026-10-11T09:50:00Z' },
            now,
        ),
        false,
    );
    assert.equal(
        awaitingAlerts({ ...finished, status: 'running' }, now),
        false,
    );
    assert.equal(
        importAlertState({ ...finished, status: 'running' }, now).tone,
        'info',
    );
    assert.equal(
        importAlertState({ ...finished, counts: { succeeded: 0 } }, now).title,
        'No alerts sent',
    );

    const sent = importAlertState(
        {
            ...finished,
            alertSummary: {
                sent: [
                    {
                        label: 'CSE · Sem 5',
                        college: 'IUL',
                        items: 3,
                        students: 10,
                        devices: 10,
                        successCount: 10,
                        failureCount: 0,
                    },
                ],
                alreadySent: 0,
                unavailable: 0,
                noRecipients: 1,
            },
        },
        now,
    );
    assert.equal(sent.tone, 'ok');
    assert.equal(sent.title, 'Sent to 10 students (CSE · Sem 5)');
    assert.equal(sent.text, '1 paper had no followers');
    assert.equal(sent.groups.length, 1);
    assert.equal(awaitingAlerts({ ...finished, alertSummary: {} }, now), false);

    assert.deepEqual(
        importAlertState(
            { ...finished, alertSummary: { skipped: 'Switched off' } },
            now,
        ),
        { tone: 'warn', title: 'Alerts weren’t sent', text: 'Switched off' },
    );
    assert.equal(
        importAlertState({ ...finished, alertSummary: { error: 'Boom' } }, now)
            .tone,
        'bad',
    );
    assert.equal(
        importAlertState(
            {
                ...finished,
                alertSummary: { sent: [], noRecipients: 4, alreadySent: 0 },
            },
            now,
        ).title,
        'No students to notify',
    );
});
