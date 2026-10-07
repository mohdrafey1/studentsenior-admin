import useAnalyticsFilters from '../../hooks/useAnalyticsFilters';
import useAnalyticsQuery from '../../hooks/useAnalyticsQuery';
import { useColleges } from '../../context/CollegeContext';
import ReportLayout from '../../components/Analytics/v2/ReportLayout';
import TreeTable from '../../components/Analytics/v2/TreeTable';
import KpiStrip from '../../components/Analytics/v2/KpiStrip';
import { Button, Panel } from '../../components/ui';

export default function Academics() {
    const controls = useAnalyticsFilters();
    const { colleges } = useColleges();
    const courses = useAnalyticsQuery(
        '/resource/courses',
        {},
        { sessionCache: true },
    );
    const branches = useAnalyticsQuery(
        '/resource/branches',
        {},
        { sessionCache: true },
    );
    const subjects = useAnalyticsQuery(
        '/resource/subjects',
        {},
        { sessionCache: true },
    );
    const summary = useAnalyticsQuery(
        '/analytics/v2/academics',
        {
            ...controls.params,
            level: 'college',
            page: 1,
        },
        { enabled: controls.ready },
    );
    const names = {
        college: Object.fromEntries(
            colleges.map((row) => [
                row.slug,
                row.name || row.collegeName || row.slug,
            ]),
        ),
        course: Object.fromEntries(
            (courses.data || []).map((row) => [row._id, row.courseName]),
        ),
        branch: Object.fromEntries(
            (branches.data || []).map((row) => [row._id, row.branchName]),
        ),
        subject: Object.fromEntries(
            (subjects.data || []).map((row) => [row._id, row.subjectName]),
        ),
    };
    const missingLabels = [courses, branches, subjects].filter(
        (query) => query.error,
    );
    return (
        <ReportLayout
            title='Academics'
            description='Expand a college to find the courses, branches and subjects students use.'
            controls={controls}
        >
            <KpiStrip
                query={summary}
                compare={controls.filters.compare}
                metrics={[
                    { key: 'views', label: 'Views' },
                    { key: 'uniqueViewers', label: 'Unique viewers' },
                    { key: 'downloads', label: 'Downloads' },
                    { key: 'unlocks', label: 'Unlocks' },
                ]}
            />
            <Panel title='Academic engagement'>
                {missingLabels.length > 0 && (
                    <div
                        role='alert'
                        className='px-5 py-3 flex flex-wrap items-center gap-3 text-xs text-warn-ink'
                    >
                        Some catalog labels could not load. IDs remain
                        available.
                        <Button
                            size='sm'
                            onClick={() =>
                                missingLabels.forEach((query) =>
                                    query.refresh(),
                                )
                            }
                        >
                            Retry labels
                        </Button>
                    </div>
                )}
                <TreeTable
                    params={controls.params}
                    names={names}
                    query={summary}
                />
                <p className='px-5 py-3 border-t border-line-soft text-xs text-muted'>
                    Unique viewers are deduplicated at each level; do not add
                    child uniques. Approved content uses the latest inventory
                    snapshot across all platforms. Expandable lists are
                    paginated in groups of 100.
                </p>
            </Panel>
        </ReportLayout>
    );
}
