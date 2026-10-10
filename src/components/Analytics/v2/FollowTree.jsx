import { Fragment, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Table, Td, Th, Tr } from '../../ui';
import { number } from './data';
import { FOLLOW_CONTENT, needsContent } from './follows';

function Rows({ nodes, depth, open, toggle }) {
    return nodes.map((node) => {
        const expandable = node.children.length > 0;
        const expanded = open.has(node.key);
        const Icon = expanded ? ChevronDown : ChevronRight;
        const flagged = needsContent(node);
        return (
            <Fragment key={node.key}>
                <Tr>
                    <Td>
                        <div
                            style={{ paddingLeft: depth * 18 }}
                            className='flex items-center gap-2 min-w-60'
                        >
                            {expandable ? (
                                <button
                                    type='button'
                                    aria-expanded={expanded}
                                    aria-label={`${expanded ? 'Collapse' : 'Expand'} ${node.label}`}
                                    className='text-muted hover:text-ink p-1 cursor-pointer'
                                    onClick={() => toggle(node.key)}
                                >
                                    <Icon className='w-4 h-4' />
                                </button>
                            ) : (
                                <span className='w-6 shrink-0' />
                            )}
                            <div>
                                <span
                                    className={
                                        node.level === 'semester'
                                            ? 'text-ink-2'
                                            : 'text-ink'
                                    }
                                >
                                    {node.label}
                                </span>
                                {node.code && node.code !== node.label && (
                                    <span className='font-mono text-xs text-muted ml-2'>
                                        {node.code}
                                    </span>
                                )}
                                {flagged && (
                                    <div className='text-xs text-warn-ink'>
                                        High demand, little content
                                    </div>
                                )}
                            </div>
                        </div>
                    </Td>
                    <Td align='right' mono>
                        {number(node.students)}
                    </Td>
                    <Td align='right' mono>
                        {number(node.alertsOn)}
                    </Td>
                    <Td align='right' mono>
                        {number(node.reachable)}
                    </Td>
                    {FOLLOW_CONTENT.map(([type]) => (
                        <Td
                            key={type}
                            align='right'
                            mono
                            className={flagged ? 'text-warn-ink' : 'text-ink-2'}
                        >
                            {node.content ? number(node.content[type]) : ''}
                        </Td>
                    ))}
                </Tr>
                {expandable && expanded && (
                    <Rows
                        nodes={node.children}
                        depth={depth + 1}
                        open={open}
                        toggle={toggle}
                    />
                )}
            </Fragment>
        );
    });
}

/**
 * College → course → branch → semester table of the students following each
 * branch, next to how much approved content the branch has. Same look as
 * TreeTable, but the whole tree arrives in one response.
 */
export default function FollowTree({ tree = [] }) {
    // A single college (e.g. filtered to one) starts open.
    const [open, setOpen] = useState(
        () => new Set(tree.length === 1 ? [tree[0].key] : []),
    );
    const toggle = (key) =>
        setOpen((previous) => {
            const next = new Set(previous);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    return (
        <Table minWidth={860}>
            <thead>
                <tr>
                    <Th>College / course / branch / semester</Th>
                    <Th align='right'>Students</Th>
                    <Th align='right'>Alerts on</Th>
                    <Th align='right'>Reachable</Th>
                    {FOLLOW_CONTENT.map(([type, label]) => (
                        <Th key={type} align='right'>
                            {label}
                        </Th>
                    ))}
                </tr>
            </thead>
            <tbody>
                <Rows nodes={tree} depth={0} open={open} toggle={toggle} />
            </tbody>
        </Table>
    );
}
