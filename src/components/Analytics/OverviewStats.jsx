import StatCard from './StatCard';

/**
 * Headline numbers in one bordered strip, divided by hairlines.
 * items: [{ label, value, note?, delta? }]
 */
function OverviewStats({ items }) {
    return (
        <div className='grid grid-cols-2 xl:grid-cols-4 gap-px bg-line-soft border border-line rounded-xl overflow-hidden'>
            {items.map((item) => (
                <StatCard key={item.label} {...item} />
            ))}
        </div>
    );
}

export default OverviewStats;
