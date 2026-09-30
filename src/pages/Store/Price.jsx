import React from 'react';
import { formatINR } from '../../utils/format';

/**
 * A rupee price set in the serif display face. PT Serif draws "₹" as a
 * rouble-like glyph, so the sign is set in the interface font.
 */
const Price = ({ value, className = '' }) => {
    const text = formatINR(value);
    return (
        <span className={`font-serif font-bold ${className}`}>
            <span className='font-sans font-semibold'>{text.slice(0, 1)}</span>
            {text.slice(1)}
        </span>
    );
};

export default Price;
