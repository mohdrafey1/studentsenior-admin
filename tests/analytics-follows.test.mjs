import test from 'node:test';
import assert from 'node:assert/strict';
import {
    alertRows,
    contentTotal,
    demandRows,
    followKpis,
    followTree,
    needsContent,
    picksSeries,
    rate,
} from '../src/components/Analytics/v2/follows.js';
import {
    reportParams,
    reportReady,
} from '../src/components/Analytics/v2/data.js';

const iul = { slug: 'iul', name: 'Integral University' };
const btech = { code: 'BTECH', name: 'B.Tech' };
const cse = { id: 'b1', code: 'CSE', name: 'Computer Science' };
const ece = { id: 'b2', code: 'ECE', name: 'Electronics' };
const rows = [
    {
        college: iul,
        course: btech,
        branch: cse,
        semester: 5,
        students: 6,
        alertsOn: 5,
        reachable: 4,
        content: { pyq: 2, note: 1, quicknote: 0 },
    },
    {
        college: iul,
        course: btech,
        branch: cse,
        semester: 3,
        students: 2,
        alertsOn: 2,
        reachable: 1,
        content: { pyq: 2, note: 1, quicknote: 0 },
    },
    {
        college: iul,
        course: btech,
        branch: ece,
        semester: null,
        students: 3,
        alertsOn: 1,
        reachable: 1,
        content: { pyq: 20, note: 0, quicknote: 4 },
    },
    {
        college: { slug: 'amu', name: 'AMU' },
        course: btech,
        branch: { id: 'b3', code: 'ME', name: 'Mechanical' },
        semester: 1,
        students: 1,
        alertsOn: 1,
        reachable: 1,
        content: { pyq: 0, note: 0, quicknote: 0 },
    },
];

test('follow rows nest into college, course, branch and semester with totals', () => {
    const tree = followTree(rows);
    assert.deepEqual(
        tree.map((college) => [college.label, college.students]),
        [
            ['Integral University', 11],
            ['AMU', 1],
        ],
    );
    const [course] = tree[0].children;
    assert.equal(course.label, 'B.Tech');
    assert.equal(course.alertsOn, 8);
    assert.equal(course.reachable, 6);
    const [first, second] = course.children;
    assert.equal(first.label, 'Computer Science');
    assert.equal(first.students, 8);
    assert.deepEqual(
        first.children.map((sem) => [sem.label, sem.students, sem.content]),
        [
            ['Semester 5', 6, null],
            ['Semester 3', 2, null],
        ],
    );
    assert.equal(second.children[0].label, 'No semester');
    // Branch content is counted once per branch, then summed upwards.
    assert.deepEqual(first.content, { pyq: 2, note: 1, quicknote: 0 });
    assert.deepEqual(tree[0].content, { pyq: 22, note: 1, quicknote: 4 });
    assert.equal(contentTotal(tree[0].content), 27);
    assert.deepEqual(followTree(undefined), []);
});

test('busy branches with less content than followers are flagged', () => {
    const tree = followTree(rows);
    const [cseNode, eceNode] = tree[0].children[0].children;
    assert.equal(needsContent(cseNode), true); // 8 students, 3 items
    assert.equal(needsContent(eceNode), false); // 3 students, 24 items
    assert.equal(needsContent(tree[1].children[0].children[0]), false); // 1 student
    assert.equal(needsContent(tree[0]), false); // only branches
    assert.deepEqual(
        demandRows(tree).map((row) => [row.label, row.students, row.items]),
        [['Computer Science', 8, 3]],
    );
});

test('KPIs, alert rates and picks are shaped for the shared charts', () => {
    assert.deepEqual(
        followKpis({ students: 8, alertsOn: 6, reachable: 5, alertsOff: 2 }),
        {
            current: {
                students: 8,
                alertsOnRate: 75,
                reachable: 5,
                alertsOff: 2,
            },
        },
    );
    assert.equal(followKpis({}).current.alertsOnRate, 0);
    assert.equal(rate(1, 3), 33.3);
    assert.equal(rate(1, 0), null);
    assert.deepEqual(
        alertRows([
            {
                college: 'IUL',
                branch: 'Computer Science',
                semester: 5,
                alerts: 2,
                delivered: 40,
                opens: 6,
            },
            {
                college: 'IUL',
                branch: 'ECE',
                semester: null,
                alerts: 1,
                delivered: 0,
                opens: 0,
            },
        ]).map((row) => [row.label, row.openRate]),
        [
            ['Computer Science · Sem 5', 15],
            ['ECE', null],
        ],
    );
    assert.deepEqual(picksSeries([{ _id: '2026-10-01', picks: 3 }]), [
        { day: '2026-10-01', picks: 3 },
    ]);
});

test('the follows report ignores the platform filter', () => {
    const filters = {
        from: '2026-10-01',
        to: '2026-10-07',
        college: 'iul',
        platform: 'web',
    };
    assert.deepEqual(reportParams(filters, 'follows'), {
        from: '2026-10-01',
        to: '2026-10-07',
        college: 'iul',
    });
    // Changing only the platform must not hold back or restart the request.
    assert.equal(
        reportReady(
            {
                filters: { ...filters, platform: 'android' },
                requestFilters: filters,
                error: '',
            },
            'follows',
        ),
        true,
    );
});
