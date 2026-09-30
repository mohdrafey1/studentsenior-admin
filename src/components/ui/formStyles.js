// Shared look for text inputs, selects and textareas. `aria-invalid` on the
// element switches the border to the error colour, so Field can drive it.
export const CONTROL_CLASS =
    'w-full rounded-lg border border-line-strong bg-sheet text-[13.5px] text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:bg-sunken disabled:text-ink-2 disabled:cursor-not-allowed aria-[invalid=true]:border-bad';
