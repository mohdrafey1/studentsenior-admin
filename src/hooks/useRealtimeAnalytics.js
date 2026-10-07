import { useEffect, useState } from 'react';
import useAnalyticsQuery from './useAnalyticsQuery';
import { reportParams } from '../components/Analytics/v2/data';

export default function useRealtimeAnalytics(filters) {
    const [visible, setVisible] = useState(
        () => document.visibilityState !== 'hidden',
    );
    const query = useAnalyticsQuery(
        '/analytics/v2/realtime',
        reportParams(filters, 'realtime'),
        { enabled: visible, ttl: 0 },
    );
    const { refresh } = query;
    useEffect(() => {
        const onVisibility = () =>
            setVisible(document.visibilityState !== 'hidden');
        document.addEventListener('visibilitychange', onVisibility);
        return () =>
            document.removeEventListener('visibilitychange', onVisibility);
    }, []);
    useEffect(() => {
        if (!visible) return;
        const timer = window.setInterval(refresh, 15000);
        return () => window.clearInterval(timer);
    }, [visible, refresh]);
    return { ...query, visible };
}
