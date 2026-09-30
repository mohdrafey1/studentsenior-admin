import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

/**
 * One cell of the headline strip: label, serif number and a note. `delta`
 * is a whole-number percentage; it shows with an arrow and a sign so the
 * direction never relies on colour alone.
 */
export default function StatCard({ label, value, note, delta }) {
    const hasDelta = delta !== undefined && delta !== null;
    const Arrow = delta < 0 ? ArrowDownRight : ArrowUpRight;
    return (
        <div className='flex flex-col gap-2.5 px-4 sm:px-5 py-4 sm:py-[18px] bg-sheet min-w-0'>
            <span className='text-[13px] text-ink-2'>{label}</span>
            <span className='font-serif font-bold text-[24px] sm:text-[30px] leading-none text-ink break-words'>
                {value}
            </span>
            {(hasDelta || note) && (
                <span className='flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[12.5px] text-muted'>
                    {hasDelta && delta !== 0 && (
                        <span
                            className={`inline-flex items-center gap-0.5 font-medium ${
                                delta > 0 ? 'text-ok-ink' : 'text-bad-ink'
                            }`}
                        >
                            <Arrow className='w-3.5 h-3.5' aria-hidden='true' />
                            {delta > 0 ? '+' : '−'}
                            {Math.abs(delta)}%
                        </span>
                    )}
                    {hasDelta && delta === 0 && (
                        <span className='font-medium text-ink-2'>
                            No change
                        </span>
                    )}
                    {note}
                </span>
            )}
        </div>
    );
}
