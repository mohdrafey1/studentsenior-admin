import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    Check,
    Download,
    ExternalLink,
    Pencil,
    Play,
    Trash2,
    Video,
    X,
} from 'lucide-react';
import api from '../../utils/api';
import { useColleges } from '../../context/CollegeContext';
import { useSelection } from '../../hooks/useSelection';
import { downloadCsv } from '../../utils/csv';
import {
    formatDateTime,
    formatNumber,
    formatShortDate,
    formatShortDateTime,
} from '../../utils/format';
import { relativeTime } from '../../utils/relativeTime';
import FilterBar from '../../components/Common/FilterBar';
import { filterByTime } from '../../components/Common/timeFilterUtils';
import Loader from '../../components/Common/Loader';
import Pagination from '../../components/Pagination';
import ConfirmModal from '../../components/ConfirmModal';
import RejectDialog from '../../components/RejectDialog';
import VideoEditModal from '../../components/VideoEditModal';
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
    Tabs,
    Td,
    Th,
    Tr,
} from '../../components/ui';
import { youtubeThumb } from './videoUtils';

const STATUS_TABS = [
    ['', 'All'],
    ['pending', 'Pending'],
    ['approved', 'Approved'],
    ['rejected', 'Rejected'],
];

const EMPTY_FILTERS = { submissionStatus: '', subject: '' };

// The endpoint pages its results (10 by default), so ask for big pages and
// fetch the rest, letting the filters and counts cover every video.
const FETCH_LIMIT = 100;

/** YouTube thumbnail, or a dark tile with a play icon for other links. */
const Thumb = ({ url, className = '' }) => {
    const [failed, setFailed] = useState(false);
    const src = youtubeThumb(url);
    return (
        <span
            className={`relative flex items-center justify-center overflow-hidden bg-black text-white ${className}`}
        >
            {src && !failed ? (
                <img
                    src={src}
                    alt=''
                    loading='lazy'
                    onError={() => setFailed(true)}
                    className='absolute inset-0 w-full h-full object-cover'
                />
            ) : (
                <Play className='w-5 h-5 opacity-70' aria-hidden='true' />
            )}
        </span>
    );
};

// "3 h ago" for the last week, then a date.
const age = (date) =>
    Date.now() - new Date(date) < 7 * 864e5
        ? relativeTime(date)
        : formatShortDate(date);

