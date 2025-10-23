import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

export const useStatsWithDelta = (collegeSlug = null) => {
    const [currentStats, setCurrentStats] = useState(null);
    const [previousStats, setPreviousStats] = useState(null);
    const [lastViewedAt, setLastViewedAt] = useState(null);
    const [deltaStats, setDeltaStats] = useState({});
    const [loading, setLoading] = useState(true);

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

    // Update stats snapshot when user leaves or page unmounts
    const updateStatsSnapshot = useCallback(
        async (stats) => {
            try {
                console.log('[Delta] Updating snapshot with stats:', stats);
                console.log('[Delta] collegeSlug:', collegeSlug || null);

                await api.post('/admin-view-stats/update-snapshot', {
                    collegeSlug: collegeSlug || null,
                    statsSnapshot: stats,
                });

                console.log('[Delta] Snapshot updated successfully');
            } catch (error) {
                console.error('Error updating stats snapshot:', error);
                console.error(
                    '[Delta] Update error details:',
                    error.response?.data,
                );
            }
        },
        [collegeSlug],
    );

    // Initialize: fetch last viewed stats
    useEffect(() => {
        fetchLastViewedStats();
    }, [fetchLastViewedStats]);

    // Calculate delta when both current and previous stats are available
    useEffect(() => {
        if (currentStats && previousStats) {
            console.log('[Delta] Calculating delta...');
            console.log('[Delta] Current stats:', currentStats);
            console.log('[Delta] Previous stats:', previousStats);

            const delta = calculateDelta(currentStats, previousStats);
            console.log('[Delta] Calculated delta:', delta);
            setDeltaStats(delta);
        } else {
            console.log(
                '[Delta] Cannot calculate - currentStats:',
                !!currentStats,
                'previousStats:',
                !!previousStats,
            );
        }
    }, [currentStats, previousStats, calculateDelta]);

    // Update snapshot when component unmounts or when current stats change
    useEffect(() => {
        if (!currentStats) return;

        // Update snapshot on unmount
        return () => {
            updateStatsSnapshot(currentStats);
        };
    }, [currentStats, updateStatsSnapshot]);

    // Function to set current stats from parent component
    const setStats = useCallback((stats) => {
        setCurrentStats(stats);
        setLoading(false);
    }, []);

    return {
        currentStats,
        previousStats,
        deltaStats,
        lastViewedAt,
        loading,
        setStats,
        updateStatsSnapshot,
    };
};
