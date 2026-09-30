import React, { useState } from 'react';
import { Avatar } from '../../components/ui';

/**
 * Avatar that falls back to initials when the photo doesn't load. React
 * passes the image's error event up to this wrapper.
 */
const SeniorAvatar = ({ name, src, size }) => {
    const [failedSrc, setFailedSrc] = useState(null);
    return (
        <span className='contents' onError={() => setFailedSrc(src)}>
            <Avatar
                name={name}
                src={src && failedSrc !== src ? src : undefined}
                size={size}
            />
        </span>
    );
};

export default SeniorAvatar;
