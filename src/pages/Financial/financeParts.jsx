import { Link } from 'react-router-dom';
import { Copy } from 'lucide-react';
import { Avatar, Button } from '../../components/ui';
import { formatNumber, formatShortDate } from '../../utils/format';
import { copyText, formatRupees, timeOf, userName } from './financeFormat';

/** Rupees for a serif Stat value; the ₹ sign is set in the sans face. */
export function RupeeValue({ amount }) {
    const text = formatRupees(amount);
    return (
        <>
            {text.startsWith('−') && '−'}
            <span className='font-sans font-semibold'>₹</span>
            {text.replace(/^−?₹/, '')}
        </>
    );
}

/** Points for a serif Stat value, with a small "pts" unit. */
export function PointsValue({ points, signed = false }) {
    const n = Number(points || 0);
    const sign = signed && n > 0 ? '+' : n < 0 ? '−' : '';
    return (
        <>
            {sign}
            {formatNumber(Math.abs(n))}{' '}
            <span className='font-sans text-sm font-medium text-muted'>
                pts
            </span>
        </>
    );
}

/** Avatar, username (linked to the user page) and email. */
export function UserCell({ user, sub, size = 'sm', stopPropagation = true }) {
    const name = userName(user);
    const secondary = sub ?? (user?.username ? user?.email : null);
    return (
        <div className='flex items-center gap-2.5 min-w-0'>
            <Avatar name={name} src={user?.profilePicture} size={size} />
            <div className='min-w-0 flex flex-col gap-0.5'>
                {user?._id ? (
                    <Link
                        to={`/users/${user._id}`}
                        onClick={
                            stopPropagation
                                ? (event) => event.stopPropagation()
                                : undefined
                        }
                        className='font-medium text-ink hover:underline truncate'
                    >
                        {name}
                    </Link>
                ) : (
                    <span className='font-medium text-ink truncate'>
                        {name}
                    </span>
                )}
                {secondary && (
                    <span className='text-[12.5px] text-muted truncate'>
                        {secondary}
                    </span>
                )}
            </div>
        </div>
    );
}

/** Small icon button that copies a value to the clipboard. */
export function CopyButton({ value, what, label }) {
    return (
        <Button
            variant='ghost'
            size='sm'
            iconOnly
            icon={Copy}
            aria-label={label || `Copy ${what.toLowerCase()}`}
            title={label || `Copy ${what.toLowerCase()}`}
            onClick={(event) => {
                event.stopPropagation();
                copyText(value, what);
            }}
        />
    );
}

/** Short date on one line and the time underneath, for table cells. */
export function DateCell({ value }) {
    return (
        <div className='flex flex-col gap-0.5 whitespace-nowrap'>
            <span>{formatShortDate(value)}</span>
            {timeOf(value) && (
                <span className='text-xs text-muted'>{timeOf(value)}</span>
            )}
        </div>
    );
}

/** Text for a serif heading with any ₹ sign set in the sans face. */
export function SerifSafe({ text }) {
    const parts = String(text).split('₹');
    return parts.map((part, index) => (
        <span key={index}>
            {index > 0 && <span className='font-sans font-semibold'>₹</span>}
            {part}
        </span>
    ));
}
