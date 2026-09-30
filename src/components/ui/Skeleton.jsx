/** Placeholder block shown while data loads, sized by the caller. */
export default function Skeleton({ className = '' }) {
    return (
        <span
            aria-hidden='true'
            className={`block rounded-md bg-line-soft animate-pulse ${className}`}
        />
    );
}

/** A few table-like rows of skeleton bars. */
export function SkeletonRows({ rows = 5, className = '' }) {
    return (
        <div role='status' aria-label='Loading' className={className}>
            {Array.from({ length: rows }, (_, i) => (
                <div
                    key={i}
                    className='flex items-center gap-5 h-11 px-4 border-b border-line-soft'
                >
                    <Skeleton className={i % 2 ? 'h-2.5 w-52' : 'h-2.5 w-64'} />
                    <Skeleton className='h-2.5 w-24' />
                    <span className='flex-1' />
                    <Skeleton className='h-5 w-18 rounded-full' />
                </div>
            ))}
        </div>
    );
}
