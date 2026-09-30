import { useEffect, useId, useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import api from '../../utils/api';
import { Avatar, StatusBadge } from '../ui';

/**
 * Finds students by username or email. Students without a registered phone
 * are listed but can't be picked, since nothing would reach them.
 */
export default function RecipientSearch({
    onPick,
    excludeIds = [],
    placeholder = 'Search by username or email',
    label = 'Find a student',
}) {
    const inputId = useId();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [state, setState] = useState('idle'); // idle | loading | done | error

    useEffect(() => {
        const q = query.trim();
        if (q.length < 2) {
            setResults([]);
            setState('idle');
            return undefined;
        }
        const controller = new AbortController();
        const timer = setTimeout(async () => {
            setState('loading');
            try {
                const res = await api.get('/notification/recipients', {
                    params: { search: q },
                    signal: controller.signal,
                });
                setResults(res.data.data.recipients || []);
                setState('done');
            } catch {
                if (!controller.signal.aborted) setState('error');
            }
        }, 300);
        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [query]);

    const shown = results.filter((r) => !excludeIds.includes(r._id));

    return (
        <div className='flex flex-col gap-1.5'>
            <label htmlFor={inputId} className='sr-only'>
                {label}
            </label>
            <div className='flex items-center gap-2 h-9 px-3 rounded-lg border border-line-strong bg-sheet text-muted focus-within:ring-2 focus-within:ring-brand/30'>
                <Search
                    className='w-[15px] h-[15px] shrink-0'
                    aria-hidden='true'
                />
                <input
                    id={inputId}
                    type='search'
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Escape' && setQuery('')}
                    placeholder={placeholder}
                    autoComplete='off'
                    className='flex-1 min-w-0 bg-transparent outline-none text-[13.5px] text-ink placeholder:text-muted'
                />
                {state === 'loading' && (
                    <Loader2
                        className='w-4 h-4 animate-spin'
                        aria-hidden='true'
                    />
                )}
            </div>

            {state === 'error' && (
                <p className='text-[12.5px] text-bad-ink'>
                    Couldn’t search students. Try again.
                </p>
            )}
            {state === 'done' && shown.length === 0 && (
                <p className='text-[12.5px] text-muted'>
                    No students match “{query.trim()}”.
                </p>
            )}
            {shown.length > 0 && (
                <ul
                    aria-label='Matching students'
                    className='flex flex-col rounded-lg border border-line bg-sheet overflow-hidden'
                >
                    {shown.map((r) => (
                        <li
                            key={r._id}
                            className='border-b border-line-soft last:border-b-0'
                        >
                            <button
                                type='button'
                                disabled={!r.canReceive}
                                onClick={() => {
                                    onPick(r);
                                    setQuery('');
                                }}
                                className='w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-sunken disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer'
                            >
                                <Avatar
                                    name={r.username}
                                    src={r.profilePicture}
                                    size='sm'
                                />
                                <span className='flex-1 min-w-0 flex flex-col'>
                                    <span className='text-[13px] font-medium text-ink truncate'>
                                        @{r.username}
                                    </span>
                                    <span className='text-xs text-muted truncate'>
                                        {r.email}
                                    </span>
                                </span>
                                {!r.canReceive && (
                                    <StatusBadge tone='outline'>
                                        No device
                                    </StatusBadge>
                                )}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
