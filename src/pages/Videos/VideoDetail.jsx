import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, ExternalLink, Pencil, Trash2, Video } from 'lucide-react';
import api from '../../utils/api';
import { formatDateTime, formatNumber } from '../../utils/format';
import { relativeTime } from '../../utils/relativeTime';
import ConfirmModal from '../../components/ConfirmModal';
import VideoEditModal from '../../components/VideoEditModal';
import Loader from '../../components/Common/Loader';
import {
    Button,
    EmptyState,
    MetaList,
    PageHeader,
    Panel,
    StatusBadge,
} from '../../components/ui';
import ApprovalActions from '../../components/ApprovalActions';
import { shortUrl, youtubeId } from './videoUtils';

const VideoDetail = () => {
    const { collegeslug, videoid } = useParams();
    const navigate = useNavigate();
    const [video, setVideo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editing, setEditing] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [showRaw, setShowRaw] = useState(false);

    const fetchVideo = async () => {
        try {
            setError(null);
            const response = await api.get(`/video/${videoid}`);
            setVideo(response.data.data);
        } catch (e) {
            setError(
                e.response?.status === 404
                    ? 'This video doesn’t exist or was deleted.'
                    : e.response?.data?.message ||
                          'Couldn’t load this video. Check your connection and try again.',
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVideo();
    }, [videoid]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleDelete = async () => {
        try {
            await api.delete(`/video/delete/${video._id}`);
            toast.success('Video deleted');
            navigate(`/${collegeslug}/videos`);
        } catch (e) {
            toast.error(
                e.response?.data?.message || 'Couldn’t delete the video',
            );
        }
    };

    if (loading) return <Loader />;

    if (error || !video) {
        return (
            <div className='min-h-full px-4 sm:px-10 pt-8 pb-12'>
                <div className='bg-sheet border border-line rounded-xl'>
                    <EmptyState
                        icon={Video}
                        tone='error'
                        title='Video not found'
                        description={error}
                        action={
                            <Button to={`/${collegeslug}/videos`}>
                                Back to videos
                            </Button>
                        }
                    />
                </div>
            </div>
        );
    }

    const subject = video.subject || {};
    const ytId = youtubeId(video.videoUrl);

    return (
        <div className='min-h-full px-4 sm:px-10 pt-8 pb-12'>
            <PageHeader
                eyebrow={['Video', subject.subjectCode]
                    .filter(Boolean)
                    .join(' · ')}
                badge={
                    <>
                        <StatusBadge status={video.submissionStatus} />
                        {video.deleted && (
                            <StatusBadge tone='outline'>Deleted</StatusBadge>
                        )}
                    </>
                }
                title={video.title || 'Untitled video'}
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
                            Shared by{' '}
                            {video.owner?._id ? (
                                <Link
                                    to={`/users/${video.owner._id}`}
                                    className='font-medium text-link hover:underline'
                                >
                                    @{video.owner.username || 'student'}
                                </Link>
                            ) : (
                                <span className='font-medium'>
                                    @{video.owner?.username || 'unknown'}
                                </span>
                            )}{' '}
                            {relativeTime(video.createdAt)}
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
                            aria-label='Delete video'
                            onClick={() => setConfirmDelete(true)}
                        />
                    </>
                }
            />

            <div className='grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start'>
                <div className='flex flex-col gap-5 min-w-0'>
                    <section
                        aria-label='Video preview'
                        className='bg-sheet border border-line rounded-xl overflow-hidden'
                    >
                        <div className='aspect-video bg-black'>
                            {ytId ? (
                                <iframe
                                    src={`https://www.youtube.com/embed/${ytId}`}
                                    title={video.title || 'Video preview'}
                                    allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
                                    allowFullScreen
                                    className='w-full h-full border-0'
                                />
                            ) : (
                                <div className='w-full h-full flex flex-col items-center justify-center gap-2 p-6 text-center text-white'>
                                    <Video
                                        className='w-7 h-7 opacity-60'
                                        aria-hidden='true'
                                    />
                                    <p className='text-[14px] font-medium'>
                                        No preview for this link
                                    </p>
                                    <p className='text-[13px] opacity-70'>
                                        Only YouTube links play here. Open it to
                                        check the video.
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className='flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 border-t border-line-soft text-[13px] text-ink-2'>
                            <span className='inline-flex items-center gap-1.5'>
                                <Eye
                                    className='w-4 h-4 text-muted'
                                    aria-hidden='true'
                                />
                                {formatNumber(video.clickCounts)} views on
                                StudentSenior
                            </span>
                            {video.videoUrl && (
                                <>
                                    <code className='flex-1 min-w-0 truncate font-mono text-[12px] text-muted'>
                                        {shortUrl(video.videoUrl)}
                                    </code>
                                    <a
                                        href={video.videoUrl}
                                        target='_blank'
                                        rel='noopener noreferrer'
                                        className='inline-flex items-center gap-1 font-medium text-link hover:underline'
                                    >
                                        {ytId ? 'Open in YouTube' : 'Open link'}
                                        <ExternalLink
                                            className='w-3.5 h-3.5'
                                            aria-hidden='true'
                                        />
                                    </a>
                                </>
                            )}
                        </div>
                    </section>

                    <Panel
                        title='Description'
                        titleId='desc-title'
                        bodyClassName='px-5 py-4'
                    >
                        {video.description ? (
                            <p className='text-[14px] leading-relaxed text-ink-2 whitespace-pre-wrap break-words'>
                                {video.description}
                            </p>
                        ) : (
                            <p className='text-[13.5px] text-muted'>
                                No description was added.
                            </p>
                        )}
                    </Panel>
                </div>

                <div className='flex flex-col gap-4'>
                    <ApprovalActions
                        variant='panel'
                        resourceType='video'
                        currentStatus={video.submissionStatus}
                        rejectionReason={video.rejectionReason}
                        apiEndpoint={`/video/edit/${video._id}`}
                        onStatusChange={fetchVideo}
                        approveNote={`Approving shows this video to every student${subject.subjectName ? ` on ${subject.subjectName}` : ''}.`}
                    />

                    <Panel
                        title='Details'
                        titleId='details-title'
                        bodyClassName='px-5 py-4 flex flex-col gap-3'
                    >
                        <MetaList
                            labelWidth={104}
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
                                    label: 'Shared by',
                                    value: video.owner?.username && (
                                        <>
                                            @{video.owner.username}
                                            {video.owner.email && (
                                                <span className='block text-[12.5px] text-muted break-all'>
                                                    {video.owner.email}
                                                </span>
                                            )}
                                        </>
                                    ),
                                },
                                {
                                    label: 'Views',
                                    value: formatNumber(video.clickCounts),
                                },
                                {
                                    label: 'Slug',
                                    value: video.slug,
                                    mono: true,
                                },
                                {
                                    label: 'Created',
                                    value: formatDateTime(video.createdAt),
                                },
                                {
                                    label: 'Updated',
                                    value: formatDateTime(video.updatedAt),
                                },
                                { label: 'ID', value: video._id, mono: true },
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
                                {JSON.stringify(video, null, 2)}
                            </pre>
                        )}
                    </Panel>
                </div>
            </div>

            <VideoEditModal
                isOpen={editing}
                onClose={() => setEditing(false)}
                video={video}
                onSuccess={() => {
                    setEditing(false);
                    fetchVideo();
                }}
            />

            <ConfirmModal
                isOpen={confirmDelete}
                onClose={() => setConfirmDelete(false)}
                onConfirm={handleDelete}
                title='Delete this video?'
                message='Students stop seeing it on the subject page straight away.'
                confirmText='Delete'
                variant='danger'
            />
        </div>
    );
};

export default VideoDetail;
