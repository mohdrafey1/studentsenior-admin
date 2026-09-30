import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import {
    BookOpen,
    Eye,
    EyeOff,
    KeyRound,
    Loader2,
    Pencil,
    RefreshCw,
    Save,
    Send,
    Sparkles,
} from 'lucide-react';
import Loader from '../../components/Common/Loader';
import { formatShortDateTime } from '../../utils/format';
import {
    Button,
    Dialog,
    EmptyState,
    Field,
    Input,
    PageHeader,
    Textarea,
} from '../../components/ui';
import { PROSE_CLASS } from './catalogUtils';

const DEFAULT_MODELS = [
    { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash' },
    { id: 'gemini-3.7-flash', name: 'Gemini 3.7 Flash' },
    { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash Lite' },
    { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash' },
    { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite' },
];

const SUGGESTED_PROMPTS = [
    {
        label: 'Exam polish',
        text: `Rewrite this content to be strictly exam-oriented.

- Reduce unnecessary explanation
- Emphasize definitions, keywords, and important points
- Use bullet points where appropriate
- Add at most 1 short, exam-relevant example if helpful
- Keep the length nearly the same

Identify places where a diagram would help understanding.
Add clear figure placeholders with short explanations.

Do not remove important syllabus content.`,
    },
    {
        label: 'Simplify language',
        text: `Simplify the language so an average student can understand it quickly.

- Use short, clear sentences
- Avoid complex wording
- Do not remove definitions or key points
- Keep the structure intact`,
    },
    {
        label: 'Highlight key points',
        text: `Identify the most important exam-relevant points.

- Highlight them using **bold**
- Convert long paragraphs into bullet points where possible
- Do not add new content
- Do not increase overall length`,
    },
    {
        label: 'Add diagrams',
        text: `Identify places where a diagram or figure would help understanding.

- Insert placeholders in this format:
  **[Figure: <clear diagram name>]**
- Add a short 2–3 line explanation below each figure
- Do NOT draw diagrams or use ASCII art`,
    },
    {
        label: 'Add example',
        text: `Add 1 short, exam-relevant example where it improves understanding.

- Keep it concise
- Do not add examples everywhere
- Do not increase content length too much`,
    },
    {
        label: 'Make answer-friendly',
        text: `Rewrite the content so it can be directly written in exams.

- Use clear headings
- Prefer bullet points and numbered lists
- Add short introductory lines where needed
- Avoid long paragraphs`,
    },
];

const QuickNotes = () => {
    const { subjectId } = useParams();

    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [syllabus, setSyllabus] = useState(null);
    const [notes, setNotes] = useState([]);
    const [selectedUnit, setSelectedUnit] = useState(null);
    const [generating, setGenerating] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState('');

    const [modelsList, setModelsList] = useState(DEFAULT_MODELS);
    const [fetchingModels, setFetchingModels] = useState(false);

    const [selectedModel, setSelectedModel] = useState(() => {
        const saved = localStorage.getItem('quicknotes_gemini_model');
        return saved && saved !== 'gemini-3.8-flash'
            ? saved
            : 'gemini-3.8-flash';
    });
    const [apiKey, setApiKey] = useState(() => {
        return localStorage.getItem('quicknotes_gemini_api_key') || '';
    });
    const [tempKey, setTempKey] = useState(apiKey);
    const [showKeyModal, setShowKeyModal] = useState(false);
    const [showApiKeyText, setShowApiKeyText] = useState(false);

    const modelName =
        modelsList.find((m) => m.id === selectedModel)?.name || selectedModel;

    const handleModelChange = (model) => {
        setSelectedModel(model);
        localStorage.setItem('quicknotes_gemini_model', model);
        toast.success(`Model set to ${model}`);
    };

    const fetchModels = async (keyToUse) => {
        try {
            setFetchingModels(true);
            const trimmedKey = keyToUse?.trim();
            const config = {};
            if (trimmedKey) {
                config.headers = { 'x-gemini-api-key': trimmedKey };
                config.params = { apiKey: trimmedKey };
            }
            const res = await api.get('/quicknotes/models', config);
            if (
                res.data?.success &&
                Array.isArray(res.data.data) &&
                res.data.data.length > 0
            ) {
                const fetched = res.data.data;
                setModelsList(fetched);
                // If currently stored selectedModel is invalid or gemini-3.8-flash, sync to first valid model
                const isCurrentValid = fetched.some(
                    (m) => m.id === selectedModel,
                );
                if (!isCurrentValid || selectedModel === 'gemini-3.8-flash') {
                    const fallbackModel = fetched[0].id;
                    setSelectedModel(fallbackModel);
                    localStorage.setItem(
                        'quicknotes_gemini_model',
                        fallbackModel,
                    );
                }
            }
        } catch (error) {
            console.error('Failed to fetch Gemini models list:', error);
        } finally {
            setFetchingModels(false);
        }
    };

    const handleSaveKey = () => {
        const trimmed = tempKey.trim();
        setApiKey(trimmed);
        localStorage.setItem('quicknotes_gemini_api_key', trimmed);
        setShowKeyModal(false);
        fetchModels(trimmed);
        if (trimmed) {
            toast.success('API key saved');
        } else {
            toast.success('Using the server’s API key');
        }
    };

    const handleClearKey = () => {
        setTempKey('');
        setApiKey('');
        localStorage.removeItem('quicknotes_gemini_api_key');
        setShowKeyModal(false);
        fetchModels('');
        toast.success('Custom key cleared. Using the server’s key.');
    };

    useEffect(() => {
        fetchModels(apiKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiKey]);

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [subjectId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            setLoadError(null);
            const [syllabusRes, notesRes] = await Promise.all([
                api.get(`/syllabus/subject/${subjectId}`),
                api.get(`/quicknotes/${subjectId}`),
            ]);

            // The endpoint returns one syllabus; take the first if it ever sends a list.
            const syllabusData = Array.isArray(syllabusRes.data.data)
                ? syllabusRes.data.data[0]
                : syllabusRes.data.data;

            setSyllabus(syllabusData);
            setNotes(notesRes.data.data || []);

            // Select unit based on query param or default to first
            const params = new URLSearchParams(window.location.search);
            const unitParam = params.get('unit');

            if (syllabusData?.units?.length > 0) {
                if (unitParam) {
                    const unitFromParam = syllabusData.units.find(
                        (u) => u.unitNumber === parseInt(unitParam),
                    );
                    if (unitFromParam) {
                        setSelectedUnit(unitFromParam);
                    } else if (!selectedUnit) {
                        setSelectedUnit(syllabusData.units[0]);
                    }
                } else if (!selectedUnit) {
                    setSelectedUnit(syllabusData.units[0]);
                }
            }
        } catch (error) {
            // A 404 means the subject has no syllabus yet; that has its own screen.
            if (error.response?.status !== 404) {
                console.error('Fetch error:', error);
                setLoadError(
                    'Couldn’t load this subject’s notes. Check your connection and try again.',
                );
            }
        } finally {
            setLoading(false);
        }
    };

    const getNoteForUnit = (unitNumber) => {
        return notes.find((n) => n.unitNumber === unitNumber);
    };

    const handleGenerate = async () => {
        if (!selectedUnit) return;
        setGenerating(true);
        try {
            const payload = {
                subjectId,
                unitNumber: selectedUnit.unitNumber,
                model: selectedModel,
            };
            if (apiKey.trim()) {
                payload.apiKey = apiKey.trim();
                payload.customApiKey = apiKey.trim();
            }

            const res = await api.post('/quicknotes/generate', payload, {
                headers: apiKey.trim()
                    ? { 'x-gemini-api-key': apiKey.trim() }
                    : {},
            });

            if (res.data.success) {
                toast.success('Note generated');
                // Update notes list
                const newNote = res.data.data;
                setNotes((prev) => {
                    const idx = prev.findIndex(
                        (n) => n.unitNumber === newNote.unitNumber,
                    );
                    if (idx > -1) {
                        const copy = [...prev];
                        copy[idx] = newNote;
                        return copy;
                    }
                    return [...prev, newNote];
                });
            }
        } catch (error) {
            console.error(error);
            toast.error(
                error.response?.data?.message ||
                    'Couldn’t generate the note. Try again.',
            );
        } finally {
            setGenerating(false);
        }
    };

    const handleUpdate = async () => {
        const currentNote = getNoteForUnit(selectedUnit?.unitNumber);
        if (!currentNote || !chatInput.trim()) return;

        setUpdating(true);
        try {
            const payload = {
                noteId: currentNote._id,
                userPrompt: chatInput,
                model: selectedModel,
            };
            if (apiKey.trim()) {
                payload.apiKey = apiKey.trim();
                payload.customApiKey = apiKey.trim();
            }

            const res = await api.put('/quicknotes/update', payload, {
                headers: apiKey.trim()
                    ? { 'x-gemini-api-key': apiKey.trim() }
                    : {},
            });

            if (res.data.success) {
                toast.success('Draft ready. Check it, then save.');
                setChatInput('');
                const { generatedContent } = res.data.data;

                // Switch to edit mode with the generated content
                setEditContent(generatedContent);
                setIsEditing(true);
            }
        } catch (error) {
            console.error(error);
            toast.error(
                error.response?.data?.message ||
                    'Couldn’t rewrite the note. Try again.',
            );
        } finally {
            setUpdating(false);
        }
    };

    const handleSaveManual = async () => {
        const currentNote = getNoteForUnit(selectedUnit?.unitNumber);
        if (!currentNote) return;

        setSaving(true);
        try {
            const res = await api.put('/quicknotes/save', {
                noteId: currentNote._id,
                content: editContent,
            });
            if (res.data.success) {
                toast.success('Note saved');
                setIsEditing(false);
                const updatedNote = res.data.data;
                setNotes((prev) =>
                    prev.map((n) =>
                        n._id === updatedNote._id ? updatedNote : n,
                    ),
                );
            }
        } catch (error) {
            console.error(error);
            toast.error('Couldn’t save the note. Try again.');
        } finally {
            setSaving(false);
        }
    };

    const toggleEditMode = () => {
        if (!isEditing) {
            // Enter edit mode: populate content
            const currentNote = getNoteForUnit(selectedUnit?.unitNumber);
            setEditContent(currentNote?.content || '');
            setIsEditing(true);
        } else {
            // Exit edit mode
            setIsEditing(false);
            setEditContent('');
        }
    };

    if (loading) return <Loader />;

    if (loadError || !syllabus) {
        return (
            <div className='min-h-full px-4 sm:px-10 pt-8 pb-12'>
                <PageHeader title='Quick notes' />
                <div className='bg-sheet border border-line rounded-xl'>
                    <EmptyState
                        icon={BookOpen}
                        tone={loadError ? 'error' : 'neutral'}
                        title={
                            loadError
                                ? 'Couldn’t load the notes'
                                : 'This subject has no syllabus yet'
                        }
                        description={
                            loadError ||
                            'Quick notes are written from the syllabus units. Add a syllabus to the subject first.'
                        }
                        action={
                            loadError ? (
                                <Button onClick={fetchData}>Try again</Button>
                            ) : (
                                <Button to='/reports/subjects?syllabus=missing'>
                                    Subjects without a syllabus
                                </Button>
                            )
                        }
                    />
                </div>
            </div>
        );
    }

    const currentNote = selectedUnit
        ? getNoteForUnit(selectedUnit.unitNumber)
        : null;
    const units = syllabus.units || [];
    const readyCount = units.filter((u) => getNoteForUnit(u.unitNumber)).length;
    const subject = syllabus.subject;
    const syllabusLink = syllabus.college?.slug
        ? `/${syllabus.college.slug}/syllabus/${syllabus._id}`
        : null;
    const usingCustomKey = Boolean(apiKey.trim());

    return (
        <div className='min-h-full px-4 sm:px-10 pt-8 pb-12'>
            <PageHeader
                eyebrow={['Quick notes', subject?.subjectCode]
                    .filter(Boolean)
                    .join(' · ')}
                title={subject?.subjectName || syllabus.slug || 'Subject'}
                description={
                    <>
                        Exam-ready summaries for each syllabus unit
                        {syllabusLink && (
                            <>
                                {' · '}
                                <Link
                                    to={syllabusLink}
                                    className='text-link hover:underline'
                                >
                                    View syllabus
                                </Link>
                            </>
                        )}
                    </>
                }
                actions={
                    <>
                        <label className='inline-flex items-center gap-2 h-9 pl-3 pr-1 rounded-lg border border-line-strong bg-sheet text-[13px] text-muted focus-within:ring-2 focus-within:ring-brand/30'>
                            Model
                            <select
                                value={selectedModel}
                                onChange={(e) =>
                                    handleModelChange(e.target.value)
                                }
                                disabled={fetchingModels}
                                className='h-[30px] max-w-[190px] bg-transparent text-[13px] font-medium text-ink outline-none cursor-pointer disabled:opacity-50'
                            >
                                {modelsList.map((m) => (
                                    <option key={m.id} value={m.id}>
                                        {m.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <Button
                            iconOnly
                            icon={RefreshCw}
                            aria-label='Refresh the model list'
                            title='Refresh the model list'
                            onClick={() => fetchModels(apiKey)}
                            disabled={fetchingModels}
                            className={
                                fetchingModels ? '[&>svg]:animate-spin' : ''
                            }
                        />
                        <Button
                            icon={KeyRound}
                            onClick={() => {
                                setTempKey(apiKey);
                                setShowKeyModal(true);
                            }}
                        >
                            {usingCustomKey && (
                                <span
                                    className='w-[7px] h-[7px] rounded-full bg-warn'
                                    aria-hidden='true'
                                />
                            )}
                            {usingCustomKey
                                ? 'Your API key'
                                : 'Default API key'}
                        </Button>
                    </>
                }
            />

            <div
                className={`grid grid-cols-1 lg:grid-cols-[230px_minmax(0,1fr)] gap-5 items-start ${
                    currentNote
                        ? 'xl:grid-cols-[240px_minmax(0,1fr)_280px]'
                        : 'xl:grid-cols-[240px_minmax(0,1fr)]'
                }`}
            >
                {/* Units */}
                <nav
                    aria-label='Units'
                    className='bg-sunken border border-line rounded-xl p-2 flex flex-col gap-0.5'
                >
                    <span className='eyebrow px-2.5 pt-2 pb-1.5'>
                        {units.length} unit{units.length === 1 ? '' : 's'} ·{' '}
                        {readyCount} ready
                    </span>
                    {units.map((unit) => {
                        const hasNote = !!getNoteForUnit(unit.unitNumber);
                        const selected =
                            selectedUnit?.unitNumber === unit.unitNumber;
                        return (
                            <button
                                key={unit.unitNumber}
                                type='button'
                                aria-current={selected ? 'true' : undefined}
                                onClick={() => {
                                    setSelectedUnit(unit);
                                    setIsEditing(false);
                                }}
                                className={`flex items-start gap-2.5 px-2.5 py-2 rounded-lg text-left cursor-pointer transition-colors ${
                                    selected
                                        ? 'bg-sheet ring-1 ring-line-strong shadow-[0_1px_2px_rgba(28,27,24,0.06)]'
                                        : 'hover:bg-line-soft'
                                }`}
                            >
                                <span
                                    className={`w-2 h-2 mt-[5px] rounded-full shrink-0 ${
                                        hasNote ? 'bg-brand' : 'bg-line-strong'
                                    }`}
                                    aria-hidden='true'
                                />
                                <span className='flex-1 min-w-0 flex flex-col gap-0.5'>
                                    <span className='text-[12px] text-muted'>
                                        Unit {unit.unitNumber}
                                        <span className='sr-only'>
                                            {hasNote
                                                ? ', has notes'
                                                : ', no notes yet'}
                                        </span>
                                    </span>
                                    <span
                                        className={`text-[13.5px] text-ink ${selected ? 'font-medium' : ''}`}
                                    >
                                        {unit.title}
                                    </span>
                                </span>
                            </button>
                        );
                    })}
                </nav>

                {/* Notes for the selected unit */}
                <section
                    aria-labelledby='unit-title'
                    className='min-w-0 bg-sheet border border-line rounded-xl overflow-hidden'
                >
                    {selectedUnit ? (
                        <>
                            <div className='flex flex-wrap items-center gap-2.5 min-h-[52px] px-5 py-2.5 border-b border-line-soft'>
                                <h2
                                    id='unit-title'
                                    className='flex-1 min-w-[200px] text-[15px] font-semibold text-ink'
                                >
                                    Unit {selectedUnit.unitNumber} ·{' '}
                                    {selectedUnit.title}
                                </h2>
                                {currentNote &&
                                    (isEditing ? (
                                        <>
                                            <Button
                                                size='sm'
                                                variant='ghost'
                                                onClick={toggleEditMode}
                                                disabled={saving}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                size='sm'
                                                variant='primary'
                                                icon={saving ? Loader2 : Save}
                                                onClick={handleSaveManual}
                                                disabled={saving}
                                                className={
                                                    saving
                                                        ? '[&>svg]:animate-spin'
                                                        : ''
                                                }
                                            >
                                                {saving
                                                    ? 'Saving…'
                                                    : 'Save note'}
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <span className='text-[12.5px] text-muted'>
                                                Updated{' '}
                                                {formatShortDateTime(
                                                    currentNote.lastUpdated,
                                                )}
                                            </span>
                                            <Button
                                                size='sm'
                                                icon={Pencil}
                                                onClick={toggleEditMode}
                                            >
                                                Edit
                                            </Button>
                                        </>
                                    ))}
                            </div>

                            {currentNote ? (
                                isEditing ? (
                                    <div className='p-4'>
                                        <Textarea
                                            aria-label={`Notes for unit ${selectedUnit.unitNumber}, in Markdown`}
                                            value={editContent}
                                            onChange={(e) =>
                                                setEditContent(e.target.value)
                                            }
                                            rows={24}
                                            className='min-h-[500px] font-mono text-[13px] bg-sunken'
                                        />
                                    </div>
                                ) : (
                                    <article
                                        className={`px-5 sm:px-8 py-6 ${PROSE_CLASS}`}
                                    >
                                        <ReactMarkdown>
                                            {currentNote.content}
                                        </ReactMarkdown>
                                    </article>
                                )
                            ) : (
                                <div className='flex flex-col items-center gap-2.5 px-6 sm:px-8 py-16 text-center'>
                                    <span className='w-11 h-11 rounded-xl bg-brand-soft text-brand-ink flex items-center justify-center'>
                                        <Sparkles
                                            className='w-5 h-5'
                                            aria-hidden='true'
                                        />
                                    </span>
                                    <span className='text-[15px] font-semibold text-ink'>
                                        No notes for this unit yet
                                    </span>
                                    <span className='max-w-[420px] text-[13.5px] text-ink-2 line-clamp-4'>
                                        {selectedUnit.content
                                            ? `Generates a summary from the unit’s syllabus topics: ${selectedUnit.content}`
                                            : 'Generates a summary from the unit’s syllabus topics.'}
                                    </span>
                                    <Button
                                        variant='primary'
                                        size='lg'
                                        className={`mt-1.5 ${generating ? '[&>svg]:animate-spin' : ''}`}
                                        icon={generating ? Loader2 : Sparkles}
                                        onClick={handleGenerate}
                                        disabled={generating}
                                    >
                                        {generating
                                            ? 'Generating…'
                                            : `Generate with ${modelName}`}
                                    </Button>
                                </div>
                            )}
                        </>
                    ) : (
                        <p className='px-6 py-16 text-center text-[13.5px] text-ink-2'>
                            {units.length
                                ? 'Pick a unit to see its notes.'
                                : 'This syllabus has no units yet. Add them to the syllabus first.'}
                        </p>
                    )}
                </section>

                {/* Ask AI to rewrite the note */}
                {currentNote && (
                    <aside
                        aria-labelledby='refine-title'
                        className='lg:col-start-2 xl:col-start-auto bg-sheet border border-line rounded-xl px-[18px] py-4 flex flex-col gap-3'
                    >
                        <h2
                            id='refine-title'
                            className='text-[15px] font-semibold text-ink'
                        >
                            Refine this unit
                        </h2>
                        <div className='flex flex-wrap gap-1.5'>
                            {SUGGESTED_PROMPTS.map((prompt) => (
                                <button
                                    key={prompt.label}
                                    type='button'
                                    onClick={() => setChatInput(prompt.text)}
                                    className='h-7 px-2.5 rounded-full border border-line-strong bg-sheet text-[12.5px] text-ink-2 hover:border-brand hover:text-brand-ink cursor-pointer transition-colors'
                                >
                                    {prompt.label}
                                </button>
                            ))}
                        </div>
                        <Field label='Or describe the change' className='mt-1'>
                            <Textarea
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                placeholder='e.g. Add a worked example of merge sort on 8 numbers'
                                rows={5}
                            />
                        </Field>
                        <Button
                            variant='dark'
                            size='lg'
                            onClick={handleUpdate}
                            disabled={updating || !chatInput.trim()}
                            icon={updating ? Loader2 : Send}
                            className={`w-full ${updating ? '[&>svg]:animate-spin' : ''}`}
                        >
                            {updating ? 'Writing…' : 'Send to Gemini'}
                        </Button>
                        <span className='text-[12px] leading-snug text-muted'>
                            Uses {modelName} with{' '}
                            {usingCustomKey
                                ? 'your API key'
                                : 'the default API key'}
                            . The rewrite opens in the editor so you can check
                            it before saving.
                        </span>
                    </aside>
                )}
            </div>

            {/* Custom API key */}
            <Dialog
                open={showKeyModal}
                onClose={() => setShowKeyModal(false)}
                size='sm'
                title='Gemini API key'
                description='Use your own key for AI generation. Leave it empty to use the server’s key.'
                footer={
                    <>
                        {apiKey && (
                            <Button
                                variant='danger'
                                className='mr-auto'
                                onClick={handleClearKey}
                            >
                                Clear custom key
                            </Button>
                        )}
                        <Button onClick={() => setShowKeyModal(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant='primary'
                            icon={Save}
                            onClick={handleSaveKey}
                        >
                            Save key
                        </Button>
                    </>
                }
            >
                <div className='relative'>
                    <Field
                        label='API key'
                        hint='Kept in this browser’s local storage only.'
                    >
                        <Input
                            type={showApiKeyText ? 'text' : 'password'}
                            value={tempKey}
                            onChange={(e) => setTempKey(e.target.value)}
                            placeholder='AIzaSy…'
                            autoComplete='off'
                            className='pr-10 font-mono text-[13px]'
                        />
                    </Field>
                    <button
                        type='button'
                        onClick={() => setShowApiKeyText(!showApiKeyText)}
                        aria-label={
                            showApiKeyText ? 'Hide the key' : 'Show the key'
                        }
                        aria-pressed={showApiKeyText}
                        className='absolute right-0.5 top-[27px] w-8 h-8 rounded-md flex items-center justify-center text-muted hover:text-ink cursor-pointer'
                    >
                        {showApiKeyText ? (
                            <EyeOff className='w-4 h-4' aria-hidden='true' />
                        ) : (
                            <Eye className='w-4 h-4' aria-hidden='true' />
                        )}
                    </button>
                </div>
            </Dialog>
        </div>
    );
};

export default QuickNotes;
