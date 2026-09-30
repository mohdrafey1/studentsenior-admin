import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { useColleges } from '../../context/CollegeContext';
import { collegeInitials } from '../../utils/initials';

/**
 * Picks the college the College section of the sidebar works on. When the
 * admin is already on a college page, switching keeps them on the same
 * section (PYQs stays PYQs) for the newly chosen college.
 */
export default function CollegeSwitcher({ onNavigate }) {
    const { colleges, currentCollege, currentSlug, urlSlug } = useColleges();
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const rootRef = useRef(null);

    useEffect(() => {
        if (!open) return undefined;
        const onPointer = (event) => {
            if (!rootRef.current?.contains(event.target)) setOpen(false);
        };
        const onKey = (event) => {
            if (event.key === 'Escape') setOpen(false);
        };
        document.addEventListener('mousedown', onPointer);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onPointer);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return q
            ? colleges.filter(
                  (c) =>
                      c.name?.toLowerCase().includes(q) ||
                      c.slug?.toLowerCase().includes(q),
              )
            : colleges;
    }, [colleges, query]);

    const choose = (slug) => {
        // Keep the section (/pyqs, /notes …) but drop any item id after it.
        const section = urlSlug ? pathname.split('/')[2] || '' : '';
        navigate(`/${slug}${section ? `/${section}` : ''}`);
        setOpen(false);
        setQuery('');
        onNavigate?.();
    };

    const label = currentCollege?.name || currentSlug || 'Choose a college';

    return (
        <div ref={rootRef} className='relative mb-1'>
            <button
                type='button'
                aria-haspopup='listbox'
                aria-expanded={open}
                aria-label={`Switch college, current: ${label}`}
                onClick={() => setOpen((value) => !value)}
                className='w-full flex items-center gap-2.5 h-[38px] pl-1.5 pr-2 rounded-[9px] border border-line-strong bg-sheet text-ink text-[13.5px] font-medium text-left cursor-pointer hover:border-faint transition-colors'
            >
                <span className='w-[26px] h-[26px] rounded-md bg-brand-soft text-brand-ink flex items-center justify-center text-[11px] font-semibold shrink-0'>
                    {currentCollege
                        ? collegeInitials(currentCollege.name)
                        : '?'}
                </span>
                <span className='flex-1 truncate'>{label}</span>
                <ChevronsUpDown
                    className='w-[15px] h-[15px] text-muted shrink-0'
                    aria-hidden='true'
                />
            </button>

            {open && (
                <div className='absolute z-50 left-0 right-0 mt-1.5 rounded-xl border border-line bg-sheet shadow-[0_12px_32px_rgba(20,19,17,0.16)] overflow-hidden'>
                    <label className='flex items-center gap-2 h-10 px-3 border-b border-line-soft text-muted'>
                        <Search className='w-4 h-4' aria-hidden='true' />
                        <input
                            autoFocus
                            type='search'
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder='Find a college'
                            aria-label='Find a college'
                            className='flex-1 bg-transparent outline-none text-[13px] text-ink placeholder:text-muted'
                        />
                    </label>
                    <ul role='listbox' className='max-h-72 overflow-y-auto p-1'>
                        {filtered.length === 0 && (
                            <li className='px-3 py-4 text-[13px] text-muted text-center'>
                                No college matches
                            </li>
                        )}
                        {filtered.map((college) => {
                            const selected = college.slug === currentSlug;
                            return (
                                <li
                                    key={college._id || college.slug}
                                    role='option'
                                    aria-selected={selected}
                                >
                                    <button
                                        type='button'
                                        onClick={() => choose(college.slug)}
                                        className='w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-left text-[13px] text-ink hover:bg-sunken cursor-pointer'
                                    >
                                        <span className='w-6 h-6 rounded-md bg-brand-soft text-brand-ink flex items-center justify-center text-[10px] font-semibold shrink-0'>
                                            {collegeInitials(college.name)}
                                        </span>
                                        <span className='flex-1 min-w-0'>
                                            <span className='block truncate'>
                                                {college.name}
                                            </span>
                                            {!college.status && (
                                                <span className='block text-[11.5px] text-muted'>
                                                    Inactive
                                                </span>
                                            )}
                                        </span>
                                        {selected && (
                                            <Check
                                                className='w-4 h-4 text-brand'
                                                aria-hidden='true'
                                            />
                                        )}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
}
