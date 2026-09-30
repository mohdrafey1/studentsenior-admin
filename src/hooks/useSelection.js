import { useCallback, useMemo, useState } from 'react';

/**
 * Row selection for tables with bulk actions. Pass the ids of the rows on
 * screen; selection of rows that leave the screen is kept until cleared.
 */
export function useSelection(visibleIds) {
    const [selected, setSelected] = useState(() => new Set());

    const toggle = useCallback((id, on) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (on ?? !next.has(id)) next.add(id);
            else next.delete(id);
            return next;
        });
    }, []);

    const visibleSelected = useMemo(
        () => visibleIds.filter((id) => selected.has(id)).length,
        [visibleIds, selected],
    );
    const allVisible =
        visibleIds.length > 0 && visibleSelected === visibleIds.length;

    const toggleAllVisible = useCallback(
        (on) => {
            setSelected((prev) => {
                const next = new Set(prev);
                visibleIds.forEach((id) =>
                    on ? next.add(id) : next.delete(id),
                );
                return next;
            });
        },
        [visibleIds],
    );

    const clear = useCallback(() => setSelected(new Set()), []);

    return {
        selected,
        count: selected.size,
        isSelected: (id) => selected.has(id),
        toggle,
        allVisible,
        someVisible: visibleSelected > 0 && !allVisible,
        toggleAllVisible,
        clear,
    };
}
