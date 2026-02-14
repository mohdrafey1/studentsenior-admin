import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {
    ArrowLeft,
    Bot,
    Sparkles,
    Zap,
    Loader,
    Save,
    Edit2,
    X,
    Send,
    CheckCircle,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const PyqSolutionPage = () => {
    const { collegeslug, pyqid } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [solution, setSolution] = useState(null);
    const [activeTab, setActiveTab] = useState('concise');
    const [aiLoading, setAiLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState('');
    const [chatInput, setChatInput] = useState('');
    const [solutionUpdating, setSolutionUpdating] = useState(false);
    const [pyqDetails, setPyqDetails] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
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
                toast.error('Failed to load solution data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [pyqid]);

    const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash-lite');

    const handleGenerate = async () => {
        if (!pyqDetails?.fileUrl) {
            toast.error('No PDF available for this PYQ');
            return;
        }

        try {
            setAiLoading(true);
            const res = await api.post('/pyq-solution/generate', {
                pyqId: pyqid,
                model: selectedModel,
            });

            if (res.data.success) {
                toast.success('Solutions generated successfully!');
                setSolution(res.data.data);
            }
        } catch (error) {
            console.error('Generation Error:', error);
            toast.error('Failed to generate solutions');
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
                toast.success('Content refined by AI');
                setChatInput('');
                setEditContent(res.data.data.generatedContent);
                setIsEditing(true);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to refine content');
        } finally {
            setSolutionUpdating(false);
        }
    };

    const handleSave = async () => {
        if (!solution) return;

        try {
            const res = await api.put('/pyq-solution/save', {
                solutionId: solution._id,
                type: activeTab,
                content: editContent,
            });

            if (res.data.success) {
                toast.success('Saved successfully');
                setIsEditing(false);
                setSolution(res.data.data);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to save');
        }
    };

    const toggleEdit = () => {
        if (isEditing) {
            setIsEditing(false);
            setEditContent('');
        } else {
            const content =
                activeTab === 'concise'
                    ? solution?.conciseContent
                    : solution?.expertContent;
            if (content) {
                setEditContent(content);
                setIsEditing(true);
            }
        }
    };

    const getCurrentContent = () => {
        return activeTab === 'concise'
            ? solution?.conciseContent
            : solution?.expertContent;
    };

    if (loading) {
        return (
            <div className='min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center'>
                <Loader className='h-8 w-8 animate-spin text-indigo-600' />
            </div>
        );
    }

    return (
        <div className='min-h-screen bg-gray-50 dark:bg-gray-900 font-sans text-gray-900 dark:text-gray-100'>
            <Header />
            <Sidebar />
            <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
                {/* Header Actions */}
                <div className='flex items-center justify-between mb-8'>
                    <div className='flex items-center gap-4'>
                        <button
                            onClick={() =>
                                navigate(`/${collegeslug}/pyqs/${pyqid}`)
                            }
                            className='p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors'
                        >
                            <ArrowLeft className='h-5 w-5' />
                        </button>
                        <div>
                            <h1 className='text-2xl font-bold flex items-center gap-2'>
                                <Bot className='h-8 w-8 text-indigo-500' />
                                Manage AI Solutions
                            </h1>
                            <p className='text-sm text-gray-500 dark:text-gray-400'>
                                {pyqDetails?.subject?.subjectName} (
                                {pyqDetails?.year})
                            </p>
                        </div>
                    </div>
                    {solution ? (
                        <div className='flex items-center gap-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-lg border border-green-200 dark:border-green-800'>
                            <CheckCircle className='h-5 w-5' />
                            <span className='font-medium'>
                                Solutions Generated
                            </span>
                        </div>
                    ) : (
                        <div className='flex items-center gap-3'>
                            <select
                                value={selectedModel}
                                onChange={(e) =>
                                    setSelectedModel(e.target.value)
                                }
                                className='px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none'
                            >
                                <option value='gemini-2.5-flash-lite'>
                                    Gemini 2.5 Flash Lite
                                </option>
                                <option value='gemini-2.5-pro'>
                                    Gemini 2.5 Pro
                                </option>
                            </select>
                            <button
                                onClick={handleGenerate}
                                disabled={aiLoading}
                                className='flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50'
                            >
                                {aiLoading ? (
                                    <Loader className='animate-spin h-5 w-5' />
                                ) : (
                                    <Zap className='h-5 w-5' />
                                )}
                                {aiLoading
                                    ? 'Generating...'
                                    : 'Generate AI Solutions'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Main Interaction Area */}
                <div className='bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col lg:flex-row min-h-[600px]'>
                    {/* Content Area */}
                    <div className='flex-1 flex flex-col border-r border-gray-200 dark:border-gray-700'>
                        {/* Tabs */}
                        <div className='flex border-b border-gray-200 dark:border-gray-700'>
                            {['concise', 'expert'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`flex-1 py-4 text-sm font-medium text-center border-b-2 transition-colors ${
                                        activeTab === tab
                                            ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                                    }`}
                                >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}{' '}
                                    Solution
                                </button>
                            ))}
                        </div>

                        {/* Content */}
                        <div className='flex-1 p-6 relative'>
                            {getCurrentContent() ? (
                                isEditing ? (
                                    <textarea
                                        value={editContent}
                                        onChange={(e) =>
                                            setEditContent(e.target.value)
                                        }
                                        className='w-full h-full p-4 font-mono text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none'
                                    />
                                ) : (
                                    <div className='prose dark:prose-invert max-w-none'>
                                        <ReactMarkdown>
                                            {getCurrentContent()}
                                        </ReactMarkdown>
                                    </div>
                                )
                            ) : (
                                <div className='absolute inset-0 flex flex-col items-center justify-center text-center p-8'>
                                    <div className='w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4'>
                                        <Sparkles className='h-10 w-10 text-gray-400' />
                                    </div>
                                    <h3 className='text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2'>
                                        No {activeTab} solution yet
                                    </h3>
                                    <p className='text-gray-500 max-w-sm'>
                                        Click the "Generate AI Solutions" button
                                        above to create both concise and expert
                                        versions.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar / Tools */}
                    {getCurrentContent() && (
                        <div className='w-full lg:w-96 bg-gray-50 dark:bg-gray-900/30 flex flex-col'>
                            <div className='p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800'>
                                <span className='font-semibold text-sm uppercase tracking-wide text-gray-500'>
                                    Tools & Refinement
                                </span>
                                {isEditing ? (
                                    <div className='flex gap-2'>
                                        <button
                                            onClick={toggleEdit}
                                            className='p-1.5 text-gray-500 hover:text-gray-700'
                                        >
                                            <X size={18} />
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            className='p-1.5 text-green-600 hover:text-green-700 bg-green-100 rounded'
                                        >
                                            <Save size={18} />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={toggleEdit}
                                        className='text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-full'
                                    >
                                        <Edit2 className='h-3 w-3' /> Edit
                                        Solution
                                    </button>
                                )}
                            </div>

                            <div className='flex-1 p-4 flex flex-col overflow-hidden'>
                                <div className='bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100 dark:border-blue-800 mb-4'>
                                    <h4 className='flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2'>
                                        <Bot className='h-4 w-4' />
                                        AI Refinement
                                    </h4>
                                    <p className='text-xs text-blue-600 dark:text-blue-400'>
                                        Select a prompt or type your own to
                                        refine the <strong>{activeTab}</strong>{' '}
                                        solution.
                                    </p>
                                </div>

                                <div className='flex-1 overflow-y-auto space-y-2 mb-4'>
                                    {[
                                        'Fix grammar',
                                        'Simplify language',
                                        'Add examples',
                                        'Make it bulleted',
                                        'Expand explanation',
                                    ].map((prompt) => (
                                        <button
                                            key={prompt}
                                            onClick={() => setChatInput(prompt)}
                                            className='w-full text-left px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:border-indigo-400 hover:shadow-sm transition-all'
                                        >
                                            {prompt}
                                        </button>
                                    ))}
                                </div>

                                <div className='relative mt-auto'>
                                    <textarea
                                        value={chatInput}
                                        onChange={(e) =>
                                            setChatInput(e.target.value)
                                        }
                                        placeholder='Type instructions...'
                                        className='w-full p-3 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none shadow-sm'
                                        rows={3}
                                    />
                                    <button
                                        onClick={handleUpdate}
                                        disabled={
                                            solutionUpdating ||
                                            !chatInput.trim()
                                        }
                                        className='absolute bottom-2 right-2 p-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors'
                                    >
                                        {solutionUpdating ? (
                                            <Loader
                                                size={16}
                                                className='animate-spin'
                                            />
                                        ) : (
                                            <Send size={16} />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PyqSolutionPage;
