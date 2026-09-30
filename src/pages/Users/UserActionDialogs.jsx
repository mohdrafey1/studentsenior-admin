import React, { useId, useState } from 'react';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import api from '../../utils/api';
import { formatDate, formatNumber } from '../../utils/format';
import {
    Alert,
    Button,
    Dialog,
    Field,
    MetaList,
    Textarea,
} from '../../components/ui';
import { pointsWorth, premiumEndFromNow } from './userDetailHelpers';

const BONUS_PRESETS = [50, 100, 250, 500];
const PREMIUM_DAYS = [7, 30, 90, 180, 365];

const busyButton = (busy) => ({
    icon: busy ? Loader2 : undefined,
    className: busy ? '[&>svg]:animate-spin' : '',
});

/**
 * Give bonus points: pick an amount, then confirm it on a second step that
 * states the amount and the new balance before anything is sent.
 * Mount it only while open so the form starts fresh each time.
 */
export function BonusDialog({ user, onClose, onGiven }) {
    const inputId = useId();
    const errorId = useId();
    const [points, setPoints] = useState('100');
    const [description, setDescription] = useState('');
    const [step, setStep] = useState('form');
    const [busy, setBusy] = useState(false);
    const [touched, setTouched] = useState(false);

    const amount = Number(points);
    const valid = Number.isInteger(amount) && amount > 0;
    const balance = Number(user.wallet?.currentBalance || 0);
    const after = balance + (valid ? amount : 0);
    const handle = `@${user.username}`;

    const submit = async () => {
        setBusy(true);
        try {
            const response = await api.patch(`/user/users/${user._id}/bonus`, {
                points: amount,
                description: description || `Admin bonus of ${amount} points`,
            });
            toast.success(`${formatNumber(amount)} pts given to ${handle}`);
            onGiven(response.data.data.user);
        } catch (error) {
            console.error('Error giving bonus:', error);
            toast.error(
                error.response?.data?.message ||
                    'Couldn’t give the bonus. Try again.',
            );
            setBusy(false);
        }
    };

    if (step === 'confirm') {
        return (
            <Dialog
                open
                onClose={onClose}
                busy={busy}
                role='alertdialog'
                size='sm'
                title={`Give ${formatNumber(amount)} pts to ${handle}?`}
                footer={
                    <>
                        <Button onClick={() => setStep('form')} disabled={busy}>
                            Back
                        </Button>
                        <Button
                            variant='primary'
                            onClick={submit}
                            disabled={busy}
                            {...busyButton(busy)}
                        >
                            {busy
                                ? 'Giving…'
                                : `Give ${formatNumber(amount)} pts`}
                        </Button>
                    </>
                }
            >
                <div className='flex flex-col gap-4'>
                    <MetaList
                        labelWidth={112}
                        items={[
                            {
                                label: 'Amount',
                                value: `${formatNumber(amount)} pts (${pointsWorth(amount)})`,
                            },
                            {
                                label: 'Balance',
                                value: `${formatNumber(balance)} → ${formatNumber(after)} pts`,
                            },
                            {
                                label: 'Description',
                                value:
                                    description ||
                                    `Admin bonus of ${amount} points`,
                            },
                        ]}
                    />
                    <p className='text-[13.5px] leading-relaxed text-ink-2'>
                        The points go into their wallet straight away and are
                        recorded as a bonus transaction. This can’t be undone
                        from the console.
                    </p>
                </div>
            </Dialog>
        );
    }

    return (
        <Dialog
            open
            onClose={onClose}
            title='Give bonus points'
            description={`To ${handle} · current balance ${formatNumber(balance)} pts`}
            footer={
                <>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button
                        type='submit'
                        form='bonus-form'
                        variant='primary'
                        disabled={!valid}
                    >
                        {valid
                            ? `Give ${formatNumber(amount)} pts`
                            : 'Give points'}
                    </Button>
                </>
            }
        >
            <form
                id='bonus-form'
                noValidate
                className='flex flex-col gap-4'
                onSubmit={(event) => {
                    event.preventDefault();
                    setTouched(true);
                    if (valid) setStep('confirm');
                }}
            >
                <div className='flex flex-col gap-2'>
                    <label
                        htmlFor={inputId}
                        className='text-[13px] font-medium text-ink'
                    >
                        Points
                        <span className='text-bad-ink' aria-hidden='true'>
                            {' '}
                            *
                        </span>
                    </label>
                    <div
                        role='group'
                        aria-label='Quick amounts'
                        className='grid grid-cols-4 gap-1.5'
                    >
                        {BONUS_PRESETS.map((n) => {
                            const pressed = amount === n;
                            return (
                                <button
                                    key={n}
                                    type='button'
                                    aria-pressed={pressed}
                                    onClick={() => setPoints(String(n))}
                                    className={`h-9 rounded-lg border font-mono text-[13px] cursor-pointer transition-colors ${
                                        pressed
                                            ? 'border-brand bg-brand-soft text-brand-ink'
                                            : 'border-line-strong bg-sheet text-ink-2 hover:bg-sunken'
                                    }`}
                                >
                                    {n}
                                </button>
                            );
                        })}
                    </div>
                    <div className='flex items-stretch h-10 rounded-lg border border-line-strong bg-sheet overflow-hidden focus-within:ring-2 focus-within:ring-brand/30'>
                        <input
                            id={inputId}
                            type='number'
                            min='1'
                            step='1'
                            inputMode='numeric'
                            value={points}
                            onChange={(e) => setPoints(e.target.value)}
                            onBlur={() => setTouched(true)}
                            aria-invalid={touched && !valid}
                            aria-describedby={
                                touched && !valid ? errorId : undefined
                            }
                            className='flex-1 min-w-0 px-3 bg-transparent font-mono text-[15px] text-ink outline-none'
                        />
                        <span className='flex items-center px-3 bg-sunken border-l border-line text-[13px] text-ink-2 whitespace-nowrap'>
                            pts = {valid ? pointsWorth(amount) : '₹0'}
                        </span>
                    </div>
                    {touched && !valid && (
                        <p id={errorId} className='text-[12.5px] text-bad-ink'>
                            Enter a whole number of points above 0.
                        </p>
                    )}
                </div>

                <Field
                    label={
                        <>
                            Description{' '}
                            <span className='font-normal text-muted'>
                                (optional)
                            </span>
                        </>
                    }
                >
                    <Textarea
                        rows={2}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder='e.g. Top uploader for September'
                    />
                </Field>

                <div className='flex items-center gap-2.5 px-3.5 py-3 rounded-[10px] bg-sunken text-[13px] text-ink-2'>
                    <span className='flex-1'>New balance</span>
                    <span className='font-mono text-sm font-medium text-ink'>
                        {formatNumber(after)} pts
                    </span>
                </div>
            </form>
        </Dialog>
    );
}

