// Students & branches: shapes GET /analytics/v2/follows for the page.

export const FOLLOW_CONTENT = [
    ['pyq', 'PYQs'],
    ['note', 'Notes'],
    ['quicknote', 'Quick notes'],
];

// A branch "needs content" when at least this many students follow it and it
// has fewer approved PYQs, notes and quick notes than followers.
export const NEEDS_CONTENT_MIN_STUDENTS = 3;

const emptyContent = () => ({ pyq: 0, note: 0, quicknote: 0 });

export const contentTotal = (content) =>
    content
        ? (content.pyq || 0) + (content.note || 0) + (content.quicknote || 0)
        : 0;

export const needsContent = (node) =>
    node?.level === 'branch' &&
    node.students >= NEEDS_CONTENT_MIN_STUDENTS &&
    contentTotal(node.content) < node.students;

const round1 = (value) => Math.round(value * 10) / 10;

/** Percent with one decimal, or null when there is nothing to divide by. */
export const rate = (part, whole) =>
    whole ? round1(((part || 0) / whole) * 100) : null;

function child(parent, key, make) {
    let node = parent.children.get(key);
    if (!node) {
        node = {
            ...make(),
            key,
            students: 0,
            alertsOn: 0,
            reachable: 0,
            children: new Map(),
        };
        parent.children.set(key, node);
    }
    return node;
}

const add = (node, row) => {
    node.students += row.students || 0;
    node.alertsOn += row.alertsOn || 0;
    node.reachable += row.reachable || 0;
};

const byStudents = (a, b) =>
    b.students - a.students || a.label.localeCompare(b.label);

// Maps to sorted arrays; content adds up from branches (semesters share
// their branch's content, so they carry none of their own).
function finish(node) {
    const children = [...node.children.values()].map(finish).sort(byStudents);
    const done = { ...node, children };
    if (node.level === 'semester') {
        done.children = [];
        done.content = null;
    } else if (node.level !== 'branch') {
        done.content = children.reduce((sum, item) => {
            for (const [type] of FOLLOW_CONTENT)
                sum[type] += item.content?.[type] || 0;
            return sum;
        }, emptyContent());
    }
    return done;
}

/**
 * Flat follow rows (one per college, course, branch and semester) as a tree:
 * colleges → courses → branches → semesters, each with summed students,
 * alerts on and reachable counts, sorted by students.
 */
export function followTree(rows = []) {
    const root = { children: new Map() };
    for (const row of rows || []) {
        const collegeKey = row.college?.slug || row.college?.name || '?';
        const college = child(root, `college:${collegeKey}`, () => ({
            level: 'college',
            label: row.college?.name || row.college?.slug || 'Unknown college',
        }));
        const courseKey = `${college.key}/${row.course?.code || row.course?.name || '?'}`;
        const course = child(college, courseKey, () => ({
            level: 'course',
            label: row.course?.name || row.course?.code || 'Unknown course',
            code: row.course?.code || '',
        }));
        const branchKey = `${courseKey}/${row.branch?.id || row.branch?.code || '?'}`;
        const branch = child(course, branchKey, () => ({
            level: 'branch',
            label: row.branch?.name || row.branch?.code || 'Unknown branch',
            code: row.branch?.code || '',
            content: { ...emptyContent(), ...(row.content || {}) },
        }));
        const semester = child(
            branch,
            `${branchKey}/${row.semester || 'none'}`,
            () => ({
                level: 'semester',
                label: row.semester
                    ? `Semester ${row.semester}`
                    : 'No semester',
                semester: row.semester || null,
            }),
        );
        for (const node of [college, course, branch, semester]) add(node, row);
    }
    return [...root.children.values()].map(finish).sort(byStudents);
}

/** Branches with many followers and little content, most underserved first. */
export function demandRows(tree = [], limit = 8) {
    const rows = [];
    for (const college of tree)
        for (const course of college.children)
            for (const branch of course.children)
                if (needsContent(branch))
                    rows.push({
                        key: branch.key,
                        label: branch.label,
                        college: college.label,
                        course: course.label,
                        students: branch.students,
                        content: branch.content,
                        items: contentTotal(branch.content),
                    });
    return rows
        .sort(
            (a, b) =>
                b.students - b.items - (a.students - a.items) ||
                b.students - a.students,
        )
        .slice(0, limit);
}

/** The KPI strip's `current` values. */
export function followKpis(totals = {}) {
    return {
        current: {
            students: totals.students || 0,
            alertsOnRate: rate(totals.alertsOn, totals.students) ?? 0,
            reachable: totals.reachable || 0,
            alertsOff: totals.alertsOff || 0,
        },
    };
}

/** Alert performance rows with their open rate. */
export const alertRows = (byBranch = []) =>
    (byBranch || []).map((row) => ({
        ...row,
        label: [row.branch, row.semester ? `Sem ${row.semester}` : '']
            .filter(Boolean)
            .join(' · '),
        openRate: rate(row.opens, row.delivered),
    }));

/** Picks per day for TimeSeriesChart (`_id` is the IST day). */
export const picksSeries = (series = []) =>
    (series || []).map((row) => ({ day: row._id, picks: row.picks || 0 }));
