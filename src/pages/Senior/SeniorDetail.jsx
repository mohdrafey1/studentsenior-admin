import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    AlertTriangle,
    Briefcase,
    Check,
    ExternalLink,
    Eye,
    Pencil,
    Trash2,
    UserX,
} from 'lucide-react';
import api from '../../utils/api';
import { useColleges } from '../../context/CollegeContext';
import { formatDateTime, formatNumber } from '../../utils/format';
import { personInitials } from '../../utils/initials';
import { relativeTime } from '../../utils/relativeTime';
import ApprovalActions from '../../components/ApprovalActions';
import ConfirmModal from '../../components/ConfirmModal';
import SeniorEditModal from '../../components/SeniorEditModal';
import Loader from '../../components/Common/Loader';
import {
    hasOwnPhoto,
    linkHref,
    platformOf,
    seniorLinks,
    viewsOf,
} from './seniorLinks';
import {
    Button,
    EmptyState,
    MetaList,
    Panel,
    StatusBadge,
} from '../../components/ui';

// Large round photo for the profile preview, with initials when the photo
// is missing or doesn't load.
const ProfilePhoto = ({ name, src }) => {
    const [failedSrc, setFailedSrc] = useState(null);
    const classes =
        'w-24 h-24 sm:w-28 sm:h-28 rounded-full shrink-0 bg-brand-soft';
    if (src && failedSrc !== src) {
        return (
            <img
                src={src}
                alt=''
                onError={() => setFailedSrc(src)}
                className={`${classes} object-cover`}
            />
        );
    }
    return (
        <span
            aria-hidden='true'
            className={`${classes} flex items-center justify-center font-serif font-bold text-[34px] sm:text-[38px] text-brand-ink`}
        >
            {personInitials(name || '?')}
        </span>
    );
};

