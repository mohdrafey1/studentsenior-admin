import { useId, useRef, useState } from 'react';
import {
    MDXEditor,
    headingsPlugin,
    listsPlugin,
    linkPlugin,
    quotePlugin,
    thematicBreakPlugin,
    markdownShortcutPlugin,
    toolbarPlugin,
    UndoRedo,
    BoldItalicUnderlineToggles,
    BlockTypeSelect,
    linkDialogPlugin,
    CreateLink,
    InsertThematicBreak,
    ListsToggle,
    tablePlugin,
    imagePlugin,
    InsertImage,
    codeBlockPlugin,
    InsertCodeBlock,
    diffSourcePlugin,
    DiffSourceToggleWrapper,
    codeMirrorPlugin,
    directivesPlugin,
    AdmonitionDirectiveDescriptor,
} from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';
import ReactMarkdown from 'react-markdown';
import { Check, Image as ImageIcon, Sparkles, Upload, X } from 'lucide-react';
import { Button, Field, Input, Panel, Textarea } from '../../components/ui';

// Typography plugin colours mapped to the theme tokens, so long-form text
// follows light and dark mode without a `dark:` variant.
const PROSE =
    'prose max-w-none [--tw-prose-body:var(--ss-ink-2)] [--tw-prose-headings:var(--ss-ink)] [--tw-prose-lead:var(--ss-ink-2)] [--tw-prose-links:var(--ss-link)] [--tw-prose-bold:var(--ss-ink)] [--tw-prose-counters:var(--ss-muted)] [--tw-prose-bullets:var(--ss-faint)] [--tw-prose-hr:var(--ss-line)] [--tw-prose-quotes:var(--ss-ink)] [--tw-prose-quote-borders:var(--ss-line-strong)] [--tw-prose-captions:var(--ss-muted)] [--tw-prose-code:var(--ss-ink)] [--tw-prose-pre-code:var(--ss-ink)] [--tw-prose-pre-bg:var(--ss-sunken)] [--tw-prose-th-borders:var(--ss-line-strong)] [--tw-prose-td-borders:var(--ss-line)] font-serif text-[17px] leading-[1.7] prose-headings:font-sans prose-headings:font-semibold';

const MODES = [
    { value: 'editor', label: 'Write' },
    { value: 'preview', label: 'Preview' },
    { value: 'raw', label: 'Markdown' },
];

const CODE_LANGUAGES = {
    js: 'JavaScript',
    jsx: 'JSX',
    ts: 'TypeScript',
    tsx: 'TSX',
    json: 'JSON',
    html: 'HTML',
    css: 'CSS',
    bash: 'Bash',
    python: 'Python',
    sql: 'SQL',
    yaml: 'YAML',
    txt: 'Plain text',
};

const safeGroup = (group) =>
    Array.isArray(group)
        ? group
        : typeof group === 'object'
          ? Object.values(group)
          : [String(group)];

function Counter({ value, max }) {
    return (
        <span className='font-mono text-[11.5px] text-muted'>
            {value}/{max}
        </span>
    );
}

/**
 * Everything on the blog editor page below the header: the writing area
 * with Write / Preview / Markdown modes, and the side column with the
 * publish checklist, post details and summary cards. BlogCreate and
 * BlogEdit own the state and the requests; this only renders them.
 */
