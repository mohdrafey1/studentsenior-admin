import { formatNumber } from '../../utils/format';
import { alertItems } from '../../utils/contentAlerts';
import NotifySwitch from './NotifySwitch';

/**
 * One page-level "Notify students" switch for a review list. Row and bulk
 * approvals both follow it; the reach shown is for the current selection.
 */
export default function ListNotifySwitch({
    type,
    noun,
    selectedIds = [],
    checked,
    onChange,
    disabled = false,
}) {
    const items = alertItems(type, selectedIds);
    return (
        <div className='px-4 py-3 mb-4 bg-sheet border border-line rounded-xl'>
            <NotifySwitch
                items={items}
                checked={checked}
                onChange={onChange}
                disabled={disabled}
                delay={400}
                scope={`${formatNumber(items.length)} selected`}
                idleDescription={`Applies when you approve ${noun} here: followers of each branch get one alert per branch and semester. Select ${noun} to see who they reach.`}
            />
        </div>
    );
}
