import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    debounceTask,
    filterSearch,
    readFilters,
    reportParams,
    validFilterRequest,
    settledFilterRequest,
} from '../components/Analytics/v2/data';

export default function useAnalyticsFilters(
    maxDays = 366,
    { realtime = false, revenue = false } = {},
) {
    const [search, setSearch] = useSearchParams();
    const { filters, error } = readFilters(search, maxDays, undefined, {
        realtime,
        revenue,
    });
    const { from, to } = filters;
    const serialized = validFilterRequest(
        filters,
        error,
        revenue ? 'revenue' : 'period',
    );
    const [settled, setSettled] = useState(serialized);
    useEffect(() => {
        if (serialized === null) return;
        const commit = debounceTask(setSettled);
        commit(serialized);
        return commit.cancel;
    }, [serialized]);
    useEffect(() => {
        if (!search.has('from') || !search.has('to')) {
            setSearch(filterSearch(search, { from, to }), { replace: true });
        }
    }, [from, to, search, setSearch]);
    const update = (changes) =>
        setSearch((previous) => filterSearch(previous, changes), {
            replace: true,
        });
    const { ready, requestFilters } = settledFilterRequest(serialized, settled);
    return {
        filters,
        requestFilters,
        error,
        ready,
        update,
        params: reportParams(requestFilters, revenue ? 'revenue' : 'period'),
        maxDays,
    };
}
