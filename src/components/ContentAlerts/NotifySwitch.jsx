import { useAlertReach } from '../../hooks/useContentAlerts';
import { reachSummary } from '../../utils/contentAlerts';
import { Switch } from '../ui';

/**
 * "Notify students" switch with the reach of `items` (nothing is sent from
 * here). With no items it shows `idleDescription` instead of a count;
 * `scope` (e.g. "4 selected") prefixes the reach description.
 */
export default function NotifySwitch({
    items = [],
    checked,
    onChange,
    delay = 0,
    idleDescription = '',
    scope = '',
    disabled = false,
    className = '',
}) {
    const reach = useAlertReach(items, { delay });
    const summary = items.length
        ? reachSummary(reach.data, reach)
        : { label: 'Notify students', description: idleDescription };
    if (scope && items.length && summary.description)
        summary.description = `${scope}: ${summary.description}`;
    return (
        <div aria-live='polite' className={className}>
            <Switch
                checked={checked}
                onChange={onChange}
                disabled={disabled}
                label={summary.label}
                description={
                    checked
                        ? summary.description
                        : 'Off: students won’t get an alert.'
                }
            />
        </div>
    );
}
