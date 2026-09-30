import { useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { Button, Dialog } from './ui';
import ReasonPicker from './ReasonPicker';
import { reasonError } from './reviewReasons';

/**
 * Asks for a rejection reason. `onSubmit(reason)` should return a promise;
 * the dialog stays open and busy until it settles.
 */
export default function RejectDialog({
    open,
    onClose,
    onSubmit,
    title,
    description,
}) {
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (open) {
            setReason('');
            setError('');
        }
    }, [open]);

    const submit = async () => {
        const problem = reasonError(reason);
        if (problem) {
            setError(problem);
            return;
        }
        setBusy(true);
        try {
            await onSubmit(reason.trim());
        } finally {
            setBusy(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            busy={busy}
            title={title}
            description={
                description ||
                'Whoever posted it sees your reason, so say what to fix.'
            }
            footer={
                <>
                    <Button onClick={onClose} disabled={busy}>
                        Cancel
                    </Button>
                    <Button
                        variant='danger-solid'
                        icon={busy ? Loader2 : X}
                        className={busy ? '[&>svg]:animate-spin' : ''}
                        onClick={submit}
                        disabled={busy}
                    >
                        {busy ? 'Rejecting…' : 'Reject'}
                    </Button>
                </>
            }
        >
            <ReasonPicker
                value={reason}
                onChange={(text) => {
                    setReason(text);
                    setError('');
                }}
                error={error}
                disabled={busy}
                rows={4}
            />
        </Dialog>
    );
}
