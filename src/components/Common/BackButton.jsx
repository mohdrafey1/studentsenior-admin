import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

const BackButton = ({ title, TitleIcon }) => {
    const navigate = useNavigate();

    return (
        <div className='flex items-center gap-3 mb-4'>
            <button
                onClick={() => navigate(-1)}
                className='p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors'
            >
                <ChevronLeft className='w-4 h-4' />
            </button>
            <div className='flex items-center gap-2'>
                {TitleIcon && <TitleIcon className='w-4 h-4 text-gray-400' />}
                <h1 className='text-lg font-semibold text-gray-900 dark:text-white'>
                    {title}
                </h1>
            </div>
        </div>
    );
};

export default BackButton;