/**
 * Grant free premium. The API starts the grant today, so the new end date is
 * counted from now and replaces any end date the student already has.
 */
export function PremiumDialog({ user, onClose, onGranted }) {
    const [days, setDays] = useState(30);
    const [reason, setReason] = useState('');
    const [step, setStep] = useState('form');
    const [busy, setBusy] = useState(false);

    const handle = `@${user.username}`;
    const newEnd = premiumEndFromNow(days);
    const currentEnd =
        user.isPremium && user.premiumExpiryDate
            ? new Date(user.premiumExpiryDate)
            : null;
    const activeNow = currentEnd && currentEnd > new Date();
    const shortens = activeNow && currentEnd > newEnd;

    const submit = async () => {
        setBusy(true);
        try {
            const response = await api.post(
                `/user/users/${user._id}/grant-subscription`,
                {
                    durationDays: days,
                    reason:
                        reason ||
                        `Admin granted ${days} days free subscription`,
                },
            );
            toast.success(`Premium granted for ${days} days`);
            onGranted(response.data.data.user);
        } catch (error) {
            console.error('Error granting subscription:', error);
            toast.error(
                error.response?.data?.message ||
                    'Couldn’t grant premium. Try again.',
            );
            setBusy(false);
        }
    };

    if (step === 'confirm') {
        return (
            <Dialog
                open
                onClose={onClose}
                busy={busy}
                role='alertdialog'
                size='sm'
                title={`Grant ${days} days of premium to ${handle}?`}
                footer={
                    <>
                        <Button onClick={() => setStep('form')} disabled={busy}>
                            Back
                        </Button>
                        <Button
                            variant='primary'
                            onClick={submit}
                            disabled={busy}
                            {...busyButton(busy)}
                        >
                            {busy ? 'Granting…' : `Grant ${days} days`}
                        </Button>
                    </>
                }
            >
                <p className='text-[13.5px] leading-relaxed text-ink-2'>
                    Premium starts now and ends on{' '}
                    <span className='font-medium text-ink'>
                        {formatDate(newEnd)}
                    </span>
                    .{' '}
                    {activeNow &&
                        `This replaces their current end date, ${formatDate(currentEnd)}. `}
                    They aren’t charged.
                </p>
            </Dialog>
        );
    }

    return (
        <Dialog
            open
            onClose={onClose}
            title='Grant premium'
            description={`For ${handle} · ${
                activeNow
                    ? `premium until ${formatDate(currentEnd)}`
                    : 'not premium now'
            }`}
            footer={
                <>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button type='submit' form='premium-form' variant='primary'>
                        Grant {days} days
                    </Button>
                </>
            }
        >
            <form
                id='premium-form'
                className='flex flex-col gap-4'
                onSubmit={(event) => {
                    event.preventDefault();
                    setStep('confirm');
                }}
            >
                <fieldset className='flex flex-col gap-2'>
                    <legend className='pb-2 text-[13px] font-medium text-ink'>
                        Free for
                    </legend>
                    <div className='grid grid-cols-5 gap-1.5'>
                        {PREMIUM_DAYS.map((n) => (
                            <label key={n} className='relative'>
                                <input
                                    type='radio'
                                    name='premium-days'
                                    value={n}
                                    checked={days === n}
                                    onChange={() => setDays(n)}
                                    className='peer sr-only'
                                />
                                <span className='flex flex-col items-center justify-center gap-0.5 h-[52px] rounded-[9px] border border-line-strong bg-sheet text-ink-2 cursor-pointer transition-colors hover:bg-sunken peer-checked:border-brand peer-checked:bg-brand-soft peer-checked:text-brand-ink peer-focus-visible:ring-2 peer-focus-visible:ring-brand/40'>
                                    <span className='font-mono text-[15px] font-medium'>
                                        {n}
                                    </span>
                                    <span className='text-[11.5px]'>days</span>
                                </span>
                            </label>
                        ))}
                    </div>
                </fieldset>

                <Field
                    label={
                        <>
                            Reason{' '}
                            <span className='font-normal text-muted'>
                                (optional)
                            </span>
                        </>
                    }
                >
                    <Textarea
                        rows={2}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder='e.g. Compensation for the payment issue on 29 Sep'
                    />
                </Field>

                <div className='flex items-center gap-2.5 px-3.5 py-3 rounded-[10px] bg-sunken text-[13px] text-ink-2'>
                    <span className='flex-1'>Premium ends</span>
                    <span className='font-medium text-ink'>
                        {formatDate(newEnd)}
                    </span>
                </div>

                {shortens && (
                    <Alert tone='warn'>
                        Their premium currently runs until{' '}
                        {formatDate(currentEnd)}. Granting {days} days moves the
                        end date earlier, because the grant starts today.
                    </Alert>
                )}
            </form>
        </Dialog>
    );
}
