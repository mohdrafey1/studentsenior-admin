import useAnalyticsQuery from '../../../hooks/useAnalyticsQuery';
import { Button } from '../../ui';
import { CHART_COLORS, CONTENT_TYPES, number } from './data';
import QueryPanel from './QueryPanel';

function TypeRow({ type, index, params, total }) {
    const query = useAnalyticsQuery('/analytics/v2/content', {
        ...params,
        type: type.value,
    });
    const views = query.data?.current?.views || 0;
    return (
        <li className='space-y-1.5'>
            <div className='flex justify-between gap-3 text-sm'>
                <span className='text-ink-2'>{type.label}</span>
                {query.error ? (
                    <Button
                        size='sm'
                        onClick={query.refresh}
                        aria-label={`Retry ${type.label}`}
                    >
                        Retry
                    </Button>
                ) : (
                    <span className='font-mono'>
                        {query.loading ? '…' : number(views)}
                    </span>
                )}
            </div>
            {query.error && (
                <p role='alert' className='text-xs text-bad-ink'>
                    {query.error}
                </p>
            )}
            <div
                className='h-1.5 bg-line-soft rounded-full overflow-hidden'
                aria-hidden='true'
            >
                <div
                    className='h-full rounded-full'
                    style={{
                        background: CHART_COLORS[index % 6],
                        width: `${total ? (views / total) * 100 : 0}%`,
                    }}
                />
            </div>
        </li>
    );
}

export default function ContentTypeBreakdown({ params, overview }) {
    const total = overview.data?.current?.views || 0;
    return (
        <QueryPanel
            title='Views by content type'
            query={overview}
            empty={!total}
        >
            {total > 0 && (
                <ul className='grid sm:grid-cols-2 gap-x-6 gap-y-4 p-5'>
                    {CONTENT_TYPES.map((type, index) => (
                        <TypeRow
                            key={type.value}
                            {...{ type, index, params, total }}
                        />
                    ))}
                </ul>
            )}
        </QueryPanel>
    );
}
