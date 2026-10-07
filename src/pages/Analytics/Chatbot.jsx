import useAnalyticsFilters from '../../hooks/useAnalyticsFilters';
import useAnalyticsQuery from '../../hooks/useAnalyticsQuery';
import ChatbotAnalytics from '../../components/Analytics/ChatbotAnalytics';
import ReportLayout from '../../components/Analytics/v2/ReportLayout';
import QueryPanel from '../../components/Analytics/v2/QueryPanel';

export default function Chatbot() {
    const controls = useAnalyticsFilters();
    const query = useAnalyticsQuery('/analytics/chatbot');
    return (
        <ReportLayout
            title='Chatbot'
            description='Usage of the in-app study assistant across all colleges and platforms.'
            controls={{ ...controls, error: null }}
            filtersVisible={false}
        >
            <p className='text-sm text-muted'>
                This report shows all-time totals and the last 30 days of
                activity. The date, college and platform filters from other
                Analytics tabs do not apply.
            </p>
            <QueryPanel
                title='Study assistant activity'
                query={query}
                empty={!query.data?.totalUsers && !query.data?.totalSessions}
            >
                <div className='p-4 sm:p-5'>
                    <ChatbotAnalytics chatbotData={query.data} />
                </div>
            </QueryPanel>
        </ReportLayout>
    );
}
