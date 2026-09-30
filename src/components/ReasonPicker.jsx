import { COMMON_REASONS, REASON_MAX } from './reviewReasons';
import { Field, Textarea } from './ui';

/** Reason chips plus the editable reason text, used wherever we reject. */
export default function ReasonPicker({
    value,
    onChange,
    error,
    disabled = false,
    rows = 3,
}) {
    return (
        <div className='flex flex-col gap-2.5'>
            <Field label='Reason' required error={error}>
                <Textarea
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    rows={rows}
                    placeholder='What should they fix?'
                    maxLength={REASON_MAX}
                    disabled={disabled}
                />
            </Field>
            <div className='flex flex-wrap gap-1.5' aria-label='Common reasons'>
                {COMMON_REASONS.map(([label, text]) => (
                    <button
                        key={label}
                        type='button'
                        aria-pressed={value === text}
                        disabled={disabled}
                        onClick={() => onChange(text)}
                        className={`h-[26px] px-2.5 rounded-full border text-xs cursor-pointer transition-colors ${
                            value === text
                                ? 'border-bad bg-bad-soft text-bad-ink'
                                : 'border-line-strong bg-sheet text-ink-2 hover:text-ink'
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>
        </div>
    );
}
