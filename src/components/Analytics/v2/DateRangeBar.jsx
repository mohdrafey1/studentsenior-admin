import { useState } from 'react';
import { useColleges } from '../../../context/CollegeContext';
import { Button, Input, Select, Switch } from '../../ui';
import { dayKey, rangeDays, resetFilters, shiftDay } from './data';

function DateField({ label, value, min, max, commit }) {
    const [draft, setDraft] = useState(value);
    return (
        <label className='text-xs text-muted space-y-1'>
            <span className='block'>{label}</span>
            <Input
                type='date'
                aria-label={`${label} date`}
                value={draft}
                min={min}
                max={max}
                onChange={(event) => setDraft(event.target.value)}
                onBlur={() => {
                    if (draft !== value) commit(draft);
                }}
                onKeyDown={(event) => {
                    if (event.key === 'Enter') event.currentTarget.blur();
                }}
            />
        </label>
    );
}

export default function DateRangeBar({
    filters,
    error,
    update,
    maxDays = 366,
    realtime = false,
    revenue = false,
    comparison = true,
}) {
    const { colleges } = useColleges();
    const today = dayKey();
    const presets = [7, 14, 28, 90, 365].filter((days) => days <= maxDays);
    const days = rangeDays(filters.from, filters.to);
    const selected =
        !filters.custom && filters.to === today && presets.includes(days)
            ? String(days)
            : 'custom';
    const platformOptions = [
        { value: '', label: 'All platforms' },
        { value: 'android', label: 'Android' },
        { value: 'web', label: 'Web' },
        { value: 'blog', label: 'Blog' },
        ...(!realtime ? [{ value: 'server', label: 'Server events' }] : []),
    ];
    return (
        <div className='bg-sheet border border-line rounded-xl p-4 space-y-3 mb-6'>
            <div className='flex flex-wrap items-end gap-3'>
                {!realtime && (
                    <>
                        <label className='text-xs text-muted space-y-1'>
                            <span className='block'>Period · IST</span>
                            <Select
                                aria-label='Date range preset'
                                value={selected}
                                onChange={(event) =>
                                    update(
                                        event.target.value === 'custom'
                                            ? { range: 'custom' }
                                            : {
                                                  from: shiftDay(
                                                      today,
                                                      1 -
                                                          Number(
                                                              event.target
                                                                  .value,
                                                          ),
                                                  ),
                                                  to: today,
                                                  range: '',
                                              },
                                    )
                                }
                            >
                                {presets.map((value) => (
                                    <option key={value} value={value}>
                                        {value} days
                                    </option>
                                ))}
                                <option value='custom'>Custom range</option>
                            </Select>
                        </label>
                        <DateField
                            key={`from:${filters.from}`}
                            label='From'
                            value={filters.from}
                            max={filters.to < today ? filters.to : today}
                            commit={(from) => update({ from, range: 'custom' })}
                        />
                        <DateField
                            key={`to:${filters.to}`}
                            label='To'
                            value={filters.to}
                            min={filters.from}
                            max={today}
                            commit={(to) => update({ to, range: 'custom' })}
                        />
                    </>
                )}
                <label className='text-xs text-muted space-y-1 min-w-44'>
                    <span className='block'>College</span>
                    <Select
                        aria-label='College filter'
                        value={filters.college}
                        className='max-w-64'
                        onChange={(event) =>
                            update({ college: event.target.value })
                        }
                    >
                        <option value=''>All colleges</option>
                        {filters.college &&
                            !colleges.some(
                                (college) => college.slug === filters.college,
                            ) && (
                                <option value={filters.college}>
                                    {filters.college}
                                </option>
                            )}
                        {colleges.map((college) => (
                            <option key={college._id} value={college.slug}>
                                {college.name ||
                                    college.collegeName ||
                                    college.slug}
                            </option>
                        ))}
                    </Select>
                </label>
                {!revenue && (
                    <label className='text-xs text-muted space-y-1'>
                        <span className='block'>Platform</span>
                        <Select
                            aria-label='Platform filter'
                            value={filters.platform}
                            onChange={(event) =>
                                update({ platform: event.target.value })
                            }
                            options={platformOptions}
                        />
                    </label>
                )}
                {!realtime && comparison && (
                    <Switch
                        checked={filters.compare}
                        onChange={(compare) => update({ compare })}
                        label='Compare to previous period'
                        className='min-h-9 sm:ml-auto'
                    />
                )}
                {realtime && (
                    <span className='text-xs text-muted py-2'>
                        Live window: last 30 minutes
                    </span>
                )}
            </div>
            {revenue && (
                <p className='text-xs text-muted'>
                    Revenue is recorded by the server. The platform filter does
                    not apply.
                </p>
            )}
            {error && (
                <div
                    role='alert'
                    className='flex flex-wrap items-center gap-3 text-sm text-bad-ink'
                >
                    {error}
                    <Button
                        size='sm'
                        onClick={() => update(resetFilters(today))}
                    >
                        Reset filters
                    </Button>
                </div>
            )}
        </div>
    );
}
