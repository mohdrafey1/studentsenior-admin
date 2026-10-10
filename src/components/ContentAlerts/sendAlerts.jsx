import toast from 'react-hot-toast';
import api from '../../utils/api';
import {
    alertFailure,
    chunkItems,
    mergeSend,
    sendOutcome,
} from '../../utils/contentAlerts';

function retryToast(id, text, retry) {
    toast.error(
        (t) => (
            <span className='flex flex-wrap items-center gap-x-3 gap-y-1'>
                <span>{text}</span>
                <button
                    type='button'
                    className='font-semibold underline underline-offset-2 cursor-pointer'
                    onClick={() => {
                        toast.dismiss(t.id);
                        retry();
                    }}
                >
                    Retry
                </button>
            </span>
        ),
        { id, duration: 12000 },
    );
}

/**
 * Announces live items to the students following their branch
 * (POST /content-alerts) and toasts the result. Call it only after an
 * approval or save has succeeded. Failures offer a Retry action;
 * `onSettled(result)` runs after every attempt, including retries.
 */
export async function sendContentAlerts(
    items,
    { afterApproval = false, onSettled } = {},
) {
    if (!items?.length) return null;
    const id = toast.loading('Notifying students…');
    const again = () => sendContentAlerts(items, { afterApproval, onSettled });
    let result;
    try {
        const parts = [];
        let message = '';
        for (const chunk of chunkItems(items)) {
            const res = await api.post('/content-alerts', { items: chunk });
            parts.push(res.data?.data);
            message = res.data?.message || message;
        }
        const data = mergeSend(parts);
        const outcome = sendOutcome(data, parts.length === 1 ? message : '');
        if (outcome.retry) retryToast(id, outcome.text, again);
        else if (outcome.tone === 'ok') toast.success(outcome.text, { id });
        else toast(outcome.text, { id, icon: null });
        result = { ok: !outcome.retry, data };
    } catch (error) {
        const failure = alertFailure(error, { afterApproval });
        if (failure.retry) retryToast(id, failure.text, again);
        else toast(failure.text, { id, icon: null });
        result = { ok: false, error };
    }
    onSettled?.(result);
    return result;
}
