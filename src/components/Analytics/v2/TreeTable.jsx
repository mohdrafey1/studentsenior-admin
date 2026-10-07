import { Fragment, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import useAnalyticsQuery from '../../../hooks/useAnalyticsQuery';
import { Button, Table, Td, Th, Tr } from '../../ui';
import { number, stableParams } from './data';

const LEVELS = ['college', 'course', 'branch', 'subject'];

function TreeRow({ row, level, params, names }) {
    const [open, setOpen] = useState(false);
    const field = LEVELS[level];
    const value = row._id[field];
    const expandable = level < 3 && Boolean(value);
    const label = names[field]?.[value] || value || `Unassigned ${field}`;
    const childParams = {
        ...params,
        ...Object.fromEntries(
            Object.entries(row._id).filter(
                ([key, value]) => LEVELS.includes(key) && value,
            ),
        ),
    };
    const Icon = open ? ChevronDown : ChevronRight;
    const noViews = row.contentCount > 0 && !row.views;
    const noContent = row.views > 0 && !row.contentCount;
    return (
        <>
            <Tr>
                <Td>
                    <div
                        style={{ paddingLeft: level * 18 }}
                        className='flex items-center gap-2 min-w-60'
                    >
                        {expandable ? (
                            <button
                                type='button'
                                aria-expanded={open}
                                aria-label={`${open ? 'Collapse' : 'Expand'} ${label}`}
                                className='text-muted hover:text-ink p-1 cursor-pointer'
                                onClick={() => setOpen(!open)}
                            >
                                <Icon className='w-4 h-4' />
                            </button>
                        ) : (
                            <span className='w-6 shrink-0' />
                        )}
                        <div>
                            <span className='text-ink'>{label}</span>
                            {field === 'subject' && row._id.semester && (
                                <span className='text-xs text-muted ml-2'>
                                    Semester {row._id.semester}
                                </span>
                            )}
                            {(noViews || noContent) && (
                                <div className='text-xs text-warn-ink'>
                                    {noViews
                                        ? 'Content without views'
                                        : 'Views without current approved content'}
                                </div>
                            )}
                        </div>
                    </div>
                </Td>
                {['contentCount', 'views', 'uniqueViewers', 'downloads'].map(
                    (key) => (
                        <Td key={key} align='right' mono>
                            {number(row[key])}
                        </Td>
                    ),
                )}
            </Tr>
            {open && (
                <TreeLevel
                    params={childParams}
                    level={level + 1}
                    names={names}
                />
            )}
        </>
    );
}

function TreeLevel({ params, level = 0, names, rootQuery }) {
    const [page, setPage] = useState(1);
    const pageQuery = useAnalyticsQuery(
        '/analytics/v2/academics',
        {
            ...params,
            level: LEVELS[level],
            page,
        },
        { enabled: !rootQuery || page > 1 },
    );
    const query = rootQuery && page === 1 ? rootQuery : pageQuery;
    if (query.loading && !query.data)
        return (
            <tr>
                <Td colSpan={5}>
                    <span role='status' className='text-muted'>
                        Loading {LEVELS[level]} activity…
                    </span>
                </Td>
            </tr>
        );
    if (query.error)
        return (
            <tr>
                <Td colSpan={5}>
                    <div
                        role='alert'
                        className='flex flex-wrap items-center gap-3 text-bad-ink'
                    >
                        {query.error}
                        <Button size='sm' onClick={query.refresh}>
                            Try again
                        </Button>
                    </div>
                </Td>
            </tr>
        );
    return (
        <>
            {!query.data?.rows?.length && (
                <tr>
                    <Td colSpan={5}>
                        <p className='py-5 text-muted text-center'>
                            Analytics has no data yet for this range.
                        </p>
                    </Td>
                </tr>
            )}
            {(query.data?.rows || []).map((row) => (
                <Fragment key={JSON.stringify(row._id)}>
                    <TreeRow
                        row={row}
                        level={level}
                        params={params}
                        names={names}
                    />
                </Fragment>
            ))}
            {(page > 1 || query.data?.meta?.hasMore) && (
                <tr>
                    <Td colSpan={5}>
                        <div className='flex items-center justify-end gap-3 text-xs text-muted'>
                            <span>
                                {LEVELS[level]} · page {page}
                            </span>
                            <Button
                                size='sm'
                                disabled={page === 1}
                                onClick={() => setPage(page - 1)}
                            >
                                Previous
                            </Button>
                            <Button
                                size='sm'
                                disabled={!query.data?.meta?.hasMore}
                                onClick={() => setPage(page + 1)}
                            >
                                Next
                            </Button>
                        </div>
                    </Td>
                </tr>
            )}
        </>
    );
}

export default function TreeTable({ params, names, query }) {
    return (
        <Table minWidth={780}>
            <thead>
                <tr>
                    <Th>College / course / branch / subject</Th>
                    <Th align='right'>Approved content</Th>
                    <Th align='right'>Views</Th>
                    <Th align='right'>Unique viewers</Th>
                    <Th align='right'>Downloads</Th>
                </tr>
            </thead>
            <tbody>
                <TreeLevel
                    key={stableParams(params)}
                    params={params}
                    names={names}
                    rootQuery={query}
                />
            </tbody>
        </Table>
    );
}
