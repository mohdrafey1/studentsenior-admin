import test from 'node:test';
import assert from 'node:assert/strict';
import {
    TIME_FILTER_OPTIONS,
    filterByTime,
    timeFilterRange,
} from '../src/components/Common/timeFilterUtils.js';

// The server now filters lists by date, so the range sent for each time
// filter must keep exactly the rows the old in-browser filter kept.
test('every time filter sends the same window the list used to apply', () => {
    const now = new Date();
    const hour = 60 * 60 * 1000;
    // Half past each hour, so no sample sits on a window edge while the old
    // filter reads the clock a moment later.
    const samples = Array.from({ length: 24 * 800 }, (_, i) => new Date(now.getTime() - i * hour - hour / 2));
    for (const { value } of TIME_FILTER_OPTIONS) {
        const { from, to } = timeFilterRange(value, now);
        for (const createdAt of samples) {
            const server = (!from || createdAt >= new Date(from)) && (!to || createdAt < new Date(to));
            assert.equal(server, filterByTime({ createdAt }, value), `${value} at ${createdAt.toISOString()}`);
        }
    }
    assert.deepEqual(timeFilterRange('all', now), {});
});
