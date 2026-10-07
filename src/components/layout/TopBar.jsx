import { analyticsLink } from '../Analytics/v2/data';
import { Fragment } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, Moon, Search, Sun } from 'lucide-react';
import { useColleges } from '../../context/CollegeContext';
import useTheme from '../../hooks/useTheme';
import { buildBreadcrumbs } from './breadcrumbs';

const isMac =
    typeof navigator !== 'undefined' &&
    /Mac|iPhone|iPad/.test(navigator.platform);

/** Breadcrumbs on the left; search and the theme switch on the right. */
export default function TopBar({ onOpenMenu, onOpenSearch }) {
    const { pathname, search } = useLocation();
    const { currentCollege } = useColleges();
    const { isDark, toggleTheme } = useTheme();
    const crumbs = buildBreadcrumbs(pathname, currentCollege?.name);

    return (
        <header className='h-14 shrink-0 flex items-center gap-2 pl-3 pr-3 md:pl-10 md:pr-4 border-b border-line-soft'>
            <button
                type='button'
                onClick={onOpenMenu}
                aria-label='Open navigation'
                className='md:hidden w-10 h-10 rounded-lg flex items-center justify-center text-ink hover:bg-sunken cursor-pointer'
            >
                <Menu className='w-5 h-5' aria-hidden='true' />
            </button>

            <nav
                aria-label='Breadcrumb'
                className='flex-1 min-w-0 flex items-center gap-2 text-[13px] text-muted overflow-hidden'
            >
                {crumbs.map((crumb, index) => (
                    <Fragment key={`${crumb.label}-${index}`}>
                        {index > 0 && (
                            <span aria-hidden='true' className='text-faint'>
                                /
                            </span>
                        )}
                        {crumb.to ? (
                            <Link
                                to={
                                    crumb.to.startsWith('/analytics')
                                        ? analyticsLink(
                                              crumb.to,
                                              search,
                                              pathname,
                                          )
                                        : crumb.to
                                }
                                className='truncate hover:text-ink transition-colors'
                            >
                                {crumb.label}
                            </Link>
                        ) : (
                            <span
                                aria-current={
                                    index === crumbs.length - 1
                                        ? 'page'
                                        : undefined
                                }
                                className={`truncate ${
                                    index === crumbs.length - 1
                                        ? 'text-ink font-medium'
                                        : ''
                                }`}
                            >
                                {crumb.label}
                            </span>
                        )}
                    </Fragment>
                ))}
            </nav>

            <button
                type='button'
                onClick={onOpenSearch}
                className='hidden sm:flex items-center gap-2 w-[300px] h-[34px] pl-3 pr-1.5 rounded-lg border border-line bg-sunken text-muted text-[13px] cursor-pointer hover:border-line-strong transition-colors'
            >
                <Search className='w-4 h-4' aria-hidden='true' />
                <span className='flex-1 text-left'>
                    Go to a page or college…
                </span>
                <kbd className='font-mono text-[11px] px-1.5 py-0.5 rounded-[5px] border border-line-strong bg-sheet text-muted'>
                    {isMac ? '⌘K' : 'Ctrl K'}
                </kbd>
            </button>
            <button
                type='button'
                onClick={onOpenSearch}
                aria-label='Search'
                className='sm:hidden w-10 h-10 rounded-lg flex items-center justify-center text-ink-2 hover:bg-sunken cursor-pointer'
            >
                <Search className='w-[18px] h-[18px]' aria-hidden='true' />
            </button>
            <button
                type='button'
                onClick={toggleTheme}
                aria-label={
                    isDark ? 'Switch to light theme' : 'Switch to dark theme'
                }
                title={isDark ? 'Light theme' : 'Dark theme'}
                className='w-9 h-9 rounded-lg flex items-center justify-center text-ink-2 hover:bg-sunken hover:text-ink cursor-pointer'
            >
                {isDark ? (
                    <Sun className='w-[18px] h-[18px]' aria-hidden='true' />
                ) : (
                    <Moon className='w-[18px] h-[18px]' aria-hidden='true' />
                )}
            </button>
        </header>
    );
}
