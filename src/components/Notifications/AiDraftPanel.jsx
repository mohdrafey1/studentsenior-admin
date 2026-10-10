import { useState } from 'react';
import toast from 'react-hot-toast';
import { Loader2, Sparkles, X } from 'lucide-react';
import api, { apiErrorMessage } from '../../utils/api';
import { Button, Select, Textarea } from '../ui';

const TONES = [
    { value: 'friendly', label: 'Friendly' },
    { value: 'exciting', label: 'Exciting' },
    { value: 'urgent', label: 'Urgent' },
    { value: 'informative', label: 'Informative' },
];

const LANGUAGES = [
    { value: 'english', label: 'English' },
    { value: 'hinglish', label: 'Hinglish' },
];

/**
 * Asks the server's AI provider for three title + message options. Nothing is
 * sent from here: "Use this" only fills the form for the admin to review.
 */
export default function AiDraftPanel({
    title,
    body,
    audienceText,
    opensText,
    onUse,
    onClose,
}) {
    const [brief, setBrief] = useState(() =>
        [title, body].filter((part) => part?.trim()).join('\n'),
    );
    const [tone, setTone] = useState('friendly');
    const [language, setLanguage] = useState('english');
    const [drafts, setDrafts] = useState([]);
    const [loading, setLoading] = useState(false);

    const generate = async () => {
        if (brief.trim().length < 3) {
            toast.error('Say what the notification is about first');
            return;
        }
        try {
            setLoading(true);
            const res = await api.post('/notification/ai-draft', {
                brief: brief.trim().slice(0, 600),
                tone,
                language,
                audience: (audienceText || '').slice(0, 200),
                opens: (opensText || '').slice(0, 200),
            });
            setDrafts(res.data?.data?.drafts || []);
        } catch (error) {
            toast.error(
                apiErrorMessage(error, 'Couldn’t write a draft. Try again.'),
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <section
            aria-label='Write with AI'
            className='flex flex-col gap-3 p-3.5 rounded-[10px] bg-sunken border border-line-soft'
        >
            <div className='flex items-center gap-2'>
                <Sparkles className='w-4 h-4 text-brand' aria-hidden='true' />
                <h3 className='flex-1 text-[13px] font-medium text-ink'>
                    Write with AI
                </h3>
                <Button
                    variant='ghost'
                    size='sm'
                    iconOnly
                    icon={X}
                    aria-label='Close AI writer'
                    onClick={onClose}
                />
            </div>

            <label
                htmlFor='ai-draft-brief'
                className='text-[12.5px] text-ink-2'
            >
                What’s it about? Facts only — the AI won’t add any.
            </label>
            <Textarea
                id='ai-draft-brief'
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                maxLength={600}
                rows={3}
                placeholder='For example: OS and DBMS PYQs from the last 5 years are up for Integral University. End-sems start next week.'
            />

            <div className='flex flex-wrap items-end gap-2'>
                <label className='flex flex-col gap-1 text-[12.5px] text-ink-2'>
                    Tone
                    <Select
                        value={tone}
                        onChange={(e) => setTone(e.target.value)}
                        options={TONES}
                        className='h-9'
                    />
                </label>
                <label className='flex flex-col gap-1 text-[12.5px] text-ink-2'>
                    Language
                    <Select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        options={LANGUAGES}
                        className='h-9'
                    />
                </label>
                <Button
                    variant='primary'
                    icon={loading ? Loader2 : Sparkles}
                    onClick={generate}
                    disabled={loading}
                    className={`ml-auto ${loading ? '[&>svg]:animate-spin' : ''}`}
                >
                    {loading
                        ? 'Writing…'
                        : drafts.length
                          ? 'Try again'
                          : 'Suggest 3 options'}
                </Button>
            </div>

            {drafts.length > 0 && (
                <ul className='flex flex-col gap-2' aria-label='Suggestions'>
                    {drafts.map((draft, index) => (
                        <li
                            key={`${draft.title}-${index}`}
                            className='flex items-start gap-3 p-3 rounded-lg bg-sheet border border-line'
                        >
                            <div className='flex-1 min-w-0'>
                                <p className='text-[13.5px] font-semibold text-ink break-words'>
                                    {draft.title}
                                </p>
                                <p className='text-[13px] text-ink-2 break-words'>
                                    {draft.message}
                                </p>
                            </div>
                            <Button size='sm' onClick={() => onUse(draft)}>
                                Use this
                            </Button>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
