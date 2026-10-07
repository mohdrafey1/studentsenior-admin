import { ShieldBan } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { EmptyState, Panel } from '../../ui';
import { canAccessAnalytics } from './data';

export default function AnalyticsAccess({ children, silent = false }) {
    const { user } = useAuth();
    if (canAccessAnalytics(user)) return children;
    if (silent) return null;
    return (
        <div className='px-4 sm:px-10 pt-8 pb-12'>
            <Panel>
                <EmptyState
                    icon={ShieldBan}
                    title='Analytics access required'
                    description='Analytics is available to Admins and Moderators.'
                />
            </Panel>
        </div>
    );
}
