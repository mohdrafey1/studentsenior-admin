import { useCallback, useEffect, useState } from 'react';
import api, { apiErrorMessage } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
    CATALOG_CACHE_TTL,
    QueryCache,
    stableParams,
} from '../components/Analytics/v2/data';

const cache = new QueryCache();
const catalogCache = new QueryCache(8);

export default function useAnalyticsQuery(
    path,
    params = {},
    { enabled = true, ttl = 30000, sessionCache = false } = {},
) {
    const { token } = useAuth();
    const serialized = stableParams(params);
    const key = `${path}:${serialized}`;
    const [revision, setRevision] = useState(0);
    const [state, setState] = useState({
        key: '',
        owner: token,
        data: null,
        loading: true,
        error: null,
    });
    const refresh = useCallback(() => setRevision((value) => value + 1), []);

    useEffect(() => {
        if (!enabled || !path) return;
        const store = sessionCache ? catalogCache : cache;
        store.scope(token);
        const cached =
            revision === 0
                ? store.get(key, sessionCache ? CATALOG_CACHE_TTL : ttl)
                : undefined;
        if (cached !== undefined) {
            setState({
                key,
                owner: token,
                data: cached,
                loading: false,
                error: null,
            });
            return;
        }
        const controller = new AbortController();
        setState((old) => ({
            key,
            owner: token,
            data: old.key === key && old.owner === token ? old.data : null,
            loading: true,
            error: null,
        }));
        api.get(path, {
            params: JSON.parse(serialized),
            signal: controller.signal,
        })
            .then((response) => {
                if (controller.signal.aborted) return;
                if (response.data.success === false)
                    throw new Error(
                        response.data.message || 'Could not load analytics.',
                    );
                const data = response.data.data;
                store.set(key, data);
                setState({
                    key,
                    owner: token,
                    data,
                    loading: false,
                    error: null,
                });
            })
            .catch((error) => {
                if (!controller.signal.aborted)
                    setState({
                        key,
                        owner: token,
                        data: null,
                        loading: false,
                        error: apiErrorMessage(
                            error,
                            'Could not load analytics.',
                        ),
                    });
            });
        return () => controller.abort();
    }, [path, serialized, key, enabled, revision, ttl, token, sessionCache]);

    const result =
        state.key === key && state.owner === token
            ? state
            : { data: null, loading: enabled, error: null };
    return { ...result, loading: enabled && result.loading, refresh };
}
