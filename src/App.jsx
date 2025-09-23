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
import Contacts from "./pages/Contacts";
import ComingSoon from "./pages/ComingSoon";
import CollegeDetail from "./pages/CollegeDetail";
import CollegeComingSoon from "./pages/CollegeComingSoon";

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
                        path="/reports/:category"
                        element={
                            <ProtectedRoute>
                                <ComingSoon />
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

                    {/* College category detail routes */}
                    <Route
                        path="/college/:collegeslug/:category"
                        element={
                            <ProtectedRoute>
                                <CollegeComingSoon />
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
