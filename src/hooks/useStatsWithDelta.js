import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

export const useStatsWithDelta = (collegeId = null) => {
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
            const params = collegeId ? { collegeId } : {};
            const response = await api.get('/admin-view-stats/last-viewed', {
                params,
            });

            if (response.data.success) {
                setPreviousStats(response.data.data.lastSnapshot);
                setLastViewedAt(response.data.data.lastViewedAt);
            }
        } catch (error) {
            console.error('Error fetching last viewed stats:', error);
        }
    }, [collegeId]);

    // Update stats snapshot when user leaves or page unmounts
    const updateStatsSnapshot = useCallback(
        async (stats) => {
            try {
                await api.post('/admin-view-stats/update-snapshot', {
                    collegeId: collegeId || null,
                    statsSnapshot: stats,
                });
            } catch (error) {
                console.error('Error updating stats snapshot:', error);
            }
        },
        [collegeId],
    );

    // Initialize: fetch last viewed stats
    useEffect(() => {
        fetchLastViewedStats();
    }, [fetchLastViewedStats]);

    // Calculate delta when both current and previous stats are available
    useEffect(() => {
        if (currentStats && previousStats) {
            const delta = calculateDelta(currentStats, previousStats);
            setDeltaStats(delta);
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
