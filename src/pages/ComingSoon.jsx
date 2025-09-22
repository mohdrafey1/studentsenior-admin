import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../components/Header";
import {
    ArrowLeft,
    Construction,
    BarChart3,
    Users,
    Book,
    Building,
    GraduationCap,
    ShoppingBag,
    Gift,
    Plus,
} from "lucide-react";

const ComingSoon = () => {
    const navigate = useNavigate();
    const { category } = useParams();

    const getPageInfo = (category) => {
        switch (category) {
            case "redemptions":
                return {
                    title: "Redemption Requests",
                    icon: <Gift className="w-8 h-8" />,
                    color: "purple",
                    description:
                        "Manage point redemption requests and approvals",
                };
            case "transactions":
                return {
                    title: "Transactions",
                    icon: <BarChart3 className="w-8 h-8" />,
                    color: "blue",
                    description: "View all financial transactions and activity",
                };
            case "clients":
                return {
                    title: "Client Management",
                    icon: <Users className="w-8 h-8" />,
                    color: "indigo",
                    description: "Manage user accounts and client information",
                };
            case "add-points":
                return {
                    title: "Add Point Requests",
                    icon: <Plus className="w-8 h-8" />,
                    color: "amber",
                    description: "Review and process point addition requests",
                };
            case "subjects":
                return {
                    title: "Subject Management",
                    icon: <Book className="w-8 h-8" />,
                    color: "cyan",
                    description: "Manage academic subjects and categories",
                };
            case "branches":
                return {
                    title: "Branch Management",
                    icon: <Building className="w-8 h-8" />,
                    color: "teal",
                    description: "Manage educational branches and departments",
                };
            case "courses":
                return {
                    title: "Course Management",
                    icon: <GraduationCap className="w-8 h-8" />,
                    color: "emerald",
                    description: "Manage courses and curriculum",
                };
            case "products":
                return {
                    title: "Affiliate Products",
                    icon: <ShoppingBag className="w-8 h-8" />,
                    color: "rose",
                    description: "Manage affiliate products and partnerships",
                };
            default:
                return {
                    title: "Report Details",
                    icon: <BarChart3 className="w-8 h-8" />,
                    color: "gray",
                    description: "Detailed view of statistics and data",
                };
        }
    };

    const pageInfo = getPageInfo(category);

    const colorClasses = {
        purple: "bg-purple-600 text-purple-100 border-purple-500",
        blue: "bg-blue-600 text-blue-100 border-blue-500",
        indigo: "bg-indigo-600 text-indigo-100 border-indigo-500",
        amber: "bg-amber-600 text-amber-100 border-amber-500",
        cyan: "bg-cyan-600 text-cyan-100 border-cyan-500",
        teal: "bg-teal-600 text-teal-100 border-teal-500",
        emerald: "bg-emerald-600 text-emerald-100 border-emerald-500",
        rose: "bg-rose-600 text-rose-100 border-rose-500",
        gray: "bg-gray-600 text-gray-100 border-gray-500",
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header />

            <main className="pt-6 pb-12">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header Section */}
                    <div className="flex items-center mb-8">
                        <button
                            onClick={() => navigate("/reports")}
                            className="mr-4 p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="flex items-center">
                            <div
                                className={`p-3 rounded-lg mr-4 ${
                                    colorClasses[pageInfo.color]
                                }`}
                            >
                                {pageInfo.icon}
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                    {pageInfo.title}
                                </h1>
                                <p className="text-gray-600 dark:text-gray-400 mt-1">
                                    {pageInfo.description}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Coming Soon Content */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
                        <div className="max-w-md mx-auto">
                            <Construction className="w-24 h-24 mx-auto text-gray-400 mb-6" />
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                Coming Soon
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-8">
                                This feature is currently under development.
                                We're working hard to bring you comprehensive{" "}
                                {pageInfo.title.toLowerCase()} management
                                capabilities.
                            </p>
                            <div className="space-y-4">
                                <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                                    <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                                        Planned Features:
                                    </h3>
                                    <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                                        <li>• Advanced filtering and search</li>
                                        <li>• Data export capabilities</li>
                                        <li>• Real-time updates</li>
                                        <li>
                                            • Detailed analytics and insights
                                        </li>
                                    </ul>
                                </div>
                                <button
                                    onClick={() => navigate("/reports")}
                                    className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                >
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to Reports
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ComingSoon;
