import React from "react";
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import OfflineIndicator from "./components/OfflineIndicator";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Reports from "./pages/Reports";
import Payments from "./pages/Payments";
import PaymentDetail from "./pages/PaymentDetail";
import Redemptions from "./pages/Redemptions";
import Transactions from "./pages/Transactions";
import Contacts from "./pages/Contacts";
import Users from "./pages/Users";
import DashboardUsers from "./pages/DashboardUsers";
import ComingSoon from "./pages/ComingSoon";
import CollegeDetail from "./pages/CollegeDetail";
import CollegeComingSoon from "./pages/CollegeComingSoon";
import Courses from "./pages/Courses";
import Branches from "./pages/Branches";
import Subjects from "./pages/Subjects";

function App() {
    return (
        <AuthProvider>
            <Router>
                <OfflineIndicator />
                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 4000,
                        style: {
                            background: "#363636",
                            color: "#fff",
                            zIndex: 99999,
                        },
                        success: {
                            duration: 3000,
                            theme: {
                                primary: "green",
                                secondary: "black",
                            },
                        },
                        error: {
                            duration: 4000,
                            theme: {
                                primary: "red",
                                secondary: "black",
                            },
                        },
                    }}
                    containerStyle={{
                        zIndex: 99999,
                    }}
                />
                <Routes>
                    {/* Public routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />

                    {/* Protected routes */}
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />

                    {/* Reports route */}
                    <Route
                        path="/reports"
                        element={
                            <ProtectedRoute>
                                <Reports />
                            </ProtectedRoute>
                        }
                    />

                    {/* Reports detail routes */}
                    <Route
                        path="/reports/payments"
                        element={
                            <ProtectedRoute>
                                <Payments />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/reports/payments/:id"
                        element={
                            <ProtectedRoute>
                                <PaymentDetail />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/reports/contacts"
                        element={
                            <ProtectedRoute>
                                <Contacts />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/reports/redemptions"
                        element={
                            <ProtectedRoute>
                                <Redemptions />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/reports/transactions"
                        element={
                            <ProtectedRoute>
                                <Transactions />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/reports/clients"
                        element={
                            <ProtectedRoute>
                                <Users />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/reports/dashboard-users"
                        element={
                            <ProtectedRoute>
                                <DashboardUsers />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/reports/courses"
                        element={
                            <ProtectedRoute>
                                <Courses />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/reports/branches"
                        element={
                            <ProtectedRoute>
                                <Branches />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/reports/subjects"
                        element={
                            <ProtectedRoute>
                                <Subjects />
                            </ProtectedRoute>
                        }
                    />

                    {/* College detail route */}
                    <Route
                        path="/:collegeslug"
                        element={
                            <ProtectedRoute>
                                <CollegeDetail />
                            </ProtectedRoute>
                        }
                    />

                    {/* Default redirect */}
                    <Route
                        path="/"
                        element={<Navigate to="/dashboard" replace />}
                    />

                    {/* Catch all other routes */}
                    <Route
                        path="*"
                        element={<Navigate to="/dashboard" replace />}
                    />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
