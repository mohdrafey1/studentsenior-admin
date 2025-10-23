import React from 'react';
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
} from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SidebarProvider } from './context/SidebarContext';
import ProtectedRoute from './components/ProtectedRoute';
import OfflineIndicator from './components/OfflineIndicator';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import Payments from './pages/Payments';
import PaymentDetail from './pages/PaymentDetail';
import Order from './pages/Order';
import Redemptions from './pages/Redemptions';
import Transactions from './pages/Transactions';
import Contacts from './pages/Contacts';
import Users from './pages/Users';
import DashboardUsers from './pages/DashboardUsers';
import CollegeDetail from './pages/CollegeDetail';
import Courses from './pages/Courses';
import Branches from './pages/Branches';
import Subjects from './pages/Subjects';
import PyqList from './pages/PyqList';
import PyqDetail from './pages/PyqDetail';
import NotesList from './pages/NotesList';
import NotesDetail from './pages/NotesDetail';
import ProductList from './pages/ProductList';
import ProductDetail from './pages/ProductDetail';
import SeniorList from './pages/SeniorList';
import SeniorDetail from './pages/SeniorDetail';
import GroupList from './pages/GroupList';
import GroupDetail from './pages/GroupDetail';
import OpportunityList from './pages/OpportunityList';
import OpportunityDetail from './pages/OpportunityDetail';
import LostFoundList from './pages/LostFoundList';
import VideoList from './pages/VideoList';
import VideoDetail from './pages/VideoDetail';
import Analytics from './pages/Analytics';

function App() {
    return (
        <AuthProvider>
            <SidebarProvider>
                <Router>
                    <OfflineIndicator />
                    <Toaster
                        position='top-right'
                        toastOptions={{
                            duration: 4000,
                            style: {
                                background: '#363636',
                                color: '#fff',
                                zIndex: 99999,
                            },
                            success: {
                                duration: 3000,
                                theme: {
                                    primary: 'green',
                                    secondary: 'black',
                                },
                            },
                            error: {
                                duration: 4000,
                                theme: {
                                    primary: 'red',
                                    secondary: 'black',
                                },
                            },
                        }}
                        containerStyle={{
                            zIndex: 99999,
                        }}
                    />
                    <Routes>
                        {/* Public routes */}
                        <Route path='/login' element={<Login />} />
                        <Route path='/signup' element={<Signup />} />

                        {/* Protected routes */}
                        <Route
                            path='/dashboard'
                            element={
                                <ProtectedRoute>
                                    <Dashboard />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path='/analytics'
                            element={
                                <ProtectedRoute>
                                    <Analytics />
                                </ProtectedRoute>
                            }
                        />

                        {/* Reports route */}
                        <Route
                            path='/reports'
                            element={
                                <ProtectedRoute>
                                    <Reports />
                                </ProtectedRoute>
                            }
                        />

                        {/* Reports detail routes */}
                        <Route
                            path='/reports/payments'
                            element={
                                <ProtectedRoute>
                                    <Payments />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path='/reports/orders'
                            element={
                                <ProtectedRoute>
                                    <Order />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path='/reports/payments/:id'
                            element={
                                <ProtectedRoute>
                                    <PaymentDetail />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path='/reports/contacts'
                            element={
                                <ProtectedRoute>
                                    <Contacts />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path='/reports/redemptions'
                            element={
                                <ProtectedRoute>
                                    <Redemptions />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path='/reports/transactions'
                            element={
                                <ProtectedRoute>
                                    <Transactions />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path='/reports/clients'
                            element={
                                <ProtectedRoute>
                                    <Users />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path='/reports/dashboard-users'
                            element={
                                <ProtectedRoute>
                                    <DashboardUsers />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path='/reports/courses'
                            element={
                                <ProtectedRoute>
                                    <Courses />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path='/reports/branches'
                            element={
                                <ProtectedRoute>
                                    <Branches />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path='/reports/subjects'
                            element={
                                <ProtectedRoute>
                                    <Subjects />
                                </ProtectedRoute>
                            }
                        />

                        {/* PYQ routes */}
                        <Route
                            path='/:collegeslug/pyqs'
                            element={
                                <ProtectedRoute>
                                    <PyqList />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path='/:collegeslug/pyqs/:pyqid'
                            element={
                                <ProtectedRoute>
                                    <PyqDetail />
                                </ProtectedRoute>
                            }
                        />

                        {/* Notes routes */}
                        <Route
                            path='/:collegeslug/notes'
                            element={
                                <ProtectedRoute>
                                    <NotesList />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path='/:collegeslug/notes/:noteid'
                            element={
                                <ProtectedRoute>
                                    <NotesDetail />
                                </ProtectedRoute>
                            }
                        />

                        {/* Product routes */}
                        <Route
                            path='/:collegeslug/products'
                            element={
                                <ProtectedRoute>
                                    <ProductList />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path='/:collegeslug/products/:productid'
                            element={
                                <ProtectedRoute>
                                    <ProductDetail />
                                </ProtectedRoute>
                            }
                        />

                        {/* Senior routes */}
                        <Route
                            path='/:collegeslug/seniors'
                            element={
                                <ProtectedRoute>
                                    <SeniorList />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path='/:collegeslug/seniors/:seniorid'
                            element={
                                <ProtectedRoute>
                                    <SeniorDetail />
                                </ProtectedRoute>
                            }
                        />

                        {/* Group routes */}
                        <Route
                            path='/:collegeslug/groups'
                            element={
                                <ProtectedRoute>
                                    <GroupList />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path='/:collegeslug/groups/:groupid'
                            element={
                                <ProtectedRoute>
                                    <GroupDetail />
                                </ProtectedRoute>
                            }
                        />

                        {/* Opportunity routes */}
                        <Route
                            path='/:collegeslug/opportunities'
                            element={
                                <ProtectedRoute>
                                    <OpportunityList />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path='/:collegeslug/opportunities/:opportunityid'
                            element={
                                <ProtectedRoute>
                                    <OpportunityDetail />
                                </ProtectedRoute>
                            }
                        />

                        {/* Lost & Found routes */}
                        <Route
                            path='/:collegeslug/lost-found'
                            element={
                                <ProtectedRoute>
                                    <LostFoundList />
                                </ProtectedRoute>
                            }
                        />

                        {/* Video routes */}
                        <Route
                            path='/:collegeslug/videos'
                            element={
                                <ProtectedRoute>
                                    <VideoList />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path='/:collegeslug/videos/:videoid'
                            element={
                                <ProtectedRoute>
                                    <VideoDetail />
                                </ProtectedRoute>
                            }
                        />

                        {/* College detail route */}
                        <Route
                            path='/:collegeslug'
                            element={
                                <ProtectedRoute>
                                    <CollegeDetail />
                                </ProtectedRoute>
                            }
                        />

                        {/* Default redirect */}
                        <Route
                            path='/'
                            element={<Navigate to='/dashboard' replace />}
                        />

                        {/* Catch all other routes */}
                        <Route
                            path='*'
                            element={<Navigate to='/dashboard' replace />}
                        />
                    </Routes>
                </Router>
            </SidebarProvider>
        </AuthProvider>
    );
}

export default App;
