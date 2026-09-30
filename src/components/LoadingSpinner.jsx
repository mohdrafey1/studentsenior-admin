/** Full-screen loading state, used before the console layout has mounted. */
const LoadingSpinner = () => {
    return (
        <div
            role='status'
            aria-label='Loading'
            className='flex items-center justify-center min-h-screen bg-ground'
        >
            <span className='w-9 h-9 rounded-full border-[3px] border-line-strong border-t-brand animate-spin' />
        </div>
    );
};

export default LoadingSpinner;