const VideoList = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { collegeslug } = useParams();
    const { currentCollege } = useColleges();

    // Filters live in the URL so a filtered list can be shared or reloaded.
    const params = new URLSearchParams(location.search);
    const [videos, setVideos] = useState([]);
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
    const [viewMode, setViewMode] = useState('grid');

    const [editingVideo, setEditingVideo] = useState(null);
    const [confirm, setConfirm] = useState(null);
    const [rejecting, setRejecting] = useState(null); // array of ids
    const [bulkBusy, setBulkBusy] = useState(false);

    const fetchVideos = async () => {
        try {
            setError(null);
            const url = `/video/all/${collegeslug}`;
            const first = await api.get(url, {
                params: { page: 1, limit: FETCH_LIMIT },
            });
            const { videos: firstPage = [], pagination } =
                first.data.data || {};
            const pages = pagination?.totalPages || 1;
            const rest =
                pages > 1
                    ? await Promise.all(
                          Array.from({ length: pages - 1 }, (_, i) =>
                              api.get(url, {
                                  params: { page: i + 2, limit: FETCH_LIMIT },
                              }),
                          ),
                      )
                    : [];
            setVideos([
                ...firstPage,
                ...rest.flatMap((r) => r.data.data?.videos || []),
            ]);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    'Couldn’t load videos. Check your connection and try again.',
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVideos();
    }, [collegeslug]); // eslint-disable-line react-hooks/exhaustive-deps

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

    const subjectNames = useMemo(
        () =>
            [
                ...new Set(
                    videos.map((v) => v.subject?.subjectName).filter(Boolean),
                ),
            ].sort((a, b) => a.localeCompare(b)),
        [videos],
    );

    // Everything except the status tab, so tab counts reflect the other filters.
    const matchesFilters = (video) => {
        const q = search.trim().toLowerCase();
        const matchesSearch =
            !q ||
            video.title?.toLowerCase().includes(q) ||
            video.description?.toLowerCase().includes(q) ||
            video.subject?.subjectName?.toLowerCase().includes(q) ||
            video.subject?.subjectCode?.toLowerCase().includes(q) ||
            video.owner?.username?.toLowerCase().includes(q);
        return (
            matchesSearch &&
            (!filters.subject ||
                video.subject?.subjectName === filters.subject) &&
            filterByTime(video, timeFilter)
        );
    };

    const base = videos.filter(matchesFilters);
    const counts = base.reduce(
        (acc, v) => {
            const status = v.submissionStatus || 'pending';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        },
        { '': base.length },
    );
    const filtered = base.filter(
        (v) =>
            !filters.submissionStatus ||
            (v.submissionStatus || 'pending') === filters.submissionStatus,
    );
    const sorted = [...filtered].sort((a, b) => {
        const diff =
            sortBy === 'clickCounts'
                ? (a.clickCounts || 0) - (b.clickCounts || 0)
                : new Date(a.createdAt) - new Date(b.createdAt);
        return sortOrder === 'desc' ? -diff : diff;
    });
    const current = sorted.slice((page - 1) * pageSize, page * pageSize);

    const selection = useSelection(
        useMemo(() => current.map((v) => v._id), [current]),
    );

    const activeFilters = Object.entries(filters).filter(
        ([key, value]) => key !== 'submissionStatus' && value,
    ).length;
    const clearAll = () => {
        setSearch('');
        setTimeFilter('all');
        setFilters((prev) => ({
            ...EMPTY_FILTERS,
            submissionStatus: prev.submissionStatus,
        }));
        setSortBy('createdAt');
        setSortOrder('desc');
        setPage(1);
    };

    const updateLocal = (ids, patch) =>
        setVideos((prev) =>
            prev.map((v) => (ids.includes(v._id) ? { ...v, ...patch } : v)),
        );

    // Runs one request per video and reports how many went through.
    const runBulk = async (ids, request, verb) => {
        setBulkBusy(true);
        const results = await Promise.allSettled(ids.map(request));
        setBulkBusy(false);
        const done = ids.filter((_, i) => results[i].status === 'fulfilled');
        const failed = ids.length - done.length;
        if (done.length)
            toast.success(
                `${formatNumber(done.length)} video${done.length === 1 ? '' : 's'} ${verb}`,
            );
        if (failed) {
            const reason = results.find((r) => r.status === 'rejected')?.reason
                ?.response?.data?.message;
            toast.error(
                `${formatNumber(failed)} couldn’t be ${verb}.${reason ? ` ${reason}` : ' Try those again.'}`,
            );
        }
        return done;
    };

    // The video endpoint only accepts the fields it knows, so approving
    // sends the status alone.
    const approve = async (ids) => {
        const done = await runBulk(
            ids,
            (id) =>
                api.put(`/video/edit/${id}`, { submissionStatus: 'approved' }),
            'approved',
        );
        updateLocal(done, { submissionStatus: 'approved' });
        selection.clear();
    };

    const reject = async (ids, reason) => {
        const done = await runBulk(
            ids,
            (id) =>
                api.put(`/video/edit/${id}`, {
                    submissionStatus: 'rejected',
                    rejectionReason: reason,
                }),
            'rejected',
        );
        updateLocal(done, {
            submissionStatus: 'rejected',
            rejectionReason: reason,
        });
        selection.clear();
        setRejecting(null);
    };

    const remove = (ids) =>
        setConfirm({
            title:
                ids.length === 1
                    ? 'Delete this video?'
                    : `Delete ${formatNumber(ids.length)} videos?`,
            message:
                'Students stop seeing it on the subject page straight away.',
            confirmText: 'Delete',
            onConfirm: async () => {
                const done = await runBulk(
                    ids,
                    (id) => api.delete(`/video/delete/${id}`),
                    'deleted',
                );
                setVideos((prev) => prev.filter((v) => !done.includes(v._id)));
                selection.clear();
            },
        });

    const exportCsv = () =>
        downloadCsv(
            `videos-${collegeslug}`,
            [
                { label: 'Title', value: (v) => v.title },
                { label: 'Subject', value: (v) => v.subject?.subjectName },
                { label: 'Code', value: (v) => v.subject?.subjectCode },
                { label: 'Semester', value: (v) => v.subject?.semester },
                {
                    label: 'Status',
                    value: (v) => v.submissionStatus || 'pending',
                },
                { label: 'Views', value: (v) => v.clickCounts || 0 },
                { label: 'Link', value: (v) => v.videoUrl },
                { label: 'Shared by', value: (v) => v.owner?.username },
                {
                    label: 'Submitted',
                    value: (v) => formatDateTime(v.createdAt),
                },
            ],
            sorted,
        );

    if (loading) return <Loader />;

    const selectedIds = [...selection.selected];
    const videoUrl = (video) => `/${collegeslug}/videos/${video._id}`;
    const subjectLine = (video) =>
        [
            video.subject?.subjectCode,
            video.subject?.semester && `Sem ${video.subject.semester}`,
        ]
            .filter(Boolean)
            .join(' · ');

    const rowActions = (video) => {
        const pending = (video.submissionStatus || 'pending') === 'pending';
        const name = video.title || 'video';
        const stop = (fn) => (event) => {
            event.stopPropagation();
            fn();
        };
        return pending ? (
            <>
                <Button
                    variant='ghost'
                    size='sm'
                    iconOnly
                    icon={X}
                    aria-label={`Reject ${name}`}
                    className='text-bad-ink hover:text-bad-ink'
                    disabled={bulkBusy}
                    onClick={stop(() => setRejecting([video._id]))}
                />
                <Button
                    variant='ghost'
                    size='sm'
                    iconOnly
                    icon={Check}
                    aria-label={`Approve ${name}`}
                    className='text-ok-ink hover:text-ok-ink'
                    disabled={bulkBusy}
                    onClick={stop(() => approve([video._id]))}
                />
            </>
        ) : (
            <>
                <Button
                    variant='ghost'
                    size='sm'
                    iconOnly
                    icon={Pencil}
                    aria-label={`Edit ${name}`}
                    onClick={stop(() => setEditingVideo(video))}
                />
                <Button
                    variant='ghost'
                    size='sm'
                    iconOnly
                    icon={Trash2}
                    aria-label={`Delete ${name}`}
                    className='text-bad-ink hover:text-bad-ink'
                    onClick={stop(() => remove([video._id]))}
                />
            </>
        );
    };

    const watchLink = (video, withLabel) =>
        video.videoUrl && (
            <Button
                variant={withLabel ? 'link' : 'ghost'}
                size='sm'
                iconOnly={!withLabel}
                icon={withLabel ? undefined : ExternalLink}
                href={video.videoUrl}
                target='_blank'
                rel='noopener noreferrer'
                aria-label={
                    withLabel
                        ? undefined
                        : `Watch ${video.title || 'video'} in a new tab`
                }
                onClick={(e) => e.stopPropagation()}
            >
                {withLabel && (
                    <>
                        Watch
                        <ExternalLink
                            className='w-3.5 h-3.5'
                            aria-hidden='true'
                        />
                    </>
                )}
            </Button>
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

    const reviewQueueEmpty =
        filters.submissionStatus === 'pending' && !activeFilters && !search;
    const empty = (
        <EmptyState
            icon={Video}
            tone={reviewQueueEmpty && videos.length ? 'done' : 'neutral'}
            title={
                videos.length === 0
                    ? 'No videos yet'
                    : reviewQueueEmpty
                      ? 'Nothing waiting for review'
                      : 'No videos match'
            }
            description={
                videos.length === 0
                    ? 'Lecture links students share for this college’s subjects appear here.'
                    : reviewQueueEmpty
                      ? 'New links appear here until someone approves or rejects them.'
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
                title='Videos'
                description={`Lecture videos students have shared for ${currentCollege?.name || collegeslug} subjects.`}
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

            <Tabs
                label='Review status'
                className='mb-4'
                value={filters.submissionStatus}
                onChange={(value) => {
                    setFilter('submissionStatus', value);
                    selection.clear();
                }}
                items={STATUS_TABS.map(([value, label]) => ({
                    value,
                    label,
                    count: counts[value] || 0,
                    attention: value === 'pending' && counts.pending > 0,
                }))}
            />

            <FilterBar
                className='mb-4'
                search={search}
                onSearch={(value) => {
                    setSearch(value);
                    setPage(1);
                }}
                searchPlaceholder='Search by title, subject or who shared it'
                filters={[
                    {
                        label: 'Subject',
                        value: filters.subject,
                        onChange: (v) => setFilter('subject', v),
                        options: [
                            { value: '', label: 'Any subject' },
                            ...subjectNames.map((s) => ({
                                value: s,
                                label: s,
                            })),
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
                    onChange: setSortBy,
                    options: [
                        { value: 'createdAt', label: 'Newest first' },
                        { value: 'clickCounts', label: 'Most viewed' },
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
                        <Button size='sm' onClick={fetchVideos}>
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
                            primary
                            icon={Check}
                            disabled={bulkBusy}
                            onClick={() => approve(selectedIds)}
                        >
                            Approve
                        </BulkButton>
                        <BulkButton
                            icon={X}
                            disabled={bulkBusy}
                            onClick={() => setRejecting(selectedIds)}
                        >
                            Reject…
                        </BulkButton>
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
                        <Table minWidth={1000}>
                            <thead>
                                <tr>
                                    <SelectCell
                                        header
                                        label='Select all videos on this page'
                                        checked={selection.allVisible}
                                        indeterminate={selection.someVisible}
                                        onChange={selection.toggleAllVisible}
                                    />
                                    <Th>Video</Th>
                                    <Th>Subject</Th>
                                    <Th>Status</Th>
                                    <Th>Shared</Th>
                                    <Th>
                                        <span className='sr-only'>Actions</span>
                                    </Th>
                                </tr>
                            </thead>
                            <tbody>
                                {current.map((video) => (
                                    <Tr
                                        key={video._id}
                                        selected={selection.isSelected(
                                            video._id,
                                        )}
                                        onClick={() =>
                                            navigate(videoUrl(video))
                                        }
                                    >
                                        <SelectCell
                                            label={`Select ${video.title || 'video'}`}
                                            checked={selection.isSelected(
                                                video._id,
                                            )}
                                            onChange={(on) =>
                                                selection.toggle(video._id, on)
                                            }
                                        />
                                        <Td className='max-w-[380px]'>
                                            <div className='flex items-center gap-3 min-w-0'>
                                                <Thumb
                                                    url={video.videoUrl}
                                                    className='w-[72px] h-[42px] rounded-md shrink-0'
                                                />
                                                <div className='flex flex-col gap-0.5 min-w-0'>
                                                    <Link
                                                        to={videoUrl(video)}
                                                        onClick={(e) =>
                                                            e.stopPropagation()
                                                        }
                                                        className='font-medium text-ink hover:underline truncate'
                                                    >
                                                        {video.title ||
                                                            'Untitled video'}
                                                    </Link>
                                                    <span className='text-[12.5px] text-muted truncate'>
                                                        {video.description ||
                                                            'No description'}
                                                    </span>
                                                </div>
                                            </div>
                                        </Td>
                                        <Td className='max-w-[240px]'>
                                            <div className='flex flex-col gap-0.5 min-w-0'>
                                                <span className='truncate'>
                                                    {video.subject
                                                        ?.subjectName || '—'}
                                                </span>
                                                <span className='text-[12.5px] text-muted truncate'>
                                                    {subjectLine(video)}
                                                </span>
                                            </div>
                                        </Td>
                                        <Td>
                                            <div className='flex flex-col items-start gap-1'>
                                                <StatusBadge
                                                    status={
                                                        video.submissionStatus
                                                    }
                                                />
                                                {video.clickCounts > 0 && (
                                                    <span className='text-xs text-muted'>
                                                        {formatNumber(
                                                            video.clickCounts,
                                                        )}{' '}
                                                        views
                                                    </span>
                                                )}
                                            </div>
                                        </Td>
                                        <Td>
                                            <div className='flex flex-col gap-0.5'>
                                                <span className='whitespace-nowrap'>
                                                    {formatShortDateTime(
                                                        video.createdAt,
                                                    )}
                                                </span>
                                                <span className='text-[12.5px] text-muted'>
                                                    {video.owner?.username
                                                        ? `@${video.owner.username}`
                                                        : 'Unknown'}
                                                </span>
                                            </div>
                                        </Td>
                                        <Td align='right'>
                                            <div className='flex justify-end gap-1'>
                                                {watchLink(video, false)}
                                                {rowActions(video)}
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
                    <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4'>
                        {current.map((video) => (
                            <article
                                key={video._id}
                                onClick={() => navigate(videoUrl(video))}
                                className='flex flex-col bg-sheet border border-line rounded-xl overflow-hidden hover:border-line-strong cursor-pointer transition-colors'
                            >
                                <div className='relative'>
                                    <Thumb
                                        url={video.videoUrl}
                                        className='w-full aspect-video'
                                    />
                                    {video.subject?.subjectCode && (
                                        <span className='absolute top-2.5 left-2.5 px-1.5 py-0.5 rounded bg-black/60 font-mono text-[11px] text-white'>
                                            {video.subject.subjectCode}
                                        </span>
                                    )}
                                    <StatusBadge
                                        status={video.submissionStatus}
                                        className='absolute bottom-2.5 left-2.5'
                                    />
                                </div>
                                <div className='flex-1 flex flex-col gap-1 p-4'>
                                    <Link
                                        to={videoUrl(video)}
                                        onClick={(e) => e.stopPropagation()}
                                        className='font-medium text-ink leading-snug hover:underline line-clamp-2'
                                    >
                                        {video.title || 'Untitled video'}
                                    </Link>
                                    <span className='text-[13px] text-ink-2 truncate'>
                                        {video.subject?.subjectName ||
                                            'No subject'}
                                    </span>
                                    <span className='text-xs text-muted'>
                                        {[
                                            video.owner?.username &&
                                                `@${video.owner.username}`,
                                            age(video.createdAt),
                                            video.clickCounts > 0 &&
                                                `${formatNumber(video.clickCounts)} views`,
                                        ]
                                            .filter(Boolean)
                                            .join(' · ')}
                                    </span>
                                </div>
                                <div className='flex items-center gap-1 px-4 py-2.5 border-t border-line-soft'>
                                    <span className='flex-1'>
                                        {watchLink(video, true)}
                                    </span>
                                    {rowActions(video)}
                                </div>
                            </article>
                        ))}
                    </div>
                    <div className='bg-sheet border border-line rounded-xl px-4 py-3'>
                        {pagination}
                    </div>
                </div>
            )}

            <VideoEditModal
                isOpen={Boolean(editingVideo)}
                onClose={() => setEditingVideo(null)}
                video={editingVideo}
                onSuccess={(updated) => {
                    if (updated?._id)
                        setVideos((prev) =>
                            prev.map((v) =>
                                v._id === updated._id ? updated : v,
                            ),
                        );
                    setEditingVideo(null);
                }}
            />

            <ConfirmModal
                isOpen={Boolean(confirm)}
                onClose={() => setConfirm(null)}
                onConfirm={() => confirm?.onConfirm()}
                title={confirm?.title}
                message={confirm?.message}
                confirmText={confirm?.confirmText}
                variant='danger'
            />

            <RejectDialog
                open={Boolean(rejecting)}
                onClose={() => setRejecting(null)}
                title={
                    rejecting?.length > 1
                        ? `Reject ${formatNumber(rejecting.length)} videos?`
                        : 'Reject this video?'
                }
                description={
                    rejecting?.length > 1
                        ? 'Everyone who shared them gets the same reason, so keep it general.'
                        : undefined
                }
                onSubmit={(reason) => reject(rejecting, reason)}
            />
        </div>
    );
};

export default VideoList;
