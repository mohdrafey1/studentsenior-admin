import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    ArrowRight,
    FileQuestion,
    Loader2,
    Pencil,
    Sparkles,
    Upload,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import api, { apiErrorMessage } from '../../utils/api';
import { formatDateTime, formatNumber } from '../../utils/format';
import { examTypeLabel } from '../../utils/labels';
import { relativeTime } from '../../utils/relativeTime';
import { SOLUTION_PROMPTS } from '../../constants/prompts';
import ManualPyqSolutionModal from '../../components/ManualPyqSolutionModal';
import Loader from '../../components/Common/Loader';
import {
    Alert,
    Button,
    EmptyState,
    MetaList,
    PageHeader,
    Panel,
    Segmented,
    StatusBadge,
    Textarea,
} from '../../components/ui';

const VERSIONS = [
    ['concise', 'Concise'],
    ['expert', 'Expert'],
];

// Full-paper prompts are long; one-line edits are short. Split them so the
// panel shows "Prompt style" and "Quick edits" as separate groups.
const PROMPT_STYLES = SOLUTION_PROMPTS.filter((p) => p.prompt.length > 200);
const QUICK_EDITS = SOLUTION_PROMPTS.filter((p) => p.prompt.length <= 200);

// Markdown styles in the console's palette (light and dark via tokens).
const PROSE = [
    'prose max-w-none text-[14.5px] leading-relaxed',
    '[--tw-prose-body:var(--ss-ink-2)] [--tw-prose-headings:var(--ss-ink)] [--tw-prose-bold:var(--ss-ink)]',
    '[--tw-prose-links:var(--ss-link)] [--tw-prose-code:var(--ss-ink)] [--tw-prose-pre-code:var(--ss-ink)]',
    '[--tw-prose-pre-bg:var(--ss-sunken)] [--tw-prose-bullets:var(--ss-muted)] [--tw-prose-counters:var(--ss-muted)]',
    '[--tw-prose-hr:var(--ss-line)] [--tw-prose-quotes:var(--ss-ink-2)] [--tw-prose-quote-borders:var(--ss-line-strong)]',
    '[--tw-prose-th-borders:var(--ss-line)] [--tw-prose-td-borders:var(--ss-line-soft)] [--tw-prose-captions:var(--ss-muted)]',
    'prose-h2:font-serif prose-h2:text-xl prose-h3:text-[15px]',
    'prose-code:before:content-none prose-code:after:content-none prose-code:font-normal prose-code:text-[13px] prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:bg-ground',
    'prose-pre:border prose-pre:border-line-soft prose-pre:rounded-[10px] prose-pre:text-[12.5px]',
].join(' ');

const countWords = (text = '') =>
    text.trim().split(/\s+/).filter(Boolean).length;

const chipClass = (on) =>
    `h-7 px-2.5 rounded-full border text-[12.5px] cursor-pointer transition-colors ${
        on
            ? 'border-brand bg-brand-soft text-brand-ink'
            : 'border-line-strong bg-sheet text-ink-2 hover:text-ink'
    }`;

