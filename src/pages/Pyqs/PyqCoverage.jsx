import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Check, Download, Grid3x3, Hourglass } from 'lucide-react';
import api from '../../utils/api';
import { useResources } from '../../hooks/useResources';
import { downloadCsv } from '../../utils/csv';
import { formatNumber } from '../../utils/format';
import Pagination from '../../components/Pagination';
import {
    Alert,
    Button,
    EmptyState,
    Input,
    PageHeader,
    Panel,
    Segmented,
    Select,
    SkeletonRows,
    Stat,
    Table,
    Td,
    Th,
    Tr,
} from '../../components/ui';

// Which Midsem 1 / Midsem 2 / Endsem papers each subject has for the running
// session and the two before it, and which missing ones students asked for.

const EXAM_LABELS = { midsem1: 'M1', midsem2: 'M2', endsem: 'End' };
const EXAM_NAMES = {
    midsem1: 'Midsem 1',
    midsem2: 'Midsem 2',
    endsem: 'Endsem',
};
const SEMESTERS = Array.from({ length: 10 }, (_, i) => ({
    value: String(i + 1),
    label: `Semester ${i + 1}`,
}));
const SHOW = [
    { value: 'all', label: 'All' },
    { value: 'requested', label: 'Requested' },
    { value: 'empty', label: 'No papers' },
];
const SORTS = [
    { value: 'views', label: 'Most viewed' },
    { value: 'requests', label: 'Most requested' },
    { value: 'coverage', label: 'Least covered' },
    { value: 'code', label: 'Subject code' },
];

const slotState = (slot) =>
    slot.approved ? 'available' : slot.pending ? 'pending' : 'missing';

function summarize(subject) {
    let available = 0;
    let requests = 0;
    for (const slot of subject.slots) {
        if (slot.approved) available += 1;
        else if (!slot.pending) requests += slot.requests;
    }
    return { available, requests, total: subject.slots.length };
}

function SlotCell({ slot, subjectName }) {
    const state = slotState(slot);
    const what = `${subjectName} · ${EXAM_NAMES[slot.examType]} ${slot.year}`;
    if (state === 'available') {
        return (
            <span
                title={`${what}: ${slot.approved} paper${slot.approved === 1 ? '' : 's'}`}
                className='inline-flex items-center justify-center w-7 h-7 rounded-md bg-ok-soft text-ok-ink'
            >
                <Check className='w-3.5 h-3.5' aria-hidden='true' />
                <span className='sr-only'>Available</span>
            </span>
        );
    }
    if (state === 'pending') {
        return (
            <span
                title={`${what}: waiting for review`}
                className='inline-flex items-center justify-center w-7 h-7 rounded-md bg-warn-soft text-warn-ink'
            >
                <Hourglass className='w-3.5 h-3.5' aria-hidden='true' />
                <span className='sr-only'>In review</span>
            </span>
        );
    }
    if (slot.requests) {
        return (
            <span
                title={`${what}: missing, ${slot.requests} student${slot.requests === 1 ? '' : 's'} asked`}
                className='inline-flex items-center justify-center w-7 h-7 rounded-md bg-bad-soft text-bad-ink text-[12px] font-semibold'
            >
                {slot.requests}
                <span className='sr-only'> requests, missing</span>
            </span>
        );
    }
    return (
        <span
            title={`${what}: missing`}
            className='inline-flex items-center justify-center w-7 h-7 rounded-md border border-dashed border-line text-faint'
        >
            <span aria-hidden='true'>·</span>
            <span className='sr-only'>Missing</span>
        </span>
    );
}

function Legend() {
    const item = (swatch, label) => (
        <span className='inline-flex items-center gap-1.5'>
            {swatch}
            {label}
        </span>
    );
    return (
        <div className='flex flex-wrap items-center gap-x-4 gap-y-2 text-[12.5px] text-ink-2'>
            {item(
                <span className='w-3.5 h-3.5 rounded bg-ok-soft border border-ok/30' />,
                'Available',
            )}
            {item(
                <span className='w-3.5 h-3.5 rounded bg-warn-soft border border-warn/30' />,
                'In review',
            )}
            {item(
                <span className='w-3.5 h-3.5 rounded bg-bad-soft border border-bad/30' />,
                'Missing, students asked (number of students)',
            )}
            {item(
                <span className='w-3.5 h-3.5 rounded border border-dashed border-line' />,
                'Missing',
            )}
        </div>
    );
}

