import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    Check,
    Download,
    FileText,
    Pencil,
    Sparkles,
    Trash2,
} from 'lucide-react';
import api from '../../utils/api';
import { useSelection } from '../../hooks/useSelection';
import { downloadCsv } from '../../utils/csv';
import {
    formatDateTime,
    formatNumber,
    formatShortDate,
} from '../../utils/format';
import { examTypeLabel } from '../../utils/labels';
import FilterBar from '../../components/Common/FilterBar';
import Loader from '../../components/Common/Loader';
import Pagination from '../../components/Pagination';
import ConfirmModal from '../../components/ConfirmModal';
import {
    Alert,
    BulkBar,
    BulkButton,
    Button,
    EmptyState,
    PageHeader,
    SelectCell,
    SkeletonRows,
    Stat,
    Table,
    Tabs,
    Td,
    Th,
    Tr,
} from '../../components/ui';

const ENDPOINTS = {
    all: (slug) => `/pyq-solution/all/${slug}`,
    requested: (slug) => `/pyq-solution/requested/${slug}`,
};

/** Green chip when a version exists, a dashed one when it's missing. */
const VersionChip = ({ has, label }) =>
    has ? (
        <span className='inline-flex items-center gap-1 h-[22px] px-2 rounded-full bg-ok-soft text-ok-ink text-xs font-medium whitespace-nowrap'>
            <Check className='w-3 h-3' aria-hidden='true' />
            {label}
        </span>
    ) : (
        <span className='inline-flex items-center h-[22px] px-2 rounded-full border border-dashed border-faint text-muted text-xs font-medium whitespace-nowrap'>
            No {label.toLowerCase()}
        </span>
    );

