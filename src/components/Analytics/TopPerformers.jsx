import { formatNumber } from '../../utils/format';
import { Panel, Table, Td, Th, Tr } from '../ui';

/**
 * Most-viewed items. The API sends the top five of each type, identified by
 * slug, so they're merged and ranked here.
 */
function TopPerformers({ topPerformers }) {
    const rows = [...(topPerformers || [])]
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 8);

    return (
        <Panel
            title='Most viewed'
            titleId='top-title'
            action={<span className='text-[12.5px] text-muted'>All time</span>}
        >
            {rows.length === 0 ? (
                <p className='px-5 py-10 text-center text-[13.5px] text-muted'>
                    Items with the most views appear here.
                </p>
            ) : (
                <Table minWidth={460}>
                    <thead>
                        <tr>
                            <Th className='w-10'>#</Th>
                            <Th>Item</Th>
                            <Th>Type</Th>
                            <Th align='right'>Views</Th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((item, index) => (
                            <Tr key={item.id || `${item.type}-${item.title}`}>
                                <Td mono className='text-muted text-xs'>
                                    {index + 1}
                                </Td>
                                <Td className='max-w-[360px]'>
                                    <span
                                        className='block truncate font-mono text-[12.5px] text-ink'
                                        title={item.title}
                                    >
                                        {item.title}
                                    </span>
                                </Td>
                                <Td className='text-[12.5px] text-ink-2 whitespace-nowrap'>
                                    {item.type}
                                </Td>
                                <Td align='right' mono>
                                    {formatNumber(item.views)}
                                </Td>
                            </Tr>
                        ))}
                    </tbody>
                </Table>
            )}
        </Panel>
    );
}

export default TopPerformers;
