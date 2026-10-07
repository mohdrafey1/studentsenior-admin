import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { apiErrorMessage } from '../../utils/api';
import {
    Button,
    EmptyState,
    PageHeader,
    Panel,
    SkeletonRows,
} from '../../components/ui';
import { contentDestination } from '../../components/Analytics/v2/contentDestination';

export default function OpenContent() {
    const { type, id } = useParams();
    const navigate = useNavigate();
    const [error, setError] = useState(null);
    const [attempt, setAttempt] = useState(0);
    useEffect(() => {
        const controller = new AbortController();
        setError(null);
        const get = (path, options = {}) =>
            api.get(path, { ...options, signal: controller.signal });
        const open = async () => {
            try {
                const response = await get('/college');
                const path = await contentDestination(
                    type,
                    id,
                    response.data.data || [],
                    get,
                );
                if (!controller.signal.aborted)
                    navigate(path, { replace: true });
            } catch (error) {
                if (!controller.signal.aborted)
                    setError(
                        apiErrorMessage(error, 'Could not find this content.'),
                    );
            }
        };
        open();
        return () => controller.abort();
    }, [type, id, navigate, attempt]);
    return (
        <div className='px-4 sm:px-10 pt-8 pb-12'>
            <PageHeader
                eyebrow='Analytics'
                title='Open content'
                description='Finding this item in the existing admin catalog.'
            />
            <Panel>
                {error ? (
                    <EmptyState
                        title='Content unavailable'
                        description={error}
                        tone='error'
                        action={
                            <div className='flex gap-2'>
                                <Button onClick={() => setAttempt(attempt + 1)}>
                                    Try again
                                </Button>
                                <Button to='/analytics/content/all'>
                                    Back to content
                                </Button>
                            </div>
                        }
                    />
                ) : (
                    <>
                        <SkeletonRows rows={3} />
                        <div className='p-5'>
                            <Button to='/analytics/content/all'>Cancel</Button>
                        </div>
                    </>
                )}
            </Panel>
        </div>
    );
}
