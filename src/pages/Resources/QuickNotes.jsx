import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import { useSidebarLayout } from '../../hooks/useSidebarLayout';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import BackButton from '../../components/Common/BackButton';
import Loader from '../../components/Common/Loader';
import ReactMarkdown from 'react-markdown';
import { BookOpen, Sparkles, Send, Edit, Save, X, Key, Cpu, Eye, EyeOff, RefreshCw, Loader2 } from 'lucide-react';

const DEFAULT_MODELS = [
    { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash' },
    { id: 'gemini-3.7-flash', name: 'Gemini 3.7 Flash' },
    { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash Lite' },
    { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash' },
    { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite' }
];

const QuickNotes = () => {
    const { subjectId } = useParams();
    const { mainContentMargin } = useSidebarLayout();

    const SUGGESTED_PROMPTS = [
        {
            label: '✨ Exam Polish',
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
            label: '🎯 Simplify Language',
            text: `Simplify the language so an average student can understand it quickly.

- Use short, clear sentences
- Avoid complex wording
- Do not remove definitions or key points
- Keep the structure intact`,
        },
        {
            label: '🧠 Highlight Key Points',
            text: `Identify the most important exam-relevant points.

- Highlight them using **bold**
- Convert long paragraphs into bullet points where possible
- Do not add new content
- Do not increase overall length`,
        },
        {
            label: '🖼️ Add Diagrams',
            text: `Identify places where a diagram or figure would help understanding.

- Insert placeholders in this format:
  **[Figure: <clear diagram name>]**
- Add a short 2–3 line explanation below each figure
- Do NOT draw diagrams or use ASCII art`,
        },
        {
            label: '🧪 Add Example',
            text: `Add 1 short, exam-relevant example where it improves understanding.

- Keep it concise
- Do not add examples everywhere
- Do not increase content length too much`,
        },
        {
            label: '🧩 Make Answer-Friendly',
            text: `Rewrite the content so it can be directly written in exams.

- Use clear headings
- Prefer bullet points and numbered lists
- Add short introductory lines where needed
- Avoid long paragraphs`,
        },
    ];

    const [loading, setLoading] = useState(true);
    const [syllabus, setSyllabus] = useState(null);
    const [notes, setNotes] = useState([]);
    const [selectedUnit, setSelectedUnit] = useState(null);
    const [generating, setGenerating] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState('');

    const [modelsList, setModelsList] = useState(DEFAULT_MODELS);
    const [fetchingModels, setFetchingModels] = useState(false);

    const [selectedModel, setSelectedModel] = useState(() => {
        const saved = localStorage.getItem('quicknotes_gemini_model');
        return saved && saved !== 'gemini-3.8-flash' ? saved : 'gemini-3.8-flash';
    });
    const [apiKey, setApiKey] = useState(() => {
        return localStorage.getItem('quicknotes_gemini_api_key') || '';
    });
    const [tempKey, setTempKey] = useState(apiKey);
    const [showKeyModal, setShowKeyModal] = useState(false);
    const [showApiKeyText, setShowApiKeyText] = useState(false);

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
            if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
                const fetched = res.data.data;
                setModelsList(fetched);
                // If currently stored selectedModel is invalid or gemini-3.8-flash, sync to first valid model
                const isCurrentValid = fetched.some((m) => m.id === selectedModel);
                if (!isCurrentValid || selectedModel === 'gemini-3.8-flash') {
                    const fallbackModel = fetched[0].id;
                    setSelectedModel(fallbackModel);
                    localStorage.setItem('quicknotes_gemini_model', fallbackModel);
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
            toast.success('Custom API Key saved!');
        } else {
            toast.success('Using default server API Key');
        }
    };

    const handleClearKey = () => {
        setTempKey('');
        setApiKey('');
        localStorage.removeItem('quicknotes_gemini_api_key');
        setShowKeyModal(false);
        fetchModels('');
        toast.success('Custom API Key cleared. Using default server key.');
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
            const [syllabusRes, notesRes] = await Promise.all([
                api.get(`/syllabus/subject/${subjectId}`),
                api.get(`/quicknotes/${subjectId}`),
            ]);

            // Syllabus API might return list, assuming we get the one for this subject
            // If the API returns a list, find the one matching subjectId or assume query param filters it.
            // Based on Syllabus.ts, it has subject field.
            // Let's assume response structure. If it's a list, take first.
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
            console.error('Fetch error:', error);
            toast.error('Failed to load data');
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
                headers: apiKey.trim() ? { 'x-gemini-api-key': apiKey.trim() } : {},
            });

            if (res.data.success) {
                toast.success('Note generated successfully!');
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
            toast.error(error.response?.data?.message || 'Failed to generate note');
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
                headers: apiKey.trim() ? { 'x-gemini-api-key': apiKey.trim() } : {},
            });

            if (res.data.success) {
                toast.success('Content generated. Please review and save.');
                setChatInput('');
                const { generatedContent } = res.data.data;

                // Switch to edit mode with the generated content
                setEditContent(generatedContent);
                setIsEditing(true);
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to generate update');
        } finally {
            setUpdating(false);
        }
    };

    const handleSaveManual = async () => {
        const currentNote = getNoteForUnit(selectedUnit?.unitNumber);
        if (!currentNote) return;

        try {
            const res = await api.put('/quicknotes/save', {
                noteId: currentNote._id,
                content: editContent,
            });
            if (res.data.success) {
                toast.success('Note saved successfully!');
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
            toast.error('Failed to save note manually');
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

    if (!syllabus) {
        return (
            <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
                <Header />
                <Sidebar />
                <main className={`py-4 ${mainContentMargin}`}>
                    <div className='max-w-7xl mx-auto px-4'>
                        <BackButton title='Quick Notes' TitleIcon={BookOpen} />
                        <div className='text-center py-10 text-gray-500'>
                            Syllabus not found for this subject. Please add
                            syllabus first.
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    const currentNote = selectedUnit
        ? getNoteForUnit(selectedUnit.unitNumber)
        : null;

    return (
        <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
            <Header />
            <Sidebar />
            <main
                className={`py-4 ${mainContentMargin} transition-all duration-300`}
            >
                <div className='max-w-7xl mx-auto px-4 sm:px-6 h-[calc(100vh-100px)] flex flex-col'>
                    <div className='flex flex-wrap items-center justify-between gap-3 mb-4'>
                        <BackButton
                            title={`Quick Notes: ${syllabus.slug || 'Subject'}`}
                            TitleIcon={BookOpen}
                            className='mb-0'
                        />

                        {/* AI Config Bar (Model Selector & Custom API Key Settings) */}
                        <div className='flex items-center gap-3 bg-white dark:bg-gray-800 p-1.5 px-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm'>
                            <div className='flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 font-medium'>
                                <Cpu size={15} className='text-indigo-500' />
                                <span className='hidden sm:inline'>Model:</span>
                                <div className='flex items-center gap-1.5'>
                                    <select
                                        value={selectedModel}
                                        onChange={(e) => handleModelChange(e.target.value)}
                                        disabled={fetchingModels}
                                        className='bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-xs rounded-md px-2 py-1 focus:ring-1 focus:ring-indigo-500 outline-none font-sans cursor-pointer disabled:opacity-50'
                                    >
                                        {modelsList.map((m) => (
                                            <option key={m.id} value={m.id}>
                                                {m.name}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        type='button'
                                        onClick={() => fetchModels(apiKey)}
                                        disabled={fetchingModels}
                                        className='p-1 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors disabled:opacity-50'
                                        title='Fetch latest Gemini models list'
                                    >
                                        <RefreshCw
                                            size={13}
                                            className={fetchingModels ? 'animate-spin text-indigo-500' : ''}
                                        />
                                    </button>
                                </div>
                            </div>

                            <div className='h-4 w-px bg-gray-200 dark:bg-gray-700'></div>

                            <button
                                onClick={() => {
                                    setTempKey(apiKey);
                                    setShowKeyModal(true);
                                }}
                                className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md transition-colors ${
                                    apiKey.trim()
                                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-700 font-medium'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                                }`}
                                title="Configure Custom Gemini API Key"
                            >
                                <Key size={14} className={apiKey.trim() ? 'text-amber-500' : 'text-gray-400'} />
                                <span>{apiKey.trim() ? 'Custom Key' : 'Default Key'}</span>
                            </button>
                        </div>
                    </div>

                    <div className='flex flex-1 gap-4 overflow-hidden'>
                        {/* Unit List Sidebar */}
                        <div className='w-64 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-y-auto'>
                            <div className='p-3 border-b border-gray-200 dark:border-gray-700 font-semibold text-gray-700 dark:text-gray-200'>
                                Units
                            </div>
                            <ul>
                                {syllabus.units.map((unit) => {
                                    const hasNote = !!getNoteForUnit(
                                        unit.unitNumber,
                                    );
                                    return (
                                        <li
                                            key={unit.unitNumber}
                                            onClick={() => {
                                                setSelectedUnit(unit);
                                                setIsEditing(false);
                                            }}
                                            className={`p-3 cursor-pointer border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                                                selectedUnit?.unitNumber ===
                                                unit.unitNumber
                                                    ? 'bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-l-indigo-600'
                                                    : ''
                                            }`}
                                        >
                                            <div className='flex justify-between items-start'>
                                                <div className='text-sm font-medium text-gray-900 dark:text-white'>
                                                    Unit {unit.unitNumber}
                                                </div>
                                                {hasNote && (
                                                    <div className='h-2 w-2 rounded-full bg-green-500 mt-1'></div>
                                                )}
                                            </div>
                                            <div className='text-xs text-gray-500 dark:text-gray-400 truncate'>
                                                {unit.title}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>

                        {/* Main Content Area */}
                        <div className='flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden'>
                            {selectedUnit ? (
                                <>
                                    <div className='p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50'>
                                        <div>
                                            <h2 className='text-lg font-bold text-gray-900 dark:text-white'>
                                                Unit {selectedUnit.unitNumber}:{' '}
                                                {selectedUnit.title}
                                            </h2>
                                        </div>
                                        <div>
                                            {!currentNote ? (
                                                <button
                                                    onClick={handleGenerate}
                                                    disabled={generating}
                                                    className='inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50'
                                                >
                                                    {generating ? (
                                                        <span className='flex items-center gap-2'>
                                                            <Loader2
                                                                size={16}
                                                                className='animate-spin'
                                                            />{' '}
                                                            Generating...
                                                        </span>
                                                    ) : (
                                                        <>
                                                            <Sparkles
                                                                size={16}
                                                            />{' '}
                                                            Generate with AI
                                                        </>
                                                    )}
                                                </button>
                                            ) : (
                                                <div className='flex items-center gap-2'>
                                                    {isEditing ? (
                                                        <>
                                                            <button
                                                                onClick={
                                                                    toggleEditMode
                                                                }
                                                                className='p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                                                title='Cancel'
                                                            >
                                                                <X size={20} />
                                                            </button>
                                                            <button
                                                                onClick={
                                                                    handleSaveManual
                                                                }
                                                                className='inline-flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm'
                                                            >
                                                                <Save
                                                                    size={16}
                                                                />
                                                                Save
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className='text-xs text-gray-500 hidden sm:block mr-2'>
                                                                Last updated:{' '}
                                                                {new Date(
                                                                    currentNote.lastUpdated,
                                                                ).toLocaleString()}
                                                            </div>
                                                            <button
                                                                onClick={
                                                                    toggleEditMode
                                                                }
                                                                className='p-2 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400'
                                                                title='Edit Note'
                                                            >
                                                                <Edit
                                                                    size={18}
                                                                />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className='flex-1 overflow-hidden flex flex-col md:flex-row'>
                                        {/* Markdown Preview */}
                                        <div
                                            className={`flex-1 overflow-y-auto p-6 prose dark:prose-invert max-w-none ${currentNote ? '' : 'flex items-center justify-center'}`}
                                        >
                                            {currentNote ? (
                                                isEditing ? (
                                                    <textarea
                                                        value={editContent}
                                                        onChange={(e) =>
                                                            setEditContent(
                                                                e.target.value,
                                                            )
                                                        }
                                                        className='w-full h-full min-h-[500px] p-4 font-mono text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-gray-900 dark:text-gray-100'
                                                    />
                                                ) : (
                                                    <ReactMarkdown>
                                                        {currentNote.content}
                                                    </ReactMarkdown>
                                                )
                                            ) : (
                                                <div className='text-center text-gray-400'>
                                                    <BookOpen
                                                        size={48}
                                                        className='mx-auto mb-2 opacity-50'
                                                    />
                                                    <p>
                                                        No notes generated for
                                                        this unit yet.
                                                    </p>
                                                    <p className='text-sm'>
                                                        Click "Generate with AI"
                                                        to create notes.
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* AI Chat / Edit Panel */}
                                        {currentNote && (
                                            <div className='w-full md:w-80 border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-700 flex flex-col bg-gray-50 dark:bg-gray-900/30'>
                                                <div className='p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center'>
                                                    <span className='font-semibold text-xs uppercase tracking-wider text-gray-500'>
                                                        Refine Content
                                                    </span>
                                                    <span className='text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded font-mono truncate max-w-[120px]'>
                                                        {selectedModel}
                                                    </span>
                                                </div>
                                                <div className='flex-1 p-4 overflow-y-auto'>
                                                    <p className='text-sm text-gray-600 dark:text-gray-400 mb-4'>
                                                        Want to change
                                                        something? Ask AI to
                                                        rewrite sections, add
                                                        examples, or simplify
                                                        the text.
                                                    </p>
                                                    <div className='flex flex-wrap gap-2'>
                                                        {SUGGESTED_PROMPTS.map(
                                                            (prompt) => (
                                                                <button
                                                                    key={
                                                                        prompt.label
                                                                    }
                                                                    onClick={() =>
                                                                        setChatInput(
                                                                            prompt.text,
                                                                        )
                                                                    }
                                                                    className='px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors'
                                                                >
                                                                    {
                                                                        prompt.label
                                                                    }
                                                                </button>
                                                            ),
                                                        )}
                                                    </div>
                                                </div>
                                                <div className='p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'>
                                                    <div className='relative'>
                                                        <textarea
                                                            value={chatInput}
                                                            onChange={(e) =>
                                                                setChatInput(
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            placeholder="e.g., 'Make the definition of X simpler'"
                                                            className='w-full p-2 pr-10 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none'
                                                            rows={3}
                                                        />
                                                        <button
                                                            onClick={
                                                                handleUpdate
                                                            }
                                                            disabled={
                                                                updating ||
                                                                !chatInput.trim()
                                                            }
                                                            className='absolute bottom-2 right-2 p-1.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50'
                                                        >
                                                            <Send size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className='flex-1 flex items-center justify-center text-gray-400'>
                                    Select a unit to view notes
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Custom API Key Modal */}
                {showKeyModal && (
                    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4'>
                        <div className='bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-md p-6 relative'>
                            <button
                                onClick={() => setShowKeyModal(false)}
                                className='absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                            >
                                <X size={20} />
                            </button>
                            <div className='flex items-center gap-3 mb-4'>
                                <div className='p-2.5 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg text-indigo-600 dark:text-indigo-400'>
                                    <Key size={22} />
                                </div>
                                <div>
                                    <h3 className='text-lg font-bold text-gray-900 dark:text-white'>
                                        Custom Gemini API Key
                                    </h3>
                                    <p className='text-xs text-gray-500 dark:text-gray-400'>
                                        Provide your own API Key for AI generation
                                    </p>
                                </div>
                            </div>

                            <div className='space-y-4'>
                                <div>
                                    <label className='block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1'>
                                        Gemini API Key
                                    </label>
                                    <div className='relative'>
                                        <input
                                            type={showApiKeyText ? 'text' : 'password'}
                                            value={tempKey}
                                            onChange={(e) => setTempKey(e.target.value)}
                                            placeholder='AIzaSy...'
                                            className='w-full pl-3 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none'
                                        />
                                        <button
                                            type='button'
                                            onClick={() => setShowApiKeyText(!showApiKeyText)}
                                            className='absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                                        >
                                            {showApiKeyText ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                    <p className='text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed'>
                                        Saved securely in your browser's local storage. Leave empty to use default server API key.
                                    </p>
                                </div>

                                <div className='flex items-center justify-between gap-3 pt-2 border-t border-gray-100 dark:border-gray-700'>
                                    {apiKey ? (
                                        <button
                                            type='button'
                                            onClick={handleClearKey}
                                            className='px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors'
                                        >
                                            Clear Custom Key
                                        </button>
                                    ) : (
                                        <div></div>
                                    )}
                                    <div className='flex items-center gap-2'>
                                        <button
                                            type='button'
                                            onClick={() => setShowKeyModal(false)}
                                            className='px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors'
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type='button'
                                            onClick={handleSaveKey}
                                            className='px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5'
                                        >
                                            <Save size={14} />
                                            Save Key
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default QuickNotes;
