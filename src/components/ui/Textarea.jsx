import { CONTROL_CLASS } from './formStyles';

/** Multi-line text input in the console style. */
export default function Textarea({ className = '', rows = 4, ...rest }) {
    return (
        <textarea
            rows={rows}
            className={`${CONTROL_CLASS} px-3 py-2.5 leading-relaxed resize-y ${className}`}
            {...rest}
        />
    );
}
