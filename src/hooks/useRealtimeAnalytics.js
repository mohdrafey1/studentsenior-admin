import { useEffect, useState } from 'react';
import useAnalyticsQuery from './useAnalyticsQuery';
import {
    reportParams,
    reportReady,
    stableParams,
} from '../components/Analytics/v2/data';

export default function useRealtimeAnalytics(controls) {
    const [visible, setVisible] = useState(
        () => document.visibilityState !== 'hidden',
    );
    const params = reportParams(controls.requestFilters, 'realtime');
    const key = stableParams(params);
    const [failedKey, setFailedKey] = useState(null);
    const enabled = visible && reportReady(controls, 'realtime');
    const query = useAnalyticsQuery('/analytics/v2/realtime', params, {
        enabled: enabled && failedKey !== key,
        ttl: 0,
    });
    const { refresh, error } = query;
    useEffect(() => {
        if (error) setFailedKey(key);
    }, [error, key]);
    useEffect(() => {
        const onVisibility = () =>
            setVisible(document.visibilityState !== 'hidden');
        document.addEventListener('visibilitychange', onVisibility);
        return () =>
            document.removeEventListener('visibilitychange', onVisibility);
    }, []);
    useEffect(() => {
        if (!enabled || error || failedKey === key) return;
        const timer = window.setInterval(refresh, 15000);
        return () => window.clearInterval(timer);
    }, [enabled, error, failedKey, key, refresh]);
    const retry = () => {
        if (!enabled) return;
        setFailedKey(null);
        refresh();
    };
    return { ...query, refresh: retry, visible, paused: failedKey === key };
}
