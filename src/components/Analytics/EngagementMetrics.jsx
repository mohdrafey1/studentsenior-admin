import { formatNumber } from '../../utils/format';
import { Panel } from '../ui';
import ContentCard from './ContentCard';
import { CONTENT_TYPES } from './analyticsData';

/** All-time views per content type, from the items' view counters. */
function EngagementMetrics({ engagement }) {
    if (!engagement || Object.keys(engagement).length === 0) return null;

    const rows = CONTENT_TYPES.filter((type) => engagement[type.series])
        .map((type) => ({
            label: type.label,
            value: engagement[type.series].totalViews || 0,
        }))
        .sort((a, b) => b.value - a.value);
    const max = rows[0]?.value || 0;
    const total = rows.reduce((sum, row) => sum + row.value, 0);

    return (
        <Panel
            title='Views by type'
            titleId='views-title'
            action={<span className='text-[12.5px] text-muted'>All time</span>}
            bodyClassName='px-5 py-4'
        >
            <ul className='flex flex-col gap-3'>
                {rows.map((row) => (
                    <ContentCard
                        key={row.label}
                        label={row.label}
                        value={formatNumber(row.value)}
                        share={
                            total
                                ? `${Math.round((row.value / total) * 100)}%`
                                : '—'
                        }
                        pct={max ? (row.value / max) * 100 : 0}
                    />
                ))}
            </ul>
        </Panel>
    );
}

export default EngagementMetrics;
