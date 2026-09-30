import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BookOpenCheck, Download, Pencil, Trash2 } from 'lucide-react';
import api from '../../utils/api';
import { useColleges } from '../../context/CollegeContext';
import { useSelection } from '../../hooks/useSelection';
import { downloadCsv } from '../../utils/csv';
import { formatDate, formatNumber, formatShortDate } from '../../utils/format';
import FilterBar from '../../components/Common/FilterBar';
import { filterByTime } from '../../components/Common/timeFilterUtils';
import Loader from '../../components/Common/Loader';
import Pagination from '../../components/Pagination';
import ConfirmModal from '../../components/ConfirmModal';
import SyllabusEditModal from '../../components/SyllabusEditModal';
import {
    Alert,
    BulkBar,
    BulkButton,
    Button,
    EmptyState,
    PageHeader,
    SelectCell,
    StatusBadge,
    Table,
    Td,
    Th,
    Tr,
} from '../../components/ui';

const EMPTY_FILTERS = { year: '', semester: '', isActive: '' };

const unitCount = (item) => {
    const n = item.units?.length || 0;
    return n === 1 ? '1 unit' : `${formatNumber(n)} units`;
};

const SyllabusList = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { collegeslug } = useParams();
    const { currentCollege } = useColleges();

    // Filters live in the URL so a filtered list can be shared or reloaded.
    const params = new URLSearchParams(location.search);
    const [syllabus, setSyllabus] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState(params.get('search') || '');
    const [page, setPage] = useState(parseInt(params.get('page')) || 1);
    const [pageSize, setPageSize] = useState(20);
    const [timeFilter, setTimeFilter] = useState(params.get('time') || 'all');
    const [filters, setFilters] = useState(() =>
        Object.fromEntries(
            Object.keys(EMPTY_FILTERS).map((key) => [
                key,
                params.get(key) || '',
            ]),
        ),
    );
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const [viewMode, setViewMode] = useState(() =>
        window.innerWidth >= 1024 ? 'table' : 'grid',
    );

    const [editing, setEditing] = useState(null);
    const [confirm, setConfirm] = useState(null);
    const [bulkBusy, setBulkBusy] = useState(false);

    const fetchSyllabus = useCallback(async () => {
        try {
            setError(null);
            const response = await api.get(`/syllabus/all/${collegeslug}`);
            setSyllabus(response.data.data || []);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    'Couldn’t load the syllabus. Check your connection and try again.',
            );
        } finally {
            setLoading(false);
        }
    }, [collegeslug]);

    useEffect(() => {
        fetchSyllabus();
    }, [fetchSyllabus]);

    useEffect(() => {
        const next = new URLSearchParams();
        if (search) next.set('search', search);
        if (timeFilter && timeFilter !== 'all') next.set('time', timeFilter);
        Object.entries(filters).forEach(
            ([key, value]) => value && next.set(key, value),
        );
        if (page > 1) next.set('page', String(page));
        navigate({ search: next.toString() }, { replace: true });
    }, [search, timeFilter, filters, page, navigate]);

    const setFilter = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
        setPage(1);
    };

    const filtered = syllabus.filter((item) => {
        const q = search.trim().toLowerCase();
        const matchesSearch =
            !q ||
            item.subject?.subjectName?.toLowerCase().includes(q) ||
            item.subject?.subjectCode?.toLowerCase().includes(q);
        const matchesActive =
            filters.isActive === '' ||
            (filters.isActive === 'true' ? item.isActive : !item.isActive);
        return (
            matchesSearch &&
            (!filters.year || item.year === parseInt(filters.year)) &&
            (!filters.semester ||
                item.semester === parseInt(filters.semester)) &&
            matchesActive &&
            filterByTime(item, timeFilter)
        );
    });

    const sorted = [...filtered].sort((a, b) => {
        let diff;
        if (sortBy === 'viewCount') {
            diff = (a.viewCount || 0) - (b.viewCount || 0);
        } else if (sortBy === 'semester') {
            diff =
                (a.semester || 0) - (b.semester || 0) ||
                (a.subject?.subjectCode || '').localeCompare(
                    b.subject?.subjectCode || '',
                );
        } else {
            diff = new Date(a.createdAt) - new Date(b.createdAt);
        }
        return sortOrder === 'desc' ? -diff : diff;
    });
    const current = sorted.slice((page - 1) * pageSize, page * pageSize);

    const selection = useSelection(
        useMemo(() => current.map((s) => s._id), [current]),
    );

    const activeFilters = Object.values(filters).filter(Boolean).length;
    const clearAll = () => {
        setSearch('');
        setTimeFilter('all');
        setFilters(EMPTY_FILTERS);
        setSortBy('createdAt');
        setSortOrder('desc');
        setPage(1);
    };

    const remove = (ids) =>
        setConfirm({
            title:
                ids.length === 1
                    ? 'Delete this syllabus?'
                    : `Delete ${formatNumber(ids.length)} syllabi?`,
            message:
                'Students stop seeing the units on the subject page, and the subject loses its link to them. This can’t be undone.',
            onConfirm: async () => {
                setBulkBusy(true);
                const results = await Promise.allSettled(
                    ids.map((id) => api.delete(`/syllabus/delete/${id}`)),
                );
                setBulkBusy(false);
                const done = ids.filter(
                    (_, i) => results[i].status === 'fulfilled',
                );
                const failed = ids.length - done.length;
                if (done.length)
                    toast.success(
                        done.length === 1
                            ? 'Syllabus deleted'
                            : `${formatNumber(done.length)} syllabi deleted`,
                    );
                if (failed)
                    toast.error(
                        `${formatNumber(failed)} couldn’t be deleted. Try those again.`,
                    );
                setSyllabus((prev) =>
                    prev.filter((s) => !done.includes(s._id)),
                );
                selection.clear();
            },
        });

    const exportCsv = () =>
        downloadCsv(
            `syllabus-${collegeslug}`,
            [
                { label: 'Code', value: (s) => s.subject?.subjectCode },
                { label: 'Subject', value: (s) => s.subject?.subjectName },
                {
                    label: 'Branch',
                    value: (s) => s.subject?.branch?.branchName,
                },
                {
                    label: 'Course',
                    value: (s) => s.subject?.branch?.course?.courseName,
                },
                { label: 'Year', value: (s) => s.year },
                { label: 'Semester', value: (s) => s.semester },
                { label: 'Units', value: (s) => s.units?.length || 0 },
                { label: 'Views', value: (s) => s.viewCount || 0 },
                {
                    label: 'Status',
                    value: (s) => (s.isActive ? 'active' : 'inactive'),
                },
                { label: 'Added', value: (s) => formatDate(s.createdAt) },
            ],
            sorted,
        );

    if (loading) return <Loader />;

    const selectedIds = [...selection.selected];
    const itemUrl = (item) => `/${collegeslug}/syllabus/${item._id}`;
    const name = (item) =>
        item.subject?.subjectName || item.subject?.subjectCode || 'syllabus';
    const branchLine = (item) =>
        [
            item.subject?.branch?.course?.courseName,
            item.subject?.branch?.branchCode,
        ]
            .filter(Boolean)
            .join(' · ');

    const rowActions = (item) => {
        const stop = (fn) => (event) => {
            event.stopPropagation();
            fn();
        };
        return (
            <>
                <Button
                    variant='ghost'
                    size='sm'
                    iconOnly
                    icon={Pencil}
                    aria-label={`Edit ${name(item)}`}
                    onClick={stop(() => setEditing(item))}
                />
                <Button
                    variant='ghost'
                    size='sm'
                    iconOnly
                    icon={Trash2}
                    aria-label={`Delete ${name(item)}`}
                    className='text-bad-ink hover:text-bad-ink'
                    disabled={bulkBusy}
                    onClick={stop(() => remove([item._id]))}
                />
            </>
        );
    };

    const statusBadge = (item) => (
        <StatusBadge status={item.isActive ? 'active' : 'inactive'} />
    );

    const pagination = (
        <Pagination
            currentPage={page}
            pageSize={pageSize}
            totalItems={sorted.length}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
            }}
        />
    );

    const empty = (
        <EmptyState
            icon={BookOpenCheck}
            title={
                syllabus.length === 0 ? 'No syllabus yet' : 'Nothing matches'
            }
            description={
                syllabus.length === 0
                    ? 'Syllabi added from a branch’s subject list appear here.'
                    : 'Try another search or clear the filters.'
            }
            action={
                activeFilters || search || timeFilter !== 'all' ? (
                    <Button onClick={clearAll}>Clear filters</Button>
                ) : undefined
            }
        />
    );

    return (
        <div className='min-h-full px-4 sm:px-10 pt-8 pb-12'>
            <PageHeader
                title='Syllabus'
                description={`Unit-wise syllabus for ${currentCollege?.name || collegeslug} subjects, shown to students on subject pages.`}
                actions={
                    <Button
                        icon={Download}
                        onClick={exportCsv}
                        disabled={!sorted.length}
                    >
                        Export CSV
                    </Button>
                }
            />

            <FilterBar
                className='mb-4'
                search={search}
                onSearch={(value) => {
                    setSearch(value);
                    setPage(1);
                }}
                searchPlaceholder='Search by subject name or code'
                filters={[
                    {
                        label: 'Year',
                        value: filters.year,
                        onChange: (v) => setFilter('year', v),
                        options: [
                            { value: '', label: 'Any year' },
                            ...[1, 2, 3, 4, 5, 6].map((y) => ({
                                value: String(y),
                                label: `Year ${y}`,
                            })),
                        ],
                    },
                    {
                        label: 'Semester',
                        value: filters.semester,
                        onChange: (v) => setFilter('semester', v),
                        options: [
                            { value: '', label: 'Any semester' },
                            ...[1, 2, 3, 4, 5, 6, 7, 8].map((s) => ({
                                value: String(s),
                                label: `Semester ${s}`,
                            })),
                        ],
                    },
                    {
                        label: 'Status',
                        value: filters.isActive,
                        onChange: (v) => setFilter('isActive', v),
                        options: [
                            { value: '', label: 'Active or inactive' },
                            { value: 'true', label: 'Active' },
                            { value: 'false', label: 'Inactive' },
                        ],
                    },
                ]}
                timeFilter={{
                    value: timeFilter,
                    onChange: (v) => {
                        setTimeFilter(v);
                        setPage(1);
                    },
                }}
                sortBy={{
                    value: sortBy,
                    onChange: (v) => {
                        setSortBy(v);
                        // Semester order reads naturally from the first one.
                        if (v === 'semester') setSortOrder('asc');
                    },
                    options: [
                        { value: 'createdAt', label: 'Newest first' },
                        { value: 'viewCount', label: 'Most viewed' },
                        { value: 'semester', label: 'Semester' },
                    ],
                }}
                sortOrder={{
                    value: sortOrder,
                    onToggle: () =>
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'),
                }}
                viewMode={{ value: viewMode, onChange: setViewMode }}
                onClear={clearAll}
                showClear={Boolean(
                    search || timeFilter !== 'all' || activeFilters,
                )}
            />

            {error && (
                <Alert
                    tone='bad'
                    className='mb-4'
                    action={
                        <Button size='sm' onClick={fetchSyllabus}>
                            Try again
                        </Button>
                    }
                >
                    {error}
                </Alert>
            )}

            {viewMode === 'table' ? (
                <div className='bg-sheet border border-line rounded-xl overflow-hidden'>
                    <BulkBar count={selection.count} onClear={selection.clear}>
                        <BulkButton
                            icon={Trash2}
                            disabled={bulkBusy}
                            onClick={() => remove(selectedIds)}
                        >
                            Delete
                        </BulkButton>
                    </BulkBar>
                    {current.length === 0 ? (
                        empty
                    ) : (
                        <Table minWidth={900}>
                            <thead>
                                <tr>
                                    <SelectCell
                                        header
                                        label='Select all syllabi on this page'
                                        checked={selection.allVisible}
                                        indeterminate={selection.someVisible}
                                        onChange={selection.toggleAllVisible}
                                    />
                                    <Th>Subject</Th>
                                    <Th>Year · Sem</Th>
                                    <Th>Units</Th>
                                    <Th align='right'>Views</Th>
                                    <Th>Status</Th>
                                    <Th>Added</Th>
                                    <Th>
                                        <span className='sr-only'>Actions</span>
                                    </Th>
                                </tr>
                            </thead>
                            <tbody>
                                {current.map((item) => (
                                    <Tr
                                        key={item._id}
                                        selected={selection.isSelected(
                                            item._id,
                                        )}
                                        onClick={() => navigate(itemUrl(item))}
                                    >
                                        <SelectCell
                                            label={`Select ${name(item)}`}
                                            checked={selection.isSelected(
                                                item._id,
                                            )}
                                            onChange={(on) =>
                                                selection.toggle(item._id, on)
                                            }
                                        />
                                        <Td className='max-w-[360px]'>
                                            <div className='flex items-baseline gap-2.5 min-w-0'>
                                                <code className='shrink-0 font-mono text-[12.5px] text-muted'>
                                                    {item.subject
                                                        ?.subjectCode || '—'}
                                                </code>
                                                <div className='flex flex-col gap-0.5 min-w-0'>
                                                    <Link
                                                        to={itemUrl(item)}
                                                        onClick={(e) =>
                                                            e.stopPropagation()
                                                        }
                                                        className='font-medium text-ink hover:underline truncate'
                                                    >
                                                        {item.subject
                                                            ?.subjectName ||
                                                            'Untitled subject'}
                                                    </Link>
                                                    {branchLine(item) && (
                                                        <span className='text-[12.5px] text-muted truncate'>
                                                            {branchLine(item)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </Td>
                                        <Td className='whitespace-nowrap'>
                                            Year {item.year} · Sem{' '}
                                            {item.semester}
                                        </Td>
                                        <Td className='whitespace-nowrap'>
                                            {item.units?.length ? (
                                                unitCount(item)
                                            ) : (
                                                <span className='text-warn-ink'>
                                                    No units
                                                </span>
                                            )}
                                        </Td>
                                        <Td align='right' mono>
                                            {formatNumber(item.viewCount)}
                                        </Td>
                                        <Td>{statusBadge(item)}</Td>
                                        <Td className='whitespace-nowrap text-ink-2'>
                                            {formatShortDate(item.createdAt)}
                                        </Td>
                                        <Td align='right'>
                                            <div className='flex justify-end gap-1'>
                                                {rowActions(item)}
                                            </div>
                                        </Td>
                                    </Tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                    {sorted.length > 0 && (
                        <div className='px-4 py-3 border-t border-line-soft'>
                            {pagination}
                        </div>
                    )}
                </div>
            ) : current.length === 0 ? (
                <div className='bg-sheet border border-line rounded-xl'>
                    {empty}
                </div>
            ) : (
                <div className='flex flex-col gap-4'>
                    <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'>
                        {current.map((item) => (
                            <article
                                key={item._id}
                                onClick={() => navigate(itemUrl(item))}
                                className='flex flex-col gap-3 p-4 bg-sheet border border-line rounded-xl hover:border-line-strong cursor-pointer transition-colors'
                            >
                                <div className='flex items-start gap-2'>
                                    <div className='flex-1 min-w-0 flex flex-col gap-0.5'>
                                        <code className='font-mono text-[12px] text-muted'>
                                            {item.subject?.subjectCode || '—'}
                                        </code>
                                        <Link
                                            to={itemUrl(item)}
                                            onClick={(e) => e.stopPropagation()}
                                            className='font-medium text-ink hover:underline line-clamp-2'
                                        >
                                            {item.subject?.subjectName ||
                                                'Untitled subject'}
                                        </Link>
                                    </div>
                                    {statusBadge(item)}
                                </div>
                                <div className='flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-ink-2'>
                                    <span>
                                        Year {item.year} · Sem {item.semester}
                                    </span>
                                    <span
                                        className={
                                            item.units?.length
                                                ? ''
                                                : 'text-warn-ink'
                                        }
                                    >
                                        {item.units?.length
                                            ? unitCount(item)
                                            : 'No units'}
                                    </span>
                                    <span>
                                        {formatNumber(item.viewCount)} views
                                    </span>
                                </div>
                                <div className='flex items-center gap-2 pt-3 border-t border-line-soft'>
                                    <span className='flex-1 text-xs text-muted truncate'>
                                        {[
                                            branchLine(item),
                                            `Added ${formatShortDate(item.createdAt)}`,
                                        ]
                                            .filter(Boolean)
                                            .join(' · ')}
                                    </span>
                                    {rowActions(item)}
                                </div>
                            </article>
                        ))}
                    </div>
                    <div className='bg-sheet border border-line rounded-xl px-4 py-3'>
                        {pagination}
                    </div>
                </div>
            )}

            <SyllabusEditModal
                isOpen={Boolean(editing)}
                onClose={() => setEditing(null)}
                syllabus={editing}
                onUpdate={(saved) => {
                    const id = editing?._id;
                    setSyllabus((prev) =>
                        prev.map((item) =>
                            item._id === id ? { ...item, ...saved } : item,
                        ),
                    );
                }}
            />

            <ConfirmModal
                isOpen={Boolean(confirm)}
                onClose={() => setConfirm(null)}
                onConfirm={() => confirm?.onConfirm()}
                title={confirm?.title}
                message={confirm?.message}
                confirmText='Delete'
                variant='danger'
            />
        </div>
    );
};

export default SyllabusList;
