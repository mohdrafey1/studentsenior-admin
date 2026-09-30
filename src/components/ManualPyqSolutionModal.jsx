import React, { useState } from 'react';
import { Check, Copy, Loader2, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { SOLUTION_PROMPTS } from '../constants/prompts';
import { Button, Dialog, Field, Textarea } from './ui';

const Step = ({ number, title, children }) => (
    <li className='grid grid-cols-[28px_minmax(0,1fr)] gap-x-3 gap-y-2'>
        <span
            aria-hidden='true'
            className='w-7 h-7 rounded-full bg-brand-soft text-brand-ink flex items-center justify-center font-mono text-xs font-medium'
        >
            {number}
        </span>
        <h3 className='self-center text-[14px] font-semibold text-ink'>
            {title}
        </h3>
        <div className='col-start-2 flex flex-col gap-2.5 text-[13.5px] leading-relaxed text-ink-2'>
            {children}
        </div>
    </li>
);

const ManualPyqSolutionModal = ({ isOpen, onClose, onImport, loading }) => {
    const [jsonInput, setJsonInput] = useState('');
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState('');

    const initialPrompt =
        SOLUTION_PROMPTS.find((p) => p.label === 'Initial Prompt')?.prompt ||
        '';

    const handleCopyPrompt = () => {
        navigator.clipboard
            .writeText(initialPrompt)
            .then(() => {
                setCopied(true);
                toast.success('Prompt copied');
                setTimeout(() => setCopied(false), 2000);
            })
            .catch(() =>
                toast.error(
                    'Couldn’t copy the prompt. Open it below and copy it by hand.',
                ),
            );
    };

    const handleImport = () => {
        setError('');
        if (!jsonInput.trim()) {
            setError('Paste the JSON from the AI’s reply first');
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
        } catch {
            setError(
                'That isn’t valid solution JSON. Copy only the JSON block with "concise" and "expert" from the AI’s reply.',
            );
        }
    };

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            busy={loading}
            size='lg'
            title='Import solutions'
            description='Generate the solutions in another AI tool, then paste its reply here.'
            footer={
                <>
                    <Button onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        variant='primary'
                        onClick={handleImport}
                        disabled={loading}
                        icon={loading ? Loader2 : Upload}
                        className={loading ? '[&>svg]:animate-spin' : ''}
                    >
                        {loading ? 'Importing…' : 'Import solutions'}
                    </Button>
                </>
            }
        >
            <ol className='flex flex-col gap-6'>
                <Step number={1} title='Copy the prompt'>
                    <p>
                        It asks for a concise and an expert version, returned as
                        JSON.
                    </p>
                    <div className='flex flex-wrap items-center gap-3'>
                        <Button
                            size='sm'
                            icon={copied ? Check : Copy}
                            onClick={handleCopyPrompt}
                        >
                            {copied ? 'Copied' : 'Copy prompt'}
                        </Button>
                        <details className='text-[13px]'>
                            <summary className='cursor-pointer text-link hover:underline'>
                                Show the prompt
                            </summary>
                            <pre className='mt-2 max-h-56 overflow-auto p-3 rounded-lg bg-sunken font-mono text-[11.5px] leading-relaxed text-ink-2 whitespace-pre-wrap'>
                                {initialPrompt}
                            </pre>
                        </details>
                    </div>
                </Step>

                <Step number={2} title='Run it with the question paper'>
                    <ol className='list-decimal pl-5 flex flex-col gap-1'>
                        <li>Open ChatGPT, Gemini or Claude.</li>
                        <li>Upload the question paper PDF.</li>
                        <li>Paste the prompt and send it.</li>
                        <li>Copy the JSON code block from the reply.</li>
                    </ol>
                </Step>

                <Step number={3} title='Paste the JSON'>
                    <Field error={error}>
                        <Textarea
                            aria-label='JSON from the AI’s reply'
                            value={jsonInput}
                            onChange={(e) => {
                                setJsonInput(e.target.value);
                                if (error) setError('');
                            }}
                            rows={8}
                            placeholder='{ "concise": "…", "expert": "…" }'
                            className='font-mono text-[12.5px]'
                        />
                    </Field>
                </Step>
            </ol>
        </Dialog>
    );
};

export default ManualPyqSolutionModal;
