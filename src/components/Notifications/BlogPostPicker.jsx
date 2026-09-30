import { useEffect, useId, useState } from 'react';
import { ExternalLink, Loader2, Newspaper, Search } from 'lucide-react';
import api from '../../utils/api';
import { formatDate } from '../../utils/format';
import { blogEndpoints, blogPostUrl } from '../../pages/Blog/blogApi';
import { Button } from '../ui';

/**
 * Picks a published blog post. Shows the newest posts straight away and
 * searches titles and descriptions as you type.
 */
export default function BlogPostPicker({ value, onChange }) {
    const inputId = useId();
    const [query, setQuery] = useState('');
    const [posts, setPosts] = useState([]);
    const [state, setState] = useState('loading');

    useEffect(() => {
        if (value) return undefined;
        const controller = new AbortController();
        const timer = setTimeout(
            async () => {
                setState('loading');
                try {
                    const res = await api.get(blogEndpoints.list, {
                        params: {
                            status: 'published',
                            search: query.trim() || undefined,
                            page: 1,
                            limit: 6,
                        },
                        signal: controller.signal,
                    });
                    setPosts(res.data.data.blogs || []);
                    setState('done');
                } catch {
                    if (!controller.signal.aborted) setState('error');
                }
            },
            query ? 300 : 0,
        );
        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [query, value]);

    if (value) {
        return (
            <div className='flex items-start gap-3 p-3 rounded-lg border border-line bg-sheet'>
                <Newspaper
                    className='w-4 h-4 mt-0.5 text-muted shrink-0'
                    aria-hidden='true'
                />
                <div className='flex-1 min-w-0 flex flex-col gap-0.5'>
                    <span className='text-[13.5px] font-medium text-ink'>
                        {value.title || value.slug}
                    </span>
                    <a
                        href={blogPostUrl(value.slug)}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='inline-flex items-center gap-1 text-xs text-link hover:underline break-all'
                    >
                        {blogPostUrl(value.slug).replace('https://', '')}
                        <ExternalLink
                            className='w-3 h-3 shrink-0'
                            aria-hidden='true'
                        />
                    </a>
                </div>
                <Button
                    size='sm'
                    variant='ghost'
                    onClick={() => onChange(null)}
                >
                    Change
                </Button>
            </div>
        );
    }

    return (
        <div className='flex flex-col gap-1.5'>
            <label htmlFor={inputId} className='text-[12.5px] text-ink-2'>
                Blog post
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
                    placeholder='Search published posts'
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
                    Couldn’t load blog posts. Try again.
                </p>
            )}
            {state === 'done' && posts.length === 0 && (
                <p className='text-[12.5px] text-muted'>
                    {query.trim()
                        ? `No published posts match “${query.trim()}”.`
                        : 'No published posts yet.'}
                </p>
            )}
            {posts.length > 0 && (
                <ul
                    aria-label={
                        query.trim() ? 'Matching posts' : 'Newest posts'
                    }
                    className='flex flex-col rounded-lg border border-line bg-sheet overflow-hidden'
                >
                    {posts.map((post) => (
                        <li
                            key={post._id || post.slug}
                            className='border-b border-line-soft last:border-b-0'
                        >
                            <button
                                type='button'
                                onClick={() =>
                                    onChange({
                                        slug: post.slug,
                                        title: post.title,
                                    })
                                }
                                className='w-full flex items-baseline gap-3 px-3 py-2 text-left hover:bg-sunken cursor-pointer'
                            >
                                <span className='flex-1 min-w-0 text-[13px] text-ink line-clamp-2'>
                                    {post.title}
                                </span>
                                <span className='text-xs text-muted whitespace-nowrap'>
                                    {formatDate(post.createdAt)}
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
