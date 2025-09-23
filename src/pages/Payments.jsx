import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import api from "../utils/api";
import toast from "react-hot-toast";
import { CreditCard, Eye, Search, ArrowLeft, Loader } from "lucide-react";
import Pagination from "../components/Pagination";

const Payments = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalAmount, setTotalAmount] = useState(0);
    const navigate = useNavigate();

    const fetchPayments = async () => {
        try {
            setError(null);
            const response = await api.get("/transactions/payments");
            setPayments(response.data.data || []);

            // Calculate total amount for paid payments
            const total = (response.data.data || []).reduce((sum, payment) => {
                if (payment.status === "paid") {
                    return sum + (payment.amount || 0);
                }
                return sum;
            }, 0);
            setTotalAmount(total);
        } catch (error) {
            console.error("Error fetching payments:", error);
            setError("Failed to load payments");
            toast.error("Failed to load payments");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, []);

    // Filter payments based on search and filters
    const filteredPayments = payments.filter(
        (payment) =>
            (payment.user?.email?.toLowerCase() || "").includes(
                searchQuery.trim().toLowerCase()
            ) &&
            (filterType
                ? (payment.typeOfPurchase?.toLowerCase() || "") ===
                  filterType.toLowerCase()
                : true) &&
            (filterStatus
                ? (payment.status?.toLowerCase() || "") ===
                  filterStatus.toLowerCase()
                : true)
    );

    // Pagination logic
    const indexOfLastPayment = currentPage * pageSize;
    const indexOfFirstPayment = indexOfLastPayment - pageSize;
    const currentPayments = filteredPayments.slice(
        indexOfFirstPayment,
        indexOfLastPayment
    );
    // totalPages managed by Pagination via totalItems

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "paid":
                return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
            case "pending":
                return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
            case "failed":
                return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
            case "refunded":
                return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case "note_purchase":
                return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
            case "pyq_purchase":
                return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300";
            case "course_purchase":
                return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
            case "add_points":
                return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300";
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <Header />
                <div className="flex items-center justify-center py-20">
                    <div className="flex items-center space-x-2">
                        <Loader className="w-6 h-6 animate-spin text-blue-600" />
                        <span className="text-gray-600 dark:text-gray-400">
                            Loading payments...
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header />

            <main className="pt-6 pb-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header Section */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center">
                            <button
                                onClick={() => navigate("/reports")}
                                className="mr-4 p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div className="flex items-center">
                                <div className="bg-green-600 text-white p-3 rounded-lg mr-4">
                                    <CreditCard className="w-6 h-6" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                        Payment History
                                    </h1>
                                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                                        Manage and view all payment transactions
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-green-50 dark:bg-green-900/30 px-6 py-3 rounded-lg">
                            <div className="text-sm text-green-600 dark:text-green-400">
                                Total Revenue:
                            </div>
                            <div className="text-2xl font-bold text-green-800 dark:text-green-300">
                                ₹{totalAmount.toLocaleString()}
                            </div>
                        </div>
                    </div>

                    {/* Search & Filters */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search by email..."
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                />
                            </div>

                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            >
                                <option value="">All Types</option>
                                <option value="note_purchase">
                                    Note Purchase
                                </option>
                                <option value="pyq_purchase">
                                    PYQ Purchase
                                </option>
                                <option value="course_purchase">
                                    Course Purchase
                                </option>
                                <option value="add_points">Add Points</option>
                            </select>

                            <select
                                value={filterStatus}
                                onChange={(e) =>
                                    setFilterStatus(e.target.value)
                                }
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            >
                                <option value="">All Statuses</option>
                                <option value="paid">Paid</option>
                                <option value="pending">Pending</option>
                                <option value="failed">Failed</option>
                                <option value="refunded">Refunded</option>
                            </select>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/50 border-l-4 border-red-500 text-red-700 dark:text-red-400 p-4 rounded-lg mb-8">
                            <div className="flex items-center">
                                <span>{error}</span>
                            </div>
                        </div>
                    )}

                    {/* Payments Table */}
                    {currentPayments.length > 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                User
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Type
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Amount
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Date
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {currentPayments.map((payment) => (
                                            <tr
                                                key={payment._id}
                                                className="hover:bg-gray-50 dark:hover:bg-gray-700"
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {payment.user
                                                                ?.username ||
                                                                "N/A"}
                                                        </div>
                                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                                            {payment.user
                                                                ?.email ||
                                                                "N/A"}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span
                                                        className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(
                                                            payment.typeOfPurchase
                                                        )}`}
                                                    >
                                                        {payment.typeOfPurchase?.replace(
                                                            "_",
                                                            " "
                                                        ) || "N/A"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                    {payment.currency}{" "}
                                                    {payment.amount || 0}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span
                                                        className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                                                            payment.status
                                                        )}`}
                                                    >
                                                        {payment.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                    {payment.createdAt
                                                        ? new Date(
                                                              payment.createdAt
                                                          ).toLocaleDateString()
                                                        : "N/A"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <button
                                                        onClick={() =>
                                                            navigate(
                                                                `/reports/payments/${payment._id}`
                                                            )
                                                        }
                                                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {filteredPayments.length > 0 && (
                                <div className="bg-white dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700 sm:px-6">
                                    <Pagination
                                        currentPage={currentPage}
                                        pageSize={pageSize}
                                        totalItems={filteredPayments.length}
                                        onPageChange={handlePageChange}
                                        onPageSizeChange={(size) => {
                                            setPageSize(size);
                                            setCurrentPage(1);
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-center p-12">
                            <CreditCard className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                                No Payments Found
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                No payments match your current filters.
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Payments;
