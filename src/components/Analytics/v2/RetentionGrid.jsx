import { Table, Td, Th, Tr } from '../../ui';
import { number, shiftDay } from './data';

export default function RetentionGrid({ rows, endDay }) {
    const cohorts = [...new Set(rows.map((row) => row._id.cohort))].sort();
    const maxWeek = Math.max(0, ...rows.map((row) => row._id.week));
    const weeks = Array.from({ length: maxWeek + 1 }, (_, index) => index);
    const lookup = new Map(
        rows.map((row) => [`${row._id.cohort}:${row._id.week}`, row.users]),
    );
    return (
        <Table minWidth={Math.max(520, 190 + weeks.length * 78)}>
            <thead>
                <tr>
                    <Th>Cohort week</Th>
                    <Th align='right'>Actors</Th>
                    {weeks.map((week) => (
                        <Th key={week} align='center'>
                            W{week}
                        </Th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {cohorts.map((cohort) => {
                    const base = lookup.get(`${cohort}:0`) || 0;
                    return (
                        <Tr key={cohort}>
                            <Td mono>{cohort}</Td>
                            <Td align='right' mono>
                                {number(base)}
                            </Td>
                            {weeks.map((week) => {
                                const count =
                                    lookup.get(`${cohort}:${week}`) || 0;
                                const percent = base ? (count / base) * 100 : 0;
                                // Cohort membership spans seven calendar days; the newest actor
                                // needs its full elapsed interval before a cell is final.
                                const future =
                                    shiftDay(cohort, week * 7) > endDay;
                                const provisional =
                                    shiftDay(cohort, 12 + week * 7) > endDay;
                                return (
                                    <Td
                                        key={week}
                                        align='center'
                                        className='!p-1'
                                    >
                                        <span
                                            className='block rounded py-2 px-2 text-xs font-mono text-ink'
                                            style={
                                                !future
                                                    ? {
                                                          background: `color-mix(in srgb, var(--ss-chart-1) ${Math.round(percent * 0.4)}%, var(--ss-sheet))`,
                                                      }
                                                    : undefined
                                            }
                                            title={
                                                future
                                                    ? 'Interval has not started'
                                                    : `${count} of ${base} actors${provisional ? ' · incomplete interval' : ''}`
                                            }
                                        >
                                            {future
                                                ? '—'
                                                : `${Math.round(percent)}%${provisional ? '*' : ''}`}
                                        </span>
                                    </Td>
                                );
                            })}
                        </Tr>
                    );
                })}
            </tbody>
        </Table>
    );
}
