import { formatNumber } from '../../utils/format';
import { Panel } from '../ui';
import ContentCard from './ContentCard';
import { CONTENT_TYPES } from './analyticsData';

/** How the content added in the range splits across types. */
function ContentDistribution({ totals }) {
    const total = totals?.totalContent || 0;
    const rows = CONTENT_TYPES.map((type) => ({
        label: type.label,
        value: totals?.[type.total] || 0,
    })).sort((a, b) => b.value - a.value);
    const max = rows[0]?.value || 0;

    return (
        <Panel
            title='Content by type'
            titleId='distribution-title'
            action={
                <span className='font-mono text-xs text-muted'>
                    {formatNumber(total)}
                </span>
            }
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

export default ContentDistribution;