const PyqSolutionList = () => {
    const { collegeslug } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // Tab, search and page live in the URL so the view can be shared or reloaded.
    const params = new URLSearchParams(location.search);
    const [activeTab, setActiveTab] = useState(
        params.get('tab') === 'requested' ? 'requested' : 'all',
    );
    const [search, setSearch] = useState(params.get('search') || '');
    const [query, setQuery] = useState(search);
    const [page, setPage] = useState(parseInt(params.get('page')) || 1);
    const [pageSize, setPageSize] = useState(10);
    const [viewMode, setViewMode] = useState(() =>
        window.innerWidth >= 1024 ? 'table' : 'grid',
    );

    const [solutions, setSolutions] = useState([]);
    const [totalItems, setTotalItems] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(null);
    const [summary, setSummary] = useState(null);
    const [confirm, setConfirm] = useState(null);
    const [bulkBusy, setBulkBusy] = useState(false);
    const [exporting, setExporting] = useState(false);

    // Wait for a pause in typing before searching the server.
    useEffect(() => {
        const timer = setTimeout(() => setQuery(search.trim()), 300);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        const next = new URLSearchParams();
        if (activeTab !== 'all') next.set('tab', activeTab);
        if (search) next.set('search', search);
        if (page > 1) next.set('page', String(page));
        navigate({ search: next.toString() }, { replace: true });
    }, [activeTab, search, page, navigate]);

    // Only the latest request may update the list, so a slow response for an
    // old search or page can't overwrite a newer one.
    const latestRequest = useRef(0);

    const fetchSolutions = useCallback(async () => {
        const requestId = ++latestRequest.current;
        const isLatest = () => requestId === latestRequest.current;
        try {
            setLoading(true);
            setError(null);
            const response = await api.get(ENDPOINTS[activeTab](collegeslug), {
                params: {
                    page,
                    limit: pageSize,
                    search: query || undefined,
                },
            });

            if (isLatest() && response.data.success) {
                setSolutions(response.data.data);
                setTotalItems(response.data.pagination.total);
            }
        } catch (err) {
            console.error(err);
            if (isLatest())
                setError(
                    err.response?.data?.message ||
                        'Couldn’t load solutions. Check your connection and try again.',
                );
        } finally {
            if (isLatest()) {
                setLoading(false);
                setLoaded(true);
            }
        }
    }, [collegeslug, page, pageSize, query, activeTab]);

    // Totals for both tabs, without the search, for the tiles and tab counts.
    const fetchSummary = useCallback(async () => {
        try {
            const [all, requested] = await Promise.all(
                ['all', 'requested'].map((tab) =>
                    api.get(ENDPOINTS[tab](collegeslug), {
                        params: { page: 1, limit: 1 },
                    }),
                ),
            );
            setSummary({
                all: all.data.pagination?.total ?? 0,
                requested: requested.data.pagination?.total ?? 0,
            });
        } catch {
            setSummary(null);
        }
    }, [collegeslug]);

    useEffect(() => {
        fetchSolutions();
    }, [fetchSolutions]);

    useEffect(() => {
        fetchSummary();
    }, [fetchSummary]);

    const isAll = activeTab === 'all';
    const selection = useSelection(
        useMemo(
            () => (activeTab === 'all' ? solutions.map((s) => s._id) : []),
            [solutions, activeTab],
        ),
    );

    const switchTab = (tab) => {
        setActiveTab(tab);
        setPage(1);
        setSolutions([]);
        selection.clear();
    };

    const editorPath = (pyqId) => `/${collegeslug}/pyqs/${pyqId}/aisolution`;

    const handleEdit = (solution) => {
        if (solution.pyq?._id) {
            navigate(editorPath(solution.pyq._id));
        } else {
            toast.error('This solution’s PYQ no longer exists');
        }
    };

    // Runs one request per solution and reports how many went through.
    const deleteSolutions = async (ids) => {
        setBulkBusy(true);
        const results = await Promise.allSettled(
            ids.map((id) => api.delete(`/pyq-solution/delete/${id}`)),
        );
        setBulkBusy(false);
        const done = results.filter((r) => r.status === 'fulfilled').length;
        const failed = ids.length - done;
        if (done)
            toast.success(
                `${formatNumber(done)} solution${done === 1 ? '' : 's'} deleted`,
            );
        if (failed)
            toast.error(
                ids.length === 1
                    ? results[0].reason?.response?.data?.message ||
                          'Couldn’t delete the solution. Try again.'
                    : `${formatNumber(failed)} couldn’t be deleted. Try those again.`,
            );
        selection.clear();
        fetchSolutions();
        fetchSummary();
    };

    const remove = (ids, name) =>
        setConfirm({
            title:
                ids.length === 1
                    ? `Delete the solution for ${name || 'this PYQ'}?`
                    : `Delete ${formatNumber(ids.length)} solutions?`,
            message:
                'Students lose the concise and expert answers, and the PYQ is marked unsolved again. This can’t be undone.',
            onConfirm: () => deleteSolutions(ids),
        });

    const exportCsv = async () => {
        setExporting(true);
        try {
            const response = await api.get(ENDPOINTS[activeTab](collegeslug), {
                params: {
                    page: 1,
                    limit: totalItems,
                    search: query || undefined,
                },
            });
            const rows = response.data.data || [];
            const pyqOf = (row) => (isAll ? row.pyq : row) || {};
            const common = [
                {
                    label: 'Subject',
                    value: (r) => pyqOf(r).subject?.subjectName,
                },
                { label: 'Code', value: (r) => pyqOf(r).subject?.subjectCode },
                { label: 'Slug', value: (r) => pyqOf(r).slug },
                { label: 'Year', value: (r) => pyqOf(r).year },
                {
                    label: 'Exam',
                    value: (r) => examTypeLabel(pyqOf(r).examType),
                },
            ];
            downloadCsv(
                `pyq-solutions-${isAll ? 'all' : 'requested'}-${collegeslug}`,
                isAll
                    ? [
                          ...common,
                          {
                              label: 'Concise',
                              value: (r) => (r.conciseContent ? 'yes' : 'no'),
                          },
                          {
                              label: 'Expert',
                              value: (r) => (r.expertContent ? 'yes' : 'no'),
                          },
                          {
                              label: 'Written by',
                              value: (r) => r.generatedBy?.name,
                          },
                          { label: 'Views', value: (r) => r.clickCounts || 0 },
                          {
                              label: 'Updated',
                              value: (r) => formatDateTime(r.lastUpdated),
                          },
                      ]
                    : [
                          ...common,
                          {
                              label: 'Requests',
                              value: (r) => r.solutionRequestCount || 0,
                          },
                          {
                              label: 'Updated',
                              value: (r) => formatDateTime(r.updatedAt),
                          },
                      ],
                rows,
            );
        } catch {
            toast.error('Couldn’t export the list. Try again.');
        } finally {
            setExporting(false);
        }
    };

    if (loading && !loaded) return <Loader />;

    const maxRequests = Math.max(
        1,
        ...solutions.map((s) => s.solutionRequestCount || 0),
    );

    // Normalise both tabs: "all" rows are PyqSolution docs with a populated
    // pyq; "requested" rows are the PYQs themselves.
    const rows = solutions.map((item) => {
        const pyq = isAll ? item.pyq : item;
        return {
            key: item._id,
            item,
            pyq,
            name: pyq?.subject?.subjectName || 'PYQ removed',
            code: pyq?.subject?.subjectCode,
            slug: pyq?.slug,
        };
    });

    const open = (row) =>
        isAll ? handleEdit(row.item) : navigate(editorPath(row.pyq._id));

    const nameCell = (row) => (
        <div className='flex flex-col gap-0.5 min-w-0'>
            {row.pyq?._id ? (
                <Link
                    to={editorPath(row.pyq._id)}
                    onClick={(e) => e.stopPropagation()}
                    className='font-medium text-ink hover:underline truncate'
                >
                    {row.name}
                </Link>
            ) : (
                <span className='font-medium text-muted'>{row.name}</span>
            )}
            {row.slug && (
                <code className='font-mono text-[11.5px] text-muted truncate'>
                    {row.slug}
                </code>
            )}
        </div>
    );

    const yearExam = (pyq) => (
        <div className='flex flex-col gap-0.5'>
            <span>{pyq?.year || '—'}</span>
            <span className='text-[12.5px] text-muted whitespace-nowrap'>
                {examTypeLabel(pyq?.examType)}
            </span>
        </div>
    );

    const requestsBar = (count) => (
        <div className='flex items-center gap-2.5'>
            <span className='w-7 text-right font-mono text-[13px] font-medium'>
                {formatNumber(count)}
            </span>
            <span
                aria-hidden='true'
                className='flex-1 min-w-[60px] h-1.5 rounded-full bg-line-soft overflow-hidden'
            >
                <span
                    className='block h-full rounded-full bg-brand'
                    style={{
                        width: `${Math.round((count / maxRequests) * 100)}%`,
                    }}
                />
            </span>
        </div>
    );

    const actions = (row) =>
        isAll ? (
            <>
                <Button
                    variant='ghost'
                    size='sm'
                    iconOnly
                    icon={Pencil}
                    aria-label={`Edit the solution for ${row.name}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(row.item);
                    }}
                />
                <Button
                    variant='ghost'
                    size='sm'
                    iconOnly
                    icon={Trash2}
                    aria-label={`Delete the solution for ${row.name}`}
                    className='text-bad-ink hover:text-bad-ink'
                    onClick={(e) => {
                        e.stopPropagation();
                        remove([row.item._id], row.name);
                    }}
                />
            </>
        ) : (
            <Button
                variant='primary'
                size='sm'
                icon={Sparkles}
                to={editorPath(row.pyq._id)}
                onClick={(e) => e.stopPropagation()}
                aria-label={`Create a solution for ${row.name}`}
            >
                Create solution
            </Button>
        );

    const pagination = (
        <Pagination
            currentPage={page}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
            }}
        />
    );

    const empty = (
        <EmptyState
            icon={FileText}
            tone={!isAll && !query ? 'done' : 'neutral'}
            title={
                query
                    ? 'No solutions match'
                    : isAll
                      ? 'No solutions yet'
                      : 'No open requests'
            }
            description={
                query
                    ? 'Search looks at the PYQ slug, year and exam type.'
                    : isAll
                      ? 'Solutions you generate or import for this college’s PYQs appear here.'
                      : 'Unsolved PYQs appear here when students ask for a solution.'
            }
            action={
                query ? (
                    <Button
                        onClick={() => {
                            setSearch('');
                            setPage(1);
                        }}
                    >
                        Clear search
                    </Button>
                ) : undefined
            }
        />
    );

    const updatedOf = (row) =>
        isAll ? row.item.lastUpdated : row.item.updatedAt;

    return (
        <div className='min-h-full px-4 sm:px-10 pt-8 pb-12'>
            <PageHeader
                title='PYQ solutions'
                description='AI-written answers attached to PYQs. Requested papers are the ones students are waiting on.'
                actions={
                    <Button
                        icon={Download}
                        onClick={exportCsv}
                        disabled={!totalItems || exporting}
                    >
                        {exporting ? 'Exporting…' : 'Export CSV'}
                    </Button>
                }
            />

            {summary && (
                <div className='grid grid-cols-2 gap-3 sm:gap-4 mb-6'>
                    <Stat
                        label='Waiting for a solution'
                        attention={summary.requested > 0}
                        value={formatNumber(summary.requested)}
                        note='Unsolved papers students asked for'
                    />
                    <Stat
                        label='Solved PYQs'
                        value={formatNumber(summary.all)}
                        note='Generated or imported'
                    />
                </div>
            )}

            <Tabs
                label='Solution list'
                className='mb-4'
                value={activeTab}
                onChange={switchTab}
                items={[
                    {
                        value: 'all',
                        label: 'All solutions',
                        count: summary?.all,
                    },
                    {
                        value: 'requested',
                        label: 'Requested',
                        count: summary?.requested,
                        attention: summary?.requested > 0,
                    },
                ]}
            />

            <FilterBar
                className='mb-4'
                search={search}
                onSearch={(value) => {
                    setSearch(value);
                    setPage(1);
                }}
                searchPlaceholder='Search by PYQ slug, year or exam type'
                viewMode={{ value: viewMode, onChange: setViewMode }}
                onClear={() => {
                    setSearch('');
                    setPage(1);
                }}
                showClear={Boolean(search)}
            />

            {error && (
                <Alert
                    tone='bad'
                    className='mb-4'
                    action={
                        <Button size='sm' onClick={fetchSolutions}>
                            Try again
                        </Button>
                    }
                >
                    {error}
                </Alert>
            )}

            {viewMode === 'table' ? (
                <div className='bg-sheet border border-line rounded-xl overflow-hidden'>
                    {isAll && (
                        <BulkBar
                            count={selection.count}
                            onClear={selection.clear}
                        >
                            <BulkButton
                                icon={Trash2}
                                disabled={bulkBusy}
                                onClick={() => remove([...selection.selected])}
                            >
                                Delete
                            </BulkButton>
                        </BulkBar>
                    )}
                    {loading && !rows.length ? (
                        <SkeletonRows rows={6} />
                    ) : rows.length === 0 ? (
                        empty
                    ) : (
                        <Table minWidth={isAll ? 940 : 860}>
                            <thead>
                                <tr>
                                    {isAll && (
                                        <SelectCell
                                            header
                                            label='Select all solutions on this page'
                                            checked={selection.allVisible}
                                            indeterminate={
                                                selection.someVisible
                                            }
                                            onChange={
                                                selection.toggleAllVisible
                                            }
                                        />
                                    )}
                                    <Th>PYQ</Th>
                                    <Th>Year · Exam</Th>
                                    {isAll ? (
                                        <>
                                            <Th>Versions</Th>
                                            <Th>Written by</Th>
                                        </>
                                    ) : (
                                        <Th className='w-[220px]'>
                                            Student requests
                                        </Th>
                                    )}
                                    <Th>Updated</Th>
                                    <Th>
                                        <span className='sr-only'>Actions</span>
                                    </Th>
                                </tr>
                            </thead>
                            <tbody
                                className={
                                    loading
                                        ? 'opacity-60 transition-opacity'
                                        : ''
                                }
                            >
                                {rows.map((row) => (
                                    <Tr
                                        key={row.key}
                                        selected={
                                            isAll &&
                                            selection.isSelected(row.key)
                                        }
                                        onClick={
                                            row.pyq?._id
                                                ? () => open(row)
                                                : undefined
                                        }
                                    >
                                        {isAll && (
                                            <SelectCell
                                                label={`Select the solution for ${row.name}`}
                                                checked={selection.isSelected(
                                                    row.key,
                                                )}
                                                onChange={(on) =>
                                                    selection.toggle(
                                                        row.key,
                                                        on,
                                                    )
                                                }
                                            />
                                        )}
                                        <Td className='max-w-[340px]'>
                                            {nameCell(row)}
                                        </Td>
                                        <Td>{yearExam(row.pyq)}</Td>
                                        {isAll ? (
                                            <>
                                                <Td>
                                                    <div className='flex gap-1.5'>
                                                        <VersionChip
                                                            has={Boolean(
                                                                row.item
                                                                    .conciseContent,
                                                            )}
                                                            label='Concise'
                                                        />
                                                        <VersionChip
                                                            has={Boolean(
                                                                row.item
                                                                    .expertContent,
                                                            )}
                                                            label='Expert'
                                                        />
                                                    </div>
                                                </Td>
                                                <Td className='text-ink-2'>
                                                    {row.item.generatedBy
                                                        ?.name || '—'}
                                                </Td>
                                            </>
                                        ) : (
                                            <Td>
                                                {requestsBar(
                                                    row.item
                                                        .solutionRequestCount ||
                                                        0,
                                                )}
                                            </Td>
                                        )}
                                        <Td className='text-ink-2 whitespace-nowrap'>
                                            {formatShortDate(updatedOf(row))}
                                        </Td>
                                        <Td align='right'>
                                            <div className='flex justify-end gap-1'>
                                                {actions(row)}
                                            </div>
                                        </Td>
                                    </Tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                    {totalItems > 0 && (
                        <div className='px-4 py-3 border-t border-line-soft'>
                            {pagination}
                        </div>
                    )}
                </div>
            ) : loading && !rows.length ? (
                <div className='bg-sheet border border-line rounded-xl overflow-hidden'>
                    <SkeletonRows rows={6} />
                </div>
            ) : rows.length === 0 ? (
                <div className='bg-sheet border border-line rounded-xl'>
                    {empty}
                </div>
            ) : (
                <div className='flex flex-col gap-4'>
                    <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'>
                        {rows.map((row) => (
                            <article
                                key={row.key}
                                onClick={
                                    row.pyq?._id ? () => open(row) : undefined
                                }
                                className='flex flex-col gap-3 p-4 bg-sheet border border-line rounded-xl hover:border-line-strong cursor-pointer transition-colors'
                            >
                                {nameCell(row)}
                                <p className='text-[13px] text-ink-2'>
                                    {[
                                        row.pyq?.year,
                                        examTypeLabel(row.pyq?.examType),
                                    ]
                                        .filter(Boolean)
                                        .join(' · ')}
                                </p>
                                {isAll ? (
                                    <div className='flex flex-wrap gap-1.5'>
                                        <VersionChip
                                            has={Boolean(
                                                row.item.conciseContent,
                                            )}
                                            label='Concise'
                                        />
                                        <VersionChip
                                            has={Boolean(
                                                row.item.expertContent,
                                            )}
                                            label='Expert'
                                        />
                                    </div>
                                ) : (
                                    <div className='flex flex-col gap-1'>
                                        <span className='text-xs text-muted'>
                                            Student requests
                                        </span>
                                        {requestsBar(
                                            row.item.solutionRequestCount || 0,
                                        )}
                                    </div>
                                )}
                                <div className='flex items-center gap-2 pt-3 mt-auto border-t border-line-soft'>
                                    <span className='flex-1 text-xs text-muted truncate'>
                                        Updated{' '}
                                        {formatShortDate(updatedOf(row))}
                                        {isAll &&
                                            row.item.generatedBy?.name &&
                                            ` · ${row.item.generatedBy.name}`}
                                    </span>
                                    {actions(row)}
                                </div>
                            </article>
                        ))}
                    </div>
                    <div className='bg-sheet border border-line rounded-xl px-4 py-3'>
                        {pagination}
                    </div>
                </div>
            )}

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

export default PyqSolutionList;
