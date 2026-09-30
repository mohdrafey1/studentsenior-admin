import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FileQuestion, Pencil, Trash2 } from 'lucide-react';
import api from '../../utils/api';
import { formatDateTime, formatNumber, formatPoints } from '../../utils/format';
import { relativeTime } from '../../utils/relativeTime';
import ApprovalActions from '../../components/ApprovalActions';
import ConfirmModal from '../../components/ConfirmModal';
import FilePreview from '../../components/FilePreview';
import NotesEditModal from '../../components/NotesEditModal';
import Loader from '../../components/Common/Loader';
import {
    Button,
    EmptyState,
    MetaList,
    PageHeader,
    Panel,
    StatusBadge,
} from '../../components/ui';

const NotesDetail = () => {
    const { collegeslug, noteid } = useParams();
    const navigate = useNavigate();
    const [note, setNote] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editing, setEditing] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [showRaw, setShowRaw] = useState(false);

    const fetchNote = async () => {
        try {
            setError(null);
            const response = await api.get(`/notes/${noteid}`);
            setNote(response.data.data);
        } catch (e) {
            setError(
                e.response?.status === 404
                    ? 'This note doesn’t exist or was deleted.'
                    : e.response?.data?.message ||
                          'Couldn’t load this note. Check your connection and try again.',
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNote();
    }, [noteid]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleDelete = async () => {
        try {
            await api.delete(`/notes/delete/${note._id}`);
            toast.success('Note deleted');
            navigate(`/${collegeslug}/notes`);
        } catch (e) {
            toast.error(
                e.response?.data?.message || 'Couldn’t delete the note',
            );
        }
    };

    if (loading) return <Loader />;

    if (error || !note) {
        return (
            <div className='min-h-full px-4 sm:px-10 pt-8 pb-12'>
                <div className='bg-sheet border border-line rounded-xl'>
                    <EmptyState
                        icon={FileQuestion}
                        tone='error'
                        title='Note not found'
                        description={error}
                        action={
                            <Button to={`/${collegeslug}/notes`}>
                                Back to notes
                            </Button>
                        }
                    />
                </div>
            </div>
        );
    }

    const subject = note.subject || {};
    const paid = note.isPaid || note.price > 0;

    return (
        <div className='min-h-full px-4 sm:px-10 pt-8 pb-12'>
            <PageHeader
                eyebrow={['Note', subject.subjectCode]
                    .filter(Boolean)
                    .join(' · ')}
                badge={
                    <>
                        <StatusBadge status={note.submissionStatus} />
                        {note.deleted && (
                            <StatusBadge tone='outline'>Deleted</StatusBadge>
                        )}
                    </>
                }
                title={note.title || 'Untitled note'}
                meta={
                    <p className='flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-ink-2'>
                        {[
                            subject.subjectName,
                            subject.semester && `Sem ${subject.semester}`,
                        ]
                            .filter(Boolean)
                            .join(' · ')}
                        {subject.subjectName && (
                            <span aria-hidden='true' className='text-faint'>
                                ·
                            </span>
                        )}
                        <span>
                            Uploaded by{' '}
                            {note.owner?._id ? (
                                <Link
                                    to={`/users/${note.owner._id}`}
                                    className='font-medium text-link hover:underline'
                                >
                                    @{note.owner.username || 'student'}
                                </Link>
                            ) : (
                                <span className='font-medium'>
                                    @{note.owner?.username || 'unknown'}
                                </span>
                            )}{' '}
                            {relativeTime(note.createdAt)}
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
                            aria-label='Delete note'
                            onClick={() => setConfirmDelete(true)}
                        />
                    </>
                }
            />

            <div className='grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start'>
                <div className='flex flex-col gap-5 min-w-0'>
                    <FilePreview fileUrl={note.fileUrl} title='Note preview' />

                    <Panel
                        title='Description'
                        titleId='desc-title'
                        action={
                            <Button
                                variant='link'
                                size='sm'
                                onClick={() => setEditing(true)}
                            >
                                Edit
                            </Button>
                        }
                        bodyClassName='px-5 py-4'
                    >
                        {note.description ? (
                            <p className='text-[14px] leading-relaxed text-ink-2 whitespace-pre-wrap break-words'>
                                {note.description}
                            </p>
                        ) : (
                            <p className='text-[13.5px] text-muted'>
                                The uploader didn’t add a description.
                            </p>
                        )}
                    </Panel>
                </div>

                <div className='flex flex-col gap-4'>
                    <ApprovalActions
                        variant='panel'
                        resourceType='note'
                        currentStatus={note.submissionStatus}
                        rejectionReason={note.rejectionReason}
                        apiEndpoint={`/notes/edit/${note._id}`}
                        onStatusChange={fetchNote}
                        approveNote={`Publishes the note to every student at the college${paid ? ` for ${formatPoints(note.price)}` : ' for free'}. The uploader earns reward points the first time it’s approved.`}
                    />

                    <Panel
                        title='Access'
                        titleId='access-title'
                        action={
                            <Button
                                variant='link'
                                size='sm'
                                onClick={() => setEditing(true)}
                            >
                                Change
                            </Button>
                        }
                        bodyClassName='px-5 py-4'
                    >
                        <MetaList
                            labelWidth={112}
                            items={[
                                {
                                    label: 'Price',
                                    value: formatPoints(paid ? note.price : 0),
                                    mono: true,
                                },
                                {
                                    label: 'Download',
                                    value:
                                        note.isDownloadable === false
                                            ? 'View only'
                                            : 'Allowed',
                                },
                                {
                                    label: 'Views',
                                    value: formatNumber(note.clickCounts),
                                },
                                {
                                    label: 'Likes',
                                    value: formatNumber(note.likes?.length),
                                },
                                paid && {
                                    label: 'Purchases',
                                    value: formatNumber(
                                        note.purchasedBy?.length,
                                    ),
                                },
                                note.rewardPoints > 0 && {
                                    label: 'Uploader reward',
                                    value: `${formatNumber(note.rewardPoints)} pts`,
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
                                    value: subject.subjectName && (
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
                                { label: 'Semester', value: subject.semester },
                                {
                                    label: 'Uploader',
                                    value: note.owner?.username && (
                                        <>
                                            @{note.owner.username}
                                            {note.owner.email && (
                                                <span className='block text-[12.5px] text-muted break-all'>
                                                    {note.owner.email}
                                                </span>
                                            )}
                                        </>
                                    ),
                                },
                                { label: 'Slug', value: note.slug, mono: true },
                                {
                                    label: 'Created',
                                    value: formatDateTime(note.createdAt),
                                },
                                {
                                    label: 'Updated',
                                    value: formatDateTime(note.updatedAt),
                                },
                                note.deleted && {
                                    label: 'Deleted',
                                    value: formatDateTime(note.deletedAt),
                                },
                                { label: 'ID', value: note._id, mono: true },
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
                                {JSON.stringify(note, null, 2)}
                            </pre>
                        )}
                    </Panel>
                </div>
            </div>

            <NotesEditModal
                isOpen={editing}
                onClose={() => setEditing(false)}
                note={note}
                // The save response leaves subject and uploader unfilled, so reload.
                onSuccess={fetchNote}
            />

            <ConfirmModal
                isOpen={confirmDelete}
                onClose={() => setConfirmDelete(false)}
                onConfirm={handleDelete}
                title='Delete this note?'
                message='The file is removed and students lose access straight away, including anyone who paid for it. This can’t be undone.'
                confirmText='Delete'
                variant='danger'
            />
        </div>
    );
};

export default NotesDetail;
