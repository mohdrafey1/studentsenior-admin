import { Link } from 'react-router-dom';
import { Table, Td, Th, Tr } from '../../ui';
import { number, typeLabel } from './data';

export default function ContentTable({ rows = [], realtime = false }) {
    return (
        <Table minWidth={realtime ? 460 : 820}>
            <thead>
                <tr>
                    <Th>Content</Th>
                    <Th>Type</Th>
                    <Th align='right'>{realtime ? 'Events' : 'Views'}</Th>
                    {!realtime && (
                        <>
                            <Th align='right'>Downloads</Th>
                            <Th align='right'>Unlocks</Th>
                            <Th align='right'>7 days</Th>
                            <Th align='right'>30 days</Th>
                            <Th align='right'>Since launch</Th>
                        </>
                    )}
                </tr>
            </thead>
            <tbody>
                {rows.map((row) => (
                    <Tr key={`${row._id.type}:${row._id.id}`}>
                        <Td>
                            <Link
                                className='text-link underline-offset-2 hover:underline font-mono text-xs'
                                to={`/analytics/open/${row._id.type}/${row._id.id}`}
                            >
                                {row._id.id}
                            </Link>
                        </Td>
                        <Td>{typeLabel(row._id.type)}</Td>
                        <Td align='right' mono>
                            {number(realtime ? row.events : row.views)}
                        </Td>
                        {!realtime && (
                            <>
                                {[
                                    'downloads',
                                    'unlocks',
                                    'views7d',
                                    'views30d',
                                    'allTime',
                                ].map((key) => (
                                    <Td key={key} align='right' mono>
                                        {number(row[key])}
                                    </Td>
                                ))}
                            </>
                        )}
                    </Tr>
                ))}
            </tbody>
        </Table>
    );
}
