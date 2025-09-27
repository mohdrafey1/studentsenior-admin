import { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';

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
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef(null);
    const inputRef = useRef(null);

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
    };

    return (
        <div className='relative w-full' ref={dropdownRef}>
            {label && (
                <label className='block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1'>
                    {label}{' '}
                    {required && <span className='text-red-500'>*</span>}
                </label>
            )}

            <div
                className={`relative flex items-center border ${
                    isOpen
                        ? 'ring-2 ring-blue-500 border-transparent'
                        : 'border-gray-300 dark:border-gray-600'
                } 
        ${errorState ? 'border-red-500 dark:border-red-600' : ''} 
        ${
            disabled
                ? 'bg-gray-100 opacity-70 dark:bg-gray-700 dark:text-gray-100'
                : 'bg-white dark:bg-gray-700 dark:text-gray-100'
        } 
        rounded-lg overflow-hidden cursor-pointer`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                <div className='flex-grow p-3 overflow-hidden text-ellipsis whitespace-nowrap'>
                    {selectedOption ? selectedOption.label : placeholder}
                </div>
                <div className='px-3 text-gray-400 dark:text-gray-400'>
                    <Search className='w-4 h-4' />
                </div>
            </div>

            {isOpen && (
                <div className='absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto'>
                    <div className='sticky top-0 bg-white dark:bg-gray-800 p-2 border-b border-gray-200 dark:border-gray-700'>
                        <input
                            ref={inputRef}
                            autoFocus
                            type='text'
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className='w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100'
                            placeholder='Search...'
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>

                    {loading ? (
                        <div className='py-3 px-4 text-gray-500 dark:text-gray-400 text-center'>
                            Loading...
                        </div>
                    ) : filteredOptions.length > 0 ? (
                        filteredOptions.map((option) => (
                            <div
                                key={option.value}
                                className={`py-3 px-4 hover:bg-blue-50 dark:hover:bg-blue-900 dark:hover:text-blue-100 cursor-pointer ${
                                    value === option.value
                                        ? 'bg-blue-100 dark:bg-blue-900 dark:text-blue-100'
                                        : ''
                                }`}
                                onClick={() => handleSelect(option.value)}
                            >
                                {option.label}
                            </div>
                        ))
                    ) : (
                        <div className='py-3 px-4 text-gray-500 dark:text-gray-400 text-center'>
                            No options found. Try a different search term.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchableSelect;
