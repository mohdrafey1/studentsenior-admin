import { formatDateTime } from '../../utils/format';
import { relativeTime } from '../../utils/relativeTime';
import { Panel } from '../ui';

/** The latest uploads across PYQs, notes, products, groups and opportunities. */
function RecentActivity({ recentActivity }) {
    const items = (recentActivity || []).slice(0, 7);

    return (
        <Panel title='Recent activity' titleId='activity-title'>
            {items.length === 0 ? (
                <p className='px-5 py-10 text-center text-[13.5px] text-muted'>
                    New uploads from students appear here.
                </p>
            ) : (
                <ul className='px-5 py-1'>
                    {items.map((activity) => (
                        <li
                            key={activity.id}
                            className='flex gap-3 py-2.5 border-b border-line-soft last:border-b-0'
                        >
                            <span
                                aria-hidden='true'
                                className='w-2 h-2 mt-1.5 rounded-full shrink-0 bg-neutral'
                            />
                            <div className='flex-1 min-w-0 flex flex-col gap-0.5'>
                                <span className='text-[13px] leading-snug text-ink'>
                                    {activity.action}
                                    {activity.user &&
                                        activity.user !== 'Unknown' && (
                                            <span className='text-ink-2'>
                                                {' '}
                                                by @{activity.user}
                                            </span>
                                        )}
                                </span>
                                <span className='text-xs text-muted'>
                                    {activity.type} ·{' '}
                                    <time
                                        dateTime={activity.timestamp}
                                        title={formatDateTime(
                                            activity.timestamp,
                                        )}
                                    >
                                        {relativeTime(activity.timestamp)}
                                    </time>
                                </span>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </Panel>
    );
}

export default RecentActivity;
