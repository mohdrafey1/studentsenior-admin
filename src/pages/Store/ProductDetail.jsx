import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ExternalLink, PackageX, Pencil, Trash2 } from 'lucide-react';
import api from '../../utils/api';
import { useColleges } from '../../context/CollegeContext';
import { formatDateTime, formatNumber } from '../../utils/format';
import { relativeTime } from '../../utils/relativeTime';
import ApprovalActions from '../../components/ApprovalActions';
import ConfirmModal from '../../components/ConfirmModal';
import ProductEditModal from '../../components/ProductEditModal';
import Loader from '../../components/Common/Loader';
import Price from './Price';
import ProductImage from './ProductImage';
import {
    Avatar,
    Button,
    EmptyState,
    MetaList,
    PageHeader,
    Panel,
    StatusBadge,
    Switch,
} from '../../components/ui';

const ProductDetail = () => {
    const { collegeslug, productid } = useParams();
    const navigate = useNavigate();
    const { currentCollege } = useColleges();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editing, setEditing] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [showRaw, setShowRaw] = useState(false);
    const [showPhone, setShowPhone] = useState(false);
    const [savingAvailable, setSavingAvailable] = useState(false);

    const fetchProduct = async () => {
        try {
            setError(null);
            const response = await api.get(`/store/${productid}`);
            setProduct(response.data.data);
        } catch (e) {
            setError(
                e.response?.status === 404
                    ? 'This listing doesn’t exist or was deleted.'
                    : 'Couldn’t load this listing. Check your connection and try again.',
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProduct();
    }, [productid]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleDelete = async () => {
        try {
            await api.delete(`/store/delete/${product._id}`);
            toast.success('Listing deleted');
            navigate(`/${collegeslug}/products`);
        } catch (e) {
            toast.error(
                e.response?.data?.message || 'Couldn’t delete the listing',
            );
        }
    };

    // Same endpoint and field the edit dialog saves, without opening it.
    const setAvailable = async (available) => {
        setSavingAvailable(true);
        try {
            await api.put(`/store/edit/${product._id}`, { available });
            setProduct((prev) => ({ ...prev, available }));
            toast.success(
                available ? 'Marked available' : 'Marked unavailable',
            );
        } catch (e) {
            toast.error(
                e.response?.data?.message ||
                    'Couldn’t change availability. Try again.',
            );
        } finally {
            setSavingAvailable(false);
        }
    };

    if (loading) return <Loader />;

    if (error || !product) {
        return (
            <div className='min-h-full px-4 sm:px-10 pt-8 pb-12'>
                <div className='bg-sheet border border-line rounded-xl'>
                    <EmptyState
                        icon={PackageX}
                        tone='error'
                        title='Listing not found'
                        description={error}
                        action={
                            <Button to={`/${collegeslug}/products`}>
                                Back to store
                            </Button>
                        }
                    />
                </div>
            </div>
        );
    }

    const owner = product.owner || {};
    const phone = product.whatsapp ? String(product.whatsapp) : '';
    const collegeName = currentCollege?.name || 'college';

    const contactRow = (label, value) => (
        <div className='flex items-center gap-2.5 min-h-7 text-[13.5px]'>
            <span className='w-[72px] shrink-0 text-muted'>{label}</span>
            {value || <span className='text-muted'>Not provided</span>}
        </div>
    );

    return (
        <div className='min-h-full px-4 sm:px-10 pt-8 pb-12'>
            <PageHeader
                eyebrow='Store listing'
                badge={
                    <>
                        <StatusBadge status={product.submissionStatus} />
                        {!product.available && (
                            <span className='inline-flex items-center h-[22px] px-2 rounded-full bg-inverse text-on-inverse text-xs font-medium'>
                                Unavailable
                            </span>
                        )}
                        {product.deleted && (
                            <StatusBadge tone='outline'>Deleted</StatusBadge>
                        )}
                    </>
                }
                title={product.name || 'Untitled listing'}
                meta={
                    <p className='text-[13px] text-ink-2'>
                        Listed by{' '}
                        {owner._id ? (
                            <Link
                                to={`/users/${owner._id}`}
                                className='font-medium text-link hover:underline'
                            >
                                @{owner.username || 'student'}
                            </Link>
                        ) : (
                            <span className='font-medium'>
                                @{owner.username || 'unknown'}
                            </span>
                        )}{' '}
                        {relativeTime(product.createdAt)}
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
                            aria-label='Delete listing'
                            onClick={() => setConfirmDelete(true)}
                        />
                    </>
                }
            />

            <div className='grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start'>
                <div className='flex flex-col gap-5 min-w-0'>
                    <section
                        aria-label='Product photo'
                        className='bg-sheet border border-line rounded-xl overflow-hidden'
                    >
                        <ProductImage
                            src={product.image}
                            alt={product.name}
                            fit='contain'
                            className='w-full aspect-[4/3] max-h-[500px]'
                            iconClassName='w-10 h-10'
                        />
                        {product.image && (
                            <div className='flex items-center gap-3 px-4 py-2.5 border-t border-line-soft text-[12.5px] text-muted'>
                                <code className='flex-1 min-w-0 font-mono text-xs truncate'>
                                    {product.image}
                                </code>
                                <a
                                    href={product.image}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    className='inline-flex items-center gap-1 shrink-0 font-medium text-link hover:underline'
                                >
                                    Open full size
                                    <ExternalLink
                                        className='w-3.5 h-3.5'
                                        aria-hidden='true'
                                    />
                                </a>
                            </div>
                        )}
                    </section>

                    <Panel
                        title='Description'
                        titleId='description-title'
                        bodyClassName='px-5 py-4 text-sm leading-relaxed text-ink-2 whitespace-pre-wrap break-words'
                    >
                        {product.description || (
                            <span className='text-muted'>
                                The seller didn’t add a description.
                            </span>
                        )}
                    </Panel>
                </div>

                <div className='flex flex-col gap-4'>
                    <ApprovalActions
                        variant='panel'
                        resourceType='listing'
                        currentStatus={product.submissionStatus}
                        rejectionReason={product.rejectionReason}
                        apiEndpoint={`/store/edit/${product._id}`}
                        onStatusChange={fetchProduct}
                        approveNote={`Lists it in the ${collegeName} store with the price and availability below.`}
                    />

                    <Panel
                        title='Listing'
                        titleId='listing-title'
                        bodyClassName='px-5 py-4 flex flex-col gap-4'
                    >
                        <div className='flex flex-col gap-1'>
                            <span className='text-[13px] text-muted'>
                                Price
                            </span>
                            <Price
                                value={product.price}
                                className='text-[28px] leading-tight text-ink'
                            />
                            <span className='text-xs text-muted'>
                                In rupees, not points. Buyers contact the seller
                                on WhatsApp or Telegram.
                            </span>
                        </div>
                        <Switch
                            checked={Boolean(product.available)}
                            onChange={setAvailable}
                            disabled={savingAvailable}
                            label='Available'
                            description='Turn off when it has been sold'
                        />
                    </Panel>

                    <Panel
                        title='Seller'
                        titleId='seller-title'
                        bodyClassName='px-5 py-4 flex flex-col gap-3'
                    >
                        <div className='flex items-center gap-2.5 min-w-0'>
                            <Avatar name={owner.username} />
                            <div className='flex flex-col gap-0.5 min-w-0'>
                                {owner._id ? (
                                    <Link
                                        to={`/users/${owner._id}`}
                                        className='text-[13.5px] font-medium text-link hover:underline truncate'
                                    >
                                        @{owner.username || 'student'}
                                    </Link>
                                ) : (
                                    <span className='text-[13.5px] font-medium'>
                                        @{owner.username || 'unknown'}
                                    </span>
                                )}
                                {owner.email && (
                                    <span className='text-[12.5px] text-muted truncate'>
                                        {owner.email}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className='flex flex-col gap-1'>
                            {contactRow(
                                'WhatsApp',
                                phone && (
                                    <>
                                        <span className='flex-1 font-mono text-[13px]'>
                                            {showPhone
                                                ? phone
                                                : `•••••• ${phone.slice(-4)}`}
                                        </span>
                                        <Button
                                            variant='link'
                                            size='sm'
                                            aria-label={
                                                showPhone
                                                    ? 'Hide WhatsApp number'
                                                    : 'Show WhatsApp number'
                                            }
                                            onClick={() =>
                                                setShowPhone((v) => !v)
                                            }
                                        >
                                            {showPhone ? 'Hide' : 'Show'}
                                        </Button>
                                    </>
                                ),
                            )}
                            {contactRow(
                                'Telegram',
                                product.telegram && (
                                    <span className='flex-1 min-w-0 font-mono text-[13px] break-all'>
                                        {product.telegram}
                                    </span>
                                ),
                            )}
                        </div>
                    </Panel>

                    <Panel
                        title='Details'
                        titleId='details-title'
                        bodyClassName='px-5 py-4 flex flex-col gap-3'
                    >
                        <MetaList
                            items={[
                                {
                                    label: 'Slug',
                                    value: product.slug,
                                    mono: true,
                                },
                                {
                                    label: 'Views',
                                    value: formatNumber(
                                        product.clickCount ??
                                            product.clickCounts,
                                    ),
                                },
                                {
                                    label: 'Created',
                                    value: formatDateTime(product.createdAt),
                                },
                                {
                                    label: 'Updated',
                                    value: formatDateTime(product.updatedAt),
                                },
                                product.deletedAt && {
                                    label: 'Deleted',
                                    value: formatDateTime(product.deletedAt),
                                },
                                { label: 'ID', value: product._id, mono: true },
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
                                {JSON.stringify(product, null, 2)}
                            </pre>
                        )}
                    </Panel>
                </div>
            </div>

            <ProductEditModal
                isOpen={editing}
                onClose={() => setEditing(false)}
                product={product}
                onSuccess={fetchProduct}
            />

            <ConfirmModal
                isOpen={confirmDelete}
                onClose={() => setConfirmDelete(false)}
                onConfirm={handleDelete}
                title='Delete this listing?'
                message='The listing disappears from the store and buyers can no longer contact the seller through it. This can’t be undone.'
                confirmText='Delete'
                variant='danger'
            />
        </div>
    );
};

export default ProductDetail;
