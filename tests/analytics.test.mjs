import test from 'node:test';
import assert from 'node:assert/strict';
import {
    CONTENT_TYPES,
    QueryCache,
    dayKey,
    hasValues,
    readFilters,
    reportParams,
    stableParams,
    weeklySeries,
    retentionCurve,
    debounceTask,
    filterSearch,
    resetFilters,
    percent,
    deltaTone,
    canAccessAnalytics,
    analyticsLink,
    typeBreakdown,
    contentTitle,
} from '../src/components/Analytics/v2/data.js';
import { contentDestination } from '../src/components/Analytics/v2/contentDestination.js';

const today = '2026-10-07';
const read = (query, maxDays = 366) =>
    readFilters(new URLSearchParams(query), maxDays, today);

test('default range is 28 inclusive IST days and handles IST midnight', () => {
    const { filters, error } = read('');
    assert.equal(error, '');
    assert.equal(filters.from, '2026-09-10');
    assert.equal(filters.to, today);
    assert.equal(dayKey(new Date('2026-10-06T18:29:59Z')), '2026-10-06');
    assert.equal(dayKey(new Date('2026-10-06T18:30:00Z')), today);
});

test('URL filters preserve custom mode, comparison, college and platform', () => {
    const { filters, error } = read(
        'from=2026-10-01&to=2026-10-07&range=custom&compare=false&college=sample-college&platform=web',
    );
    assert.equal(error, '');
    assert.equal(filters.custom, true);
    assert.equal(filters.compare, false);
    assert.equal(filters.college, 'sample-college');
    assert.equal(filters.platform, 'web');
});

test('invalid, future and reversed dates are rejected before a request', () => {
    for (const query of [
        'from=2026-02-30',
        'to=2026-10-08',
        'from=2026-10-07&to=2026-10-06',
        'from=not-a-date',
    ])
        assert.ok(read(query).error, query);
});

test('reports allow up to 366 days, while user activity stops at 90 days', () => {
    assert.equal(read('from=2025-10-07').error, '');
    assert.ok(read('from=2025-10-06').error);
    assert.equal(read('from=2026-07-10', 90).error, '');
    assert.ok(read('from=2026-07-09', 90).error);
});

test('invalid college and platform query strings are rejected', () => {
    assert.ok(read('college=College Name').error);
    assert.ok(read('platform=ios').error);
    assert.equal(read('platform=server').error, '');
});

test('endpoint parameters honor growth and realtime exceptions', () => {
    const { filters } = read('college=sample&platform=android&compare=false');
    assert.deepEqual(reportParams(filters), {
        from: '2026-09-10',
        to: today,
        college: 'sample',
        platform: 'android',
    });
    assert.deepEqual(reportParams(filters, 'growth'), {
        from: '2026-09-10',
        to: today,
        college: 'sample',
    });
    assert.deepEqual(reportParams(filters, 'realtime'), {
        college: 'sample',
        platform: 'android',
    });
});

test('cache keys are independent of parameter ordering and omit empty values', () => {
    assert.equal(
        stableParams({ platform: '', to: today, from: '2026-10-01' }),
        stableParams({ from: '2026-10-01', to: today }),
    );
    assert.notEqual(
        stableParams({ platform: 'web' }),
        stableParams({ platform: 'android' }),
    );
});

test('memory cache expires, remains bounded, and cannot cross admin identities', () => {
    const cache = new QueryCache(2);
    cache.scope('admin-a');
    cache.set('a', { views: 4 }, 10);
    assert.deepEqual(cache.get('a', 30, 39), { views: 4 });
    assert.equal(cache.get('a', 30, 40), undefined);
    cache.set('b', 2, 10);
    cache.set('c', 3, 10);
    assert.equal(cache.get('a', 30, 11), undefined);
    assert.equal(cache.entries.size, 2);
    cache.scope('admin-b');
    assert.equal(cache.entries.size, 0);
});

