import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    CalendarDays,
    ImageIcon,
    MapPin,
    MessageSquare,
    Package,
    Pencil,
    Trash2,
} from 'lucide-react';
import api from '../../utils/api';
import { formatDate, formatDateTime, formatNumber } from '../../utils/format';
import { relativeTime } from '../../utils/relativeTime';
import ApprovalActions from '../../components/ApprovalActions';
import ConfirmModal from '../../components/ConfirmModal';
import LostFoundEditModal from '../../components/LostFoundEditModal';
import Loader from '../../components/Common/Loader';
import {
    Button,
    EmptyState,
    MetaList,
    PageHeader,
    Panel,
    Segmented,
    StatusBadge,
} from '../../components/ui';

// The model stores `clickCount`; older records may still use `clickCounts`.
const viewsOf = (item) => item.clickCount ?? item.clickCounts ?? 0;

const maskPhone = (phone = '') =>
    phone.length > 4 ? `•••••• ${phone.slice(-4)}` : phone;

const daysSince = (date) =>
    Math.max(1, Math.ceil((Date.now() - new Date(date)) / 864e5));

const LostFoundDetail = () => {
    const { collegeslug, itemid } = useParams();
    const navigate = useNavigate();
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [notFound, setNotFound] = useState(false);
    const [editing, setEditing] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [showRaw, setShowRaw] = useState(false);
    const [showPhone, setShowPhone] = useState(false);
    const [stateBusy, setStateBusy] = useState(false);

    const fetchItemDetails = async () => {
        try {
            setError(null);
            const response = await api.get(`/lostandfound/${itemid}`);
            setItem(response.data.data);
        } catch (e) {
            setNotFound(e.response?.status === 404);
            setError(
                e.response?.status === 404
                    ? 'This item doesn’t exist or was deleted.'
                    : 'Couldn’t load this item. Check your connection and try again.',
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItemDetails();
    }, [itemid]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleDelete = async () => {
        try {
            await api.delete(`/lostandfound/delete/${item._id}`);
            toast.success('Item deleted');
            navigate(`/${collegeslug}/lost-found`);
        } catch (e) {
            toast.error(
                e.response?.data?.message || 'Couldn’t delete the item',
            );
        }
    };

    const setItemState = async (currentStatus) => {
        if (stateBusy || currentStatus === (item.currentStatus || 'open'))
            return;
        setStateBusy(true);
        try {
            await api.put(`/lostandfound/edit/${item._id}`, { currentStatus });
            toast.success(
                currentStatus === 'closed' ? 'Item closed' : 'Item reopened',
            );
            await fetchItemDetails();
        } catch (e) {
            toast.error(
                e.response?.data?.message ||
                    'Couldn’t change the item state. Try again.',
            );
        } finally {
            setStateBusy(false);
        }
    };

    if (loading) return <Loader />;

    if (error || !item) {
        return (
            <div className='min-h-full px-4 sm:px-10 pt-8 pb-12'>
                <div className='bg-sheet border border-line rounded-xl'>
                    <EmptyState
                        icon={Package}
                        tone='error'
                        title='Item not found'
                        description={error}
                        action={
                            <div className='flex flex-wrap justify-center gap-2'>
                                {!notFound && (
                                    <Button onClick={fetchItemDetails}>
                                        Try again
                                    </Button>
                                )}
                                <Button to={`/${collegeslug}/lost-found`}>
                                    Back to lost & found
                                </Button>
                            </div>
                        }
                    />
                </div>
            </div>
        );
    }

    const views = viewsOf(item);
    const closed = item.currentStatus === 'closed';
    const typeWord = item.type === 'found' ? 'Found' : 'Lost';
    const owner = item.owner?._id ? (
        <Link
            to={`/users/${item.owner._id}`}
            className='font-medium text-link hover:underline'
        >
            @{item.owner.username || 'student'}
        </Link>
    ) : (
        <span className='font-medium'>
            @{item.owner?.username || 'unknown'}
        </span>
    );

    return (
        <div className='min-h-full px-4 sm:px-10 pt-8 pb-12'>
            <PageHeader
                eyebrow='Lost & found'
                badge={
                    <>
                        <span
                            className={`inline-flex items-center h-6 px-2 rounded-md border text-[12.5px] font-medium text-ink ${
                                item.type === 'found'
                                    ? 'bg-ground border-transparent'
                                    : 'bg-sheet border-line-strong'
                            }`}
                        >
                            {typeWord}
                        </span>
                        <StatusBadge status={item.submissionStatus} />
                        {closed && <StatusBadge status='closed' />}
                        {item.deleted && (
                            <StatusBadge tone='outline'>Deleted</StatusBadge>
                        )}
                    </>
                }
                title={item.title || 'Untitled item'}
                meta={
                    <p className='flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-ink-2'>
                        <span>
                            Posted by {owner} {relativeTime(item.createdAt)}
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
                            aria-label='Delete item'
                            onClick={() => setConfirmDelete(true)}
                        />
                    </>
                }
            />

            <div className='grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start'>
                <div className='flex flex-col gap-5 min-w-0'>
                    <section
                        aria-label='Photo'
                        className='bg-sheet border border-line rounded-xl overflow-hidden'
                    >
                        {item.imageUrl ? (
                            <div className='flex items-center justify-center bg-sunken max-h-[440px] aspect-[16/10]'>
                                <img
                                    src={item.imageUrl}
                                    alt={`Photo of ${item.title}`}
                                    className='max-h-full max-w-full object-contain'
                                />
                            </div>
                        ) : (
                            <div className='flex flex-col items-center justify-center gap-2.5 py-16 bg-ground text-muted'>
                                <ImageIcon
                                    className='w-9 h-9'
                                    strokeWidth={1.25}
                                    aria-hidden='true'
                                />
                                <span className='text-[13px]'>
                                    The student didn’t add a photo
                                </span>
                            </div>
                        )}
                    </section>

                    <Panel
                        title='Description'
                        titleId='desc-title'
                        bodyClassName='px-5 py-4'
                    >
                        {item.description ? (
                            <p className='text-sm leading-relaxed text-ink-2 whitespace-pre-wrap break-words'>
                                {item.description}
                            </p>
                        ) : (
                            <p className='text-sm text-muted'>
                                The student didn’t add a description.
                            </p>
                        )}
                    </Panel>
                </div>

                <div className='flex flex-col gap-4'>
                    <ApprovalActions
                        variant='panel'
                        resourceType='Item'
                        currentStatus={item.submissionStatus}
                        rejectionReason={item.rejectionReason}
                        apiEndpoint={`/lostandfound/edit/${item._id}`}
                        onStatusChange={fetchItemDetails}
                        approveNote='Approving shows this post to every student at the college.'
                    />

                    <Panel
                        title='Item state'
                        titleId='state-title'
                        bodyClassName='px-5 py-4 flex flex-col gap-3'
                    >
                        <Segmented
                            label='Item state'
                            className={`w-full [&>button]:flex-1 ${stateBusy ? 'opacity-60' : ''}`}
                            value={closed ? 'closed' : 'open'}
                            onChange={setItemState}
                            options={[
                                { value: 'open', label: 'Open' },
                                { value: 'closed', label: 'Closed' },
                            ]}
                        />
                        <p className='text-[13px] leading-relaxed text-ink-2'>
                            {closed
                                ? 'Marked as closed. Reopen it if the item is still missing.'
                                : `Open for ${formatNumber(daysSince(item.createdAt))} day${daysSince(item.createdAt) === 1 ? '' : 's'}. Close it once the item is back with its owner.`}
                        </p>
                    </Panel>

                    <Panel
                        title='Where and when'
                        titleId='where-title'
                        bodyClassName='px-5 py-4 flex flex-col gap-3 text-[13.5px] text-ink'
                    >
                        <p className='flex items-center gap-2.5'>
                            <MapPin
                                className='w-4 h-4 text-muted shrink-0'
                                aria-hidden='true'
                            />
                            <span className='min-w-0 break-words'>
                                {item.location || 'Place not given'}
                            </span>
                        </p>
                        <p className='flex items-center gap-2.5'>
                            <CalendarDays
                                className='w-4 h-4 text-muted shrink-0'
                                aria-hidden='true'
                            />
                            {item.date
                                ? `${typeWord} on ${formatDate(item.date)}`
                                : 'Date not given'}
                        </p>
                        {item.whatsapp && (
                            <p className='flex items-center gap-2.5 pt-3 border-t border-line-soft'>
                                <MessageSquare
                                    className='w-4 h-4 text-muted shrink-0'
                                    aria-hidden='true'
                                />
                                <span className='sr-only'>WhatsApp</span>
                                <span className='flex-1 font-mono text-[13px]'>
                                    {showPhone
                                        ? item.whatsapp
                                        : maskPhone(item.whatsapp)}
                                </span>
                                <button
                                    type='button'
                                    aria-pressed={showPhone}
                                    onClick={() => setShowPhone((v) => !v)}
                                    className='text-[13px] font-medium text-link hover:underline cursor-pointer'
                                >
                                    {showPhone ? 'Hide' : 'Show number'}
                                </button>
                            </p>
                        )}
                    </Panel>

                    <Panel
                        title='Details'
                        titleId='details-title'
                        bodyClassName='px-5 py-4 flex flex-col gap-3'
                    >
                        <MetaList
                            items={[
                                { label: 'Posted by', value: owner },
                                { label: 'Slug', value: item.slug, mono: true },
                                {
                                    label: 'Created',
                                    value: formatDateTime(item.createdAt),
                                },
                                {
                                    label: 'Updated',
                                    value: formatDateTime(
                                        item.updatedAt || item.createdAt,
                                    ),
                                },
                                { label: 'ID', value: item._id, mono: true },
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
                                {JSON.stringify(item, null, 2)}
                            </pre>
                        )}
                    </Panel>
                </div>
            </div>

            <LostFoundEditModal
                isOpen={editing}
                onClose={() => setEditing(false)}
                item={item}
                onSuccess={() => {
                    fetchItemDetails();
                    setEditing(false);
                }}
            />

            <ConfirmModal
                isOpen={confirmDelete}
                onClose={() => setConfirmDelete(false)}
                onConfirm={handleDelete}
                title='Delete this item?'
                message='The post disappears for students straight away, along with its photo and contact number. This can’t be undone.'
                confirmText='Delete'
                variant='danger'
            />
        </div>
    );
};

export default LostFoundDetail;
