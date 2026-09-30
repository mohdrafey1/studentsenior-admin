import { CONTROL_CLASS } from './formStyles';

/**
 * Native select in the console style. Pass `options` as
 * [{ value, label }] or plain <option> children.
 */
export default function Select({
    options,
    placeholder,
    className = '',
    children,
    ...rest
}) {
    return (
        <select
            className={`${CONTROL_CLASS} h-9 px-2.5 cursor-pointer ${className}`}
            {...rest}
        >
            {placeholder !== undefined && (
                <option value=''>{placeholder}</option>
            )}
            {options
                ? options.map((option) => (
                      <option key={option.value} value={option.value}>
                          {option.label}
                      </option>
                  ))
                : children}
        </select>
    );
}
