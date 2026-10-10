import { useState } from 'react';
import { Bell, BellRing, Loader2 } from 'lucide-react';
import { useAlertReach, useAlertStatus } from '../../hooks/useContentAlerts';
import {
    alertKey,
    alertStatusText,
    canNotify,
    reachSummary,
} from '../../utils/contentAlerts';
import { Button } from '../ui';
import { sendContentAlerts } from './sendAlerts';

/**
 * For an approved PYQ, note or quick note: whether its branch followers were
 * told ("Students notified · 23 · 29 Sep, 18:42"), with a "Notify students"
 * button while they haven't been. Bump `revision` after sending elsewhere.
 */
export default function AlertStatus({ item, revision = 0, className = '' }) {
    const [sending, setSending] = useState(false);
    const items = item?.id ? [item] : [];
    const status = useAlertStatus(items, { revision });
    const record = item?.id ? status.data[alertKey(item)] : undefined;
    const open = !status.loading && !status.error && canNotify(record);
    const reach = useAlertReach(items, { enabled: open });
    const reachLabel = reachSummary(reach.data, reach).label;
    const sent = record?.status === 'sent';

    const notify = async () => {
        setSending(true);
        await sendContentAlerts(items, { onSettled: status.refresh });
        setSending(false);
    };

    if (!item?.id) return null;
    const Icon = sent ? BellRing : Bell;
    return (
        <div
            className={`flex flex-wrap items-center gap-x-3 gap-y-2 ${className}`}
        >
            <span
                className={`flex-1 min-w-[160px] flex items-center gap-2 text-[13px] ${
                    sent ? 'text-ok-ink' : 'text-ink-2'
                }`}
            >
                <Icon className='w-4 h-4 shrink-0' aria-hidden='true' />
                <span aria-live='polite'>
                    {status.loading && !record
                        ? 'Checking alerts…'
                        : status.error
                          ? 'Couldn’t check whether students were notified'
                          : alertStatusText(record)}
                </span>
            </span>
            {status.error ? (
                <Button size='sm' variant='ghost' onClick={status.refresh}>
                    Try again
                </Button>
            ) : (
                open && (
                    <Button
                        size='sm'
                        icon={sending ? Loader2 : BellRing}
                        className={sending ? '[&>svg]:animate-spin' : ''}
                        disabled={sending || reach.data?.students === 0}
                        title={
                            reach.data?.students === 0
                                ? 'No students follow this branch with alerts on yet'
                                : undefined
                        }
                        onClick={notify}
                    >
                        {sending
                            ? 'Notifying…'
                            : reachLabel === 'No students to notify'
                              ? 'No followers yet'
                              : reachLabel}
                    </Button>
                )
            )}
        </div>
    );
}
