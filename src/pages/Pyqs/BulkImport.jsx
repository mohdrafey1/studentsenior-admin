import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FileText, Loader2, UploadCloud } from 'lucide-react';
import api from '../../utils/api';
import { useColleges } from '../../context/CollegeContext';
import { formatNumber, formatShortDateTime } from '../../utils/format';
import {
    Alert,
    Button,
    EmptyState,
    Field,
    Input,
    PageHeader,
    Panel,
    Segmented,
    SkeletonRows,
    StatusBadge,
    Table,
    Td,
    Th,
    Tr,
} from '../../components/ui';

// Values the import API expects, with the words shown for them.
const EXAM_TYPES = [
    ['Endsem', 'End sem'],
    ['Midsem', 'Mid sem'],
    ['Quiz', 'Quiz'],
    ['Other', 'Other'],
];
const examLabel = (value) =>
    EXAM_TYPES.find(([v]) => v === value)?.[1] || value || '—';

const MATCHING_NOTES = [
    <>
        The first word of each file name is read as the subject code, e.g.{' '}
        <code className='font-mono text-xs px-1.5 py-px rounded bg-sheet border border-line'>
            KCS301 - Final.pdf
        </code>
        .
    </>,
    'Codes that don’t match a subject create a placeholder subject (semester 0, Unassigned branch) to fix later.',
    'PDFs and images are imported. Other files, and papers that already exist as a PYQ, are skipped.',
    'Imported papers are saved as Approved, so students see them straight away. Check the folder first.',
];

const percent = (job) => {
    const total = job.counts?.total ?? 0;
    const processed = job.counts?.processed ?? 0;
    return total === 0 ? 0 : Math.min(100, (processed / total) * 100);
};

