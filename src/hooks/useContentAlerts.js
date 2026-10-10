import { useCallback, useEffect, useState } from 'react';
import api, { apiErrorMessage } from '../utils/api';
import {
    chunkItems,
    mergeReach,
    readNotifyPref,
    storeNotifyPref,
} from '../utils/contentAlerts';

/** The "Notify students" choice, remembered per browser (on by default). */
export function useNotifyPreference() {
    const [notify, setNotify] = useState(readNotifyPref);
    const update = useCallback((on) => {
        setNotify(on);
        storeNotifyPref(on);
    }, []);
    return [notify, update];
}

const itemsKey = (items = []) =>
    JSON.stringify(
        items
            .map(({ type, id }) => [type, id])
            .sort((a, b) => `${a}`.localeCompare(`${b}`)),
    );

/**
 * How many students the items would reach (POST /content-alerts/reach).
 * Nothing is sent. `delay` debounces changing selections.
 */
export function useAlertReach(items, { enabled = true, delay = 0 } = {}) {
    const key = itemsKey(items);
    const [state, setState] = useState({ key: '', data: null, error: '' });

    useEffect(() => {
        const list = JSON.parse(key).map(([type, id]) => ({ type, id }));
        if (!enabled || !list.length) return;
        const controller = new AbortController();
        const timer = setTimeout(async () => {
            try {
                const parts = [];
                for (const chunk of chunkItems(list)) {
                    const res = await api.post(
                        '/content-alerts/reach',
                        { items: chunk },
                        { signal: controller.signal },
                    );
                    parts.push(res.data?.data);
                }
                if (!controller.signal.aborted)
                    setState({ key, data: mergeReach(parts), error: '' });
            } catch (error) {
                if (!controller.signal.aborted)
                    setState({
                        key,
                        data: null,
                        error: apiErrorMessage(
                            error,
                            'Couldn’t count followers',
                        ),
                    });
            }
        }, delay);
        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [key, enabled, delay]);

    const active = enabled && key !== '[]';
    const current = state.key === key;
    return {
        data: active && current ? state.data : null,
        error: active && current ? state.error : '',
        loading: active && !current,
    };
}

/**
 * Which items were already announced (POST /content-alerts/status), as
 * `{ 'pyq:<id>': { status, sentAt, recipients } }`. Bump `revision` to reload.
 */
export function useAlertStatus(items, { enabled = true, revision = 0 } = {}) {
    const key = itemsKey(items);
    const [state, setState] = useState({ key: '', data: {}, error: '' });
    const [ownRevision, setOwnRevision] = useState(0);
    const refresh = useCallback(() => setOwnRevision((n) => n + 1), []);
    const stateKey = `${key}#${revision}#${ownRevision}`;

    useEffect(() => {
        const list = JSON.parse(key).map(([type, id]) => ({ type, id }));
        if (!enabled || !list.length) return;
        const controller = new AbortController();
        (async () => {
            try {
                const data = {};
                for (const chunk of chunkItems(list)) {
                    const res = await api.post(
                        '/content-alerts/status',
                        { items: chunk },
                        { signal: controller.signal },
                    );
                    Object.assign(data, res.data?.data || {});
                }
                if (!controller.signal.aborted)
                    setState({ key: stateKey, data, error: '' });
            } catch (error) {
                if (!controller.signal.aborted)
                    setState({
                        key: stateKey,
                        data: {},
                        error: apiErrorMessage(
                            error,
                            'Couldn’t check the alert status',
                        ),
                    });
            }
        })();
        return () => controller.abort();
    }, [key, enabled, stateKey]);

    const active = enabled && key !== '[]';
    const current = state.key === stateKey;
    // Keep showing the last answer for the same items while a refresh loads.
    const sameItems = state.key.startsWith(`${key}#`);
    return {
        data: active && sameItems ? state.data : {},
        error: active && current ? state.error : '',
        loading: active && !current,
        refresh,
    };
}
