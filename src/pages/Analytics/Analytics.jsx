import { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { downloadCsv } from '../../utils/csv';
import { formatNumber } from '../../utils/format';
import Loader from '../../components/Common/Loader';
import { Alert, Button } from '../../components/ui';
import AnalyticsHeader from '../../components/Analytics/AnalyticsHeader';
import OverviewStats from '../../components/Analytics/OverviewStats';
import ContentDistribution from '../../components/Analytics/ContentDistribution';
import EngagementMetrics from '../../components/Analytics/EngagementMetrics';
import TopPerformers from '../../components/Analytics/TopPerformers';
import RecentActivity from '../../components/Analytics/RecentActivity';
import GrowthTrends from '../../components/Analytics/GrowthTrends';
import AnalyticsInsights from '../../components/Analytics/AnalyticsInsights';
import ChatbotAnalytics from '../../components/Analytics/ChatbotAnalytics';
import SubmissionsChart from '../../components/Analytics/SubmissionsChart';
import {
    CONTENT_TYPES,
    buildTimeline,
    percentChange,
    rangeLabel,
} from '../../components/Analytics/analyticsData';

function Analytics() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [analyticsData, setAnalyticsData] = useState(null);
    const [collegeData, setCollegeData] = useState(null);
    const [chatbotData, setChatbotData] = useState(null);
    const [timeRange, setTimeRange] = useState('30');

    const fetchAnalytics = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            // "All time" is the API's default when `days` is left out; sending
            // days=all made the server build an invalid date and fail.
            const response = await api.get(
                timeRange === 'all'
                    ? '/analytics'
                    : `/analytics?days=${timeRange}`,
            );
            if (response.data.success) {
                setAnalyticsData(response.data.data);
                setCollegeData(response.data.data.totals);
                return true;
            }
            setError('Couldn’t load analytics. Try again.');
        } catch (error) {
            console.error('Error fetching analytics:', error);
            setError(
                'Couldn’t load analytics. Check your connection and try again.',
            );
        } finally {
            setLoading(false);
        }
        return false;
    }, [timeRange]);

    const fetchChatbotAnalytics = useCallback(async () => {
        try {
            const response = await api.get('/analytics/chatbot');
            if (response.data.success) {
                setChatbotData(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching chatbot analytics:', error);
        }
    }, []);

    useEffect(() => {
        fetchAnalytics();
        fetchChatbotAnalytics();
    }, [fetchAnalytics, fetchChatbotAnalytics]);

    const handleRefresh = async () => {
        setRefreshing(true);
        const [ok] = await Promise.all([
            fetchAnalytics(),
            fetchChatbotAnalytics(),
        ]);
        setRefreshing(false);
        if (ok) toast.success('Analytics refreshed');
    };

    const rangeText = rangeLabel(timeRange);

    const timeline = useMemo(
        () => buildTimeline(analyticsData?.growthData, timeRange),
        [analyticsData, timeRange],
    );

    const changes = analyticsData?.percentageChanges || {};
    const weekNow = Object.values(changes).reduce(
        (sum, c) => sum + (c?.current || 0),
        0,
    );
    const weekBefore = Object.values(changes).reduce(
        (sum, c) => sum + (c?.previous || 0),
        0,
    );
    const totalViews = Object.values(analyticsData?.engagement || {}).reduce(
        (sum, item) => sum + (item?.totalViews || 0),
        0,
    );

    const handleExport = () =>
        downloadCsv(
            `analytics-${timeRange === 'all' ? 'all-time' : `${timeRange}-days`}`,
            [
                { label: 'Content type', value: (t) => t.label },
                {
                    label: `Added (${rangeText})`,
                    value: (t) => collegeData?.[t.total] || 0,
                },
                {
                    label: 'Views (all time)',
                    value: (t) =>
                        analyticsData?.engagement?.[t.series]?.totalViews || 0,
                },
                {
                    label: 'Added, last 7 days',
                    value: (t) => changes[t.change]?.current || 0,
                },
                {
                    label: 'Added, 7 days before',
                    value: (t) => changes[t.change]?.previous || 0,
                },
            ],
            CONTENT_TYPES,
        );

    if (loading && !analyticsData) return <Loader />;

    return (
        <div className='min-h-full px-4 sm:px-10 pt-8 pb-12'>
            <AnalyticsHeader
                timeRange={timeRange}
                setTimeRange={setTimeRange}
                onRefresh={handleRefresh}
                onExport={handleExport}
                refreshing={refreshing || loading}
                exportDisabled={!analyticsData}
                summary={
                    <AnalyticsInsights
                        engagement={analyticsData?.engagement}
                        percentageChanges={analyticsData?.percentageChanges}
                    />
                }
            />

            {error && (
                <Alert
                    tone='bad'
                    className='mb-6'
                    action={
                        <Button size='sm' onClick={fetchAnalytics}>
                            Try again
                        </Button>
                    }
                >
                    {error}
                </Alert>
            )}

            {analyticsData && (
                <div
                    className={`flex flex-col gap-6 transition-opacity ${
                        loading ? 'opacity-60' : ''
                    }`}
                    aria-busy={loading}
                >
                    <OverviewStats
                        items={[
                            {
                                label: 'Content added',
                                value: formatNumber(collegeData?.totalContent),
                                note: rangeText,
                            },
                            {
                                label: 'Added this week',
                                value: formatNumber(weekNow),
                                delta: percentChange(weekNow, weekBefore),
                                note: `vs ${formatNumber(weekBefore)} the week before`,
                            },
                            {
                                label: 'Total views',
                                value: formatNumber(totalViews),
                                note: 'All time, every type',
                            },
                            {
                                label: 'Assistant users',
                                value: chatbotData
                                    ? formatNumber(chatbotData.totalUsers)
                                    : '—',
                                note: chatbotData
                                    ? 'All time'
                                    : 'Couldn’t load assistant data',
                            },
                        ]}
                    />

                    <div className='grid grid-cols-1 xl:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)] gap-5 items-stretch'>
                        <SubmissionsChart
                            timeline={timeline}
                            rangeText={rangeText}
                        />
                        <ContentDistribution totals={collegeData} />
                    </div>

                    <div className='grid grid-cols-1 xl:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)] gap-5 items-start'>
                        <TopPerformers
                            topPerformers={analyticsData.topPerformers}
                        />
                        <RecentActivity
                            recentActivity={analyticsData.recentActivity}
                        />
                    </div>

                    <div className='grid grid-cols-1 xl:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)] gap-5 items-start'>
                        <GrowthTrends
                            percentageChanges={analyticsData.percentageChanges}
                        />
                        <EngagementMetrics
                            engagement={analyticsData.engagement}
                        />
                    </div>
                </div>
            )}

            <div className='mt-8'>
                <ChatbotAnalytics chatbotData={chatbotData} />
            </div>
        </div>
    );
}

export default Analytics;
