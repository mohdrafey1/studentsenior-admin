import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { CONTROL_CLASS } from './ui';

/**
 * Dropdown with a search box, for long option lists.
 * options: [{ value, label }]; onChange receives the chosen value.
 * Works inside Field too: the id and aria props it passes land on the trigger.
 */
const SearchableSelect = ({
    options = [],
    value,
    onChange,
    placeholder,
    label = '',
    loading = false,
    errorState = false,
    required = false,
    disabled = false,
    id: idProp,
    'aria-invalid': ariaInvalid,
    'aria-describedby': ariaDescribedBy,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef(null);
    const inputRef = useRef(null);
    const triggerRef = useRef(null);
    const autoId = useId();
    const id = idProp || autoId;
    const listId = `${id}-list`;

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const filteredOptions =
        options?.filter((option) =>
            option.label.toLowerCase().includes(searchTerm.toLowerCase()),
        ) || [];

    const selectedOption = options?.find((option) => option.value === value);

    const handleSelect = (optionValue) => {
        onChange(optionValue);
        setIsOpen(false);
        setSearchTerm('');
        triggerRef.current?.focus();
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Escape' && isOpen) {
            event.stopPropagation();
            setIsOpen(false);
            triggerRef.current?.focus();
        }
    };

    return (
        <div
            className='relative w-full'
            ref={dropdownRef}
            onKeyDown={handleKeyDown}
        >
            {label && (
                <label
                    htmlFor={id}
                    className='block text-[13px] font-medium text-ink mb-1.5'
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

            <button
                ref={triggerRef}
                id={id}
                type='button'
                disabled={disabled}
                aria-haspopup='listbox'
                aria-expanded={isOpen}
                aria-controls={isOpen ? listId : undefined}
                aria-invalid={errorState || ariaInvalid ? true : undefined}
                aria-describedby={ariaDescribedBy}
                aria-required={required || undefined}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`${CONTROL_CLASS} h-9 pl-3 pr-2.5 flex items-center gap-2 text-left cursor-pointer ${
                    isOpen ? 'ring-2 ring-brand/30' : ''
                }`}
            >
                <span
                    className={`flex-1 min-w-0 truncate ${selectedOption ? 'text-ink' : 'text-muted'}`}
                >
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown
                    className={`w-4 h-4 text-muted shrink-0 transition-transform ${
                        isOpen ? 'rotate-180' : ''
                    }`}
                    aria-hidden='true'
                />
            </button>

            {isOpen && (
                <div className='absolute z-30 mt-1 w-full bg-sheet border border-line rounded-lg shadow-[0_12px_32px_rgba(20,19,17,0.16)] max-h-64 overflow-y-auto'>
                    <div className='sticky top-0 bg-sheet p-2 border-b border-line-soft'>
                        <label className='flex items-center gap-2 h-8 px-2.5 rounded-md border border-line-strong bg-sheet text-muted focus-within:ring-2 focus-within:ring-brand/30'>
                            <Search
                                className='w-3.5 h-3.5 shrink-0'
                                aria-hidden='true'
                            />
                            <input
                                ref={inputRef}
                                autoFocus
                                type='text'
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className='flex-1 min-w-0 bg-transparent outline-none text-[13px] text-ink placeholder:text-muted'
                                placeholder='Search'
                                aria-label={`Search ${label || placeholder || 'options'}`}
                                aria-controls={listId}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </label>
                    </div>

                    {loading ? (
                        <div className='py-3 px-3 text-[13px] text-muted text-center'>
                            Loading…
                        </div>
                    ) : filteredOptions.length > 0 ? (
                        <ul id={listId} role='listbox' className='p-1'>
                            {filteredOptions.map((option) => {
                                const selected = value === option.value;
                                return (
                                    <li
                                        key={option.value}
                                        role='option'
                                        aria-selected={selected}
                                    >
                                        <button
                                            type='button'
                                            onClick={() =>
                                                handleSelect(option.value)
                                            }
                                            className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-left text-[13.5px] cursor-pointer ${
                                                selected
                                                    ? 'bg-brand-soft text-brand-ink font-medium'
                                                    : 'text-ink hover:bg-sunken'
                                            }`}
                                        >
                                            <span className='flex-1 min-w-0'>
                                                {option.label}
                                            </span>
                                            {selected && (
                                                <Check
                                                    className='w-4 h-4 shrink-0'
                                                    aria-hidden='true'
                                                />
                                            )}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <div className='py-3 px-3 text-[13px] text-muted text-center'>
                            Nothing matches. Try another search.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchableSelect;
