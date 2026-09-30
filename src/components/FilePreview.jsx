import { useEffect, useState } from 'react';
import { ExternalLink, FileText, Loader2 } from 'lucide-react';
import api from '../utils/api';
import { Button, EmptyState } from './ui';

// Uploaded PDFs live in a private bucket; the main API signs a short-lived URL.
const SIGNED_URL_ENDPOINT =
    'https://backend.studentsenior.com/api/v2/aws/signed-url';

const fileNameOf = (url) => {
    try {
        return decodeURIComponent(new URL(url).pathname.split('/').pop());
    } catch {
        return 'document.pdf';
    }
};

/**
 * PDF preview panel for review pages. Loads only when asked, since each
 * preview signs a URL and downloads the file.
 */
export default function FilePreview({
    fileUrl,
    title = 'Document preview',
    height = 640,
}) {
    const [requested, setRequested] = useState(false);
    const [signedUrl, setSignedUrl] = useState(null);
    const [state, setState] = useState('idle');

    useEffect(() => {
        if (!requested || !fileUrl || signedUrl) return;
        let cancelled = false;
        setState('loading');
        api.get(`${SIGNED_URL_ENDPOINT}?fileUrl=${encodeURIComponent(fileUrl)}`)
            .then((response) => {
                if (cancelled) return;
                setSignedUrl(response.data.data.signedUrl);
                setState('ready');
            })
            .catch(() => !cancelled && setState('error'));
        return () => {
            cancelled = true;
        };
    }, [requested, fileUrl, signedUrl]);

    return (
        <section
            aria-label={title}
            className='bg-sheet border border-line rounded-xl overflow-hidden'
        >
            <div className='flex items-center gap-2 h-12 pl-4 pr-2 border-b border-line-soft'>
                <FileText
                    className='w-4 h-4 text-muted shrink-0'
                    aria-hidden='true'
                />
                <code className='flex-1 min-w-0 truncate font-mono text-[12.5px] text-ink'>
                    {fileUrl ? fileNameOf(fileUrl) : 'No file attached'}
                </code>
                {fileUrl && (
                    <Button
                        variant='ghost'
                        size='sm'
                        iconOnly
                        icon={ExternalLink}
                        href={signedUrl || fileUrl}
                        target='_blank'
                        rel='noopener noreferrer'
                        aria-label='Open the file in a new tab'
                    />
                )}
            </div>
            <div
                className='bg-ground flex items-center justify-center'
                style={{ height }}
            >
                {!fileUrl ? (
                    <EmptyState
                        icon={FileText}
                        title='No file attached'
                        description='The uploader didn’t attach a file.'
                    />
                ) : state === 'ready' ? (
                    <iframe
                        src={`${signedUrl}#view=FitH`}
                        title={title}
                        className='w-full h-full border-0 bg-white'
                    />
                ) : state === 'loading' ? (
                    <span className='flex items-center gap-2 text-[13.5px] text-ink-2'>
                        <Loader2
                            className='w-4 h-4 animate-spin'
                            aria-hidden='true'
                        />
                        Loading preview…
                    </span>
                ) : state === 'error' ? (
                    <EmptyState
                        icon={FileText}
                        tone='error'
                        title='Couldn’t load the preview'
                        description='Open the file in a new tab instead, or try again.'
                        action={
                            <Button
                                onClick={() => {
                                    setSignedUrl(null);
                                    setState('idle');
                                    setRequested(false);
                                    setTimeout(() => setRequested(true));
                                }}
                            >
                                Try again
                            </Button>
                        }
                    />
                ) : (
                    <EmptyState
                        icon={FileText}
                        title='Preview the file'
                        description='Loads the PDF here so you can check it before deciding.'
                        action={
                            <Button
                                variant='primary'
                                onClick={() => setRequested(true)}
                            >
                                Load preview
                            </Button>
                        }
                    />
                )}
            </div>
        </section>
    );
}
