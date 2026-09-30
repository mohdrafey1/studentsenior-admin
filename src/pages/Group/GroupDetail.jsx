import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    Check,
    Copy,
    ExternalLink,
    MessageSquare,
    MessageSquareOff,
    Pencil,
    Trash2,
} from 'lucide-react';
import api from '../../utils/api';
import { useColleges } from '../../context/CollegeContext';
import { formatDate, formatDateTime, formatNumber } from '../../utils/format';
import ApprovalActions from '../../components/ApprovalActions';
import ConfirmModal from '../../components/ConfirmModal';
import GroupEditModal from '../../components/GroupEditModal';
import Loader from '../../components/Common/Loader';
import {
    Alert,
    Button,
    EmptyState,
    MetaList,
    PageHeader,
    Panel,
    StatusBadge,
} from '../../components/ui';

const GroupDetail = () => {
    const { collegeslug, groupid } = useParams();
    const navigate = useNavigate();
    const { currentCollege } = useColleges();
    const [group, setGroup] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editing, setEditing] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [showRaw, setShowRaw] = useState(false);
    const [copied, setCopied] = useState(false);

    const fetchGroup = async () => {
        try {
            setError(null);
            const response = await api.get(`/group/${groupid}`);
            setGroup(response.data.data);
        } catch (e) {
            setError(
                e.response?.status === 404
                    ? 'This group doesn’t exist or was deleted.'
                    : 'Couldn’t load this group. Check your connection and try again.',
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroup();
    }, [groupid]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleDelete = async () => {
        try {
            await api.delete(`/group/delete/${group._id}`);
            toast.success('Group deleted');
            navigate(`/${collegeslug}/groups`);
        } catch (e) {
            toast.error(
                e.response?.data?.message || 'Couldn’t delete the group',
            );
        }
    };

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(group.link);
            setCopied(true);
            toast.success('Invite link copied');
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error(
                'Couldn’t copy the link. Select it and copy it instead.',
            );
        }
    };

    if (loading) return <Loader />;

    if (error || !group) {
        return (
            <div className='min-h-full px-4 sm:px-10 pt-8 pb-12'>
                <div className='bg-sheet border border-line rounded-xl'>
                    <EmptyState
                        icon={MessageSquareOff}
                        tone='error'
                        title='Group not found'
                        description={error}
                        action={
                            <Button to={`/${collegeslug}/groups`}>
                                Back to WhatsApp groups
                            </Button>
                        }
                    />
                </div>
            </div>
        );
    }

    // The API returns the owner as an id; handle a populated owner too.
    const ownerId =
        typeof group.owner === 'string' ? group.owner : group.owner?._id;
    const ownerName =
        typeof group.owner === 'object' ? group.owner?.username : null;
    const clicks = group.clickCount ?? group.clickCounts ?? 0;
    const status = group.submissionStatus || 'pending';

    return (
        <div className='min-h-full px-4 sm:px-10 pt-8 pb-12'>
            <PageHeader
                eyebrow='WhatsApp group'
                badge={
                    <>
                        <StatusBadge status={group.submissionStatus} />
                        {group.deleted && (
                            <StatusBadge tone='outline'>Deleted</StatusBadge>
                        )}
                    </>
                }
                title={group.title || 'Untitled group'}
                meta={
                    <p className='text-[13px] text-ink-2'>
                        Shared
                        {ownerName && (
                            <>
                                {' by '}
                                <Link
                                    to={`/users/${ownerId}`}
                                    className='font-medium text-link hover:underline'
                                >
                                    @{ownerName}
                                </Link>
                            </>
                        )}{' '}
                        on {formatDate(group.createdAt)}
                    </p>
                }
                actions={
                    <>
                        <Button icon={Pencil} onClick={() => setEditing(true)}>
                            Edit
                        </Button>
                        <Button
                            variant='danger'
                            icon={Trash2}
                            onClick={() => setConfirmDelete(true)}
                        >
                            Delete group
                        </Button>
                    </>
                }
            />

            {status === 'rejected' && (
                <Alert
                    tone='bad'
                    className='mb-6'
                    title='Rejected'
                    action={
                        <span className='text-[12.5px]'>
                            Hidden from students
                        </span>
                    }
                >
                    {group.rejectionReason || 'No reason was recorded.'}
                </Alert>
            )}

            <div className='grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start'>
                <div className='flex flex-col gap-5 min-w-0'>
                    <section
                        aria-labelledby='link-title'
                        className='bg-sheet border border-line rounded-xl p-5 flex flex-col gap-4'
                    >
                        <div className='flex items-center gap-3.5'>
                            <span className='w-[52px] h-[52px] rounded-[14px] bg-ground text-ink-2 flex items-center justify-center shrink-0'>
                                <MessageSquare
                                    className='w-6 h-6'
                                    aria-hidden='true'
                                />
                            </span>
                            <div className='flex-1 min-w-0 flex flex-col items-start gap-1'>
                                <h2
                                    id='link-title'
                                    className='text-base font-semibold text-ink'
                                >
                                    Invite link
                                </h2>
                                {group.domain && (
                                    <span className='max-w-full px-2 py-0.5 rounded-md bg-ground text-[12.5px] text-ink-2 truncate'>
                                        Domain: {group.domain}
                                    </span>
                                )}
                            </div>
                        </div>
                        {group.link ? (
                            <div className='flex flex-wrap items-center gap-2 min-h-[42px] py-1.5 pr-1.5 pl-3.5 border border-line rounded-[9px] bg-sunken'>
                                <code className='flex-1 min-w-[180px] font-mono text-[13px] text-ink truncate'>
                                    {group.link.replace(/^https?:\/\//i, '')}
                                </code>
                                <div className='flex items-center gap-1'>
                                    <Button
                                        variant='ghost'
                                        size='sm'
                                        iconOnly
                                        icon={copied ? Check : Copy}
                                        aria-label='Copy invite link'
                                        onClick={copyLink}
                                    />
                                    <Button
                                        size='sm'
                                        href={group.link}
                                        target='_blank'
                                        rel='noopener noreferrer'
                                        className='flex-row-reverse'
                                        icon={ExternalLink}
                                    >
                                        Open in WhatsApp
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <p className='text-[13.5px] text-muted'>
                                No invite link saved for this group.
                            </p>
                        )}
                    </section>

                    <Panel
                        title='About this group'
                        titleId='about-title'
                        bodyClassName='px-5 py-4 text-sm leading-relaxed text-ink-2 whitespace-pre-wrap break-words'
                    >
                        {group.info || (
                            <span className='text-muted'>
                                The student didn’t add a description.
                            </span>
                        )}
                    </Panel>
                </div>

                <div className='flex flex-col gap-4'>
                    <ApprovalActions
                        variant='panel'
                        resourceType='group'
                        currentStatus={group.submissionStatus}
                        rejectionReason={group.rejectionReason}
                        apiEndpoint={`/group/edit/${group._id}`}
                        onStatusChange={fetchGroup}
                        approveNote={`Shows the invite link to ${currentCollege?.name || 'college'} students.`}
                    />

                    <Panel
                        title='Details'
                        titleId='details-title'
                        bodyClassName='px-5 py-4 flex flex-col gap-3'
                    >
                        <MetaList
                            items={[
                                { label: 'Domain', value: group.domain },
                                {
                                    label: 'Shared by',
                                    value: ownerId ? (
                                        <Link
                                            to={`/users/${ownerId}`}
                                            className='text-link hover:underline'
                                        >
                                            {ownerName
                                                ? `@${ownerName}`
                                                : 'View account'}
                                        </Link>
                                    ) : null,
                                },
                                {
                                    label: 'Link clicks',
                                    value: formatNumber(clicks),
                                    mono: true,
                                },
                                {
                                    label: 'Created',
                                    value: formatDateTime(group.createdAt),
                                },
                                {
                                    label: 'Updated',
                                    value: formatDateTime(group.updatedAt),
                                },
                                group.deletedAt && {
                                    label: 'Deleted',
                                    value: formatDateTime(group.deletedAt),
                                },
                                { label: 'ID', value: group._id, mono: true },
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
                                {JSON.stringify(group, null, 2)}
                            </pre>
                        )}
                    </Panel>
                </div>
            </div>

            <GroupEditModal
                isOpen={editing}
                onClose={() => setEditing(false)}
                group={group}
                onSuccess={fetchGroup}
            />

            <ConfirmModal
                isOpen={confirmDelete}
                onClose={() => setConfirmDelete(false)}
                onConfirm={handleDelete}
                title='Delete this group?'
                message='The invite link disappears from the college page straight away. The WhatsApp group itself isn’t affected. This can’t be undone.'
                confirmText='Delete'
                variant='danger'
            />
        </div>
    );
};

export default GroupDetail;
