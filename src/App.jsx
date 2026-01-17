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
import { lazy, Suspense } from 'react';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';

const Login = lazy(() => import('./pages/Login'));
// const Signup = lazy(() => import('./pages/Signup'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Reports = lazy(() => import('./pages/Reports'));
const Payments = lazy(() => import('./pages/Payments'));
const PaymentDetail = lazy(() => import('./pages/PaymentDetail'));
const Order = lazy(() => import('./pages/Order'));
const Redemptions = lazy(() => import('./pages/Redemptions'));
const Transactions = lazy(() => import('./pages/Transactions'));
const Contacts = lazy(() => import('./pages/Contacts'));
const Users = lazy(() => import('./pages/Users'));
const UserDetail = lazy(() => import('./pages/UserDetail'));
const DashboardUsers = lazy(() => import('./pages/DashboardUsers'));
const CollegeDetail = lazy(() => import('./pages/CollegeDetail'));
const Courses = lazy(() => import('./pages/Courses'));
const Branches = lazy(() => import('./pages/Branches'));
const Subjects = lazy(() => import('./pages/Subjects'));
const PyqList = lazy(() => import('./pages/PyqList'));
const PyqDetail = lazy(() => import('./pages/PyqDetail'));
const NotesList = lazy(() => import('./pages/NotesList'));
const NotesDetail = lazy(() => import('./pages/NotesDetail'));
const SyllabusList = lazy(() => import('./pages/SyllabusList'));
const SyllabusDetail = lazy(() => import('./pages/SyllabusDetail'));
const ProductList = lazy(() => import('./pages/ProductList'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const SeniorList = lazy(() => import('./pages/SeniorList'));
const SeniorDetail = lazy(() => import('./pages/SeniorDetail'));
const GroupList = lazy(() => import('./pages/GroupList'));
const GroupDetail = lazy(() => import('./pages/GroupDetail'));
const OpportunityList = lazy(() => import('./pages/OpportunityList'));
const OpportunityDetail = lazy(() => import('./pages/OpportunityDetail'));
const LostFoundList = lazy(() => import('./pages/LostFoundList'));
const LostFoundDetail = lazy(() => import('./pages/LostFoundDetail'));
const VideoList = lazy(() => import('./pages/VideoList'));
const VideoDetail = lazy(() => import('./pages/VideoDetail'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Notifications = lazy(() => import('./pages/Notifications'));

function App() {
    return (
        <AuthProvider>
            <SidebarProvider>
                <Router>
                    <ErrorBoundary>
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
                        <Suspense fallback={<LoadingSpinner />}>
                            <Routes>
                                {/* Public routes */}
                                <Route path='/login' element={<Login />} />
                                {/* <Route path='/signup' element={<Signup />} /> */}

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

                                <Route
                                    path='/notifications'
                                    element={
                                        <ProtectedRoute>
                                            <Notifications />
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

                                {/* Users routes */}
                                <Route
                                    path='/users'
                                    element={
                                        <ProtectedRoute>
                                            <Users />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path='/users/:userId'
                                    element={
                                        <ProtectedRoute>
                                            <UserDetail />
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

                                {/* Syllabus routes */}
                                <Route
                                    path='/:collegeslug/syllabus'
                                    element={
                                        <ProtectedRoute>
                                            <SyllabusList />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path='/:collegeslug/syllabus/:syllabusid'
                                    element={
                                        <ProtectedRoute>
                                            <SyllabusDetail />
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
                                <Route
                                    path='/:collegeslug/lost-found/:itemid'
                                    element={
                                        <ProtectedRoute>
                                            <LostFoundDetail />
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
                                    element={
                                        <Navigate to='/dashboard' replace />
                                    }
                                />

                                {/* Catch all other routes */}
                                <Route
                                    path='*'
                                    element={
                                        <Navigate to='/dashboard' replace />
                                    }
                                />
                            </Routes>
                        </Suspense>
                    </ErrorBoundary>
                </Router>
            </SidebarProvider>
        </AuthProvider>
    );
}

export default App;
