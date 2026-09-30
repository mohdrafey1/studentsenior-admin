import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    Briefcase,
    ExternalLink,
    Mail,
    MessageSquare,
    Pencil,
    Trash2,
} from 'lucide-react';
import api from '../../utils/api';
import { formatDateTime, formatNumber } from '../../utils/format';
import { relativeTime } from '../../utils/relativeTime';
import ApprovalActions from '../../components/ApprovalActions';
import ConfirmModal from '../../components/ConfirmModal';
import OpportunityEditModal from '../../components/OpportunityEditModal';
import Loader from '../../components/Common/Loader';
import {
    Button,
    EmptyState,
    MetaList,
    PageHeader,
    Panel,
    StatusBadge,
} from '../../components/ui';

// The model stores `clickCount`; older records may still use `clickCounts`.
const viewsOf = (o) => o.clickCount ?? o.clickCounts ?? 0;

const maskPhone = (phone = '') =>
    phone.length > 4 ? `•••••• ${phone.slice(-4)}` : phone;

const daysSince = (date) =>
    Math.max(1, Math.ceil((Date.now() - new Date(date)) / 864e5));

const OpportunityDetail = () => {
    const { collegeslug, opportunityid } = useParams();
    const navigate = useNavigate();
    const [opportunity, setOpportunity] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [notFound, setNotFound] = useState(false);
    const [editing, setEditing] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [showRaw, setShowRaw] = useState(false);
    const [showPhone, setShowPhone] = useState(false);

    const fetchOpportunity = async () => {
        try {
            setError(null);
            const response = await api.get(`/opportunity/${opportunityid}`);
            setOpportunity(response.data.data);
        } catch (e) {
            setNotFound(e.response?.status === 404);
            setError(
                e.response?.status === 404
                    ? 'This opportunity doesn’t exist or was deleted.'
                    : 'Couldn’t load this opportunity. Check your connection and try again.',
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOpportunity();
    }, [opportunityid]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleDelete = async () => {
        try {
            await api.delete(`/opportunity/delete/${opportunity._id}`);
            toast.success('Opportunity deleted');
            navigate(`/${collegeslug}/opportunities`);
        } catch (e) {
            toast.error(
                e.response?.data?.message || 'Couldn’t delete the opportunity',
            );
        }
    };

    if (loading) return <Loader />;

    if (error || !opportunity) {
        return (
            <div className='min-h-full px-4 sm:px-10 pt-8 pb-12'>
                <div className='bg-sheet border border-line rounded-xl'>
                    <EmptyState
                        icon={Briefcase}
                        tone='error'
                        title='Opportunity not found'
                        description={error}
                        action={
                            <div className='flex flex-wrap justify-center gap-2'>
                                {!notFound && (
                                    <Button onClick={fetchOpportunity}>
                                        Try again
                                    </Button>
                                )}
                                <Button to={`/${collegeslug}/opportunities`}>
                                    Back to opportunities
                                </Button>
                            </div>
                        }
                    />
                </div>
            </div>
        );
    }

    const o = opportunity;
    const views = viewsOf(o);
    const status = o.submissionStatus || 'pending';
    const owner = o.owner?._id ? (
        <Link
            to={`/users/${o.owner._id}`}
            className='font-medium text-link hover:underline'
        >
            @{o.owner.username || 'student'}
        </Link>
    ) : (
        <span className='font-medium'>@{o.owner?.username || 'unknown'}</span>
    );

    const applyRows = [
        o.link && {
            key: 'link',
            icon: ExternalLink,
            label: 'Online form',
            value: o.link,
            action: (
                <a
                    href={o.link}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-[13px] font-medium text-link hover:underline whitespace-nowrap'
                >
                    Open form
                </a>
            ),
        },
        o.email && {
            key: 'email',
            icon: Mail,
            label: 'Email',
            value: o.email,
            action: (
                <a
                    href={`mailto:${o.email}`}
                    className='text-[13px] font-medium text-link hover:underline whitespace-nowrap'
                >
                    Send email
                </a>
            ),
        },
        o.whatsapp && {
            key: 'whatsapp',
            icon: MessageSquare,
            label: 'WhatsApp',
            value: showPhone ? o.whatsapp : maskPhone(o.whatsapp),
            action: (
                <button
                    type='button'
                    aria-pressed={showPhone}
                    onClick={() => setShowPhone((v) => !v)}
                    className='text-[13px] font-medium text-link hover:underline cursor-pointer'
                >
                    {showPhone ? 'Hide' : 'Show'}
                </button>
            ),
        },
    ].filter(Boolean);

    return (
        <div className='min-h-full px-4 sm:px-10 pt-8 pb-12'>
            <PageHeader
                eyebrow='Opportunity'
                badge={
                    <>
                        <StatusBadge status={status} />
                        {o.deleted && (
                            <StatusBadge tone='outline'>Deleted</StatusBadge>
                        )}
                        {status === 'approved' && !o.deleted && (
                            <span className='text-[13px] text-muted'>
                                Live for students
                            </span>
                        )}
                    </>
                }
                title={o.name || 'Untitled opportunity'}
                meta={
                    <p className='flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-ink-2'>
                        <span>
                            Posted by {owner} {relativeTime(o.createdAt)}
                        </span>
                        <span aria-hidden='true' className='text-faint'>
                            ·
                        </span>
                        <span>
                            {formatNumber(views)} view{views === 1 ? '' : 's'}
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
                            aria-label='Delete opportunity'
                            onClick={() => setConfirmDelete(true)}
                        />
                    </>
                }
            />

            <div className='grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start'>
                <div className='flex flex-col gap-5 min-w-0'>
                    <Panel
                        title='Description'
                        titleId='desc-title'
                        bodyClassName='px-5 py-4'
                    >
                        {o.description ? (
                            <p className='text-sm leading-relaxed text-ink-2 whitespace-pre-wrap break-words'>
                                {o.description}
                            </p>
                        ) : (
                            <p className='text-sm text-muted'>
                                The poster didn’t add a description.
                            </p>
                        )}
                    </Panel>

                    <Panel title='How students apply' titleId='apply-title'>
                        {applyRows.length ? (
                            <ul>
                                {applyRows.map((row) => {
                                    const Icon = row.icon;
                                    return (
                                        <li
                                            key={row.key}
                                            className='grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[120px_minmax(0,1fr)_auto] gap-x-3.5 gap-y-1 items-center px-5 py-3 border-b border-line-soft last:border-b-0 text-[13.5px]'
                                        >
                                            <span className='inline-flex items-center gap-2 text-ink-2'>
                                                <Icon
                                                    className='w-[15px] h-[15px] text-muted'
                                                    aria-hidden='true'
                                                />
                                                {row.label}
                                            </span>
                                            <code className='order-3 sm:order-none col-span-2 sm:col-span-1 font-mono text-[12.5px] text-ink truncate'>
                                                {row.value}
                                            </code>
                                            {row.action}
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <p className='px-5 py-4 text-sm text-muted'>
                                No link, email or WhatsApp number given, so
                                students have no way to apply.
                            </p>
                        )}
                    </Panel>
                </div>

                <div className='flex flex-col gap-4'>
                    <ApprovalActions
                        variant='panel'
                        resourceType='Opportunity'
                        currentStatus={o.submissionStatus}
                        rejectionReason={o.rejectionReason}
                        apiEndpoint={`/opportunity/edit/${o._id}`}
                        onStatusChange={fetchOpportunity}
                        approveNote='Approving shows this opportunity to every student at the college.'
                    />

                    <Panel
                        title='Reach'
                        titleId='reach-title'
                        bodyClassName='px-5 py-4'
                    >
                        <p className='flex items-baseline gap-2'>
                            <span className='font-serif font-bold text-[28px] leading-none text-ink'>
                                {formatNumber(views)}
                            </span>
                            <span className='text-[13px] text-muted'>
                                view{views === 1 ? '' : 's'} in{' '}
                                {formatNumber(daysSince(o.createdAt))} day
                                {daysSince(o.createdAt) === 1 ? '' : 's'}
                            </span>
                        </p>
                    </Panel>

                    <Panel
                        title='Details'
                        titleId='details-title'
                        bodyClassName='px-5 py-4 flex flex-col gap-3'
                    >
                        <MetaList
                            items={[
                                { label: 'Posted by', value: owner },
                                { label: 'Slug', value: o.slug, mono: true },
                                {
                                    label: 'Created',
                                    value: formatDateTime(o.createdAt),
                                },
                                {
                                    label: 'Updated',
                                    value: formatDateTime(
                                        o.updatedAt || o.createdAt,
                                    ),
                                },
                                { label: 'ID', value: o._id, mono: true },
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
                                {JSON.stringify(o, null, 2)}
                            </pre>
                        )}
                    </Panel>
                </div>
            </div>

            <OpportunityEditModal
                isOpen={editing}
                onClose={() => setEditing(false)}
                opportunity={o}
                onSuccess={() => {
                    fetchOpportunity();
                    setEditing(false);
                }}
            />

            <ConfirmModal
                isOpen={confirmDelete}
                onClose={() => setConfirmDelete(false)}
                onConfirm={handleDelete}
                title='Delete this opportunity?'
                message='Students stop seeing it straight away and the poster can’t get it back. This can’t be undone.'
                confirmText='Delete'
                variant='danger'
            />
        </div>
    );
};

export default OpportunityDetail;