export default function BlogEditorForm({
    formData,
    setFormData,
    errors,
    activeTab,
    setActiveTab,
    isDark,
    editorKey,
    tagInput,
    setTagInput,
    onAddTag,
    onRemoveTag,
    onUpload,
    onGenerateSummary,
    isGenerating,
}) {
    const fileRef = useRef(null);
    const tagId = useId();
    const [uploading, setUploading] = useState(false);
    const [dragging, setDragging] = useState(false);

    const update = (key, value) => setFormData((p) => ({ ...p, [key]: value }));

    const upload = async (event) => {
        setUploading(true);
        try {
            await onUpload(event);
        } finally {
            setUploading(false);
            if (fileRef.current) fileRef.current.value = '';
        }
    };

    const tags = formData.tags || [];
    const checks = [
        ['Title written', Boolean(formData.title.trim())],
        ['Post body written', Boolean(formData.content.trim())],
        [
            'URL uses lowercase words and hyphens',
            /^[a-z0-9-]+$/.test(formData.slug),
        ],
        ['Banner is an https:// link', formData.banner.startsWith('https://')],
        ['Author named', Boolean(formData.author.trim())],
        ['At least one tag', tags.length > 0],
    ];

    return (
        <div className='grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start'>
            <section
                aria-label='Post content'
                className='min-w-0 bg-sheet border border-line rounded-xl overflow-hidden'
            >
                <div className='flex items-center gap-2 h-12 px-2.5 border-b border-line-soft bg-sunken'>
                    <div
                        role='tablist'
                        aria-label='Editor mode'
                        className='inline-flex p-[3px] rounded-lg bg-ground'
                    >
                        {MODES.map((mode) => {
                            const selected = activeTab === mode.value;
                            return (
                                <button
                                    key={mode.value}
                                    type='button'
                                    role='tab'
                                    aria-selected={selected}
                                    onClick={() => setActiveTab(mode.value)}
                                    className={`h-7 px-2.5 rounded-md text-[12.5px] cursor-pointer transition-colors ${
                                        selected
                                            ? 'bg-sheet text-ink font-medium shadow-[0_1px_2px_rgba(28,27,24,0.08)]'
                                            : 'text-ink-2 hover:text-ink'
                                    }`}
                                >
                                    {mode.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {activeTab !== 'preview' && (
                    <div className='px-5 sm:px-8 pt-6'>
                        <label htmlFor='post-title' className='sr-only'>
                            Title
                        </label>
                        <textarea
                            id='post-title'
                            name='title'
                            rows={1}
                            value={formData.title || ''}
                            onChange={(e) =>
                                update(
                                    'title',
                                    e.target.value.replace(/\n/g, ' '),
                                )
                            }
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') e.preventDefault();
                            }}
                            placeholder='Post title'
                            aria-invalid={errors.title ? true : undefined}
                            aria-describedby={
                                errors.title ? 'post-title-error' : undefined
                            }
                            className='block w-full resize-none field-sizing-content bg-transparent border-0 outline-none p-0 font-serif font-bold text-[26px] sm:text-[32px] leading-tight tracking-[-0.4px] text-ink placeholder:text-faint'
                        />
                        {errors.title && (
                            <p
                                id='post-title-error'
                                className='mt-1 text-[12.5px] text-bad-ink'
                            >
                                {errors.title}
                            </p>
                        )}
                    </div>
                )}

                <div className='min-h-[60vh]'>
                    {activeTab === 'editor' && (
                        <div className='px-2 sm:px-5 pb-6'>
                            <MDXEditor
                                key={editorKey}
                                markdown={formData.content}
                                className={
                                    isDark ? 'dark-theme dark-editor' : ''
                                }
                                contentEditableClassName={`${PROSE} min-h-[50vh]`}
                                onChange={(c) => update('content', c)}
                                plugins={[
                                    headingsPlugin(),
                                    listsPlugin(),
                                    linkPlugin(),
                                    linkDialogPlugin(),
                                    quotePlugin(),
                                    tablePlugin(),
                                    thematicBreakPlugin(),
                                    markdownShortcutPlugin(),
                                    imagePlugin(),
                                    codeBlockPlugin({
                                        defaultCodeBlockLanguage: 'js',
                                    }),
                                    codeMirrorPlugin({
                                        // Without registered languages the
                                        // "Insert code block" button renders
                                        // disabled, and fenced blocks in
                                        // existing posts have no editor.
                                        codeBlockLanguages: CODE_LANGUAGES,
                                    }),
                                    directivesPlugin({
                                        directiveDescriptors: [
                                            AdmonitionDirectiveDescriptor,
                                        ],
                                    }),
                                    diffSourcePlugin({ viewMode: 'rich-text' }),
                                    toolbarPlugin({
                                        toolbarContents: () => (
                                            <DiffSourceToggleWrapper>
                                                <UndoRedo />
                                                <BoldItalicUnderlineToggles />
                                                <BlockTypeSelect />
                                                <CreateLink />
                                                <InsertImage />
                                                <InsertThematicBreak />
                                                <ListsToggle />
                                                <InsertCodeBlock />
                                            </DiffSourceToggleWrapper>
                                        ),
                                    }),
                                ]}
                            />
                        </div>
                    )}

                    {activeTab === 'preview' && (
                        <article className='max-w-[720px] px-5 sm:px-12 py-8 flex flex-col gap-3.5'>
                            {formData.banner ? (
                                <img
                                    src={formData.banner}
                                    alt=''
                                    className='w-full aspect-[16/7] object-cover rounded-xl bg-sunken'
                                />
                            ) : (
                                <div className='w-full aspect-[16/7] rounded-xl bg-sunken border border-line-soft flex items-center justify-center text-[13px] text-muted'>
                                    No banner image yet
                                </div>
                            )}
                            {tags.length > 0 && (
                                <span className='eyebrow'>
                                    {tags.join(' · ')}
                                </span>
                            )}
                            <h1 className='font-serif font-bold text-[28px] sm:text-[34px] leading-tight text-ink break-words'>
                                {formData.title || 'Untitled post'}
                            </h1>
                            {formData.author && (
                                <span className='text-[13px] text-muted'>
                                    {formData.author}
                                </span>
                            )}
                            <div className={PROSE}>
                                <ReactMarkdown skipHtml>
                                    {formData.content}
                                </ReactMarkdown>
                            </div>
                        </article>
                    )}

                    {activeTab === 'raw' && (
                        <div className='px-5 sm:px-8 py-5'>
                            <label htmlFor='post-markdown' className='sr-only'>
                                Post body in Markdown
                            </label>
                            <textarea
                                id='post-markdown'
                                className='w-full h-[60vh] p-3 rounded-lg border border-line-strong bg-sheet font-mono text-[13px] leading-relaxed text-ink focus:outline-none focus:ring-2 focus:ring-brand/30'
                                value={formData.content}
                                onChange={(e) =>
                                    update('content', e.target.value)
                                }
                            />
                        </div>
                    )}
                </div>

                {errors.content && (
                    <p className='px-5 sm:px-8 pb-4 text-[12.5px] text-bad-ink'>
                        {errors.content}
                    </p>
                )}
            </section>

            <aside aria-label='Post settings' className='flex flex-col gap-4'>
                <Panel
                    title='Ready to publish?'
                    titleId='ready-title'
                    bodyClassName='px-5 py-4'
                >
                    <ul className='flex flex-col gap-2.5'>
                        {checks.map(([label, done]) => (
                            <li
                                key={label}
                                className='flex items-center gap-2.5 text-[13px]'
                            >
                                <span
                                    aria-hidden='true'
                                    className={`w-[18px] h-[18px] rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold ${
                                        done
                                            ? 'bg-ok-soft text-ok-ink'
                                            : 'bg-warn-soft text-warn-ink'
                                    }`}
                                >
                                    {done ? <Check className='w-3 h-3' /> : '!'}
                                </span>
                                <span
                                    className={
                                        done ? 'text-ink' : 'text-warn-ink'
                                    }
                                >
                                    <span className='sr-only'>
                                        {done ? 'Done: ' : 'To do: '}
                                    </span>
                                    {label}
                                </span>
                            </li>
                        ))}
                    </ul>
                </Panel>

                <Panel
                    title='Post details'
                    titleId='details-title'
                    bodyClassName='px-5 py-4 flex flex-col gap-4'
                >
                    <Field
                        label='URL'
                        error={errors.slug}
                        hint={`blog.studentsenior.com/${formData.slug || 'your-post'}`}
                    >
                        <Input
                            name='slug'
                            value={formData.slug || ''}
                            onChange={(e) => update('slug', e.target.value)}
                            className='font-mono text-[12.5px]'
                        />
                    </Field>

                    <Field label='Author' error={errors.author}>
                        <Input
                            name='author'
                            value={formData.author || ''}
                            onChange={(e) => update('author', e.target.value)}
                        />
                    </Field>

                    <div className='flex flex-col gap-1.5'>
                        <div className='flex items-baseline'>
                            <label
                                htmlFor='post-description'
                                className='flex-1 text-[13px] font-medium text-ink'
                            >
                                Description
                            </label>
                            <Counter
                                value={(formData.description || '').length}
                                max={200}
                            />
                        </div>
                        <Textarea
                            id='post-description'
                            name='description'
                            rows={3}
                            value={formData.description || ''}
                            onChange={(e) =>
                                update('description', e.target.value)
                            }
                            maxLength={200}
                            aria-invalid={errors.description ? true : undefined}
                        />
                        {errors.description && (
                            <p className='text-[12.5px] text-bad-ink'>
                                {errors.description}
                            </p>
                        )}
                    </div>

                    <div className='flex flex-col gap-1.5'>
                        <span className='text-[13px] font-medium text-ink'>
                            Banner image
                        </span>
                        <div
                            onDragOver={(e) => {
                                e.preventDefault();
                                setDragging(true);
                            }}
                            onDragLeave={() => setDragging(false)}
                            onDrop={(e) => {
                                e.preventDefault();
                                setDragging(false);
                                if (e.dataTransfer.files?.length)
                                    upload({
                                        target: {
                                            files: e.dataTransfer.files,
                                        },
                                    });
                            }}
                            className={`relative aspect-[16/9] rounded-[10px] border border-dashed overflow-hidden flex flex-col items-center justify-center gap-2 text-center p-3 ${
                                dragging
                                    ? 'border-brand bg-brand-soft'
                                    : 'border-faint bg-sunken'
                            }`}
                        >
                            {formData.banner && !dragging ? (
                                <img
                                    src={formData.banner}
                                    alt='Banner preview'
                                    className='absolute inset-0 w-full h-full object-cover'
                                />
                            ) : (
                                <>
                                    {uploading ? (
                                        <ImageIcon
                                            className='w-5 h-5 text-muted animate-pulse'
                                            aria-hidden='true'
                                        />
                                    ) : (
                                        <Upload
                                            className='w-5 h-5 text-muted'
                                            aria-hidden='true'
                                        />
                                    )}
                                    <span className='text-[12.5px] text-ink-2'>
                                        {uploading
                                            ? 'Uploading…'
                                            : 'Drop an image here, or upload one'}
                                    </span>
                                </>
                            )}
                        </div>
                        <div className='flex gap-2'>
                            <Input
                                name='banner'
                                aria-label='Banner image link'
                                value={formData.banner}
                                onChange={(e) =>
                                    update('banner', e.target.value)
                                }
                                placeholder='https://…'
                                aria-invalid={errors.banner ? true : undefined}
                                className='font-mono text-[12px]'
                            />
                            <Button
                                icon={Upload}
                                onClick={() => fileRef.current?.click()}
                                disabled={uploading}
                            >
                                {uploading ? 'Uploading…' : 'Upload'}
                            </Button>
                            <input
                                ref={fileRef}
                                type='file'
                                accept='image/*'
                                onChange={upload}
                                className='sr-only'
                                tabIndex={-1}
                                aria-hidden='true'
                            />
                        </div>
                        {errors.banner && (
                            <p className='text-[12.5px] text-bad-ink'>
                                {errors.banner}
                            </p>
                        )}
                    </div>

                    <div className='flex flex-col gap-1.5'>
                        <label
                            htmlFor={tagId}
                            className='text-[13px] font-medium text-ink'
                        >
                            Tags
                        </label>
                        <div
                            className={`flex flex-wrap items-center gap-1.5 min-h-9 px-1.5 py-1 rounded-lg border bg-sheet focus-within:ring-2 focus-within:ring-brand/30 ${
                                errors.tags
                                    ? 'border-bad'
                                    : 'border-line-strong'
                            }`}
                        >
                            {tags.map((t) => (
                                <span
                                    key={t}
                                    className='inline-flex items-center gap-1 h-6 pl-2 pr-1 rounded-md bg-ground text-[12.5px] text-ink'
                                >
                                    {t}
                                    <button
                                        type='button'
                                        onClick={() => onRemoveTag(t)}
                                        aria-label={`Remove ${t}`}
                                        className='w-[18px] h-[18px] rounded flex items-center justify-center text-muted hover:text-ink hover:bg-sunken cursor-pointer'
                                    >
                                        <X
                                            className='w-3 h-3'
                                            aria-hidden='true'
                                        />
                                    </button>
                                </span>
                            ))}
                            <input
                                id={tagId}
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={onAddTag}
                                placeholder='Add a tag, press Enter'
                                className='flex-1 min-w-[120px] h-6 px-1 bg-transparent border-0 outline-none text-[12.5px] text-ink placeholder:text-muted'
                            />
                        </div>
                        {errors.tags && (
                            <p className='text-[12.5px] text-bad-ink'>
                                {errors.tags}
                            </p>
                        )}
                    </div>
                </Panel>

                <Panel
                    title='Summary cards'
                    titleId='summary-title'
                    action={
                        <Button
                            size='sm'
                            icon={Sparkles}
                            onClick={onGenerateSummary}
                            disabled={isGenerating}
                        >
                            {isGenerating ? 'Generating…' : 'Generate'}
                        </Button>
                    }
                    bodyClassName='px-5 py-4 flex flex-col gap-3'
                >
                    <p className='text-[12.5px] text-muted'>
                        Short groups of sentences that sum up the post, written
                        by AI from the body. Edit them before saving.
                    </p>
                    {formData.aiSummary.length === 0 ? (
                        <p className='text-[12.5px] text-muted'>
                            No summary yet.
                        </p>
                    ) : (
                        <ul className='flex flex-col gap-2.5'>
                            {formData.aiSummary.map((group, groupIdx) => (
                                <li
                                    key={groupIdx}
                                    className='flex flex-col gap-1.5 px-3 py-2.5 rounded-[10px] bg-sunken border border-line-soft'
                                >
                                    <div className='flex items-center'>
                                        <span className='eyebrow flex-1'>
                                            Group {groupIdx + 1}
                                        </span>
                                        <button
                                            type='button'
                                            onClick={() =>
                                                setFormData((p) => ({
                                                    ...p,
                                                    aiSummary:
                                                        p.aiSummary.filter(
                                                            (_, i) =>
                                                                i !== groupIdx,
                                                        ),
                                                }))
                                            }
                                            aria-label={`Remove group ${groupIdx + 1}`}
                                            className='w-6 h-6 rounded-md flex items-center justify-center text-muted hover:text-bad-ink hover:bg-bad-soft cursor-pointer'
                                        >
                                            <X
                                                className='w-3.5 h-3.5'
                                                aria-hidden='true'
                                            />
                                        </button>
                                    </div>
                                    {safeGroup(group).map(
                                        (sentence, sentIdx) => (
                                            <textarea
                                                key={sentIdx}
                                                rows={2}
                                                aria-label={`Group ${groupIdx + 1}, sentence ${sentIdx + 1}`}
                                                value={sentence}
                                                onChange={(e) => {
                                                    const updated = [
                                                        ...formData.aiSummary,
                                                    ];
                                                    const grp = Array.isArray(
                                                        updated[groupIdx],
                                                    )
                                                        ? [...updated[groupIdx]]
                                                        : [
                                                              String(
                                                                  updated[
                                                                      groupIdx
                                                                  ],
                                                              ),
                                                          ];
                                                    grp[sentIdx] =
                                                        e.target.value;
                                                    updated[groupIdx] = grp;
                                                    setFormData((p) => ({
                                                        ...p,
                                                        aiSummary: updated,
                                                    }));
                                                }}
                                                className='w-full resize-none rounded-md border border-transparent bg-transparent px-1.5 py-1 text-[13px] leading-snug text-ink hover:border-line focus:border-line-strong focus:bg-sheet focus:outline-none'
                                            />
                                        ),
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </Panel>
            </aside>
        </div>
    );
}
