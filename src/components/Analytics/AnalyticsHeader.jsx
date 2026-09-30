import { Download, RefreshCw } from 'lucide-react';
import { Button, PageHeader, Select } from '../ui';
import { RANGE_OPTIONS } from './analyticsData';

const SpinningRefresh = (props) => (
    <RefreshCw {...props} className={`${props.className} animate-spin`} />
);

function AnalyticsHeader({
    timeRange,
    setTimeRange,
    onRefresh,
    onExport,
    refreshing,
    exportDisabled = false,
    summary,
}) {
    return (
        <PageHeader
            title='Analytics'
            description='Content added across every college, and how students use it.'
            meta={summary}
            actions={
                <>
                    <div className='w-[160px]'>
                        <Select
                            aria-label='Time range'
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value)}
                            options={RANGE_OPTIONS}
                        />
                    </div>
                    <Button
                        iconOnly
                        icon={refreshing ? SpinningRefresh : RefreshCw}
                        aria-label='Refresh'
                        onClick={onRefresh}
                        disabled={refreshing}
                    />
                    <Button
                        icon={Download}
                        onClick={onExport}
                        disabled={exportDisabled}
                    >
                        Export CSV
                    </Button>
                </>
            }
        />
    );
}

export default AnalyticsHeader;
