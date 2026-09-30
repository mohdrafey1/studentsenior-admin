import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    BarChart3,
    ExternalLink,
    FileText,
    Image as ImageIcon,
    Pencil,
    Plus,
    Trash2,
} from 'lucide-react';
import api, { apiErrorMessage } from '../../utils/api';
import {
    formatDateTime,
    formatNumber,
    formatShortDate,
} from '../../utils/format';
import FilterBar from '../../components/Common/FilterBar';
import Pagination from '../../components/Pagination';
import ConfirmModal from '../../components/ConfirmModal';
import {
    Button,
    EmptyState,
    PageHeader,
    SkeletonRows,
    StatusBadge,
    Tabs,
} from '../../components/ui';
import { blogEndpoints, blogRoutes } from './blogApi';

const POSTS_PER_PAGE = 6;

const STATUS_TABS = [
    { value: 'all', label: 'All' },
    { value: 'published', label: 'Published' },
    { value: 'draft', label: 'Drafts' },
];

const publicUrl = (slug) => `https://blog.studentsenior.com/${slug}`;

function Banner({ src, className }) {
    if (!src) {
        return (
            <div
                className={`flex items-center justify-center rounded-lg bg-sunken border border-line-soft text-faint ${className}`}
            >
                <ImageIcon className='w-5 h-5' aria-hidden='true' />
            </div>
        );
    }
    return (
        <img
            src={src}
            alt=''
            loading='lazy'
            className={`rounded-lg object-cover bg-sunken ${className}`}
        />
    );
}

function PostStatus({ post }) {
    return <StatusBadge status={post.isDraft ? 'draft' : 'published'} />;
}

function Tags({ tags }) {
    return (tags || []).slice(0, 3).map((tag) => (
        <span
            key={tag}
            className='px-1.5 py-0.5 rounded-[5px] bg-ground text-xs text-ink-2'
        >
            {tag}
        </span>
    ));
}