export default function PyqCoverage() {
    const { collegeslug } = useParams();
    const { courses, branches, fetchCourses, fetchBranches } = useResources();

    const [filters, setFilters] = useState({
        course: '',
        branch: '',
        semester: '',
    });
    const [search, setSearch] = useState('');
    const [show, setShow] = useState('all');
    const [sort, setSort] = useState('views');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchCourses();
    }, [fetchCourses]);

    useEffect(() => {
        if (filters.course) fetchBranches(filters.course);
    }, [filters.course, fetchBranches]);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError('');
        const params = Object.fromEntries(
            Object.entries(filters).filter(([, value]) => value),
        );
        api.get(`/pyq/coverage/${collegeslug}`, { params, timeout: 60000 })
            .then((response) => {
                if (!cancelled) setData(response.data.data);
            })
            .catch((err) => {
                if (!cancelled)
                    setError(
                        err.response?.data?.message ||
                            'Could not load PYQ coverage.',
                    );
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [collegeslug, filters]);

    const setFilter = (key, value) => {
        setFilters((prev) => ({
            ...prev,
            [key]: value,
            ...(key === 'course' ? { branch: '' } : {}),
        }));
        setPage(1);
    };

    const rows = useMemo(() => {
        if (!data) return [];
        const term = search.trim().toLowerCase();
        const list = data.subjects
            .map((subject) => ({ ...subject, summary: summarize(subject) }))
            .filter((subject) => {
                if (
                    term &&
                    !subject.subjectName.toLowerCase().includes(term) &&
                    !subject.subjectCode.toLowerCase().includes(term)
                )
                    return false;
                if (show === 'requested') return subject.summary.requests > 0;
                if (show === 'empty')
                    return subject.slots.every((slot) => !slot.approved);
                return true;
            });
        const by = {
            views: (a, b) => b.views - a.views,
            requests: (a, b) =>
                b.summary.requests - a.summary.requests || b.views - a.views,
            coverage: (a, b) =>
                a.summary.available - b.summary.available || b.views - a.views,
            code: (a, b) => a.subjectCode.localeCompare(b.subjectCode),
        };
        return list.sort(by[sort]);
    }, [data, search, show, sort]);

    const visible = rows.slice((page - 1) * pageSize, page * pageSize);
    const totals = data?.totals;
    const percent = totals?.slots
        ? Math.round((totals.available / totals.slots) * 100)
        : 0;

    const exportMissing = () => {
        const missing = rows.flatMap((subject) =>
            subject.slots
                .filter((slot) => slotState(slot) === 'missing')
                .map((slot) => ({ subject, slot })),
        );
        downloadCsv(
            `pyq-missing-${collegeslug}`,
            [
                { label: 'Subject code', value: (r) => r.subject.subjectCode },
                { label: 'Subject', value: (r) => r.subject.subjectName },
                { label: 'Course', value: (r) => r.subject.course?.courseCode },
                { label: 'Branch', value: (r) => r.subject.branch?.branchCode },
                { label: 'Semester', value: (r) => r.subject.semester },
                { label: 'Session', value: (r) => r.slot.year },
                { label: 'Exam', value: (r) => EXAM_NAMES[r.slot.examType] },
                { label: 'Student requests', value: (r) => r.slot.requests },
                { label: 'Subject views', value: (r) => r.subject.views },
            ],
            missing,
        );
    };

    const sessions = data?.sessions || [];
    const examTypes = data?.examTypes || ['midsem1', 'midsem2', 'endsem'];

    return (
        <div>
            <PageHeader
                eyebrow='PYQs'
                title='PYQ coverage'
                description={`Which Midsem 1, Midsem 2 and Endsem papers each subject has for ${
                    sessions.length
                        ? `${sessions[sessions.length - 1]} to ${sessions[0]}`
                        : 'the last three sessions'
                }.`}
                actions={
                    <Button
                        icon={Download}
                        onClick={exportMissing}
                        disabled={!rows.length}
                    >
                        Export missing
                    </Button>
                }
            />

            <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5'>
                <Stat
                    label='Covered'
                    value={`${percent}%`}
                    note={
                        totals
                            ? `${formatNumber(totals.available)} of ${formatNumber(totals.slots)} papers`
                            : undefined
                    }
                    loading={loading && !data}
                />
                <Stat
                    label='In review'
                    value={formatNumber(totals?.pending ?? 0)}
                    note='Uploaded, waiting for approval'
                    attention={Boolean(totals?.pending)}
                    to={`/${collegeslug}/pyqs?submissionStatus=pending`}
                    loading={loading && !data}
                />
                <Stat
                    label='Missing'
                    value={formatNumber(totals?.missing ?? 0)}
                    loading={loading && !data}
                />
                <Stat
                    label='Asked for by students'
                    value={formatNumber(totals?.requested ?? 0)}
                    note='Missing papers with at least one request'
                    attention={Boolean(totals?.requested)}
                    loading={loading && !data}
                />
            </div>

            <Panel>
                <div className='flex flex-wrap items-center gap-2.5 px-5 py-4 border-b border-line-soft'>
                    <Select
                        aria-label='Course'
                        placeholder='All courses'
                        options={courses}
                        value={filters.course}
                        onChange={(e) => setFilter('course', e.target.value)}
                        className='w-full sm:w-56'
                    />
                    <Select
                        aria-label='Branch'
                        placeholder='All branches'
                        options={filters.course ? branches : []}
                        value={filters.branch}
                        disabled={!filters.course}
                        onChange={(e) => setFilter('branch', e.target.value)}
                        className='w-full sm:w-56'
                    />
                    <Select
                        aria-label='Semester'
                        placeholder='All semesters'
                        options={SEMESTERS}
                        value={filters.semester}
                        onChange={(e) => setFilter('semester', e.target.value)}
                        className='w-full sm:w-40'
                    />
                    <Input
                        type='search'
                        aria-label='Search subjects'
                        placeholder='Search subject or code'
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        className='w-full sm:w-56'
                    />
                    <div className='flex flex-wrap items-center gap-2.5 sm:ml-auto'>
                        <Segmented
                            label='Show subjects'
                            options={SHOW}
                            value={show}
                            onChange={(value) => {
                                setShow(value);
                                setPage(1);
                            }}
                        />
                        <Select
                            aria-label='Sort'
                            options={SORTS}
                            value={sort}
                            onChange={(e) => setSort(e.target.value)}
                            className='w-40'
                        />
                    </div>
                </div>
                <div className='px-5 py-3 border-b border-line-soft'>
                    <Legend />
                </div>

                {error ? (
                    <div className='p-5'>
                        <Alert tone='bad' title='Coverage did not load'>
                            {error}
                        </Alert>
                    </div>
                ) : loading && !data ? (
                    <SkeletonRows rows={8} />
                ) : !rows.length ? (
                    <EmptyState
                        icon={Grid3x3}
                        title='No subjects match'
                        description='Try another course, branch, semester or search.'
                    />
                ) : (
                    <div className={loading ? 'opacity-60' : ''}>
                        <Table minWidth={980}>
                            <thead>
                                <tr>
                                    <Th rowSpan={2}>Subject</Th>
                                    <Th rowSpan={2} align='right'>
                                        Views
                                    </Th>
                                    {sessions.map((session) => (
                                        <Th
                                            key={session}
                                            colSpan={examTypes.length}
                                            align='center'
                                            className='border-l border-line-soft'
                                        >
                                            {session}
                                        </Th>
                                    ))}
                                    <Th rowSpan={2} align='right'>
                                        Have
                                    </Th>
                                </tr>
                                <tr>
                                    {sessions.flatMap((session) =>
                                        examTypes.map((examType, i) => (
                                            <Th
                                                key={`${session}-${examType}`}
                                                align='center'
                                                title={EXAM_NAMES[examType]}
                                                className={
                                                    i === 0
                                                        ? 'border-l border-line-soft'
                                                        : ''
                                                }
                                            >
                                                {EXAM_LABELS[examType]}
                                            </Th>
                                        )),
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {visible.map((subject) => (
                                    <Tr key={subject._id}>
                                        <Td>
                                            <div className='font-medium text-ink'>
                                                {subject.subjectName}
                                            </div>
                                            <div className='text-[12.5px] text-muted'>
                                                <span className='font-mono'>
                                                    {subject.subjectCode}
                                                </span>
                                                {subject.branch?.branchCode &&
                                                    ` · ${subject.branch.branchCode}`}
                                                {` · Sem ${subject.semester}`}
                                            </div>
                                        </Td>
                                        <Td align='right' mono>
                                            {formatNumber(subject.views)}
                                        </Td>
                                        {subject.slots.map((slot, i) => (
                                            <Td
                                                key={`${slot.year}-${slot.examType}`}
                                                align='center'
                                                className={`px-1.5 ${
                                                    i % examTypes.length === 0
                                                        ? 'border-l border-line-soft'
                                                        : ''
                                                }`}
                                            >
                                                <SlotCell
                                                    slot={slot}
                                                    subjectName={
                                                        subject.subjectName
                                                    }
                                                />
                                            </Td>
                                        ))}
                                        <Td align='right' mono>
                                            {subject.summary.available}/
                                            {subject.summary.total}
                                        </Td>
                                    </Tr>
                                ))}
                            </tbody>
                        </Table>
                        <Pagination
                            currentPage={page}
                            pageSize={pageSize}
                            pageSizeOptions={[25, 50, 100]}
                            totalItems={rows.length}
                            onPageChange={setPage}
                            onPageSizeChange={(size) => {
                                setPageSize(size);
                                setPage(1);
                            }}
                            className='px-5 py-3 border-t border-line-soft'
                        />
                    </div>
                )}
            </Panel>
        </div>
    );
}
