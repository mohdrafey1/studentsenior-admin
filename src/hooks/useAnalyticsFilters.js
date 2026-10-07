import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { readFilters, reportParams } from '../components/Analytics/v2/data';

export default function useAnalyticsFilters(maxDays = 366) {
    const [search, setSearch] = useSearchParams();
    const { filters, error } = readFilters(search, maxDays);
    const { from, to } = filters;
    useEffect(() => {
        if (!search.has('from') || !search.has('to')) {
            const next = new URLSearchParams(search);
            next.set('from', from);
            next.set('to', to);
            setSearch(next, { replace: true });
        }
    }, [from, to, search, setSearch]);

    const update = (changes) =>
        setSearch((previous) => {
            const next = new URLSearchParams(previous);
            for (const [key, value] of Object.entries(changes)) {
                if (value === '' || value == null) next.delete(key);
                else next.set(key, String(value));
            }
            return next;
        });
    return { filters, error, update, params: reportParams(filters), maxDays };
}
