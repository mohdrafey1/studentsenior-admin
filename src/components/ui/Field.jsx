import { Children, cloneElement, isValidElement, useId } from 'react';

/**
 * Label, control, hint and error in one column. Pass a single control
 * (Input, Select, Textarea or a native element) as the child: Field gives it
 * an id, aria-invalid and aria-describedby, so callers don't wire them up.
 */
export default function Field({
    label,
    hint,
    error,
    required = false,
    id: idProp,
    className = '',
    children,
}) {
    const autoId = useId();
    const id = idProp || autoId;
    const hintId = hint ? `${id}-hint` : undefined;
    const errorId = error ? `${id}-error` : undefined;
    const describedBy =
        [errorId, hintId].filter(Boolean).join(' ') || undefined;

    const child = Children.only(children);
    const control = isValidElement(child)
        ? cloneElement(child, {
              id: child.props.id || id,
              'aria-invalid': error ? true : child.props['aria-invalid'],
              'aria-describedby': describedBy,
          })
        : child;

    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            {label && (
                <label
                    htmlFor={child.props?.id || id}
                    className='text-[13px] font-medium text-ink'
                >
                    {label}
                    {required && (
                        <span className='text-bad-ink' aria-hidden='true'>
                            {' '}
                            *
                        </span>
                    )}
                </label>
            )}
            {control}
            {error && (
                <p id={errorId} className='text-[12.5px] text-bad-ink'>
                    {error}
                </p>
            )}
            {hint && (
                <p id={hintId} className='text-[12.5px] text-muted'>
                    {hint}
                </p>
            )}
        </div>
    );
}