test('weekly additive counts span Monday to Sunday, with partial weeks', () => {
    const result = weeklySeries(
        [
            { day: '2026-10-04', views: 4 },
            { day: '2026-10-05', views: 8 },
            { day: '2026-10-07', views: 2 },
        ],
        ['views'],
    );
    assert.deepEqual(
        result.map(({ day, views }) => ({ day, views })),
        [
            { day: '2026-09-28', views: 4 },
            { day: '2026-10-05', views: 10 },
        ],
    );
});

test('weekly daily-active averages and snapshot endpoints never sum unique actors or balances', () => {
    const rows = [
        { day: '2026-10-05', activeUsers: 10, users: 100 },
        { day: '2026-10-06', activeUsers: 20, users: 110 },
    ];
    assert.equal(
        weeklySeries(rows, ['activeUsers'], 'average')[0].activeUsers,
        15,
    );
    assert.equal(weeklySeries(rows, ['users'], 'last')[0].users, 110);
});

test('retention is weighted by mature cohort size, excluding immature denominators', () => {
    const rows = [
        { _id: { firstSeenDay: '2026-10-01', offset: 0 }, users: 100 },
        { _id: { firstSeenDay: '2026-10-01', offset: 1 }, users: 50 },
        { _id: { firstSeenDay: '2026-10-02', offset: 0 }, users: 10 },
        { _id: { firstSeenDay: '2026-10-02', offset: 1 }, users: 10 },
        { _id: { firstSeenDay: '2026-10-07', offset: 0 }, users: 1000 },
    ];
    const curve = retentionCurve(rows, today);
    assert.equal(curve[0].percent, 100);
    assert.equal(curve[1].eligible, 110);
    assert.equal(curve[1].retained, 60);
    assert.ok(Math.abs(curve[1].percent - (60 / 110) * 100) < 0.001);
    assert.equal(curve[7].percent, null);
});

test('all-zero filled series are empty but negative revenue is meaningful', () => {
    assert.equal(hasValues([{ views: 0 }], ['views']), false);
    assert.equal(hasValues([{ netRevenueINR: -10 }], ['netRevenueINR']), true);
    assert.equal(CONTENT_TYPES.length, 13);
});

const id = '507f1f77bcf86cd799439011';
const response = (data) => ({ data: { success: true, data } });

test('every content type resolves through exactly one destination read', async () => {
    for (const { value: type } of CONTENT_TYPES) {
        const calls = [];
        const path =
            type === 'quicknote'
                ? '/reports/subjects/parent/quick-notes?unit=3'
                : '/college/pyqs/parent/aisolution';
        assert.equal(
            await contentDestination(type, id, async (url) => {
                calls.push(url);
                return response({ collegeSlug: 'college', path });
            }),
            path,
        );
        assert.deepEqual(calls, [
            `/analytics/v2/content/${type}/${id}/destination`,
        ]);
    }
});

test('destination rejects invalid references before reads and external paths from malformed responses', async () => {
    let calls = 0;
    await assert.rejects(
        () =>
            contentDestination('pyq', 'slug', () => {
                calls++;
            }),
        /Invalid content reference/,
    );
    await assert.rejects(
        () =>
            contentDestination('unknown', id, () => {
                calls++;
            }),
        /Invalid content reference/,
    );
    assert.equal(calls, 0);
    for (const path of ['https://external.test', '//external.test', null])
        await assert.rejects(
            () => contentDestination('pyq', id, async () => response({ path })),
            /no available admin destination/,
        );
});

test('destination request failures and cancellation propagate without scanning catalogs', async () => {
    let calls = 0;
    await assert.rejects(
        () =>
            contentDestination('solution', id, async () => {
                calls++;
                throw new Error('cancelled');
            }),
        /cancelled/,
    );
    assert.equal(calls, 1);
});

