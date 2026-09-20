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
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState(new Date("2024-01-01"));
    const [endDate, setEndDate] = useState(new Date());
    const [growthRate, setGrowthRate] = useState(0);

    useEffect(() => {
        const fetchBlogs = async () => {
            try {
                // Analytics covers drafts too, so this reads the admin list.
                const res = await api.get(blogEndpoints.list);
                if (res.data.success) {
                    setBlogs(res.data.data);
                }
            } catch (err) {
                console.error("Error fetching blogs:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchBlogs();
    }, []);

    const filteredBlogs = blogs.filter((b) => {
        const created = new Date(b.createdAt);
        return created >= startDate && created <= endDate;
    });

    // --- Analytics Computations ---
    const totalReads = filteredBlogs.reduce((a, b) => a + (b.total_reads || 0), 0);
    const avgReads = filteredBlogs.length
        ? (totalReads / filteredBlogs.length).toFixed(2)
        : 0;

    const monthlyUploads = {};
    const authorStats = {};
    const dayFrequency = {};
    const dailyActivity = {};
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    filteredBlogs.forEach((blog) => {
        const d = new Date(blog.createdAt);
        const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const fullDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        const day = days[d.getDay()];

        monthlyUploads[month] = (monthlyUploads[month] || 0) + 1;
        dailyActivity[fullDate] = (dailyActivity[fullDate] || 0) + 1;
        dayFrequency[day] = (dayFrequency[day] || 0) + 1;

        authorStats[blog.author] = authorStats[blog.author] || { blogs: 0, reads: 0 };
        authorStats[blog.author].blogs++;
        authorStats[blog.author].reads += blog.total_reads || 0;
    });

    const sortedAuthors = Object.entries(authorStats)
        .sort((a, b) => b[1].reads - a[1].reads)
        .slice(0, 5);

    const topBlogs = filteredBlogs
        .sort((a, b) => (b.total_reads || 0) - (a.total_reads || 0))
        .slice(0, 5);

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

    useEffect(() => setGrowthRate(calcGrowth), [calcGrowth]);

    const bestDay =
        Object.entries(dayFrequency).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

    // Export CSV
    const exportCSV = () => {
        const csv = Papa.unparse(filteredBlogs);
        const blob = new Blob([csv], { type: "text/csv" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "blog-analytics.csv";
        link.download = "blog-analytics.csv";
        link.click();
    };

    const formatData = (obj) =>
        Object.entries(obj).map(([label, value]) => ({ label, value }));

    if (loading)
        return (
            <div className="flex justify-center items-center h-64 text-gray-600 dark:text-gray-300">
                <Activity className="w-6 h-6 animate-spin mr-2" /> Loading Analytics...
            </div>
        );

    return (
        <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 space-y-8">
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
                <KPI label="Total Blogs" value={filteredBlogs.length} icon={<FileBarChart />} color="indigo" />
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
