import { useSidebarLayout } from '../../hooks/useSidebarLayout';
import Sidebar from '../Sidebar';
import Header from '../Header';
import { Loader as LoaderIcon } from 'lucide-react';

const Loader = () => {
    const { mainContentMargin } = useSidebarLayout();

    return (
        <div className='min-h-screen bg-gray-50 dark:bg-gray-900 flex'>
            <Sidebar />

            <div className='flex flex-col flex-1'>
                <Header />

                {/* Main content area */}
                <div
                    className={`flex-1 flex items-center justify-center ${mainContentMargin} transition-all duration-300`}
                >
                    <div className='flex items-center gap-2'>
                        <LoaderIcon className='w-4 h-4 animate-spin text-gray-400' />
                        <span className='text-sm text-gray-500 dark:text-gray-400'>
                            Loading ...
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Loader;
