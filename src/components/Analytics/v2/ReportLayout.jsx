import { NavLink, useLocation } from 'react-router-dom';
import { PageHeader } from '../../ui';
import DateRangeBar from './DateRangeBar';
import { analyticsLink } from './data';

const pages = [
    ['', 'Overview'],
    ['/audience', 'Audience'],
    ['/content/all', 'Content'],
    ['/academics', 'Academics'],
    ['/revenue', 'Revenue'],
    ['/realtime', 'Realtime'],
    ['/chatbot', 'Chatbot'],
];

export default function ReportLayout({
    title,
    description,
    controls,
    realtime = false,
    revenue = false,
    filtersVisible = true,
    children,
}) {
    const { search, pathname } = useLocation();
    return (
        <div className='min-h-full px-4 sm:px-8 lg:px-10 pt-8 pb-12 space-y-5'>
            <PageHeader
                eyebrow='Analytics'
                title={title}
                description={description}
            />
            <nav
                aria-label='Analytics reports'
                className='flex gap-5 overflow-x-auto border-b border-line pb-3'
            >
                {pages.map(([path, label]) => (
                    <NavLink
                        key={path}
                        to={analyticsLink(`/analytics${path}`, search)}
                        end={!path}
                        className={({ isActive }) =>
                            `text-sm whitespace-nowrap pb-1 ${isActive || (path.startsWith('/content') && pathname.startsWith('/analytics/content')) ? 'font-semibold text-ink' : 'text-muted hover:text-link'}`
                        }
                    >
                        {label}
                    </NavLink>
                ))}
            </nav>
            {filtersVisible && (
                <DateRangeBar
                    {...controls}
                    realtime={realtime}
                    revenue={revenue}
                />
            )}
            {!controls.error && children}
            {!realtime && filtersVisible && (
                <p className='text-xs text-muted'>
                    Inclusive dates in Asia/Kolkata. Activity rollups usually
                    lag by up to 6 minutes. Anonymous history stays separate
                    from account history.
                </p>
            )}
        </div>
    );
}
