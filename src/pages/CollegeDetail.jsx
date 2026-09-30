import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    BookOpen,
    Briefcase,
    ExternalLink,
    FileText,
    Info,
    ListChecks,
    MessageCircle,
    Pencil,
    PlayCircle,
    Search,
    ShoppingBag,
    Sparkles,
    StickyNote,
    Upload,
    Users,
} from 'lucide-react';
import api from '../utils/api';
import { useColleges } from '../context/CollegeContext';
import { useStatsWithDelta } from '../hooks/useStatsWithDelta';
import { collegeInitials } from '../utils/initials';
import { relativeTime } from '../utils/relativeTime';
import DeltaBadge from '../components/DeltaBadge';
import EditCollegeModal from '../components/College/EditCollegeModal';
import { Button, EmptyState, Skeleton, StatusBadge } from '../components/ui';

// One tile per content type. `section` is the College.sections flag that
// decides whether students can see it on the site.
const TILES = [
    {
        path: 'pyqs',
        label: 'PYQs',
        statKey: 'totalNewPyqs',
        section: 'pyqs',
        icon: FileText,
    },
    {
        path: 'notes',
        label: 'Notes',
        statKey: 'totalNotes',
        section: 'notes',
        icon: BookOpen,
    },
    {
        path: 'products',
        label: 'Store products',
        statKey: 'totalProduct',
        section: 'store',
        icon: ShoppingBag,
    },
    {
        path: 'seniors',
        label: 'Seniors',
        statKey: 'totalSeniors',
        section: 'seniors',
        icon: Users,
    },
    {
        path: 'groups',
        label: 'WhatsApp groups',
        statKey: 'totalGroups',
        section: 'groups',
        icon: MessageCircle,
    },
    {
        path: 'opportunities',
        label: 'Opportunities',
        statKey: 'totalGiveOpportunity',
        section: 'opportunities',
        icon: Briefcase,
    },
    {
        path: 'lost-found',
        label: 'Lost & found',
        statKey: 'totalLostFound',
        section: 'lostFound',
        icon: Search,
    },
    {
        path: 'videos',
        label: 'Videos',
        statKey: 'totalVideos',
        section: 'videos',
        icon: PlayCircle,
    },
    {
        path: 'syllabus',
        label: 'Syllabus',
        statKey: 'totalSyllabus',
        section: 'syllabus',
        icon: ListChecks,
    },
];

const TOOLS = [
    {
        path: 'pyqs-solutions',
        label: 'PYQ solutions',
        note: 'Write and check AI solutions',
        icon: Sparkles,
    },
    {
        path: 'pyqs-bulk-import',
        label: 'Bulk import PYQs',
        note: 'Upload many papers at once',
        icon: Upload,
    },
    {
        path: 'quick-notes',
        label: 'Quick notes',
        note: 'Short revision notes',
        icon: StickyNote,
    },
];

function ContentTile({
    slug,
    tile,
    value,
    delta,
    lastViewedAt,
    hidden,
    note,
    onOpen,
}) {
    const Icon = tile.icon;
    return (
        <Link
            to={`/${slug}/${tile.path}`}
            onClick={onOpen}
            className='group flex flex-col gap-3 p-[18px] sm:px-5 bg-sheet border border-line rounded-xl hover:border-line-strong transition-colors'
        >
            <span className='flex items-center gap-2 text-[13px] text-ink-2'>
                <Icon className='w-4 h-4 text-muted' aria-hidden='true' />
                <span className='flex-1'>{tile.label}</span>
                {hidden && (
                    <StatusBadge tone='outline'>Hidden on site</StatusBadge>
                )}
            </span>
            <span className='flex items-baseline gap-2'>
                <span className='font-serif font-bold text-[30px] leading-none text-ink'>
                    {Number(value || 0).toLocaleString('en-IN')}
                </span>
                <DeltaBadge value={delta} lastViewedAt={lastViewedAt} />
            </span>
            {note && <span className='text-[12.5px] text-muted'>{note}</span>}
        </Link>
    );
}

