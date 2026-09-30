import { SkeletonRows } from '../ui';

/** In-page loading state: a title bar and a few skeleton rows inside the sheet. */
const Loader = () => {
    return (
        <div role='status' aria-label='Loading' className='px-4 sm:px-10 py-8'>
            <div className='h-8 w-48 rounded-md bg-line-soft animate-pulse mb-8' />
            <div className='border border-line rounded-xl overflow-hidden'>
                <SkeletonRows rows={6} />
            </div>
        </div>
    );
};

export default Loader;
