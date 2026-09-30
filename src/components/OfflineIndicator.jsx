import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/usePWA';

const OfflineIndicator = () => {
    const isOnline = useOnlineStatus();

    if (isOnline) {
        return null;
    }

    return (
        <div
            role='status'
            className='fixed top-3 left-1/2 -translate-x-1/2 z-[80] flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-inverse text-on-inverse text-[13.5px] shadow-[0_8px_24px_rgba(20,19,17,0.2)]'
        >
            <WifiOff className='w-4 h-4 text-warn' aria-hidden='true' />
            You’re offline. Changes can’t be saved until you reconnect.
        </div>
    );
};

export default OfflineIndicator;