const CheckItem = ({ ok, children }) => (
    <li className='flex items-center gap-2.5 text-[13.5px] text-ink'>
        <span
            className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center ${
                ok ? 'bg-ok-soft text-ok-ink' : 'bg-warn-soft text-warn-ink'
            }`}
        >
            {ok ? (
                <Check className='w-3 h-3' aria-hidden='true' />
            ) : (
                <AlertTriangle className='w-3 h-3' aria-hidden='true' />
            )}
        </span>
        <span className='sr-only'>{ok ? 'Done:' : 'Check:'}</span>
        {children}
    </li>
);

const SeniorDetail = () => {
    const { collegeslug, seniorid } = useParams();
    const navigate = useNavigate();
    const { currentCollege } = useColleges();
    const [senior, setSenior] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editing, setEditing] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [showRaw, setShowRaw] = useState(false);

    const fetchSenior = async () => {
        try {
            setError(null);
            const response = await api.get(`/senior/${seniorid}`);
            setSenior(response.data.data);
        } catch (e) {
            setError(
                e.response?.status === 404
                    ? 'This senior profile doesn’t exist or was deleted.'
                    : 'Couldn’t load this senior profile. Check your connection and try again.',
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSenior();
    }, [seniorid]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleDelete = async () => {
        try {
            await api.delete(`/senior/delete/${senior._id}`);
            toast.success('Senior deleted');
            navigate(`/${collegeslug}/seniors`);
        } catch (e) {
            toast.error(
                e.response?.data?.message || 'Couldn’t delete the senior',
            );
        }
    };

    if (loading) return <Loader />;

    if (error || !senior) {
        return (
            <div className='min-h-full px-4 sm:px-10 pt-8 pb-12'>
                <div className='bg-sheet border border-line rounded-xl'>
                    <EmptyState
                        icon={UserX}
                        tone='error'
                        title='Senior not found'
                        description={error}
                        action={
                            <Button to={`/${collegeslug}/seniors`}>
                                Back to seniors
                            </Button>
                        }
                    />
                </div>
            </div>
        );
    }

    const owner = senior.owner || {};
    const branch = senior.branch || {};
    const course = branch.course?.courseName;
    const links = seniorLinks(senior);
    const firstName = (senior.name || '').trim().split(/\s+/)[0] || 'them';
    const detailsFilled = Boolean(
        senior.name?.trim() && branch.branchName && senior.year,
    );

    const ownerLink = owner._id ? (
        <Link
            to={`/users/${owner._id}`}
            className='font-medium text-link hover:underline'
        >
            @{owner.username || 'student'}
        </Link>
    ) : (
        <span className='font-medium'>@{owner.username || 'unknown'}</span>
    );

    return (
        <div className='min-h-full px-4 sm:px-10 pt-8 pb-12'>
            <div className='flex flex-wrap items-center gap-3 mb-6'>
                <div className='flex-1 min-w-[240px] flex flex-wrap items-center gap-x-2.5 gap-y-1.5'>
                    <span className='eyebrow'>Senior profile</span>
                    <StatusBadge status={senior.submissionStatus} />
                    {senior.deleted && (
                        <StatusBadge tone='outline'>Deleted</StatusBadge>
                    )}
                    <span className='text-[13px] text-muted'>
                        Submitted by {ownerLink}{' '}
                        {relativeTime(senior.createdAt)}
                    </span>
                </div>
                <div className='flex items-center gap-2'>
                    <Button icon={Pencil} onClick={() => setEditing(true)}>
                        Edit profile
                    </Button>
                    <Button
                        variant='danger'
                        iconOnly
                        icon={Trash2}
                        aria-label='Delete profile'
                        onClick={() => setConfirmDelete(true)}
                    />
                </div>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start'>
                <div className='flex flex-col gap-5 min-w-0'>
                    <section
                        aria-label='Profile as students will see it'
                        className='bg-sheet border border-line rounded-[14px] overflow-hidden'
                    >
                        <div className='eyebrow flex items-center gap-2 h-9 px-4 bg-sunken border-b border-line-soft'>
                            <Eye className='w-3.5 h-3.5' aria-hidden='true' />
                            As students will see it
                        </div>
                        <div className='flex flex-col sm:flex-row items-start gap-5 sm:gap-7 p-5 sm:px-9 sm:py-8'>
                            <ProfilePhoto
                                name={senior.name}
                                src={senior.profilePicture}
                            />
                            <div className='flex-1 min-w-0 flex flex-col gap-2.5'>
                                <h1 className='font-serif font-bold text-[26px] sm:text-[30px] leading-[1.15] tracking-[-0.3px] text-ink break-words'>
                                    {senior.name || 'Unnamed senior'}
                                </h1>
                                <div className='flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-x-2 gap-y-1 text-[13.5px] text-ink-2'>
                                    {senior.domain && (
                                        <span className='inline-flex items-center gap-1.5'>
                                            <Briefcase
                                                className='w-3.5 h-3.5 text-muted'
                                                aria-hidden='true'
                                            />
                                            {senior.domain}
                                        </span>
                                    )}
                                    {[
                                        [course, branch.branchName]
                                            .filter(Boolean)
                                            .join(' '),
                                        senior.year,
                                    ]
                                        .filter(Boolean)
                                        .map((part, i) => (
                                            <React.Fragment key={part}>
                                                {(senior.domain || i > 0) && (
                                                    <span
                                                        aria-hidden='true'
                                                        className='hidden sm:inline text-faint'
                                                    >
                                                        ·
                                                    </span>
                                                )}
                                                <span>{part}</span>
                                            </React.Fragment>
                                        ))}
                                </div>
                                {senior.description ? (
                                    <p className='mt-1.5 text-sm leading-relaxed text-ink-2 whitespace-pre-wrap break-words'>
                                        {senior.description}
                                    </p>
                                ) : (
                                    <p className='mt-1.5 text-sm text-muted'>
                                        No about text yet.
                                    </p>
                                )}
                                {links.length > 0 && (
                                    <div className='flex flex-wrap gap-2 mt-1.5'>
                                        {links.map((link, i) => {
                                            const platform = platformOf(
                                                link.platform,
                                            );
                                            return (
                                                <Button
                                                    key={`${link.platform}-${i}`}
                                                    size='sm'
                                                    icon={platform.icon}
                                                    href={linkHref(link)}
                                                    target='_blank'
                                                    rel='noopener noreferrer'
                                                >
                                                    {platform.label}
                                                </Button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    <Panel title='Links to check' titleId='links-title'>
                        {links.length === 0 ? (
                            <p className='px-5 py-4 text-[13.5px] text-muted'>
                                No social links added. Juniors can only find
                                this senior through the directory.
                            </p>
                        ) : (
                            <ul>
                                {links.map((link, i) => (
                                    <li
                                        key={`${link.platform}-${i}`}
                                        className='grid grid-cols-[88px_minmax(0,1fr)_auto] sm:grid-cols-[110px_minmax(0,1fr)_auto] items-center gap-3.5 px-5 py-2.5 border-b border-line-soft last:border-b-0 text-[13.5px]'
                                    >
                                        <span>
                                            {platformOf(link.platform).label}
                                        </span>
                                        <code className='font-mono text-[12.5px] text-ink-2 truncate'>
                                            {link.url.replace(
                                                /^https?:\/\/(www\.)?/i,
                                                '',
                                            )}
                                        </code>
                                        <a
                                            href={linkHref(link)}
                                            target='_blank'
                                            rel='noopener noreferrer'
                                            aria-label={`Open ${platformOf(link.platform).label} link`}
                                            className='inline-flex items-center gap-1.5 text-[13px] font-medium text-link hover:underline'
                                        >
                                            Open
                                            <ExternalLink
                                                className='w-3.5 h-3.5'
                                                aria-hidden='true'
                                            />
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Panel>
                </div>

                <div className='flex flex-col gap-4'>
                    <ApprovalActions
                        variant='panel'
                        resourceType='profile'
                        currentStatus={senior.submissionStatus}
                        rejectionReason={senior.rejectionReason}
                        apiEndpoint={`/senior/edit/${senior._id}`}
                        onStatusChange={fetchSenior}
                        approveNote={`Shows ${firstName} in the ${currentCollege?.name || 'college'} seniors directory.`}
                    />

                    <Panel
                        title='Profile checks'
                        titleId='checks-title'
                        bodyClassName='px-5 py-4'
                    >
                        <ul className='flex flex-col gap-2.5'>
                            <CheckItem ok={detailsFilled}>
                                {detailsFilled
                                    ? 'Name, branch and year filled'
                                    : 'Name, branch or year missing'}
                            </CheckItem>
                            <CheckItem ok={links.length > 0}>
                                {links.length > 0
                                    ? `${formatNumber(links.length)} social link${links.length === 1 ? '' : 's'}`
                                    : 'No social links'}
                            </CheckItem>
                            <CheckItem ok={hasOwnPhoto(senior)}>
                                {hasOwnPhoto(senior)
                                    ? 'Has a profile photo'
                                    : senior.profilePicture
                                      ? 'Only the default photo'
                                      : 'No profile photo, so initials are shown'}
                            </CheckItem>
                            <CheckItem ok={Boolean(senior.description?.trim())}>
                                {senior.description?.trim()
                                    ? 'About text written'
                                    : 'No about text'}
                            </CheckItem>
                        </ul>
                    </Panel>

                    <Panel
                        title='Details'
                        titleId='details-title'
                        bodyClassName='px-5 py-4 flex flex-col gap-3'
                    >
                        <MetaList
                            items={[
                                { label: 'Branch', value: branch.branchName },
                                { label: 'Course', value: course },
                                { label: 'Year', value: senior.year },
                                {
                                    label: 'Account',
                                    value:
                                        owner._id || owner.username
                                            ? ownerLink
                                            : null,
                                },
                                { label: 'Email', value: owner.email },
                                {
                                    label: 'Profile views',
                                    value: formatNumber(viewsOf(senior)),
                                },
                                {
                                    label: 'Slug',
                                    value: senior.slug,
                                    mono: true,
                                },
                                {
                                    label: 'Created',
                                    value: formatDateTime(senior.createdAt),
                                },
                                {
                                    label: 'Updated',
                                    value: formatDateTime(senior.updatedAt),
                                },
                                senior.deletedAt && {
                                    label: 'Deleted',
                                    value: formatDateTime(senior.deletedAt),
                                },
                                { label: 'ID', value: senior._id, mono: true },
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
                                {JSON.stringify(senior, null, 2)}
                            </pre>
                        )}
                    </Panel>
                </div>
            </div>

            <SeniorEditModal
                isOpen={editing}
                onClose={() => setEditing(false)}
                senior={senior}
                onSuccess={fetchSenior}
            />

            <ConfirmModal
                isOpen={confirmDelete}
                onClose={() => setConfirmDelete(false)}
                onConfirm={handleDelete}
                title='Delete this senior?'
                message='Their profile leaves the seniors directory straight away and juniors can no longer reach them through it. This can’t be undone.'
                confirmText='Delete'
                variant='danger'
            />
        </div>
    );
};

export default SeniorDetail;
