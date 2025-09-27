import React from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { useOnlineStatus } from '../hooks/usePWA';

const OfflineIndicator = () => {
    const isOnline = useOnlineStatus();

    if (isOnline) {
        return null;
    }

    return (
        <div className='fixed top-0 left-0 right-0 bg-red-600 text-white px-4 py-2 text-center z-50'>
            <div className='flex items-center justify-center'>
                <WifiOff className='h-4 w-4 mr-2' />
                <span className='text-sm font-medium'>
                    You're offline. Some features may not be available.
                </span>
            </div>
        </div>
    );
};

export default OfflineIndicator;
