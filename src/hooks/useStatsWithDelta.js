import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../utils/api';

export const useStatsWithDelta = (collegeSlug = null) => {
    const [currentStats, setCurrentStats] = useState(null);
    const [previousStats, setPreviousStats] = useState(null);
    const [lastViewedAt, setLastViewedAt] = useState(null);
    // Keep raw delta for debugging or advanced use
    const [rawDeltaStats, setRawDeltaStats] = useState({});
    const [loading, setLoading] = useState(true);
    const storageKey = useMemo(
        () => `admin-delta-ack:${collegeSlug || 'global'}`,
        [collegeSlug],
    );
    const [ackMap, setAckMap] = useState(() => {
        try {
            const raw = localStorage.getItem('admin-delta-ack:global');
            const scoped = localStorage.getItem(storageKey);
            return scoped ? JSON.parse(scoped) : raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    });

    // Calculate delta between current and previous stats
    const calculateDelta = useCallback((current, previous) => {
        if (!current || !previous) return {};

        const delta = {};
        for (const key in current) {
            if (
                typeof current[key] === 'number' &&
                typeof previous[key] === 'number'
            ) {
                const diff = current[key] - previous[key];
                if (diff !== 0) {
                    delta[key] = diff;
                }
            }
        }
        return delta;
    }, []);

    // Fetch last viewed stats
    const fetchLastViewedStats = useCallback(async () => {
        try {
            const params = collegeSlug ? { collegeSlug } : {};
            console.log(
                '[Delta] Fetching last viewed stats with params:',
                params,
            );

            const response = await api.get('/admin-view-stats/last-viewed', {
                params,
            });

            console.log('[Delta] API Response:', response.data);

            if (response.data.success) {
                setPreviousStats(response.data.data.lastSnapshot);
                setLastViewedAt(response.data.data.lastViewedAt);
                console.log(
                    '[Delta] Previous stats set:',
                    response.data.data.lastSnapshot,
                );
                console.log(
                    '[Delta] Last viewed at:',
                    response.data.data.lastViewedAt,
                );
            }
        } catch (error) {
            console.error('Error fetching last viewed stats:', error);
            console.error('[Delta] Error details:', error.response?.data);
        }
    }, [collegeSlug]);

    // Optional: API to update a full snapshot (not auto-run anymore)
    const updateStatsSnapshot = useCallback(
        async (stats) => {
            try {
                await api.post('/admin-view-stats/update-snapshot', {
                    collegeSlug: collegeSlug || null,
                    statsSnapshot: stats,
                });
            } catch (error) {
                console.error('Error updating stats snapshot:', error);
            }
        },
        [collegeSlug],
    );

    // Initialize: fetch last viewed stats
    useEffect(() => {
        fetchLastViewedStats();
    }, [fetchLastViewedStats]);

    // Calculate raw delta when both current and previous stats are available
    useEffect(() => {
        if (currentStats && previousStats) {
            console.log('[Delta] Calculating delta...');
            console.log('[Delta] Current stats:', currentStats);
            console.log('[Delta] Previous stats:', previousStats);

            const delta = calculateDelta(currentStats, previousStats);
            console.log('[Delta] Calculated delta:', delta);
            setRawDeltaStats(delta);
        } else {
            console.log(
                '[Delta] Cannot calculate - currentStats:',
                !!currentStats,
                'previousStats:',
                !!previousStats,
            );
        }
    }, [currentStats, previousStats, calculateDelta]);

    // Persist ack map when it changes
    useEffect(() => {
        try {
            localStorage.setItem(storageKey, JSON.stringify(ackMap));
        } catch (e) {
            console.warn('Failed to persist ackMap', e);
        }
    }, [ackMap, storageKey]);

    // Function to set current stats from parent component
    const setStats = useCallback((stats) => {
        setCurrentStats(stats);
        setLoading(false);
    }, []);

    // Compute visible delta based on per-key acknowledgements
    const visibleDelta = useMemo(() => {
        if (!currentStats || !previousStats) return {};
        const result = {};
        for (const key of Object.keys(currentStats)) {
            const curr = currentStats[key];
            const prev =
                typeof previousStats[key] === 'number'
                    ? previousStats[key]
                    : undefined;
            if (typeof curr !== 'number' || typeof prev !== 'number') continue;
            const ackBase =
                typeof ackMap[key] === 'number' ? ackMap[key] : prev;
            const diff = curr - ackBase;
            if (diff !== 0) result[key] = diff;
        }
        return result;
    }, [currentStats, previousStats, ackMap]);

    // Acknowledge a single stat: set its baseline to the current value
    const acknowledgeStat = useCallback(
        (key) => {
            if (!currentStats || typeof currentStats[key] !== 'number') return;
            setAckMap((m) => ({ ...m, [key]: currentStats[key] }));
        },
        [currentStats],
    );

    // Acknowledge all stats (manual use only)
    const acknowledgeAll = useCallback(() => {
        if (!currentStats) return;
        const next = {};
        for (const [k, v] of Object.entries(currentStats)) {
            if (typeof v === 'number') next[k] = v;
        }
        setAckMap(next);
    }, [currentStats]);

    return {
        currentStats,
        previousStats,
        deltaStats: visibleDelta,
        rawDeltaStats,
        lastViewedAt,
        loading,
        setStats,
        updateStatsSnapshot,
        acknowledgeStat,
        acknowledgeAll,
    };
};
