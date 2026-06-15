import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    UploadCloud,
    Loader2,
    XCircle,
    CheckCircle2,
    AlertTriangle,
    PauseCircle,
    ExternalLink,
} from 'lucide-react';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import { useSidebarLayout } from '../../hooks/useSidebarLayout';
import api from '../../utils/api';
import BackButton from '../../components/Common/BackButton';
import Loader from '../../components/Common/Loader';

const STATUS_COLORS = {
    queued: 'bg-gray-100 text-gray-700',
    running: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
    cancelled: 'bg-yellow-100 text-yellow-700',
};

const StatusBadge = ({ status }) => (
    <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
            STATUS_COLORS[status] || 'bg-gray-100 text-gray-700'
        }`}
    >
        {status}
    </span>
);

const BulkImport = () => {
    const { collegeslug } = useParams();
    const navigate = useNavigate();
    const { mainContentMargin } = useSidebarLayout();

    const [driveFolderUrl, setDriveFolderUrl] = useState('');
    const [examType, setExamType] = useState('Endsem');
    const [year, setYear] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const [currentJob, setCurrentJob] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [loadingJobs, setLoadingJobs] = useState(true);
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
            const res = await api.get('/bulk-import', {
                params: { collegeSlug: collegeslug, limit: 20 },
            });
            setJobs(res.data?.data?.items ?? []);
        } catch (e) {
            toast.error(
                e?.response?.data?.message ?? 'Failed to load import jobs',
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
            toast.error('Drive folder URL is required');
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
                err?.response?.data?.message ?? 'Failed to start import',
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = async () => {
        if (!currentJob?._id) return;
        try {
            await api.post(`/bulk-import/${currentJob._id}/cancel`);
            toast.success('Cancellation requested');
        } catch (err) {
            toast.error(
                err?.response?.data?.message ?? 'Failed to cancel',
            );
        }
    };

    const openJob = async (jobId) => {
        try {
            const res = await api.get(`/bulk-import/${jobId}`);
            setCurrentJob(res.data?.data);
            setShowFailures(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (e) {
            toast.error('Failed to open job');
        }
    };

    const renderProgress = (job) => {
        const total = job.counts?.total ?? 0;
        const processed = job.counts?.processed ?? 0;
        const pct = total === 0 ? 0 : Math.min(100, (processed / total) * 100);
        return (
            <div>
                <div className='flex items-center justify-between mb-1 text-xs text-gray-600 dark:text-gray-400'>
                    <span>
                        {processed} / {total || '?'} processed
                    </span>
                    <span>{pct.toFixed(0)}%</span>
                </div>
                <div className='w-full bg-gray-200 dark:bg-gray-800 rounded h-2 overflow-hidden'>
                    <div
                        className='bg-blue-600 h-full transition-all'
                        style={{ width: `${pct}%` }}
                    />
                </div>
            </div>
        );
    };

    return (
        <div className='min-h-screen bg-gray-50 dark:bg-gray-950'>
            <Header />
            <Sidebar />
            <main
                className={`pt-16 transition-all duration-300 ${mainContentMargin}`}
            >
                <div className='max-w-5xl mx-auto px-4 py-6 space-y-6'>
                    <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-3'>
                            <BackButton />
                            <h1 className='text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2'>
                                <UploadCloud className='w-5 h-5 text-blue-600' />
                                Bulk Import PYQs from Google Drive
                            </h1>
                        </div>
                        <Link
                            to={`/${collegeslug}/pyqs`}
                            className='text-sm text-blue-600 hover:underline'
                        >
                            View PYQs →
                        </Link>
                    </div>

                    {/* Form */}
                    <section className='bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-5'>
                        <form
                            onSubmit={handleSubmit}
                            className='grid grid-cols-1 md:grid-cols-2 gap-4'
                        >
                            <div className='md:col-span-2'>
                                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                    Google Drive Folder URL or ID
                                </label>
                                <input
                                    type='text'
                                    value={driveFolderUrl}
                                    onChange={(e) =>
                                        setDriveFolderUrl(e.target.value)
                                    }
                                    placeholder='https://drive.google.com/drive/folders/...'
                                    className='w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm'
                                    required
                                />
                                <p className='text-xs text-gray-500 mt-1'>
                                    The folder must be publicly accessible
                                    (Anyone with the link → Viewer). The
                                    importer walks all subfolders recursively.
                                </p>
                            </div>

                            <div>
                                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                    Exam Type
                                </label>
                                <select
                                    value={examType}
                                    onChange={(e) =>
                                        setExamType(e.target.value)
                                    }
                                    className='w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm'
                                >
                                    <option value='Endsem'>Endsem</option>
                                    <option value='Midsem'>Midsem</option>
                                    <option value='Quiz'>Quiz</option>
                                    <option value='Other'>Other</option>
                                </select>
                            </div>

                            <div>
                                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                    Year{' '}
                                    <span className='text-gray-400 font-normal'>
                                        (e.g. 2025-26 — auto-parsed if blank)
                                    </span>
                                </label>
                                <input
                                    type='text'
                                    value={year}
                                    onChange={(e) => setYear(e.target.value)}
                                    placeholder='2025-26'
                                    className='w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm'
                                />
                            </div>

                            <div className='md:col-span-2 flex items-center justify-end gap-3'>
                                <button
                                    type='submit'
                                    disabled={submitting}
                                    className='inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-60'
                                >
                                    {submitting ? (
                                        <Loader2 className='w-4 h-4 animate-spin' />
                                    ) : (
                                        <UploadCloud className='w-4 h-4' />
                                    )}
                                    Start Import
                                </button>
                            </div>
                        </form>
                    </section>

                    {/* Current Job */}
                    {currentJob && (
                        <section className='bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-5'>
                            <div className='flex items-start justify-between mb-3'>
                                <div>
                                    <div className='flex items-center gap-2 mb-1'>
                                        <h2 className='text-base font-semibold text-gray-900 dark:text-white'>
                                            Current Job
                                        </h2>
                                        <StatusBadge
                                            status={currentJob.status}
                                        />
                                    </div>
                                    <p className='text-xs text-gray-500'>
                                        {currentJob.year} · {currentJob.examType}{' '}
                                        · started{' '}
                                        {currentJob.startedAt
                                            ? new Date(
                                                  currentJob.startedAt,
                                              ).toLocaleString()
                                            : '—'}
                                    </p>
                                </div>
                                {isLive && (
                                    <button
                                        onClick={handleCancel}
                                        className='inline-flex items-center gap-1 px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded text-xs hover:bg-yellow-200'
                                    >
                                        <PauseCircle className='w-4 h-4' />
                                        Cancel
                                    </button>
                                )}
                            </div>

                            {renderProgress(currentJob)}

                            <div className='grid grid-cols-2 md:grid-cols-5 gap-2 mt-4 text-center text-xs'>
                                <div className='bg-gray-50 dark:bg-gray-800 rounded p-2'>
                                    <div className='text-gray-500'>Total</div>
                                    <div className='font-semibold text-gray-900 dark:text-white'>
                                        {currentJob.counts?.total ?? 0}
                                    </div>
                                </div>
                                <div className='bg-gray-50 dark:bg-gray-800 rounded p-2'>
                                    <div className='text-gray-500'>
                                        Processed
                                    </div>
                                    <div className='font-semibold text-gray-900 dark:text-white'>
                                        {currentJob.counts?.processed ?? 0}
                                    </div>
                                </div>
                                <div className='bg-green-50 dark:bg-green-900/30 rounded p-2'>
                                    <div className='text-green-700 dark:text-green-300'>
                                        Succeeded
                                    </div>
                                    <div className='font-semibold text-green-700 dark:text-green-300'>
                                        {currentJob.counts?.succeeded ?? 0}
                                    </div>
                                </div>
                                <div className='bg-yellow-50 dark:bg-yellow-900/30 rounded p-2'>
                                    <div className='text-yellow-700 dark:text-yellow-300'>
                                        Skipped
                                    </div>
                                    <div className='font-semibold text-yellow-700 dark:text-yellow-300'>
                                        {currentJob.counts?.skipped ?? 0}
                                    </div>
                                </div>
                                <div className='bg-red-50 dark:bg-red-900/30 rounded p-2'>
                                    <div className='text-red-700 dark:text-red-300'>
                                        Failed
                                    </div>
                                    <div className='font-semibold text-red-700 dark:text-red-300'>
                                        {currentJob.counts?.failed ?? 0}
                                    </div>
                                </div>
                            </div>

                            {currentJob.failureReason && (
                                <div className='mt-3 flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded text-xs'>
                                    <AlertTriangle className='w-4 h-4 mt-0.5 flex-shrink-0' />
                                    <span>{currentJob.failureReason}</span>
                                </div>
                            )}

                            {currentJob.failures?.length > 0 && (
                                <div className='mt-4'>
                                    <button
                                        onClick={() =>
                                            setShowFailures((s) => !s)
                                        }
                                        className='text-xs font-medium text-blue-600 hover:underline'
                                    >
                                        {showFailures ? 'Hide' : 'Show'}{' '}
                                        {currentJob.failures.length} failure(s)
                                        {currentJob.extraFailures > 0
                                            ? ` (+${currentJob.extraFailures} more not shown)`
                                            : ''}
                                    </button>
                                    {showFailures && (
                                        <div className='mt-2 max-h-72 overflow-y-auto border border-gray-200 dark:border-gray-800 rounded'>
                                            <table className='w-full text-xs'>
                                                <thead className='bg-gray-50 dark:bg-gray-800 sticky top-0'>
                                                    <tr>
                                                        <th className='text-left px-3 py-2 font-medium text-gray-700 dark:text-gray-300'>
                                                            File
                                                        </th>
                                                        <th className='text-left px-3 py-2 font-medium text-gray-700 dark:text-gray-300'>
                                                            Reason
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {currentJob.failures.map(
                                                        (f, i) => (
                                                            <tr
                                                                key={`${f.driveFileId}-${i}`}
                                                                className='border-t border-gray-100 dark:border-gray-800'
                                                            >
                                                                <td className='px-3 py-1.5 text-gray-800 dark:text-gray-200 break-all'>
                                                                    {f.fileName}
                                                                </td>
                                                                <td className='px-3 py-1.5 text-red-700 dark:text-red-300 break-all'>
                                                                    {f.reason}
                                                                </td>
                                                            </tr>
                                                        ),
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}

                            {currentJob.placeholderSubjects?.length > 0 && (
                                <div className='mt-3 text-xs text-gray-600 dark:text-gray-400'>
                                    Created{' '}
                                    <span className='font-semibold'>
                                        {currentJob.placeholderSubjects.length}
                                    </span>{' '}
                                    placeholder subject(s). Review them in the{' '}
                                    <Link
                                        to='/reports/subjects'
                                        className='text-blue-600 hover:underline'
                                    >
                                        Subjects
                                    </Link>{' '}
                                    page (semester = 0, branch = Unassigned).
                                </div>
                            )}
                        </section>
                    )}

                    {/* Recent Jobs */}
                    <section className='bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800'>
                        <div className='px-5 py-3 border-b border-gray-200 dark:border-gray-800'>
                            <h2 className='text-base font-semibold text-gray-900 dark:text-white'>
                                Recent Imports
                            </h2>
                        </div>
                        {loadingJobs ? (
                            <div className='p-6'>
                                <Loader />
                            </div>
                        ) : jobs.length === 0 ? (
                            <div className='p-6 text-sm text-gray-500 text-center'>
                                No imports yet for this college.
                            </div>
                        ) : (
                            <div className='overflow-x-auto'>
                                <table className='w-full text-sm'>
                                    <thead className='bg-gray-50 dark:bg-gray-800'>
                                        <tr className='text-left text-xs text-gray-600 dark:text-gray-400'>
                                            <th className='px-4 py-2'>
                                                Started
                                            </th>
                                            <th className='px-4 py-2'>
                                                Status
                                            </th>
                                            <th className='px-4 py-2'>
                                                Year / Exam
                                            </th>
                                            <th className='px-4 py-2'>
                                                Progress
                                            </th>
                                            <th className='px-4 py-2'>
                                                Succeeded
                                            </th>
                                            <th className='px-4 py-2'>
                                                Failed
                                            </th>
                                            <th className='px-4 py-2'></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {jobs.map((j) => (
                                            <tr
                                                key={j._id}
                                                className='border-t border-gray-100 dark:border-gray-800'
                                            >
                                                <td className='px-4 py-2 text-gray-700 dark:text-gray-300 whitespace-nowrap'>
                                                    {j.createdAt
                                                        ? new Date(
                                                              j.createdAt,
                                                          ).toLocaleString()
                                                        : '—'}
                                                </td>
                                                <td className='px-4 py-2'>
                                                    <StatusBadge
                                                        status={j.status}
                                                    />
                                                </td>
                                                <td className='px-4 py-2 text-gray-700 dark:text-gray-300'>
                                                    {j.year} · {j.examType}
                                                </td>
                                                <td className='px-4 py-2 text-gray-700 dark:text-gray-300'>
                                                    {j.counts?.processed ?? 0} /{' '}
                                                    {j.counts?.total ?? 0}
                                                </td>
                                                <td className='px-4 py-2 text-green-700 dark:text-green-300'>
                                                    {j.counts?.succeeded ?? 0}
                                                </td>
                                                <td className='px-4 py-2 text-red-700 dark:text-red-300'>
                                                    {j.counts?.failed ?? 0}
                                                </td>
                                                <td className='px-4 py-2 text-right'>
                                                    <button
                                                        onClick={() =>
                                                            openJob(j._id)
                                                        }
                                                        className='text-blue-600 hover:underline text-xs'
                                                    >
                                                        Open
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
};

export default BulkImport;
