import { Activity } from 'lucide-react';
import { Button, EmptyState, Panel, SkeletonRows } from '../../ui';

export default function QueryPanel({
    title,
    query,
    empty = false,
    children,
    note,
    action,
    className = '',
}) {
    return (
        <Panel title={title} action={action} className={className}>
            {query.loading && !query.data ? (
                <SkeletonRows rows={4} />
            ) : query.error ? (
                <EmptyState
                    tone='error'
                    title='Could not load analytics'
                    description={query.error}
                    action={<Button onClick={query.refresh}>Try again</Button>}
                />
            ) : empty ? (
                <EmptyState
                    icon={Activity}
                    title='Analytics has no data yet for this range.'
                    description='Try another period or check back after new activity is recorded.'
                />
            ) : (
                children
            )}
            {note && !query.error && (
                <p className='px-5 py-3 text-xs text-muted border-t border-line-soft'>
                    {note}
                </p>
            )}
        </Panel>
    );
}
