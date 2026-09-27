import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import { blogEndpoints } from "./blogApi";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import Papa from "papaparse";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
    Calendar,
    Download,
    TrendingUp,
    TrendingDown,
    Users,
    Activity,
    Award,
    FileBarChart,
} from "lucide-react";


function AnalyticsOverview() {
    const [report, setReport] = useState(null);
    const [error, setError] = useState('');
    const [revision, setRevision] = useState(0);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState(new Date("2024-01-01"));
    const [endDate, setEndDate] = useState(new Date());


    useEffect(() => {
        const controller = new AbortController();
        const fetchReport = async () => {
            setLoading(true);
            setError('');
            try {
                const end = new Date(endDate); end.setHours(23, 59, 59, 999);
                const response = await api.get(blogEndpoints.analytics, { signal: controller.signal,
                    params: { start: startDate.toISOString(), end: end.toISOString() } });
                setReport(response.data.data);
            } catch (err) {
                if (!controller.signal.aborted) setError(err.response?.data?.message || 'Unable to load analytics.');
            } finally { if (!controller.signal.aborted) setLoading(false); }
        };
        void fetchReport();
        return () => controller.abort();
    }, [startDate, endDate, revision]);

    const totalBlogs = report?.totals?.[0]?.count || 0;
    const totalReads = report?.totals?.[0]?.reads || 0;
    const avgReads = totalBlogs ? (totalReads / totalBlogs).toFixed(2) : 0;
    const monthlyUploads = Object.fromEntries((report?.months || []).map(row => [row._id, row.count]));
    const dailyActivity = Object.fromEntries((report?.days || []).map(row => [row._id, row.count]));
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayFrequency = Object.fromEntries((report?.weekdays || []).map(row => [days[row._id - 1], row.count]));
    const sortedAuthors = (report?.authors || []).map(row => [row._id || 'Unknown', { blogs: row.blogs, reads: row.reads }]);
    const topBlogs = report?.topBlogs || [];

    const months = Object.keys(monthlyUploads).sort();
    const lastMonth = months.at(-1);
    const prevMonth = months.at(-2);
    const calcGrowth =
        lastMonth && prevMonth
            ? (
                ((monthlyUploads[lastMonth] - monthlyUploads[prevMonth]) /
                    monthlyUploads[prevMonth]) *
                100
            ).toFixed(2)
            : 0;

    const growthRate = calcGrowth;

    const bestDay =
        Object.entries(dayFrequency).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

    // Export CSV
    const exportCSV = () => {
        const csv = Papa.unparse([{ totalBlogs, totalReads, averageReads: avgReads, start: startDate.toISOString(), end: endDate.toISOString() }]);
        const blob = new Blob([csv], { type: "text/csv" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = "blog-analytics.csv";
        link.download = "blog-analytics.csv";
        link.click();
        URL.revokeObjectURL(url);
    };

    const formatData = (obj) =>
        Object.entries(obj).map(([label, value]) => ({ label, value }));

    if (error) return <div role="alert" className="p-8"><p>{error}</p><button onClick={() => setRevision(value => value + 1)}>Retry</button></div>;
    if (loading)
        return (
            <div className="flex justify-center items-center h-64 text-gray-600 dark:text-gray-300">
                <Activity className="w-6 h-6 animate-spin mr-2" /> Loading Analytics...
            </div>
        );

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">📈 Blog Analytics Dashboard</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Performance metrics and author insights
                    </p>
                </div>
                <button
                    onClick={exportCSV}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow"
                >
                    <Download className="w-4 h-4" /> Export CSV
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                    <span className="font-medium text-sm">Start:</span>
                    <DatePicker
                        selected={startDate}
                        onChange={(d) => setStartDate(d)}
                        className="border px-3 py-1 rounded-lg text-gray-800"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-pink-600" />
                    <span className="font-medium text-sm">End:</span>
                    <DatePicker
                        selected={endDate}
                        onChange={(d) => setEndDate(d)}
                        className="border px-3 py-1 rounded-lg text-gray-800"
                    />
                </div>
                <div
                    className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg ${growthRate > 0
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30"
                        : "bg-rose-100 text-rose-700 dark:bg-rose-900/30"
                        }`}
                >
                    {growthRate > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {growthRate > 0 ? `Growth +${growthRate}%` : `Decline ${growthRate}%`}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KPI label="Total Blogs" value={totalBlogs} icon={<FileBarChart />} color="indigo" />
                <KPI label="Total Reads" value={totalReads} icon={<TrendingUp />} color="emerald" />
                <KPI label="Average Reads" value={avgReads} icon={<Users />} color="violet" />
                <KPI label="Best Day" value={bestDay} icon={<Award />} color="rose" />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Monthly Uploads">
                    <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={formatData(monthlyUploads)}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
                            <XAxis dataKey="label" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line dataKey="value" stroke="#6366F1" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Daily Activity Trend">
                    <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={formatData(dailyActivity)}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
                            <XAxis dataKey="label" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line dataKey="value" stroke="#10B981" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Most Active Days of Week">
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={formatData(dayFrequency)}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
                            <XAxis dataKey="label" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill="#F59E0B" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Top Authors by Reads">
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart
                            data={sortedAuthors.map(([author, data]) => ({
                                label: author,
                                value: data.reads,
                            }))}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
                            <XAxis dataKey="label" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            {/* Top Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DataCard title="🏆 Top 5 Blogs by Reads" data={topBlogs} type="blogs" />
            </div>
        </div>
    );
}

function KPI({ label, value }) {
    return (
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-2xl shadow-xl">
            <h3 className="text-sm text-gray-600 dark:text-gray-400">{label}</h3>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
    );
}

function ChartCard({ title, children }) {
    return (
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-2xl shadow-xl">
            <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">{title}</h2>
            {children}
        </div>
    );
}

function DataCard({ title, data, type }) {
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow">
            <h2 className="text-lg font-semibold mb-3">{title}</h2>
            {data.length === 0 ? (
                <p className="text-sm text-gray-500">No data available for this range.</p>
            ) : (
                <ul className="space-y-3 text-sm">
                    {type === "blogs"
                        ? data.map((b) => (
                            <li key={b._id} className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-2">
                                <a
                                    href={`https://blog.studentsenior.com/blog/post/${b.slug}`}
                                    className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium line-clamp-1"
                                >
                                    {b.title}
                                </a>
                                <span className="text-gray-500">{b.total_reads || 0} reads</span>
                            </li>
                        ))
                        : data.map(([name, info]) => (
                            <li key={name} className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-2">
                                <span className="font-medium">{name}</span>
                                <span className="text-gray-500">{info.reads} reads</span>
                            </li>
                        ))}
                </ul>
            )}
        </div>
    );
}


export default AnalyticsOverview;
