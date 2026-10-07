import { analyticsLink } from '../Analytics/v2/data';
import { useAuth } from '../../context/AuthContext';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CornerDownLeft, Search } from 'lucide-react';
import { useColleges } from '../../context/CollegeContext';
import { collegeInitials } from '../../utils/initials';
import { COLLEGE_ITEMS, visibleNavGroups, WORKSPACE_ITEMS } from './navConfig';

/**
 * ⌘K / Ctrl+K jump list: every page in the console, the current college's
 * sections and every college. Arrow keys move, Enter opens, Escape closes.
 */
export default function CommandPalette({ open, onClose }) {
    const navigate = useNavigate();
    const { search, pathname } = useLocation();
    const { user } = useAuth();
    const { colleges, currentCollege, currentSlug } = useColleges();
    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const listRef = useRef(null);

    const entries = useMemo(() => {
        const list = WORKSPACE_ITEMS.map((item) => ({
            group: 'Pages',
            label: item.label,
            hint: '',
            to: item.to,
        }));
        if (currentSlug) {
            COLLEGE_ITEMS.forEach((item) =>
                list.push({
                    group: currentCollege?.name || currentSlug,
                    label: item.label,
                    hint: '',
                    to: `/${currentSlug}${item.path ? `/${item.path}` : ''}`,
                }),
            );
        }
        visibleNavGroups(user).forEach((group) =>
            group.items.forEach((item) =>
                list.push({
                    group: group.label,
                    label: item.label,
                    hint: '',
                    to:
                        group.id === 'analytics'
                            ? analyticsLink(item.to, search, pathname)
                            : item.to,
                }),
            ),
        );
        colleges.forEach((college) =>
            list.push({
                group: 'Colleges',
                label: college.name,
                hint: collegeInitials(college.name),
                to: `/${college.slug}`,
            }),
        );
        return list;
    }, [colleges, currentCollege, currentSlug, user, search, pathname]);

    const results = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return entries;
        return entries.filter(
            (entry) =>
                entry.label.toLowerCase().includes(q) ||
                entry.group.toLowerCase().includes(q),
        );
    }, [entries, query]);

    useEffect(() => {
        if (open) {
            setQuery('');
            setActiveIndex(0);
        }
    }, [open]);

    useEffect(() => setActiveIndex(0), [query]);

    useEffect(() => {
        listRef.current
            ?.querySelector(`[data-index="${activeIndex}"]`)
            ?.scrollIntoView({ block: 'nearest' });
    }, [activeIndex]);

    if (!open) return null;

    const go = (entry) => {
        if (!entry) return;
        navigate(entry.to);
        onClose();
    };

    const onKeyDown = (event) => {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveIndex((i) => Math.min(i + 1, results.length - 1));
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex((i) => Math.max(i - 1, 0));
        } else if (event.key === 'Enter') {
            event.preventDefault();
            go(results[activeIndex]);
        } else if (event.key === 'Escape') {
            event.preventDefault();
            onClose();
        }
    };

    let lastGroup = null;

    return (
        <div
            className='fixed inset-0 z-[60] flex justify-center items-start pt-[12vh] px-4 bg-black/35'
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <div
                role='dialog'
                aria-modal='true'
                aria-label='Go to a page or college'
                className='w-full max-w-[640px] rounded-2xl bg-sheet border border-line shadow-[0_24px_64px_rgba(20,19,17,0.3)] overflow-hidden'
            >
                <div className='flex items-center gap-3 h-14 px-4 border-b border-line-soft'>
                    <Search
                        className='w-[18px] h-[18px] text-muted'
                        aria-hidden='true'
                    />
                    <input
                        autoFocus
                        role='combobox'
                        aria-expanded='true'
                        aria-controls='palette-results'
                        aria-activedescendant={`palette-option-${activeIndex}`}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={onKeyDown}
                        placeholder='Type a page, section or college'
                        className='flex-1 h-full bg-transparent outline-none text-[15px] text-ink placeholder:text-muted'
                    />
                    <kbd className='font-mono text-[11px] px-1.5 py-0.5 rounded-[5px] border border-line-strong text-muted'>
                        esc
                    </kbd>
                </div>
                <ul
                    id='palette-results'
                    ref={listRef}
                    role='listbox'
                    className='max-h-[420px] overflow-y-auto p-2'
                >
                    {results.length === 0 && (
                        <li className='px-3 py-8 text-center text-[13.5px] text-muted'>
                            Nothing matches “{query}”
                        </li>
                    )}
                    {results.map((entry, index) => {
                        const showGroup = entry.group !== lastGroup;
                        lastGroup = entry.group;
                        const active = index === activeIndex;
                        return (
                            <li
                                key={`${entry.group}-${entry.to}`}
                                role='presentation'
                            >
                                {showGroup && (
                                    <div className='eyebrow px-2.5 pt-2.5 pb-1'>
                                        {entry.group}
                                    </div>
                                )}
                                <button
                                    type='button'
                                    id={`palette-option-${index}`}
                                    role='option'
                                    aria-selected={active}
                                    data-index={index}
                                    onMouseEnter={() => setActiveIndex(index)}
                                    onClick={() => go(entry)}
                                    className={`w-full flex items-center gap-3 h-10 px-2.5 rounded-lg text-left text-sm cursor-pointer ${
                                        active
                                            ? 'bg-brand-soft text-ink'
                                            : 'text-ink'
                                    }`}
                                >
                                    {entry.hint && (
                                        <span className='w-6 h-6 rounded-md bg-brand-soft text-brand-ink flex items-center justify-center text-[10px] font-semibold'>
                                            {entry.hint}
                                        </span>
                                    )}
                                    <span className='flex-1 truncate'>
                                        {entry.label}
                                    </span>
                                    {active && (
                                        <CornerDownLeft
                                            className='w-3.5 h-3.5 text-muted'
                                            aria-hidden='true'
                                        />
                                    )}
                                </button>
                            </li>
                        );
                    })}
                </ul>
                <div className='hidden sm:flex items-center gap-4 h-10 px-4 border-t border-line-soft bg-sunken text-xs text-muted'>
                    <span>↑ ↓ to move</span>
                    <span>↵ to open</span>
                    <span>esc to close</span>
                </div>
            </div>
        </div>
    );
}
