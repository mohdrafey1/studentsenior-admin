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
const other = '507f1f77bcf86cd799439012';
const colleges = [{ _id: other, slug: 'canonical-college' }];
const response = (data, pagination) => ({
    data: { success: true, data, pagination },
});

test('content links recover canonical college metadata rather than using a guessed college', async () => {
    const calls = [];
    const get = async (path) => {
        calls.push(path);
        return response({ college: { slug: 'canonical-college' } });
    };
    assert.equal(
        await contentDestination('pyq', id, colleges, get),
        `/canonical-college/pyqs/${id}`,
    );
    assert.deepEqual(calls, [`/pyq/${id}`]);
});

test('unpopulated college IDs resolve through the catalog and missing colleges fail safely', async () => {
    assert.equal(
        await contentDestination('group', id, colleges, async () =>
            response({ college: other }),
        ),
        `/canonical-college/groups/${id}`,
    );
    await assert.rejects(
        () => contentDestination('note', id, [], async () => response({})),
        /no longer has a college/,
    );
});

test('quick-note links find the correct parent subject through paginated catalogs', async () => {
    const pages = [];
    const get = async (path, options) => {
        pages.push(options.params.page);
        assert.equal(path, '/quicknotes/all/canonical-college');
        return options.params.page === 1
            ? response([], { pages: 2 })
            : response([{ _id: id, subject: { _id: other }, unitNumber: 3 }], {
                  pages: 2,
              });
    };
    assert.equal(
        await contentDestination('quicknote', id, colleges, get),
        `/reports/subjects/${other}/quick-notes?unit=3`,
    );
    assert.deepEqual(pages, [1, 2]);
});

test('solution links use the parent PYQ ID, not the solution ID', async () => {
    const get = async () => response([{ _id: id, pyq: { _id: other } }]);
    assert.equal(
        await contentDestination('solution', id, colleges, get),
        `/canonical-college/pyqs/${other}/aisolution`,
    );
});

test('blog and affiliate links use the existing editors; invalid IDs fail before reads', async () => {
    const get = () => {
        throw new Error('Unexpected request');
    };
    assert.equal(
        await contentDestination('blog', id, [], get),
        `/blog/edit/${id}`,
    );
    assert.equal(
        await contentDestination('affiliate', id, [], get),
        '/affiliate-products',
    );
    await assert.rejects(
        () => contentDestination('pyq', 'some-slug', [], get),
        /Invalid content ID/,
    );
});

test('metadata lookup errors and cancelled requests stop catalog traversal', async () => {
    let calls = 0;
    await assert.rejects(
        () =>
            contentDestination(
                'solution',
                id,
                [...colleges, ...colleges],
                async () => {
                    calls += 1;
                    throw new Error('cancelled');
                },
            ),
        /cancelled/,
    );
    assert.equal(calls, 1);
});
