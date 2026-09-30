import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useColleges } from '../../context/CollegeContext';
import CollegeSwitcher from './CollegeSwitcher';
import {
    COLLEGE_ITEMS,
    NAV_GROUPS,
    WORKSPACE_ITEMS,
    isPathActive,
} from './navConfig';

const ACTIVE_RING =
    'bg-sheet text-ink font-medium shadow-[0_0_0_1px_var(--ss-line-strong),0_1px_2px_rgba(28,27,24,0.06)]';

function TopItem({ item, active, onNavigate }) {
    const Icon = item.icon;
    return (
        <Link
            to={item.to}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={`flex items-center gap-2.5 h-[30px] px-2.5 rounded-lg text-[13.5px] transition-colors ${
                active
                    ? ACTIVE_RING
                    : 'text-ink-2 hover:text-ink hover:bg-sheet/60'
            }`}
        >
            <Icon className='w-4 h-4 shrink-0' aria-hidden='true' />
            <span className='truncate'>{item.label}</span>
        </Link>
    );
}

function SubItem({ to, label, active, disabled, onNavigate }) {
    if (disabled) {
        return (
            <span className='flex items-center h-[30px] pl-9 pr-2.5 text-[13.5px] text-faint select-none'>
                {label}
            </span>
        );
    }
    return (
        <Link
            to={to}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={`flex items-center gap-2.5 h-[30px] pr-2.5 rounded-lg text-[13.5px] transition-colors ${
                active
                    ? `pl-5 ${ACTIVE_RING}`
                    : 'pl-9 text-ink-2 hover:text-ink hover:bg-sheet/60'
            }`}
        >
            {active && (
                <span
                    className='w-1.5 h-1.5 rounded-full bg-brand shrink-0'
                    aria-hidden='true'
                />
            )}
            <span className='truncate'>{label}</span>
        </Link>
    );
}

/**
 * The one navigation for the whole console: workspace pages, the current
 * college's content, then collapsible Money, People, Catalog and Blog groups.
 */
export default function AppSidebar({ onNavigate }) {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { currentSlug, urlSlug } = useColleges();

    const activeGroup = NAV_GROUPS.find((group) =>
        group.items.some((item) => isPathActive(pathname, item.to, item.end)),
    )?.id;

    const [openGroups, setOpenGroups] = useState(
        () => new Set(activeGroup ? [activeGroup] : []),
    );
    const [collegeOpen, setCollegeOpen] = useState(true);

    useEffect(() => {
        if (activeGroup) {
            setOpenGroups((prev) => new Set(prev).add(activeGroup));
        }
    }, [activeGroup]);

    useEffect(() => {
        if (urlSlug) setCollegeOpen(true);
    }, [urlSlug]);

    const toggleGroup = (id) =>
        setOpenGroups((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const initials = (user?.name || 'Admin')
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');

    return (
        <nav
            aria-label='Primary'
            className='h-full w-full flex flex-col gap-3.5 pt-3.5 pb-3 pl-3.5 pr-2.5'
        >
            <Link
                to='/dashboard'
                onClick={onNavigate}
                className='flex items-center gap-2.5 h-9 px-1.5'
            >
                <span className='w-7 h-7 rounded-lg bg-inverse text-on-inverse flex items-center justify-center font-serif font-bold text-[17px] leading-none'>
                    S
                </span>
                <span className='flex-1 text-[14.5px] font-semibold tracking-[-0.2px] text-ink'>
                    StudentSenior
                </span>
                <span className='font-mono text-[10px] tracking-[0.08em] px-1.5 py-[3px] rounded-[5px] bg-line text-ink-2'>
                    ADMIN
                </span>
            </Link>

            <div className='flex-1 min-h-0 overflow-y-auto -mr-1 pr-1 flex flex-col gap-4'>
                <div className='flex flex-col gap-0.5'>
                    {WORKSPACE_ITEMS.map((item) => (
                        <TopItem
                            key={item.id}
                            item={item}
                            active={isPathActive(pathname, item.to, item.end)}
                            onNavigate={onNavigate}
                        />
                    ))}
                </div>

                <div className='flex flex-col gap-0.5'>
                    <button
                        type='button'
                        onClick={() => setCollegeOpen((value) => !value)}
                        aria-expanded={collegeOpen}
                        className='flex items-center gap-1 px-2.5 pb-1.5 eyebrow cursor-pointer hover:text-ink text-left'
                    >
                        College
                        {collegeOpen ? (
                            <ChevronDown
                                className='w-3 h-3'
                                aria-hidden='true'
                            />
                        ) : (
                            <ChevronRight
                                className='w-3 h-3'
                                aria-hidden='true'
                            />
                        )}
                    </button>
                    <CollegeSwitcher onNavigate={onNavigate} />
                    {collegeOpen &&
                        COLLEGE_ITEMS.map((item) => {
                            const to = currentSlug
                                ? `/${currentSlug}${item.path ? `/${item.path}` : ''}`
                                : '';
                            return (
                                <SubItem
                                    key={item.id}
                                    to={to}
                                    label={item.label}
                                    disabled={!currentSlug}
                                    active={
                                        Boolean(currentSlug) &&
                                        isPathActive(pathname, to, item.end)
                                    }
                                    onNavigate={onNavigate}
                                />
                            );
                        })}
                </div>

                <div className='flex flex-col gap-0.5'>
                    {NAV_GROUPS.map((group) => {
                        const Icon = group.icon;
                        const open = openGroups.has(group.id);
                        return (
                            <div
                                key={group.id}
                                className='flex flex-col gap-0.5'
                            >
                                <button
                                    type='button'
                                    aria-expanded={open}
                                    onClick={() => toggleGroup(group.id)}
                                    className='flex items-center gap-2.5 h-[30px] px-2.5 rounded-lg text-[13.5px] text-ink-2 hover:text-ink hover:bg-sheet/60 cursor-pointer text-left'
                                >
                                    <Icon
                                        className='w-4 h-4 shrink-0'
                                        aria-hidden='true'
                                    />
                                    <span className='flex-1'>
                                        {group.label}
                                    </span>
                                    {open ? (
                                        <ChevronDown
                                            className='w-3.5 h-3.5 text-muted'
                                            aria-hidden='true'
                                        />
                                    ) : (
                                        <ChevronRight
                                            className='w-3.5 h-3.5 text-muted'
                                            aria-hidden='true'
                                        />
                                    )}
                                </button>
                                {open &&
                                    group.items.map((item) => (
                                        <SubItem
                                            key={item.to}
                                            to={item.to}
                                            label={item.label}
                                            active={isPathActive(
                                                pathname,
                                                item.to,
                                                item.end,
                                            )}
                                            onNavigate={onNavigate}
                                        />
                                    ))}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className='flex items-center gap-2.5 pt-2.5 px-1.5 border-t border-line-strong'>
                <span className='w-[30px] h-[30px] rounded-full bg-inverse text-on-inverse flex items-center justify-center text-[11.5px] font-semibold shrink-0'>
                    {initials}
                </span>
                <span className='flex-1 min-w-0 flex flex-col'>
                    <span className='text-[13px] font-medium text-ink truncate'>
                        {user?.name || 'Admin'}
                    </span>
                    <span className='text-xs text-muted'>{user?.role}</span>
                </span>
                <button
                    type='button'
                    onClick={handleLogout}
                    aria-label='Sign out'
                    title='Sign out'
                    className='w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-ink hover:bg-sheet cursor-pointer'
                >
                    <LogOut className='w-4 h-4' aria-hidden='true' />
                </button>
            </div>
        </nav>
    );
}
