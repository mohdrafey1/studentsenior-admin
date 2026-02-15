import React, { useState } from 'react';
import {
    X,
    Copy,
    Check,
    AlertCircle,
    FileJson,
    Loader,
    Download,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { SOLUTION_PROMPTS } from '../constants/prompts';

const ManualPyqSolutionModal = ({ isOpen, onClose, onImport, loading }) => {
    const [jsonInput, setJsonInput] = useState('');
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleCopyPrompt = () => {
        const initialPrompt =
            SOLUTION_PROMPTS.find((p) => p.label === 'Initial Prompt')
                ?.prompt || '';
        navigator.clipboard.writeText(initialPrompt);
        setCopied(true);
        toast.success('Prompt copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
    };

    const handleImport = () => {
        setError('');
        if (!jsonInput.trim()) {
            setError('Please paste the JSON content.');
            return;
        }

        try {
            // Attempt to clean JSON if user pasted extra text
            let cleanJson = jsonInput;
            const firstBrace = jsonInput.indexOf('{');
            const lastBrace = jsonInput.lastIndexOf('}');

            if (firstBrace !== -1 && lastBrace !== -1) {
                cleanJson = jsonInput.substring(firstBrace, lastBrace + 1);
            }

            const parsed = JSON.parse(cleanJson);

            if (!parsed.concise && !parsed.expert) {
                throw new Error(
                    'JSON doesn\'t contain "concise" or "expert" keys.',
                );
            }

            onImport(parsed);
        } catch (err) {
            setError(
                'Invalid JSON format. Please ensure you copied only the JSON object.',
            );
        }
    };

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm'>
            <div className='bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col'>
                {/* Header */}
                <div className='flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700'>
                    <div>
                        <h2 className='text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2'>
                            <FileJson className='w-6 h-6 text-indigo-500' />
                            Manual AI Import
                        </h2>
                        <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
                            Generate solution externally and paste result here.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors'
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className='p-6 overflow-y-auto space-y-8'>
                    {/* Step 1 */}
                    <div className='space-y-4'>
                        <div className='flex items-center gap-3'>
                            <div className='w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm'>
                                1
                            </div>
                            <h3 className='font-semibold text-gray-900 dark:text-white'>
                                Copy Prompt
                            </h3>
                        </div>
                        <div className='pl-11'>
                            <p className='text-sm text-gray-600 dark:text-gray-300 mb-3'>
                                Copy the system prompt below and paste it into
                                your AI tool (ChatGPT, Gemini, Claude).
                            </p>
                            <button
                                onClick={handleCopyPrompt}
                                className='flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors border border-gray-200 dark:border-gray-600 w-full justify-center sm:w-auto'
                            >
                                {copied ? (
                                    <Check
                                        size={18}
                                        className='text-green-500'
                                    />
                                ) : (
                                    <Copy size={18} />
                                )}
                                {copied ? 'Copied!' : 'Copy System Prompt'}
                            </button>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className='space-y-4'>
                        <div className='flex items-center gap-3'>
                            <div className='w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm'>
                                2
                            </div>
                            <h3 className='font-semibold text-gray-900 dark:text-white'>
                                Generate Solution
                            </h3>
                        </div>
                        <div className='pl-11'>
                            <p className='text-sm text-gray-600 dark:text-gray-300'>
                                1. Open your AI chat. <br />
                                2. Upload the Question Paper PDF. <br />
                                3. Paste the copied prompt and send. <br />
                                4. Wait for the JSON code block response. <br />
                                5. Copy the code block content properly.
                            </p>
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div className='space-y-4'>
                        <div className='flex items-center gap-3'>
                            <div className='w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm'>
                                3
                            </div>
                            <h3 className='font-semibold text-gray-900 dark:text-white'>
                                Paste JSON
                            </h3>
                        </div>
                        <div className='pl-11'>
                            <textarea
                                value={jsonInput}
                                onChange={(e) => setJsonInput(e.target.value)}
                                placeholder='Paste the JSON response here (e.g., { "concise": "...", "expert": "..." })'
                                className='w-full h-40 p-4 font-mono text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none'
                            />
                            {error && (
                                <div className='mt-2 flex items-center gap-2 text-red-500 text-sm'>
                                    <AlertCircle size={16} />
                                    {error}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className='p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl flex justify-end gap-3'>
                    <button
                        onClick={onClose}
                        className='px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors'
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleImport}
                        disabled={loading}
                        className='flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50'
                    >
                        {loading ? (
                            <Loader className='animate-spin h-5 w-5' />
                        ) : (
                            <Download className='h-5 w-5' />
                        )}
                        {loading ? 'Importing...' : 'Import Solution'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ManualPyqSolutionModal;
