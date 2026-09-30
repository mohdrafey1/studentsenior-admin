/**
 * Table pieces in the console style. The wrapper scrolls sideways on narrow
 * screens; it is `relative` so visually hidden header text stays inside it.
 *
 *   <Table minWidth={860}>
 *     <thead><tr><Th>Subject</Th><Th align='right'>Views</Th></tr></thead>
 *     <tbody><Tr onClick={…}><Td>…</Td></Tr></tbody>
 *   </Table>
 */
export function Table({ minWidth = 720, className = '', children }) {
    return (
        <div className={`relative overflow-x-auto ${className}`}>
            <table
                className='w-full text-[13.5px] text-ink'
                style={{ minWidth }}
            >
                {children}
            </table>
        </div>
    );
}

const ALIGN = { left: 'text-left', right: 'text-right', center: 'text-center' };

export function Th({ align = 'left', className = '', children, ...rest }) {
    return (
        <th
            scope='col'
            className={`eyebrow font-normal px-3 first:pl-5 last:pr-5 py-2.5 bg-sunken border-b border-line-soft whitespace-nowrap ${ALIGN[align]} ${className}`}
            {...rest}
        >
            {children}
        </th>
    );
}

export function Td({
    align = 'left',
    mono = false,
    className = '',
    children,
    ...rest
}) {
    return (
        <td
            className={`px-3 first:pl-5 last:pr-5 py-3 align-middle ${ALIGN[align]} ${
                mono ? 'font-mono text-[13px]' : ''
            } ${className}`}
            {...rest}
        >
            {children}
        </td>
    );
}

/** Row with hover; `selected` tints it, `onClick` makes it act as a link. */
export function Tr({
    selected = false,
    onClick,
    className = '',
    children,
    ...rest
}) {
    return (
        <tr
            onClick={onClick}
            className={`border-b border-line-soft last:border-b-0 transition-colors ${
                selected ? 'bg-brand-soft/60' : 'hover:bg-sunken/70'
            } ${onClick ? 'cursor-pointer' : ''} ${className}`}
            {...rest}
        >
            {children}
        </tr>
    );
}

/** Checkbox cell for row selection; stops the click reaching the row. */
export function SelectCell({
    checked,
    onChange,
    label,
    header = false,
    indeterminate = false,
}) {
    const Cell = header ? 'th' : 'td';
    return (
        <Cell
            scope={header ? 'col' : undefined}
            className={`w-10 pl-5 pr-1 ${header ? 'py-2.5 bg-sunken border-b border-line-soft' : 'py-3'}`}
            onClick={(event) => event.stopPropagation()}
        >
            <input
                type='checkbox'
                aria-label={label}
                checked={checked}
                ref={(el) => {
                    if (el) el.indeterminate = indeterminate;
                }}
                onChange={(event) => onChange(event.target.checked)}
                className='w-4 h-4 accent-brand cursor-pointer align-middle'
            />
        </Cell>
    );
}