test('filter debounce commits only the latest value after 350 ms and cancels on cleanup', () => {
    let now = 0;
    const timers = new Set();
    const received = [];
    const schedule = (fn, ms) => {
        const timer = { fn, at: now + ms };
        timers.add(timer);
        return timer;
    };
    const cancel = (timer) => timers.delete(timer);
    const advance = (ms) => {
        now += ms;
        for (const timer of [...timers])
            if (timer.at <= now) {
                timers.delete(timer);
                timer.fn();
            }
    };
    const update = debounceTask(
        (value) => received.push(value),
        350,
        schedule,
        cancel,
    );
    update('android');
    advance(200);
    update('web');
    advance(349);
    assert.deepEqual(received, []);
    advance(1);
    assert.deepEqual(received, ['web']);
    update('blog');
    update.cancel();
    advance(1000);
    assert.deepEqual(received, ['web']);
});

test('reset clears custom range and filters without dropping unrelated query state', () => {
    const original = new URLSearchParams(
        'range=custom&platform=web&college=sample&compare=false&unit=2',
    );
    const next = filterSearch(original, resetFilters(today));
    assert.equal(next.get('range'), null);
    assert.equal(next.get('college'), null);
    assert.equal(next.get('platform'), null);
    assert.equal(next.get('unit'), '2');
    assert.equal(next.get('compare'), 'false');
    assert.equal(original.get('range'), 'custom');
});

test('realtime rejects server/invalid filters while revenue ignores platform', () => {
    assert.ok(
        readFilters(new URLSearchParams('platform=server'), 366, today, {
            realtime: true,
        }).error,
    );
    assert.ok(
        readFilters(new URLSearchParams('college=bad slug'), 366, today, {
            realtime: true,
        }).error,
    );
    const revenue = readFilters(
        new URLSearchParams('platform=web'),
        366,
        today,
        { revenue: true },
    );
    assert.equal(revenue.error, '');
    assert.equal(reportParams(revenue.filters, 'revenue').platform, undefined);
});

test('catalog cache can persist for the admin session but clears on identity change', () => {
    const cache = new QueryCache(8);
    cache.scope('first-admin');
    cache.set('subjects', [{ name: 'Maths' }], 1);
    assert.equal(cache.get('subjects', Infinity, 86400000)[0].name, 'Maths');
    cache.scope('second-admin');
    assert.equal(cache.get('subjects', Infinity, 86400000), undefined);
});

test('overview content types use both aggregate periods without mixing their values', () => {
    const rows = typeBreakdown({
        current: [{ type: 'pyq', views: 100 }],
        previous: [
            { type: 'pyq', views: 50 },
            { type: 'note', views: 4 },
        ],
    });
    assert.equal(rows.length, 13);
    assert.deepEqual(
        rows.find((row) => row.type === 'pyq'),
        { type: 'pyq', label: 'PYQs', current: 100, previous: 50 },
    );
    assert.equal(rows.find((row) => row.type === 'note').current, 0);
    assert.equal(rows.find((row) => row.type === 'note').previous, 4);
});

test('retention distinguishes immature values from observed zero retention', () => {
    assert.equal(percent(null), '—');
    assert.equal(percent(undefined), '—');
    assert.equal(percent(0), '0%');
    assert.equal(percent(33.333), '33.3%');
});

test('refund increases are bad while captured revenue increases are good', () => {
    assert.equal(deltaTone(20, true), 'text-bad-ink');
    assert.equal(deltaTone(-20, true), 'text-ok-ink');
    assert.equal(deltaTone(20), 'text-ok-ink');
});

test('analytics navigation preserves the entire query and table labels avoid raw IDs', () => {
    const query =
        '?from=2026-10-01&to=2026-10-07&college=sample&platform=web&compare=false&range=custom';
    assert.equal(
        analyticsLink('/analytics/chatbot', query),
        `/analytics/chatbot${query}`,
    );
    assert.equal(
        contentTitle({ _id: { type: 'pyq', id }, title: 'Maths 2026' }),
        'Maths 2026',
    );
    assert.equal(contentTitle({ _id: { type: 'pyq', id } }), 'PYQs item');
});

test('only Admin and Moderator can access analytics', () => {
    for (const role of ['Admin', 'Moderator'])
        assert.equal(canAccessAnalytics({ role }), true);
    for (const role of ['Visitor', 'Student', '', undefined])
        assert.equal(canAccessAnalytics({ role }), false);
    assert.equal(canAccessAnalytics(null), false);
});