const CollegeOverview = ({ collegeslug }) => {
    const navigate = useNavigate();
    const { colleges, refresh } = useColleges();
    const college = colleges.find((c) => c.slug === collegeslug);

    const [counts, setCounts] = useState(null);
    const [loading, setLoading] = useState(true);
    const [failed, setFailed] = useState(false);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    const {
        deltaStats,
        lastViewedAt,
        setStats,
        acknowledgeStat,
        acknowledgeAll,
    } = useStatsWithDelta(collegeslug);

    const load = useCallback(async () => {
        try {
            setLoading(true);
            setFailed(false);
            const response = await api.get(`/college-data/${collegeslug}`);
            if (!response.data.success) {
                throw new Error(
                    response.data.message || 'College data not found',
                );
            }
            setCounts(response.data.data);
            setStats(response.data.data);
        } catch (error) {
            if (error.response?.status === 404) {
                toast.error('College not found');
                navigate('/dashboard', { replace: true });
                return;
            }
            setFailed(true);
        } finally {
            setLoading(false);
        }
    }, [collegeslug, navigate, setStats]);

    useEffect(() => {
        if (collegeslug) load();
    }, [collegeslug, load]);

    const handleSave = async (formData) => {
        if (!college) return;
        try {
            setSaving(true);
            const response = await api.put(`/college/${college._id}`, formData);
            if (!response.data.success) {
                throw new Error(response.data.message || 'Update failed');
            }
            toast.success('College updated');
            setEditing(false);
            await refresh();
        } catch (error) {
            toast.error(
                error.response?.data?.message || 'Couldn’t save the college',
            );
        } finally {
            setSaving(false);
        }
    };

    const freshCount = TILES.filter(
        (t) => (deltaStats[t.statKey] || 0) > 0,
    ).length;
    const requested = counts?.totalRequestedPyqs || 0;

    return (
        <div className='min-h-full px-4 sm:px-10 pt-8 pb-12'>
            <div className='flex flex-wrap items-start gap-4 mb-6'>
                <span className='w-14 h-14 rounded-[14px] bg-brand-soft text-brand-ink flex items-center justify-center font-serif font-bold text-xl shrink-0'>
                    {collegeInitials(college?.name || collegeslug)}
                </span>
                <div className='flex-1 min-w-[240px] flex flex-col gap-1.5'>
                    <div className='flex flex-wrap items-center gap-3'>
                        <h1 className='font-serif font-bold text-[26px] sm:text-[32px] leading-[1.15] tracking-[-0.4px] text-ink'>
                            {college?.name || collegeslug}
                        </h1>
                        {college && (
                            <StatusBadge
                                status={college.status ? 'active' : 'inactive'}
                            />
                        )}
                    </div>
                    <div className='flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-2'>
                        {college?.location && <span>{college.location}</span>}
                        {college?.clickCounts > 0 && (
                            <>
                                <span aria-hidden='true' className='text-faint'>
                                    ·
                                </span>
                                <span>
                                    {Number(college.clickCounts).toLocaleString(
                                        'en-IN',
                                    )}{' '}
                                    page views
                                </span>
                            </>
                        )}
                        <span aria-hidden='true' className='text-faint'>
                            ·
                        </span>
                        <code className='font-mono text-xs'>
                            /{collegeslug}
                        </code>
                    </div>
                </div>
                <div className='flex flex-wrap items-center gap-2'>
                    <Button
                        href={`https://studentsenior.com/${collegeslug}`}
                        target='_blank'
                        rel='noreferrer'
                        icon={ExternalLink}
                    >
                        View on site
                    </Button>
                    <Button
                        variant='primary'
                        icon={Pencil}
                        onClick={() => setEditing(true)}
                        disabled={!college}
                    >
                        Edit college
                    </Button>
                </div>
            </div>

            {lastViewedAt && freshCount > 0 && (
                <div className='flex flex-wrap items-center gap-3 px-4 py-3 mb-5 rounded-xl bg-brand-soft text-[13.5px] text-brand-ink'>
                    <Info className='w-4 h-4 shrink-0' aria-hidden='true' />
                    <span className='flex-1 min-w-[200px]'>
                        You last opened this college{' '}
                        <strong>{relativeTime(lastViewedAt)}</strong>. Numbers
                        marked <span className='font-mono'>+new</span> arrived
                        since then.
                    </span>
                    <Button variant='link' size='sm' onClick={acknowledgeAll}>
                        Mark all as seen
                    </Button>
                </div>
            )}

            {failed ? (
                <div className='bg-sheet border border-line rounded-xl'>
                    <EmptyState
                        icon={Info}
                        tone='error'
                        title='Couldn’t load this college’s numbers'
                        description='Check your connection and try again.'
                        action={<Button onClick={load}>Try again</Button>}
                    />
                </div>
            ) : (
                <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4'>
                    {TILES.map((tile) =>
                        loading && !counts ? (
                            <div
                                key={tile.path}
                                className='flex flex-col gap-3 p-[18px] sm:px-5 bg-sheet border border-line rounded-xl'
                            >
                                <Skeleton className='h-3 w-28' />
                                <Skeleton className='h-7 w-20' />
                                <Skeleton className='h-2.5 w-36' />
                            </div>
                        ) : (
                            <ContentTile
                                key={tile.path}
                                slug={collegeslug}
                                tile={tile}
                                value={counts?.[tile.statKey]}
                                delta={deltaStats[tile.statKey]}
                                lastViewedAt={lastViewedAt}
                                hidden={
                                    college?.sections &&
                                    college.sections[tile.section] === false
                                }
                                note={
                                    tile.path === 'pyqs' && requested > 0
                                        ? `${requested.toLocaleString('en-IN')} requested by students`
                                        : undefined
                                }
                                onOpen={() => acknowledgeStat(tile.statKey)}
                            />
                        ),
                    )}
                </div>
            )}

            <h2 className='eyebrow mt-8 mb-3'>More for this college</h2>
            <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
                {TOOLS.map((tool) => {
                    const Icon = tool.icon;
                    return (
                        <Link
                            key={tool.path}
                            to={`/${collegeslug}/${tool.path}`}
                            className='flex items-center gap-3 px-4 py-3 bg-sheet border border-line rounded-xl hover:border-line-strong transition-colors'
                        >
                            <span className='w-8 h-8 rounded-lg bg-ground text-ink-2 flex items-center justify-center shrink-0'>
                                <Icon className='w-4 h-4' aria-hidden='true' />
                            </span>
                            <span className='flex flex-col gap-0.5 min-w-0'>
                                <span className='text-[13.5px] font-medium text-ink'>
                                    {tool.label}
                                </span>
                                <span className='text-[12.5px] text-muted truncate'>
                                    {tool.note}
                                </span>
                            </span>
                        </Link>
                    );
                })}
            </div>

            <EditCollegeModal
                isOpen={editing}
                onClose={() => !saving && setEditing(false)}
                college={college}
                onSave={handleSave}
                loading={saving}
            />
        </div>
    );
};

// Keyed by slug so switching colleges starts fresh, including the
// per-college "seen" baselines kept by useStatsWithDelta.
const CollegeDetail = () => {
    const { collegeslug } = useParams();
    return <CollegeOverview key={collegeslug} collegeslug={collegeslug} />;
};

export default CollegeDetail;
