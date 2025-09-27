import React from 'react';
import { Download, Smartphone } from 'lucide-react';
import { usePWA } from '../hooks/usePWA';

const InstallPWA = () => {
    const { isInstallable, isInstalled, installApp } = usePWA();

    if (isInstalled || !isInstallable) {
        return null;
    }

    const handleInstall = async () => {
        const success = await installApp();
        if (success) {
            console.log('App installed successfully');
        }
    };

    return (
        <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6'>
            <div className='flex items-center'>
                <div className='flex-shrink-0'>
                    <Smartphone className='h-5 w-5 text-blue-400' />
                </div>
                <div className='ml-3 flex-1'>
                    <h3 className='text-sm font-medium text-blue-800'>
                        Install Admin Dashboard
                    </h3>
                    <p className='mt-1 text-sm text-blue-700'>
                        Install this app on your device for quick access and
                        offline functionality.
                    </p>
                </div>
                <div className='ml-3 flex-shrink-0'>
                    <button
                        onClick={handleInstall}
                        className='inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                    >
                        <Download className='h-4 w-4 mr-1' />
                        Install
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InstallPWA;