const AllPosts = () => {
    const [posts, setPosts] = useState([]);
    const [allTags, setAllTags] = useState([]);
    const [totalItems, setTotalItems] = useState(0);
    const [error, setError] = useState('');
    const [revision, setRevision] = useState(0);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTag, setSelectedTag] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [viewMode, setViewMode] = useState('list');
    const [deleting, setDeleting] = useState(null);

    useEffect(() => {
        const controller = new AbortController();
        const timer = setTimeout(async () => {
            setLoading(true);
            setError('');
            try {
                const res = await api.get(blogEndpoints.list, {
                    signal: controller.signal,
                    params: {
                        page: currentPage,
                        limit: POSTS_PER_PAGE,
                        status: filter,
                        search: searchTerm,
                        tag: selectedTag,
                    },
                });
                setPosts(res.data.data.blogs);
                setAllTags(res.data.data.tags);
                setTotalItems(res.data.data.pagination.totalItems);
            } catch (err) {
                if (!controller.signal.aborted)
                    setError(
                        apiErrorMessage(
                            err,
                            'Couldn’t load posts. Check your connection and try again.',
                        ),
                    );
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        }, 250);
        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [currentPage, filter, searchTerm, selectedTag, revision]);

    const deletePost = async (id) => {
        try {
            await api.delete(blogEndpoints.remove(id));
            return { success: true };
        } catch (err) {
            return {
                success: false,
                error: apiErrorMessage(err, 'Couldn’t delete the post'),
            };
        }
    };

    const handleDeletePost = async (id) => {
        const result = await deletePost(id);
        if (result.success) {
            toast.success('Post deleted');
            setCurrentPage(1);
            setRevision((value) => value + 1);
        } else {
            toast.error(result.error);
        }
    };

    const filtersActive = Boolean(searchTerm || selectedTag);
    const clearFilters = () => {
        setSearchTerm('');
        setSelectedTag('');
        setCurrentPage(1);
    };

    const rowActions = (post) => (
        <>
            <Button
                variant='ghost'
                size='sm'
                iconOnly
                icon={Pencil}
                to={blogRoutes.edit(post.slug)}
                aria-label={`Edit ${post.title}`}
            />
            <Button
                variant='ghost'
                size='sm'
                iconOnly
                icon={ExternalLink}
                href={publicUrl(post.slug)}
                target='_blank'
                rel='noreferrer'
                aria-label={`View ${post.title} on the blog`}
            />
            <Button
                variant='ghost'
                size='sm'
                iconOnly
                icon={Trash2}
                className='text-bad-ink hover:text-bad-ink'
                onClick={() => setDeleting(post)}
                aria-label={`Delete ${post.title}`}
            />
        </>
    );

    const byline = (post) =>
        [post.author && `by ${post.author}`, formatShortDate(post.createdAt)]
            .filter(Boolean)
            .join(' · ');

    let content;
    if (error) {
        content = (
            <div className='bg-sheet border border-line rounded-xl'>
                <EmptyState
                    icon={FileText}
                    tone='error'
                    title='Couldn’t load posts'
                    description={error}
                    action={
                        <Button
                            variant='dark'
                            onClick={() => setRevision((value) => value + 1)}
                        >
                            Try again
                        </Button>
                    }
                />
            </div>
        );
    } else if (loading) {
        content = (
            <div className='bg-sheet border border-line rounded-xl overflow-hidden'>
                <SkeletonRows rows={POSTS_PER_PAGE} />
            </div>
        );
    } else if (posts.length === 0) {
        content = (
            <div className='bg-sheet border border-line rounded-xl'>
                <EmptyState
                    icon={FileText}
                    title={
                        filtersActive || filter !== 'all'
                            ? 'No posts match'
                            : 'No posts yet'
                    }
                    description={
                        filtersActive
                            ? 'Try another search or tag, or clear the filters.'
                            : filter === 'draft'
                              ? 'Drafts you save appear here until you publish them.'
                              : 'Posts you write appear here, drafts included.'
                    }
                    action={
                        filtersActive ? (
                            <Button onClick={clearFilters}>
                                Clear filters
                            </Button>
                        ) : (
                            <Button
                                variant='primary'
                                icon={Plus}
                                to={blogRoutes.create}
                            >
                                New post
                            </Button>
                        )
                    }
                />
            </div>
        );
    } else if (viewMode === 'list') {
        content = (
            <ul className='bg-sheet border border-line rounded-xl overflow-hidden'>
                {posts.map((post) => (
                    <li
                        key={post.slug}
                        className='flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-[18px] px-4 sm:px-[18px] py-3.5 border-b border-line-soft last:border-b-0'
                    >
                        <div className='flex-1 min-w-0 flex gap-3 sm:gap-[18px] sm:items-center'>
                            <Banner
                                src={post.banner}
                                className='w-20 h-14 sm:w-32 sm:h-[72px] shrink-0'
                            />
                            <div className='flex-1 min-w-0 flex flex-col gap-1.5'>
                                <div className='flex flex-wrap items-center gap-x-2.5 gap-y-1'>
                                    <Link
                                        to={blogRoutes.edit(post.slug)}
                                        className='min-w-0 max-w-full line-clamp-2 sm:truncate text-[15px] font-semibold text-ink hover:underline'
                                    >
                                        {post.title}
                                    </Link>
                                    <PostStatus post={post} />
                                </div>
                                {post.description && (
                                    <p className='text-[13px] text-muted truncate'>
                                        {post.description}
                                    </p>
                                )}
                                <div className='flex flex-wrap items-center gap-1.5 text-xs text-muted'>
                                    <Tags tags={post.tags} />
                                    <span
                                        className='pl-1'
                                        title={formatDateTime(post.createdAt)}
                                    >
                                        {byline(post)}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className='flex items-center gap-4 sm:gap-0 shrink-0'>
                            <div className='sm:w-[88px] flex sm:flex-col items-baseline sm:items-end gap-1 sm:gap-0.5'>
                                <span className='font-mono text-[13.5px] font-medium text-ink'>
                                    {formatNumber(post.total_reads)}
                                </span>
                                <span className='text-xs text-muted'>
                                    reads
                                </span>
                            </div>
                            <div className='sm:w-[72px] flex sm:flex-col items-baseline sm:items-end gap-1 sm:gap-0.5'>
                                <span className='font-mono text-[13.5px] text-ink'>
                                    {formatNumber(post.total_likes)}
                                </span>
                                <span className='text-xs text-muted'>
                                    likes
                                </span>
                            </div>
                            <div className='flex gap-0.5 ml-auto sm:ml-3'>
                                {rowActions(post)}
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        );
    } else {
        content = (
            <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
                {posts.map((post) => (
                    <article
                        key={post.slug}
                        className='flex flex-col bg-sheet border border-line rounded-xl overflow-hidden hover:border-line-strong transition-colors'
                    >
                        <Banner
                            src={post.banner}
                            className='w-full aspect-[16/9] !rounded-none border-0 border-b border-line-soft'
                        />
                        <div className='flex-1 flex flex-col gap-2.5 p-4'>
                            <div className='flex items-start gap-2'>
                                <Link
                                    to={blogRoutes.edit(post.slug)}
                                    className='flex-1 min-w-0 font-semibold text-ink hover:underline line-clamp-2'
                                >
                                    {post.title}
                                </Link>
                                <PostStatus post={post} />
                            </div>
                            {post.description && (
                                <p className='text-[13px] text-muted line-clamp-2'>
                                    {post.description}
                                </p>
                            )}
                            <div className='flex flex-wrap items-center gap-1.5 text-xs text-muted'>
                                <Tags tags={post.tags} />
                            </div>
                            <div className='flex items-center gap-2 pt-3 mt-auto border-t border-line-soft'>
                                <span className='flex-1 text-xs text-muted'>
                                    <span className='font-mono text-ink'>
                                        {formatNumber(post.total_reads)}
                                    </span>{' '}
                                    reads ·{' '}
                                    <span className='font-mono text-ink'>
                                        {formatNumber(post.total_likes)}
                                    </span>{' '}
                                    likes
                                </span>
                                {rowActions(post)}
                            </div>
                        </div>
                    </article>
                ))}
            </div>
        );
    }

    return (
        <div>
            <PageHeader
                title='Blog posts'
                description='Articles published on blog.studentsenior.com.'
                actions={
                    <>
                        <Button icon={BarChart3} to={blogRoutes.analytics}>
                            Analytics
                        </Button>
                        <Button
                            variant='primary'
                            icon={Plus}
                            to={blogRoutes.create}
                        >
                            New post
                        </Button>
                    </>
                }
            />

            <Tabs
                label='Post status'
                className='mb-4'
                value={filter}
                onChange={(value) => {
                    setFilter(value);
                    setCurrentPage(1);
                }}
                items={STATUS_TABS.map((tab) => ({
                    ...tab,
                    count:
                        tab.value === filter && !loading && !error
                            ? totalItems
                            : undefined,
                }))}
            />

            <FilterBar
                className='mb-4'
                search={searchTerm}
                onSearch={(value) => {
                    setSearchTerm(value);
                    setCurrentPage(1);
                }}
                searchPlaceholder='Search titles and descriptions'
                filters={[
                    {
                        label: 'Tag',
                        value: selectedTag,
                        onChange: (value) => {
                            setSelectedTag(value);
                            setCurrentPage(1);
                        },
                        options: [
                            { value: '', label: 'Any tag' },
                            ...allTags.map((tag) => ({
                                value: tag,
                                label: tag,
                            })),
                        ],
                    },
                ]}
                viewMode={{
                    value: viewMode === 'list' ? 'table' : 'grid',
                    onChange: (value) =>
                        setViewMode(value === 'table' ? 'list' : 'grid'),
                }}
                onClear={clearFilters}
                showClear={filtersActive}
            />

            {content}

            {!error && totalItems > POSTS_PER_PAGE && (
                <div className='mt-4 bg-sheet border border-line rounded-xl px-4 py-3'>
                    <Pagination
                        currentPage={currentPage}
                        totalItems={totalItems}
                        pageSize={POSTS_PER_PAGE}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}

            <ConfirmModal
                isOpen={Boolean(deleting)}
                onClose={() => setDeleting(null)}
                onConfirm={() => handleDeletePost(deleting.slug)}
                title='Delete this post?'
                message={`“${deleting?.title || ''}” comes off the blog straight away, with its reads and likes. This can’t be undone.`}
                confirmText='Delete post'
                variant='danger'
            />
        </div>
    );
};

export default AllPosts;
