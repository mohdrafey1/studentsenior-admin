import { Link, useLocation } from 'react-router-dom';
import { Download } from 'lucide-react';
import { Button, Table, Td, Th, Tr } from '../../ui';
import { downloadCsv } from '../../../utils/csv';
import { analyticsLink, contentTitle, number, typeLabel } from './data';
import { contentCsvColumns } from './contentCsv';

export default function ContentTable({ rows = [], realtime = false }) {
    const { search, pathname } = useLocation();
    return (
        <>
            {!realtime && (
                <div className='px-5 py-3 flex justify-end'>
                    <Button
                        size='sm'
                        icon={Download}
                        disabled={!rows.length}
                        onClick={() =>
                            downloadCsv(
                                'analytics-top-content',
                                contentCsvColumns,
                                rows,
                            )
                        }
                    >
                        Export CSV
                    </Button>
                </div>
            )}
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
                                    className='text-link underline-offset-2 hover:underline text-sm'
                                    to={analyticsLink(
                                        `/analytics/open/${row._id.type}/${row._id.id}`,
                                        search,
                                        pathname,
                                    )}
                                >
                                    {contentTitle(row)}
                                </Link>
                            </Td>
                            <Td>{typeLabel(row._id.type)}</Td>
                            <Td align='right' mono>
                                {number(realtime ? row.events : row.views)}
                            </Td>
                            {!realtime &&
                                [
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
                        </Tr>
                    ))}
                </tbody>
            </Table>
        </>
    );
}
