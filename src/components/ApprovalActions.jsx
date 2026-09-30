import React, { useState } from 'react';
import { Check, Clock, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import ConfirmModal from './ConfirmModal';
import RejectDialog from './RejectDialog';
import ReasonPicker from './ReasonPicker';
import { reasonError as checkReason } from './reviewReasons';
import { Button, StatusBadge } from './ui';

/**
 * Approve or reject a student upload.
 *
 * variant='bar'   — amber band across the page, only while pending.
 * variant='panel' — the "Review" card for the side column of review pages.
 *                   Shows the decision controls while pending, and the
 *                   current decision (with "Change decision") otherwise.
 */
const ApprovalActions = ({
    resourceType,
    currentStatus,
    rejectionReason: currentReason,
    apiEndpoint,
    onStatusChange,
    variant = 'bar',
    approveNote,
}) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [rejectOpen, setRejectOpen] = useState(false);

    // Panel state
    const [decision, setDecision] = useState('approve');
    const [reason, setReason] = useState('');
    const [reasonError, setReasonError] = useState('');
    const [reopened, setReopened] = useState(false);

    // Pages pass names like 'PYQ', 'note' or 'Opportunity'. Mid-sentence we
    // lower-case them (keeping acronyms); toasts start with a capital.
    const noun =
        resourceType === resourceType.toUpperCase()
            ? resourceType
            : resourceType.toLowerCase();
    const label = noun.charAt(0).toUpperCase() + noun.slice(1);

    const setStatus = async (submissionStatus, rejectionReason = '') => {
        setIsProcessing(true);
        try {
            await api.put(apiEndpoint, { submissionStatus, rejectionReason });
            toast.success(
                submissionStatus === 'approved'
                    ? `${label} approved`
                    : `${label} rejected`,
            );
            setReopened(false);
            setReason('');
            onStatusChange && onStatusChange(submissionStatus);
            return true;
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                    `Couldn’t update the ${noun}. Try again.`,
            );
            return false;
        } finally {
            setIsProcessing(false);
        }
    };

    const status = currentStatus || 'pending';

    if (variant === 'panel') {
        const deciding = status === 'pending' || reopened;
        const submit = () => {
            if (decision === 'reject') {
                const problem = checkReason(reason);
                if (problem) {
                    setReasonError(problem);
                    return;
                }
                setStatus('rejected', reason.trim());
            } else {
                setStatus('approved');
            }
        };

        const choice = (value, label, Icon, on) => (
            <button
                type='button'
                role='radio'
                aria-checked={decision === value}
                onClick={() => {
                    setDecision(value);
                    setReasonError('');
                }}
                disabled={isProcessing}
                className={`flex items-center justify-center gap-2 h-10 rounded-[9px] border text-[13.5px] font-medium cursor-pointer transition-colors ${
                    decision === value
                        ? on
                        : 'border-line-strong bg-sheet text-ink-2 hover:text-ink'
                }`}
            >
                <Icon className='w-4 h-4' aria-hidden='true' />
                {label}
            </button>
        );

        return (
            <section
                aria-labelledby='review-title'
                className='bg-sheet border border-line rounded-xl p-5 flex flex-col gap-3.5'
            >
                <div className='flex items-center gap-2'>
                    <h2
                        id='review-title'
                        className='flex-1 text-[15px] font-semibold text-ink'
                    >
                        Review
                    </h2>
                    <StatusBadge status={status} />
                </div>

                {!deciding ? (
                    <>
                        {status === 'rejected' && currentReason && (
                            <p className='px-3 py-2.5 rounded-lg bg-bad-soft text-[13px] leading-relaxed text-bad-ink'>
                                {currentReason}
                            </p>
                        )}
                        <p className='text-[13px] text-ink-2'>
                            {status === 'approved'
                                ? `Students can see this ${noun}.`
                                : `Students can’t see this ${noun}.`}
                        </p>
                        <Button
                            onClick={() => {
                                setDecision(
                                    status === 'approved'
                                        ? 'reject'
                                        : 'approve',
                                );
                                setReopened(true);
                            }}
                        >
                            Change decision
                        </Button>
                    </>
                ) : (
                    <>
                        <div
                            role='radiogroup'
                            aria-label='Decision'
                            className='grid grid-cols-2 gap-2'
                        >
                            {choice(
                                'approve',
                                'Approve',
                                Check,
                                'border-ok bg-ok-soft text-ok-ink',
                            )}
                            {choice(
                                'reject',
                                'Reject',
                                X,
                                'border-bad bg-bad-soft text-bad-ink',
                            )}
                        </div>
                        {decision === 'reject' ? (
                            <ReasonPicker
                                value={reason}
                                onChange={(text) => {
                                    setReason(text);
                                    setReasonError('');
                                }}
                                error={reasonError}
                                disabled={isProcessing}
                            />
                        ) : (
                            <p className='text-[13px] leading-relaxed text-ink-2'>
                                {approveNote ||
                                    `Approving makes this ${noun} visible to every student.`}
                            </p>
                        )}
                        <Button
                            variant='dark'
                            size='lg'
                            onClick={submit}
                            disabled={isProcessing}
                            icon={isProcessing ? Loader2 : undefined}
                            className={
                                isProcessing ? '[&>svg]:animate-spin' : ''
                            }
                        >
                            {isProcessing
                                ? 'Saving…'
                                : decision === 'reject'
                                  ? 'Reject with reason'
                                  : `Approve ${noun}`}
                        </Button>
                        {reopened && (
                            <Button
                                variant='ghost'
                                size='sm'
                                onClick={() => setReopened(false)}
                            >
                                Keep current decision
                            </Button>
                        )}
                    </>
                )}
            </section>
        );
    }

    // Bar: only while pending.
    if (status !== 'pending') return null;

    return (
        <>
            <div className='flex flex-wrap items-center gap-3 px-4 py-3 mb-5 rounded-xl bg-warn-soft text-warn-ink'>
                <Clock className='w-4 h-4 shrink-0' aria-hidden='true' />
                <p className='flex-1 min-w-[200px] text-[13.5px]'>
                    <span className='font-semibold'>Waiting for review.</span>{' '}
                    Approving makes this {noun} visible to all students.
                </p>
                <div className='flex items-center gap-2'>
                    <Button
                        variant='danger'
                        icon={X}
                        onClick={() => setRejectOpen(true)}
                        disabled={isProcessing}
                    >
                        Reject
                    </Button>
                    <Button
                        variant='primary'
                        icon={isProcessing ? Loader2 : Check}
                        onClick={() => setConfirmOpen(true)}
                        disabled={isProcessing}
                        className={isProcessing ? '[&>svg]:animate-spin' : ''}
                    >
                        Approve
                    </Button>
                </div>
            </div>

            <ConfirmModal
                isOpen={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={() => {
                    setConfirmOpen(false);
                    setStatus('approved');
                }}
                title={`Approve this ${noun}?`}
                message='It will become visible to all students.'
                variant='success'
                confirmText='Approve'
            />

            <RejectDialog
                open={rejectOpen}
                onClose={() => setRejectOpen(false)}
                title={`Reject this ${noun}?`}
                onSubmit={async (text) => {
                    if (await setStatus('rejected', text)) setRejectOpen(false);
                }}
            />
        </>
    );
};

export default ApprovalActions;