const BulkImport = () => {
    const { collegeslug } = useParams();
    const { currentCollege } = useColleges();

    const [driveFolderUrl, setDriveFolderUrl] = useState('');
    const [folderError, setFolderError] = useState('');
    const [examType, setExamType] = useState('Endsem');
    const [year, setYear] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const [currentJob, setCurrentJob] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [loadingJobs, setLoadingJobs] = useState(true);
    const [jobsError, setJobsError] = useState(null);
    const [showFailures, setShowFailures] = useState(false);

    const pollRef = useRef(null);

    const isLive = useMemo(
        () =>
            currentJob &&
            (currentJob.status === 'queued' || currentJob.status === 'running'),
        [currentJob],
    );

    const fetchJobs = async () => {
        try {
            setLoadingJobs(true);
            setJobsError(null);
            const res = await api.get('/bulk-import', {
                params: { collegeSlug: collegeslug, limit: 20 },
            });
            setJobs(res.data?.data?.items ?? []);
        } catch (e) {
            setJobsError(
                e?.response?.data?.message ??
                    'Couldn’t load recent imports. Try again.',
            );
        } finally {
            setLoadingJobs(false);
        }
    };

    useEffect(() => {
        if (collegeslug) fetchJobs();
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [collegeslug]);

    useEffect(() => {
        if (!currentJob?._id) return;
        if (pollRef.current) clearInterval(pollRef.current);
        if (!isLive) return;

        pollRef.current = setInterval(async () => {
            try {
                const res = await api.get(`/bulk-import/${currentJob._id}`);
                const fresh = res.data?.data;
                if (fresh) {
                    setCurrentJob(fresh);
                    if (
                        fresh.status !== 'queued' &&
                        fresh.status !== 'running'
                    ) {
                        clearInterval(pollRef.current);
                        pollRef.current = null;
                        fetchJobs();
                    }
                }
            } catch {
                // swallow transient errors
            }
        }, 3000);

        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentJob?._id, isLive]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!driveFolderUrl.trim()) {
            setFolderError('Paste a Drive folder link or ID');
            toast.error('Add the Drive folder link first');
            return;
        }
        try {
            setSubmitting(true);
            const res = await api.post('/bulk-import/pyq', {
                driveFolderUrl: driveFolderUrl.trim(),
                collegeSlug: collegeslug,
                examType: examType.trim() || 'Endsem',
                year: year.trim() || undefined,
            });
            const data = res.data?.data;
            toast.success('Import started');
            const jobRes = await api.get(`/bulk-import/${data.jobId}`);
            setCurrentJob(jobRes.data?.data);
            setShowFailures(false);
            fetchJobs();
        } catch (err) {
            toast.error(
                err?.response?.data?.message ??
                    'Couldn’t start the import. Try again.',
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = async () => {
        if (!currentJob?._id) return;
        try {
            await api.post(`/bulk-import/${currentJob._id}/cancel`);
            toast.success('Cancel requested');
        } catch (err) {
            toast.error(
                err?.response?.data?.message ??
                    'Couldn’t cancel the import. Try again.',
            );
        }
    };

    const openJob = async (jobId) => {
        try {
            const res = await api.get(`/bulk-import/${jobId}`);
            setCurrentJob(res.data?.data);
            setShowFailures(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch {
            toast.error('Couldn’t open that import. Try again.');
        }
    };

    const counts = currentJob?.counts || {};
    const pct = currentJob ? percent(currentJob) : 0;
    const failures = currentJob?.failures || [];
    const placeholders = currentJob?.placeholderSubjects?.length || 0;

    const tiles = currentJob && [
        ['Total', counts.total],
        ['Processed', counts.processed],
        ['Imported', counts.succeeded, 'bg-ok'],
        ['Skipped', counts.skipped, 'bg-neutral'],
        ['Failed', counts.failed, 'bg-bad'],
    ];

    return (
        <div className='min-h-full px-4 sm:px-10 pt-8 pb-12'>
            <PageHeader
                title='Bulk import from Google Drive'
                description={`Every PDF and image in the folder and its subfolders is added as a PYQ for ${currentCollege?.name || collegeslug}.`}
                actions={
                    <Button icon={FileText} to={`/${collegeslug}/pyqs`}>
                        View PYQs
                    </Button>
                }
            />

            <div className='grid grid-cols-1 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-5 items-stretch mb-6'>
                <form
                    onSubmit={handleSubmit}
                    noValidate
                    aria-labelledby='new-title'
                    className='bg-sheet border border-line rounded-xl p-5 sm:px-6 flex flex-col gap-4'
                >
                    <h2
                        id='new-title'
                        className='text-[15px] font-semibold text-ink'
                    >
                        New import
                    </h2>
                    <Field
                        label='Drive folder link or ID'
                        required
                        error={folderError}
                        hint='Share the folder as “Anyone with the link can view”. Subfolders are included.'
                    >
                        <Input
                            value={driveFolderUrl}
                            onChange={(e) => {
                                setDriveFolderUrl(e.target.value);
                                if (folderError) setFolderError('');
                            }}
                            placeholder='https://drive.google.com/drive/folders/…'
                            className='font-mono text-[13px] h-10'
                        />
                    </Field>
                    <div className='grid grid-cols-1 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-4'>
                        <div className='flex flex-col gap-1.5'>
                            <span className='text-[13px] font-medium text-ink'>
                                Exam type
                            </span>
                            <Segmented
                                label='Exam type'
                                className='w-full [&>button]:flex-1'
                                value={examType}
                                onChange={setExamType}
                                options={EXAM_TYPES.map(([value, label]) => ({
                                    value,
                                    label,
                                }))}
                            />
                        </div>
                        <Field
                            label='Year'
                            hint='Leave blank to read it from the folder name, like “PYQs 2025-26”.'
                        >
                            <Input
                                value={year}
                                onChange={(e) => setYear(e.target.value)}
                                placeholder='2025-26'
                                className='font-mono text-[13px]'
                            />
                        </Field>
                    </div>
                    <div className='flex flex-wrap items-center gap-3 mt-auto pt-1'>
                        <Button
                            type='submit'
                            variant='primary'
                            disabled={submitting}
                            icon={submitting ? Loader2 : UploadCloud}
                            className={submitting ? '[&>svg]:animate-spin' : ''}
                        >
                            {submitting ? 'Starting…' : 'Start import'}
                        </Button>
                        <span className='text-[12.5px] text-muted'>
                            The import keeps running if you leave this page.
                        </span>
                    </div>
                </form>

                <section
                    aria-labelledby='tips-title'
                    className='bg-sunken border border-line-soft rounded-xl p-5 sm:px-6 flex flex-col gap-3.5'
                >
                    <h2
                        id='tips-title'
                        className='text-[15px] font-semibold text-ink'
                    >
                        How files are matched
                    </h2>
                    <ol className='flex flex-col gap-3 text-[13px] leading-relaxed text-ink-2'>
                        {MATCHING_NOTES.map((note, i) => (
                            <li key={i} className='flex gap-2.5'>
                                <span
                                    aria-hidden='true'
                                    className='pt-0.5 font-mono text-[11px] text-muted'
                                >
                                    {String(i + 1).padStart(2, '0')}
                                </span>
                                <span>{note}</span>
                            </li>
                        ))}
                    </ol>
                </section>
            </div>

            {currentJob && (
                <section
                    aria-labelledby='job-title'
                    className='bg-sheet border border-line rounded-xl overflow-hidden mb-6'
                >
                    <div className='flex flex-wrap items-center gap-x-3 gap-y-2 px-5 sm:px-6 py-4 border-b border-line-soft'>
                        <h2
                            id='job-title'
                            className='text-[15px] font-semibold text-ink'
                        >
                            {isLive ? 'Current import' : 'Import'}
                        </h2>
                        <StatusBadge status={currentJob.status} />
                        <span className='flex-1 min-w-[180px] text-[13px] text-muted'>
                            {[
                                currentJob.year,
                                examLabel(currentJob.examType),
                                currentJob.startedAt &&
                                    `started ${formatShortDateTime(currentJob.startedAt)}`,
                            ]
                                .filter(Boolean)
                                .join(' · ')}
                        </span>
                        {isLive && (
                            <Button
                                variant='danger'
                                size='sm'
                                onClick={handleCancel}
                            >
                                Cancel import
                            </Button>
                        )}
                    </div>

                    <div className='px-5 sm:px-6 py-5 flex flex-col gap-5'>
                        <div className='flex flex-col gap-2'>
                            <div className='flex items-baseline gap-3 text-[13px] text-ink-2'>
                                <span className='flex-1'>
                                    <b className='font-mono font-semibold text-ink'>
                                        {formatNumber(counts.processed)}
                                    </b>{' '}
                                    of{' '}
                                    {counts.total
                                        ? formatNumber(counts.total)
                                        : '?'}{' '}
                                    files processed
                                </span>
                                <span className='font-mono'>
                                    {pct.toFixed(0)}%
                                </span>
                            </div>
                            <div
                                role='progressbar'
                                aria-label='Import progress'
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-valuenow={Math.round(pct)}
                                className='h-2 rounded-full bg-line-soft overflow-hidden'
                            >
                                <div
                                    className='h-full rounded-full bg-brand transition-all'
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                        </div>

                        <dl className='grid grid-cols-2 sm:grid-cols-5 gap-3'>
                            {tiles.map(([label, value, dot]) => (
                                <div
                                    key={label}
                                    className={`flex flex-col gap-1.5 px-3.5 py-3 rounded-[10px] ${
                                        label === 'Failed' && value > 0
                                            ? 'bg-bad-soft'
                                            : 'bg-sunken'
                                    }`}
                                >
                                    <dt
                                        className={`flex items-center gap-1.5 text-[12.5px] ${
                                            label === 'Failed' && value > 0
                                                ? 'text-bad-ink'
                                                : 'text-ink-2'
                                        }`}
                                    >
                                        {dot && (
                                            <span
                                                aria-hidden='true'
                                                className={`w-[7px] h-[7px] rounded-full ${dot}`}
                                            />
                                        )}
                                        {label}
                                    </dt>
                                    <dd className='font-serif font-bold text-2xl leading-none text-ink'>
                                        {formatNumber(value)}
                                    </dd>
                                </div>
                            ))}
                        </dl>

                        {currentJob.failureReason && (
                            <Alert tone='bad' title='The import stopped'>
                                {currentJob.failureReason}
                            </Alert>
                        )}

                        {placeholders > 0 && (
                            <Alert
                                tone='warn'
                                action={
                                    <Button
                                        variant='link'
                                        size='sm'
                                        to='/reports/subjects'
                                    >
                                        Review subjects
                                    </Button>
                                }
                            >
                                {formatNumber(placeholders)} subject code
                                {placeholders === 1
                                    ? ' wasn’t'
                                    : 's weren’t'}{' '}
                                found, so placeholder subjects were created
                                (semester 0, Unassigned branch).
                            </Alert>
                        )}

                        {failures.length > 0 && (
                            <div className='border border-line-soft rounded-[10px] overflow-hidden'>
                                <button
                                    type='button'
                                    aria-expanded={showFailures}
                                    onClick={() => setShowFailures((s) => !s)}
                                    className='w-full flex items-center gap-2.5 h-10 px-3.5 bg-sheet text-left text-[13px] font-medium text-ink cursor-pointer hover:bg-sunken'
                                >
                                    <span className='flex-1'>
                                        {formatNumber(failures.length)} file
                                        {failures.length === 1 ? '' : 's'}{' '}
                                        failed or skipped
                                        {currentJob.extraFailures > 0 &&
                                            ` (and ${formatNumber(currentJob.extraFailures)} more not listed)`}
                                    </span>
                                    <span className='text-[12.5px] font-normal text-muted'>
                                        {showFailures ? 'Hide' : 'Show'}
                                    </span>
                                </button>
                                {showFailures && (
                                    <div className='max-h-72 overflow-y-auto border-t border-line-soft'>
                                        <Table minWidth={520}>
                                            <thead>
                                                <tr>
                                                    <Th className='sticky top-0'>
                                                        File
                                                    </Th>
                                                    <Th className='sticky top-0'>
                                                        Reason
                                                    </Th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {failures.map((f, i) => (
                                                    <Tr
                                                        key={`${f.driveFileId}-${i}`}
                                                    >
                                                        <Td className='font-mono text-xs break-all'>
                                                            {f.fileName}
                                                        </Td>
                                                        <Td className='text-[13px] text-ink-2 break-words'>
                                                            {f.reason}
                                                        </Td>
                                                    </Tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </section>
            )}

            <Panel title='Recent imports' titleId='recent-title'>
                {jobsError ? (
                    <div className='p-4'>
                        <Alert
                            tone='bad'
                            action={
                                <Button size='sm' onClick={fetchJobs}>
                                    Try again
                                </Button>
                            }
                        >
                            {jobsError}
                        </Alert>
                    </div>
                ) : loadingJobs && !jobs.length ? (
                    <SkeletonRows rows={4} />
                ) : jobs.length === 0 ? (
                    <EmptyState
                        icon={UploadCloud}
                        title='No imports yet'
                        description='Imports you start for this college appear here, with their progress.'
                    />
                ) : (
                    <Table minWidth={820}>
                        <thead>
                            <tr>
                                <Th>Started</Th>
                                <Th>Status</Th>
                                <Th>Year · Exam</Th>
                                <Th>Progress</Th>
                                <Th align='right'>Imported</Th>
                                <Th align='right'>Failed</Th>
                                <Th>
                                    <span className='sr-only'>Actions</span>
                                </Th>
                            </tr>
                        </thead>
                        <tbody>
                            {jobs.map((j) => {
                                const total = j.counts?.total ?? 0;
                                return (
                                    <Tr
                                        key={j._id}
                                        selected={currentJob?._id === j._id}
                                        onClick={() => openJob(j._id)}
                                    >
                                        <Td className='whitespace-nowrap'>
                                            {j.createdAt
                                                ? formatShortDateTime(
                                                      j.createdAt,
                                                  )
                                                : '—'}
                                        </Td>
                                        <Td>
                                            <StatusBadge status={j.status} />
                                        </Td>
                                        <Td className='text-ink-2 whitespace-nowrap'>
                                            {j.year} · {examLabel(j.examType)}
                                        </Td>
                                        <Td>
                                            <div className='flex items-center gap-2 min-w-[140px]'>
                                                <span
                                                    aria-hidden='true'
                                                    className='flex-1 h-1 rounded-full bg-line-soft overflow-hidden'
                                                >
                                                    <span
                                                        className='block h-full rounded-full bg-brand/70'
                                                        style={{
                                                            width: `${percent(j)}%`,
                                                        }}
                                                    />
                                                </span>
                                                <span className='font-mono text-xs text-ink-2 whitespace-nowrap'>
                                                    {formatNumber(
                                                        j.counts?.processed,
                                                    )}{' '}
                                                    / {formatNumber(total)}
                                                </span>
                                            </div>
                                        </Td>
                                        <Td align='right' mono>
                                            {formatNumber(j.counts?.succeeded)}
                                        </Td>
                                        <Td align='right' mono>
                                            {formatNumber(j.counts?.failed)}
                                        </Td>
                                        <Td align='right'>
                                            <Button
                                                variant='link'
                                                size='sm'
                                                aria-label={`Open the import started ${formatShortDateTime(j.createdAt)}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openJob(j._id);
                                                }}
                                            >
                                                Open
                                            </Button>
                                        </Td>
                                    </Tr>
                                );
                            })}
                        </tbody>
                    </Table>
                )}
            </Panel>
        </div>
    );
};

export default BulkImport;
