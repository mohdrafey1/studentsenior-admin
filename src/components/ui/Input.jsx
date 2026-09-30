import { CONTROL_CLASS } from './formStyles';

/** Text input in the console style. Use inside Field for label and errors. */
export default function Input({ className = '', type = 'text', ...rest }) {
    return (
        <input
            type={type}
            className={`${CONTROL_CLASS} h-9 px-3 ${className}`}
            {...rest}
        />
    );
}
