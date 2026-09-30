import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FileQuestion, Pencil, Sparkles, Trash2 } from 'lucide-react';
import api from '../../utils/api';
import { formatDateTime, formatNumber, formatPoints } from '../../utils/format';
import { examTypeLabel } from '../../utils/labels';
import { relativeTime } from '../../utils/relativeTime';
import ApprovalActions from '../../components/ApprovalActions';
import ConfirmModal from '../../components/ConfirmModal';
import FilePreview from '../../components/FilePreview';
import PyqEditModal from '../../components/PyqEditModal';
import Loader from '../../components/Common/Loader';
import {
    Button,
    EmptyState,
    MetaList,
    PageHeader,
    Panel,
    StatusBadge,
} from '../../components/ui';

const PyqDetail = () => {
    const { collegeslug, pyqid } = useParams();
    const navigate = useNavigate();
    const [pyq, setPyq] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editing, setEditing] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [showRaw, setShowRaw] = useState(false);

    const fetchPyq = async () => {
        try {
            setError(null);
            const response = await api.get(`/pyq/${pyqid}`);
            setPyq(response.data.data);
        } catch (e) {
            setError(
                e.response?.status === 404
                    ? 'This PYQ doesn’t exist or was deleted.'
                    : 'Couldn’t load this PYQ. Check your connection and try again.',
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPyq();
    }, [pyqid]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleDelete = async () => {
        try {
            await api.delete(`/pyq/delete/${pyq._id}`);
            toast.success('PYQ deleted');
            navigate(`/${collegeslug}/pyqs`);
        } catch (e) {
            toast.error(e.response?.data?.message || 'Couldn’t delete the PYQ');
        }
    };

    if (loading) return <Loader />;

    if (error || !pyq) {
        return (
            <div className='min-h-full px-4 sm:px-10 pt-8 pb-12'>
                <div className='bg-sheet border border-line rounded-xl'>
                    <EmptyState
                        icon={FileQuestion}
                        tone='error'
                        title='PYQ not found'
                        description={error}
                        action={
                            <Button to={`/${collegeslug}/pyqs`}>
                                Back to PYQs
                            </Button>
                        }
                    />
                </div>
            </div>
        );
    }

    const subject = pyq.subject || {};
    const course = subject.branch?.course?.courseName;
    const branch = subject.branch?.branchName;
    const title = [
        subject.subjectName || 'Untitled subject',
        [examTypeLabel(pyq.examType), pyq.year].filter(Boolean).join(' '),
    ]
        .filter(Boolean)
        .join(' — ');

    return (
        <div className='min-h-full px-4 sm:px-10 pt-8 pb-12'>
            <PageHeader
                eyebrow={['PYQ', subject.subjectCode]
                    .filter(Boolean)
                    .join(' · ')}
                badge={
                    <>
                        <StatusBadge status={pyq.submissionStatus} />
                        {pyq.mdSolution && (
                            <StatusBadge tone='info'>AI solved</StatusBadge>
                        )}
                        {pyq.deleted && (
                            <StatusBadge tone='outline'>Deleted</StatusBadge>
                        )}
                    </>
                }
                title={title}
                meta={
                    <p className='flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-ink-2'>
                        {[
                            course,
                            branch,
                            subject.semester && `Sem ${subject.semester}`,
                        ]
                            .filter(Boolean)
                            .join(' · ')}
                        <span aria-hidden='true' className='text-faint'>
                            ·
                        </span>
                        <span>
                            Uploaded by{' '}
                            {pyq.owner?._id ? (
                                <Link
                                    to={`/users/${pyq.owner._id}`}
                                    className='font-medium text-link hover:underline'
                                >
                                    @{pyq.owner.username || 'student'}
                                </Link>
                            ) : (
                                <span className='font-medium'>
                                    @{pyq.owner?.username || 'unknown'}
                                </span>
                            )}{' '}
                            {relativeTime(pyq.createdAt)}
                        </span>
                    </p>
                }
                actions={
                    <>
                        <Button icon={Pencil} onClick={() => setEditing(true)}>
                            Edit
                        </Button>
                        <Button
                            variant='danger'
                            iconOnly
                            icon={Trash2}
                            aria-label='Delete PYQ'
                            onClick={() => setConfirmDelete(true)}
                        />
                    </>
                }
            />

            <div className='grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start'>
                <div className='flex flex-col gap-5 min-w-0'>
                    <FilePreview
                        fileUrl={pyq.fileUrl}
                        title='Exam paper preview'
                    />

                    <Panel
                        title='AI solutions'
                        titleId='ai-title'
                        action={
                            <Button
                                size='sm'
                                variant={
                                    pyq.mdSolution ? 'secondary' : 'primary'
                                }
                                icon={Sparkles}
                                to={`/${collegeslug}/pyqs/${pyqid}/aisolution`}
                            >
                                {pyq.mdSolution
                                    ? 'Open solution editor'
                                    : 'Generate solutions'}
                            </Button>
                        }
                        bodyClassName='px-5 py-4 text-[13.5px] text-ink-2'
                    >
                        {pyq.mdSolution
                            ? 'Concise and expert solutions exist for this paper. Open the editor to check or change them.'
                            : 'No AI solutions yet. Generate a concise and an expert solution, then review them before publishing.'}
                        {pyq.solutionRequestCount > 0 && (
                            <span className='block mt-1.5 text-warn-ink'>
                                {formatNumber(pyq.solutionRequestCount)} student
                                {pyq.solutionRequestCount === 1
                                    ? ' has'
                                    : 's have'}{' '}
                                asked for a solution.
                            </span>
                        )}
                    </Panel>
                </div>

                <div className='flex flex-col gap-4'>
                    <ApprovalActions
                        variant='panel'
                        resourceType='PYQ'
                        currentStatus={pyq.submissionStatus}
                        rejectionReason={pyq.rejectionReason}
                        apiEndpoint={`/pyq/edit/${pyq._id}`}
                        onStatusChange={fetchPyq}
                        approveNote='Approving publishes this paper to every student at the college.'
                    />

                    <Panel
                        title='Access'
                        titleId='access-title'
                        bodyClassName='px-5 py-4'
                    >
                        <MetaList
                            labelWidth={112}
                            items={[
                                {
                                    label: 'Price',
                                    value: formatPoints(
                                        pyq.isPaid ? pyq.price : 0,
                                    ),
                                    mono: true,
                                },
                                {
                                    label: 'Solved',
                                    value: pyq.solved ? 'Yes' : 'Not yet',
                                },
                                {
                                    label: 'Views',
                                    value: formatNumber(pyq.clickCounts),
                                },
                                pyq.isPaid && {
                                    label: 'Purchases',
                                    value: formatNumber(
                                        pyq.purchasedBy?.length,
                                    ),
                                },
                                pyq.rewardPoints > 0 && {
                                    label: 'Uploader reward',
                                    value: `${formatNumber(pyq.rewardPoints)} pts`,
                                },
                            ]}
                        />
                    </Panel>

                    <Panel
                        title='Details'
                        titleId='details-title'
                        bodyClassName='px-5 py-4 flex flex-col gap-3'
                    >
                        <MetaList
                            items={[
                                {
                                    label: 'Subject',
                                    value: (
                                        <>
                                            {subject.subjectName}{' '}
                                            {subject.subjectCode && (
                                                <span className='font-mono text-xs text-muted'>
                                                    {subject.subjectCode}
                                                </span>
                                            )}
                                        </>
                                    ),
                                },
                                { label: 'Branch', value: branch },
                                { label: 'Course', value: course },
                                { label: 'Semester', value: subject.semester },
                                { label: 'Year', value: pyq.year },
                                {
                                    label: 'Exam type',
                                    value: examTypeLabel(pyq.examType),
                                },
                                { label: 'Slug', value: pyq.slug, mono: true },
                                {
                                    label: 'Created',
                                    value: formatDateTime(pyq.createdAt),
                                },
                                {
                                    label: 'Updated',
                                    value: formatDateTime(pyq.updatedAt),
                                },
                                { label: 'ID', value: pyq._id, mono: true },
                            ]}
                        />
                        <button
                            type='button'
                            aria-expanded={showRaw}
                            onClick={() => setShowRaw((v) => !v)}
                            className='self-start text-[13px] font-medium text-link hover:underline cursor-pointer'
                        >
                            {showRaw ? 'Hide raw data' : 'Show raw data'}
                        </button>
                        {showRaw && (
                            <pre className='max-h-80 overflow-auto p-3 rounded-lg bg-sunken font-mono text-[11.5px] leading-relaxed text-ink-2'>
                                {JSON.stringify(pyq, null, 2)}
                            </pre>
                        )}
                    </Panel>
                </div>
            </div>

            <PyqEditModal
                isOpen={editing}
                onClose={() => setEditing(false)}
                pyq={pyq}
                onUpdate={fetchPyq}
            />

            <ConfirmModal
                isOpen={confirmDelete}
                onClose={() => setConfirmDelete(false)}
                onConfirm={handleDelete}
                title='Delete this PYQ?'
                message='Students lose access straight away, including anyone who paid for it. This can’t be undone.'
                confirmText='Delete'
                variant='danger'
            />
        </div>
    );
};

export default PyqDetail;
