import React, { useState } from 'react';
import { ImageOff, Package } from 'lucide-react';

/**
 * The seller's photo, or a quiet placeholder when there is none or it
 * fails to load. `fit` is 'cover' for thumbnails and cards, 'contain' for
 * the full view on the detail page.
 */
const ProductImage = ({
    src,
    alt = '',
    fit = 'cover',
    className = '',
    iconClassName = 'w-7 h-7',
}) => {
    const [failedSrc, setFailedSrc] = useState(null);
    const failed = Boolean(src) && failedSrc === src;

    if (!src || failed) {
        const Icon = failed ? ImageOff : Package;
        return (
            <div
                role={alt ? 'img' : undefined}
                aria-label={
                    alt
                        ? failed
                            ? `Photo of ${alt} couldn’t be loaded`
                            : `No photo of ${alt}`
                        : undefined
                }
                className={`flex items-center justify-center bg-ground text-muted ${className}`}
            >
                <Icon className={iconClassName} aria-hidden='true' />
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={alt}
            loading='lazy'
            onError={() => setFailedSrc(src)}
            className={`${fit === 'contain' ? 'object-contain' : 'object-cover'} bg-ground ${className}`}
        />
    );
};

export default ProductImage;
