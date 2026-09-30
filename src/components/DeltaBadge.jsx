import { relativeTime } from '../utils/relativeTime';

/**
 * "+18 new" chip: how much a count changed since the admin last looked.
 * Hidden when there is no earlier visit to compare with.
 */
const DeltaBadge = ({ value, lastViewedAt }) => {
    if (!lastViewedAt || value === undefined || value === null || value === 0) {
        return null;
    }

    const positive = value > 0;

    return (
        <span
            className={`inline-flex items-center font-mono text-xs px-1.5 py-0.5 rounded-[5px] ${
                positive
                    ? 'bg-brand-soft text-brand-ink'
                    : 'bg-neutral-soft text-neutral-ink'
            }`}
            title={`Since your last visit (${relativeTime(lastViewedAt)})`}
        >
            {positive
                ? `+${value.toLocaleString('en-IN')} new`
                : `${value.toLocaleString('en-IN')} fewer`}
        </span>
    );
};

export default DeltaBadge;
