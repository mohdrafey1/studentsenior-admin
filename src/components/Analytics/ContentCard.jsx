/**
 * One row of a bar list: a label, its number and a thin bar scaled against
 * the largest row. Used for content by type, views by type, and the study
 * assistant and blog lists.
 *
 *   <ContentCard label='PYQs' value='4,210' share='34%' pct={100} />
 */
export default function ContentCard({
    label,
    sublabel,
    value,
    extra,
    share,
    pct,
}) {
    const width = Math.max(0, Math.min(100, Number(pct) || 0));
    return (
        <li className='flex flex-col gap-1.5'>
            <div className='flex items-baseline gap-2 text-[13px]'>
                <span className='flex-1 min-w-0 truncate text-ink'>
                    {label}
                    {sublabel && (
                        <span className='ml-1.5 font-mono text-[11.5px] text-muted'>
                            {sublabel}
                        </span>
                    )}
                </span>
                {extra && (
                    <span className='font-mono text-[11.5px] text-muted whitespace-nowrap'>
                        {extra}
                    </span>
                )}
                <span className='font-mono text-[12.5px] text-ink whitespace-nowrap'>
                    {value}
                </span>
                {share !== undefined && (
                    <span className='w-10 text-right font-mono text-[11.5px] text-muted'>
                        {share}
                    </span>
                )}
            </div>
            <div className='h-1.5 rounded-full bg-line-soft' aria-hidden='true'>
                <div
                    className='h-full rounded-full bg-brand'
                    style={{ width: `${width}%` }}
                />
            </div>
        </li>
    );
}
