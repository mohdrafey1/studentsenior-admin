/**
 * Small pill switch for two to five mutually exclusive options.
 * options: [{ value, label, icon?, ariaLabel? }]
 */
export default function Segmented({
    options,
    value,
    onChange,
    label,
    className = '',
}) {
    return (
        <div
            role='group'
            aria-label={label}
            className={`inline-flex p-[3px] rounded-[9px] bg-ground ${className}`}
        >
            {options.map((option) => {
                const pressed = option.value === value;
                const Icon = option.icon;
                return (
                    <button
                        key={option.value}
                        type='button'
                        aria-pressed={pressed}
                        aria-label={option.ariaLabel}
                        onClick={() => onChange(option.value)}
                        className={`inline-flex items-center justify-center gap-1.5 h-[30px] rounded-md text-[13px] cursor-pointer transition-colors ${
                            Icon && !option.label ? 'w-[30px]' : 'px-3'
                        } ${
                            pressed
                                ? 'bg-sheet text-ink font-medium shadow-[0_1px_2px_rgba(28,27,24,0.08)]'
                                : 'text-ink-2 hover:text-ink'
                        }`}
                    >
                        {Icon && <Icon className='w-[15px] h-[15px]' />}
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}