const PyqSolutionPage = () => {
    const { collegeslug, pyqid } = useParams();

    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [notFound, setNotFound] = useState(false);
    const [solution, setSolution] = useState(null);
    const [activeTab, setActiveTab] = useState('concise');
    const [aiLoading, setAiLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState('');
    const [mode, setMode] = useState('markdown'); // while editing
    const [saving, setSaving] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [solutionUpdating, setSolutionUpdating] = useState(false);
    const [pyqDetails, setPyqDetails] = useState(null);
    const [isManualModalOpen, setIsManualModalOpen] = useState(false);
    // The server decides the AI provider (AI_PROVIDER); it lists the models
    // it can use. Empty means "server default".
    const [models, setModels] = useState([]);
    const [selectedModel, setSelectedModel] = useState('');

    useEffect(() => {
        let active = true;
        api.get('/quicknotes/models')
            .then((res) => {
                const list = Array.isArray(res.data?.data) ? res.data.data : [];
                if (!active || !list.length) return;
                setModels(list.map((m) => [m.id, m.name || m.id]));
                setSelectedModel(list[0].id);
            })
            .catch(() => {});
        return () => {
            active = false;
        };
    }, []);

    const fetchData = useCallback(async () => {
        try {
            setLoadError(null);
            const [pyqRes, solRes] = await Promise.all([
                api.get(`/pyq/${pyqid}`),
                api.get(`/pyq-solution/${pyqid}`),
            ]);

            if (pyqRes.data.success) {
                setPyqDetails(pyqRes.data.data);
            }

            if (solRes.data.success && solRes.data.data) {
                setSolution(solRes.data.data);
            }
        } catch (error) {
            console.error('Failed to load data:', error);
            setNotFound(error.response?.status === 404);
            setLoadError(
                error.response?.status === 404
                    ? 'This PYQ doesn’t exist or was deleted.'
                    : 'Couldn’t load this PYQ’s solutions. Check your connection and try again.',
            );
        } finally {
            setLoading(false);
        }
    }, [pyqid]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleGenerate = async () => {
        if (!pyqDetails?.fileUrl) {
            toast.error('This PYQ has no PDF to read');
            return;
        }

        try {
            setAiLoading(true);
            const res = await api.post('/pyq-solution/generate', {
                pyqId: pyqid,
                ...(selectedModel && { model: selectedModel }),
            });

            if (res.data.success) {
                toast.success('Solutions generated');
                setSolution(res.data.data);
            }
        } catch (error) {
            console.error('Generation Error:', error);
            toast.error(
                apiErrorMessage(
                    error,
                    'Couldn’t generate solutions. Try again.',
                ),
            );
        } finally {
            setAiLoading(false);
        }
    };

    const handleUpdate = async () => {
        if (!solution || !chatInput.trim()) return;

        try {
            setSolutionUpdating(true);
            const res = await api.put('/pyq-solution/update', {
                solutionId: solution._id,
                type: activeTab,
                userPrompt: chatInput,
            });

            if (res.data.success) {
                toast.success('Rewrite ready to check');
                setChatInput('');
                setEditContent(res.data.data.generatedContent);
                setIsEditing(true);
                setMode('preview');
            }
        } catch (error) {
            console.error(error);
            toast.error(
                apiErrorMessage(
                    error,
                    'Couldn’t refine the solution. Try again.',
                ),
            );
        } finally {
            setSolutionUpdating(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const payload = {
                type: activeTab,
                content: editContent,
            };

            if (solution) {
                payload.solutionId = solution._id;
            } else {
                payload.pyqId = pyqid;
            }

            const res = await api.put('/pyq-solution/save', payload);

            if (res.data.success) {
                toast.success(
                    `${activeTab === 'concise' ? 'Concise' : 'Expert'} solution saved`,
                );
                setIsEditing(false);
                setSolution(res.data.data);
            }
        } catch (error) {
            console.error(error);
            toast.error('Couldn’t save the solution. Try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleManualImport = async (parsedJson) => {
        try {
            setAiLoading(true); // Re-using aiLoading for modal loading state

            const payload = {
                pyqId: pyqid,
                type: 'both',
                conciseContent: parsedJson.concise,
                expertContent: parsedJson.expert,
            };

            if (solution) {
                payload.solutionId = solution._id;
            }

            const res = await api.put('/pyq-solution/save', payload);

            if (res.data.success) {
                toast.success('Solutions imported');
                setSolution(res.data.data);
                setIsManualModalOpen(false);
            }
        } catch (error) {
            console.error(error);
            toast.error('Couldn’t save the imported solutions. Try again.');
        } finally {
            setAiLoading(false);
        }
    };

    const getCurrentContent = () =>
        activeTab === 'concise'
            ? solution?.conciseContent
            : solution?.expertContent;

    const toggleEdit = () => {
        if (isEditing) {
            setIsEditing(false);
            setEditContent('');
        } else {
            const content = getCurrentContent();
            if (content) {
                setEditContent(content);
                setIsEditing(true);
                setMode('markdown');
            }
        }
    };

    const writeByHand = () => {
        setIsEditing(true);
        setMode('markdown');
    };

    if (loading) return <Loader />;

    if (loadError || !pyqDetails) {
        return (
            <div className='min-h-full px-4 sm:px-10 pt-8 pb-12'>
                <div className='bg-sheet border border-line rounded-xl'>
                    <EmptyState
                        icon={FileQuestion}
                        tone='error'
                        title='Couldn’t open the solution editor'
                        description={
                            loadError ||
                            'This PYQ doesn’t exist or was deleted.'
                        }
                        action={
                            <div className='flex flex-wrap justify-center gap-2'>
                                {!notFound && (
                                    <Button
                                        onClick={() => {
                                            setLoading(true);
                                            fetchData();
                                        }}
                                    >
                                        Try again
                                    </Button>
                                )}
                                <Button to={`/${collegeslug}/pyqs`}>
                                    Back to PYQs
                                </Button>
                            </div>
                        }
                    />
                </div>
            </div>
        );
    }

    const subject = pyqDetails.subject || {};
    const title = [
        subject.subjectName || 'Untitled subject',
        [examTypeLabel(pyqDetails.examType), pyqDetails.year]
            .filter(Boolean)
            .join(' '),
    ]
        .filter(Boolean)
        .join(' — ');
    const content = getCurrentContent();
    const versionName = activeTab === 'concise' ? 'concise' : 'expert';
    const shownText = isEditing ? editContent : content || '';
    const requests = pyqDetails.solutionRequestCount || 0;
    const generating = aiLoading && !isManualModalOpen;

    return (
        <div className='min-h-full px-4 sm:px-10 pt-8 pb-12'>
            <PageHeader
                eyebrow={['AI solutions', subject.subjectCode]
                    .filter(Boolean)
                    .join(' · ')}
                badge={
                    solution ? (
                        <>
                            <StatusBadge tone='ok'>Saved</StatusBadge>
                            {solution.lastUpdated && (
                                <span className='text-[13px] text-muted'>
                                    Updated {relativeTime(solution.lastUpdated)}
                                </span>
                            )}
                        </>
                    ) : (
                        <StatusBadge tone='neutral'>
                            No solution yet
                        </StatusBadge>
                    )
                }
                title={title}
                actions={
                    !solution && (
                        <>
                            {models.length > 0 && (
                                <label className='inline-flex items-center gap-1 h-9 pl-3 pr-1 rounded-lg border border-line-strong bg-sheet text-[13px] text-muted'>
                                    Model
                                    <select
                                        value={selectedModel}
                                        onChange={(e) =>
                                            setSelectedModel(e.target.value)
                                        }
                                        disabled={aiLoading}
                                        className='h-8 pl-1 pr-1 bg-transparent text-[13px] font-medium text-ink rounded-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand/30'
                                    >
                                        {models.map(([value, label]) => (
                                            <option key={value} value={value}>
                                                {label}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            )}
                            <Button
                                icon={Upload}
                                onClick={() => setIsManualModalOpen(true)}
                                disabled={aiLoading}
                            >
                                Manual import
                            </Button>
                            <Button
                                variant='primary'
                                icon={generating ? Loader2 : Sparkles}
                                className={
                                    generating ? '[&>svg]:animate-spin' : ''
                                }
                                onClick={handleGenerate}
                                disabled={aiLoading}
                            >
                                {generating
                                    ? 'Generating…'
                                    : 'Generate solutions'}
                            </Button>
                        </>
                    )
                }
            />

            {generating && (
                <Alert tone='info' className='mb-5'>
                    Reading the PDF and writing both versions. This can take a
                    minute; keep this page open.
                </Alert>
            )}

            <div className='grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-5 items-start'>
                <section
                    aria-label='Solution'
                    className='min-w-0 bg-sheet border border-line rounded-xl overflow-hidden'
                >
                    <div className='flex flex-wrap items-center gap-x-3 gap-y-2 pl-5 pr-3 border-b border-line-soft'>
                        <div
                            role='tablist'
                            aria-label='Solution version'
                            className='flex gap-5 flex-1 min-w-[160px]'
                        >
                            {VERSIONS.map(([value, label]) => {
                                const selected = value === activeTab;
                                const locked = isEditing && !selected;
                                return (
                                    <button
                                        key={value}
                                        type='button'
                                        role='tab'
                                        aria-selected={selected}
                                        disabled={locked}
                                        title={
                                            locked
                                                ? 'Save or discard your changes first'
                                                : undefined
                                        }
                                        onClick={() => setActiveTab(value)}
                                        className={`h-[46px] px-0.5 -mb-px border-b-2 text-[13.5px] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 transition-colors ${
                                            selected
                                                ? 'border-ink text-ink font-medium'
                                                : 'border-transparent text-muted hover:text-ink'
                                        }`}
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                        {shownText && (
                            <span className='text-[12.5px] text-muted'>
                                {formatNumber(countWords(shownText))} words
                            </span>
                        )}
                        {(content || isEditing) && (
                            <Segmented
                                label='View'
                                className='my-2'
                                value={isEditing ? mode : 'preview'}
                                onChange={(value) => {
                                    if (isEditing) setMode(value);
                                    else if (value === 'markdown') toggleEdit();
                                }}
                                options={[
                                    { value: 'preview', label: 'Preview' },
                                    { value: 'markdown', label: 'Markdown' },
                                ]}
                            />
                        )}
                    </div>

                    {isEditing && (
                        <div className='flex flex-wrap items-center gap-2 px-5 py-2.5 bg-warn-soft text-warn-ink border-b border-line-soft'>
                            <span className='flex-1 min-w-[180px] text-[13px]'>
                                Unsaved changes to the {versionName} solution.
                            </span>
                            <Button
                                size='sm'
                                variant='ghost'
                                onClick={toggleEdit}
                                disabled={saving}
                                className='text-warn-ink hover:text-warn-ink'
                            >
                                Discard
                            </Button>
                            <Button
                                size='sm'
                                variant='primary'
                                onClick={handleSave}
                                disabled={saving}
                                icon={saving ? Loader2 : undefined}
                                className={saving ? '[&>svg]:animate-spin' : ''}
                            >
                                {saving ? 'Saving…' : `Save ${versionName}`}
                            </Button>
                        </div>
                    )}

                    {content || isEditing ? (
                        isEditing && mode === 'markdown' ? (
                            <div className='p-4'>
                                <Textarea
                                    aria-label={`${versionName} solution in Markdown`}
                                    value={editContent}
                                    onChange={(e) =>
                                        setEditContent(e.target.value)
                                    }
                                    rows={24}
                                    className='font-mono text-[13px] leading-relaxed min-h-[520px]'
                                    placeholder={`Write the ${versionName} solution in Markdown…`}
                                />
                            </div>
                        ) : (
                            <article className={`px-5 sm:px-10 py-7 ${PROSE}`}>
                                {shownText ? (
                                    <ReactMarkdown>{shownText}</ReactMarkdown>
                                ) : (
                                    <p className='text-muted'>
                                        Nothing written yet. Switch to Markdown
                                        to write the solution.
                                    </p>
                                )}
                            </article>
                        )
                    ) : (
                        <EmptyState
                            icon={Sparkles}
                            className='min-h-[420px]'
                            title={`No ${versionName} solution yet`}
                            description={
                                solution
                                    ? `Only the other version was saved. Write the ${versionName} one by hand.`
                                    : 'Generate both versions with AI or import them with the buttons above, or write this one by hand.'
                            }
                            action={
                                <Button icon={Pencil} onClick={writeByHand}>
                                    Write by hand
                                </Button>
                            }
                        />
                    )}
                </section>

                <aside
                    aria-label='Tools'
                    className='flex flex-col gap-4 min-w-0'
                >
                    {solution && (
                        <Panel
                            title='Refine with AI'
                            titleId='refine-title'
                            action={
                                !isEditing &&
                                content && (
                                    <Button
                                        size='sm'
                                        icon={Pencil}
                                        onClick={toggleEdit}
                                    >
                                        Edit by hand
                                    </Button>
                                )
                            }
                            bodyClassName='px-5 py-4 flex flex-col gap-3.5'
                        >
                            {[
                                ['Prompt style', PROMPT_STYLES],
                                ['Quick edits', QUICK_EDITS],
                            ].map(
                                ([heading, prompts]) =>
                                    prompts.length > 0 && (
                                        <div
                                            key={heading}
                                            className='flex flex-col gap-1.5'
                                        >
                                            <span className='eyebrow'>
                                                {heading}
                                            </span>
                                            <div className='flex flex-wrap gap-1.5'>
                                                {prompts.map((item) => (
                                                    <button
                                                        key={item.label}
                                                        type='button'
                                                        aria-pressed={
                                                            chatInput ===
                                                            item.prompt
                                                        }
                                                        onClick={() =>
                                                            setChatInput(
                                                                item.prompt,
                                                            )
                                                        }
                                                        className={chipClass(
                                                            chatInput ===
                                                                item.prompt,
                                                        )}
                                                    >
                                                        {item.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ),
                            )}
                            <label
                                htmlFor='refine-instructions'
                                className='mt-1 text-[13px] font-medium text-ink'
                            >
                                Your instructions
                            </label>
                            <Textarea
                                id='refine-instructions'
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                rows={4}
                                placeholder='Add a worked example for question 2'
                                aria-describedby='refine-hint'
                            />
                            <Button
                                variant='dark'
                                onClick={handleUpdate}
                                disabled={solutionUpdating || !chatInput.trim()}
                                className={`w-full ${solutionUpdating ? '[&>svg]:animate-spin' : ''}`}
                                icon={solutionUpdating ? Loader2 : undefined}
                            >
                                {solutionUpdating
                                    ? 'Rewriting…'
                                    : `Apply to ${versionName}`}
                                {!solutionUpdating && (
                                    <ArrowRight
                                        className='w-[15px] h-[15px]'
                                        aria-hidden='true'
                                    />
                                )}
                            </Button>
                            <p
                                id='refine-hint'
                                className='text-[12.5px] text-muted'
                            >
                                The rewrite opens here unsaved, so you can check
                                it before saving.
                            </p>
                        </Panel>
                    )}

                    <Panel
                        title='This PYQ'
                        titleId='pyq-title'
                        bodyClassName='px-5 py-4 flex flex-col gap-3'
                    >
                        {requests > 0 && (
                            <p className='text-[13px] text-warn-ink'>
                                {formatNumber(requests)} student
                                {requests === 1 ? ' has' : 's have'} asked for a
                                solution.
                            </p>
                        )}
                        <MetaList
                            labelWidth={88}
                            items={[
                                {
                                    label: 'Subject',
                                    value: subject.subjectName,
                                },
                                {
                                    label: 'Code',
                                    value: subject.subjectCode,
                                    mono: true,
                                },
                                { label: 'Year', value: pyqDetails.year },
                                {
                                    label: 'Exam',
                                    value: examTypeLabel(pyqDetails.examType),
                                },
                                solution && {
                                    label: 'Saved',
                                    value: formatDateTime(solution.lastUpdated),
                                },
                            ]}
                        />
                        <Button
                            variant='link'
                            size='sm'
                            to={`/${collegeslug}/pyqs/${pyqid}`}
                            className='self-start'
                        >
                            Back to the PYQ
                        </Button>
                    </Panel>
                </aside>
            </div>

            <ManualPyqSolutionModal
                isOpen={isManualModalOpen}
                onClose={() => setIsManualModalOpen(false)}
                onImport={handleManualImport}
                loading={aiLoading}
            />
        </div>
    );
};

export default PyqSolutionPage;
