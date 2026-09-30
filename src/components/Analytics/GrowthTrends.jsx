import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { formatNumber } from '../../utils/format';
import { Panel, Table, Td, Th, Tr } from '../ui';
import { CONTENT_TYPES, percentChange } from './analyticsData';

function Change({ current, previous }) {
    if (!previous) {
        return current > 0 ? (
            <span className='text-ink-2'>New</span>
        ) : (
            <span className='text-muted'>—</span>
        );
    }
    const pct = percentChange(current, previous);
    if (pct === 0) return <span className='text-ink-2'>No change</span>;
    const Arrow = pct > 0 ? ArrowUpRight : ArrowDownRight;
    return (
        <span
            className={`inline-flex items-center gap-0.5 font-medium ${
                pct > 0 ? 'text-ok-ink' : 'text-bad-ink'
            }`}
        >
            <Arrow className='w-3.5 h-3.5' aria-hidden='true' />
            {pct > 0 ? '+' : '−'}
            {Math.abs(pct)}%
        </span>
    );
}

/** New items per type in the last 7 days against the 7 days before. */
function GrowthTrends({ percentageChanges }) {
    if (!percentageChanges || Object.keys(percentageChanges).length === 0) {
        return null;
    }

    const rows = CONTENT_TYPES.filter((type) => percentageChanges[type.change])
        .map((type) => ({
            label: type.label,
            ...percentageChanges[type.change],
        }))
        .sort((a, b) => b.current - a.current);

    return (
        <Panel
            title='Week on week'
            titleId='weekly-title'
            action={
                <span className='text-[12.5px] text-muted'>
                    Items added, by type
                </span>
            }
        >
            <Table minWidth={340}>
                <thead>
                    <tr>
                        <Th>Type</Th>
                        <Th align='right'>This week</Th>
                        <Th align='right'>Week before</Th>
                        <Th align='right'>Change</Th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <Tr key={row.label}>
                            <Td>{row.label}</Td>
                            <Td align='right' mono>
                                {formatNumber(row.current)}
                            </Td>
                            <Td align='right' mono className='text-ink-2'>
                                {formatNumber(row.previous)}
                            </Td>
                            <Td
                                align='right'
                                className='text-[13px] whitespace-nowrap'
                            >
                                <Change
                                    current={row.current}
                                    previous={row.previous}
                                />
                            </Td>
                        </Tr>
                    ))}
                </tbody>
            </Table>
        </Panel>
    );
}

export default GrowthTrends;
