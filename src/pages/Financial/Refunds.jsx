import { useEffect, useState } from 'react';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import { useSidebarLayout } from '../../hooks/useSidebarLayout';
import api, { apiErrorMessage } from '../../utils/api';

export default function Refunds() {
    const [items, setItems] = useState([]);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(0);
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState('');
    const [revision, setRevision] = useState(0);
    const { mainContentMargin } = useSidebarLayout();
    useEffect(() => {
        const controller = new AbortController();
        setLoading(true); setError('');
        api.get('/refunds', { signal: controller.signal, params: { page, limit: 20, ...(status ? { status } : {}) } })
            .then(({ data }) => { setItems(data.data.requests); setPages(data.data.pagination.totalPages); })
            .catch(err => { if (!controller.signal.aborted) setError(apiErrorMessage(err)); })
            .finally(() => { if (!controller.signal.aborted) setLoading(false); });
        return () => controller.abort();
    }, [page, status, revision]);
    const review = async (item, decision) => {
        const note = decision === 'reject' ? window.prompt('Reason for rejecting this request:') : '';
        if (note === null) return;
        if (decision === 'approve' && !window.confirm('Approve the full refund? This reverses wallet earnings and may send money through Razorpay.')) return;
        setBusy(item._id); setError('');
        try {
            await api.post(`/refunds/${item._id}/review`, { decision, note });
            setRevision(value => value + 1);
        } catch (err) { setError(apiErrorMessage(err)); }
        finally { setBusy(''); }
    };
    return <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header /><Sidebar />
        <main className={`${mainContentMargin} p-6 space-y-5 text-gray-900 dark:text-gray-100`}>
            <h1 className="text-2xl font-bold">Refund requests</h1>
            <p>Refunds remain pending until the provider confirms completion. Google Play refunds are managed in Play Console.</p>
            <label>Status <select className="p-2 dark:bg-gray-800" value={status} onChange={event => { setStatus(event.target.value); setPage(1); }}>
                <option value="">All</option>
                {['requested', 'reviewing', 'processing', 'provider_pending', 'needs_reconciliation', 'refunded', 'rejected'].map(value => <option key={value}>{value}</option>)}
            </select></label>
            {error && <div role="alert"><p>{error}</p><button onClick={() => setRevision(value => value + 1)}>Retry</button></div>}
            {loading ? <p role="status">Loading requests…</p> : items.length === 0 ? <p>No refund requests found.</p> : items.map(item => <article key={item._id} className="border rounded-lg p-4 space-y-2">
                <p className="font-semibold">{item.user?.username || 'Customer'} · {item.status}</p>
                <p>Order: {item.orderId?._id || 'Unavailable'} · {item.orderId?.amount} {item.orderId?.currency} · {item.orderId?.paymentMethod}</p>
                <p>{item.reason || 'No reason provided'}</p>
                {item.staffNote && <p>{item.staffNote}</p>}
                {item.providerRefundId && <p>Provider reference: {item.providerRefundId}</p>}
                {['requested', 'reviewing'].includes(item.status) && <div className="flex gap-4">
                    <button disabled={!!busy} className="border rounded p-2" onClick={() => review(item, 'approve')}>{busy === item._id ? 'Processing…' : 'Approve full refund'}</button>
                    <button disabled={!!busy} className="border rounded p-2" onClick={() => review(item, 'reject')}>Reject</button>
                </div>}
            </article>)}
            <nav aria-label="Refund pages" className="flex gap-4">
                <button disabled={page <= 1 || loading} onClick={() => setPage(value => value - 1)}>Previous</button>
                <span>Page {page} of {Math.max(1, pages)}</span>
                <button disabled={page >= pages || loading} onClick={() => setPage(value => value + 1)}>Next</button>
            </nav>
        </main>
    </div>;
}
