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

// Auth
const Login = lazy(() => import('./pages/Auth/Login'));
// const Signup = lazy(() => import('./pages/Auth/Signup'));

// Dashboard & Reports
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Reports = lazy(() => import('./pages/Reports'));
const Analytics = lazy(() => import('./pages/Analytics/Analytics'));
const Notifications = lazy(() => import('./pages/Notifications'));

// Financial
const Payments = lazy(() => import('./pages/Financial/Payments'));
const PaymentDetail = lazy(() => import('./pages/Financial/PaymentDetail'));
const Order = lazy(() => import('./pages/Financial/Order'));
const Redemptions = lazy(() => import('./pages/Financial/Redemptions'));
const Transactions = lazy(() => import('./pages/Financial/Transactions'));
const Subscriptions = lazy(() => import('./pages/Financial/Subscriptions'));
const ContentPurchases = lazy(
    () => import('./pages/Financial/ContentPurchases'),
);

// Users
const Contacts = lazy(() => import('./pages/Users/Contacts'));
const Users = lazy(() => import('./pages/Users/Users'));
const UserDetail = lazy(() => import('./pages/Users/UserDetail'));
const DashboardUsers = lazy(() => import('./pages/Users/DashboardUsers'));
const Tasks = lazy(() => import('./pages/Tasks/Tasks'));
const AffiliateProducts = lazy(() => import('./pages/AffiliateProducts'));

// College & Resources
const CollegeDetail = lazy(() => import('./pages/CollegeDetail'));
const Courses = lazy(() => import('./pages/Resources/Courses'));
const Branches = lazy(() => import('./pages/Resources/Branches'));
const BranchSubjects = lazy(() => import('./pages/Resources/BranchSubjects'));
const Subjects = lazy(() => import('./pages/Resources/Subjects'));
const QuickNotes = lazy(() => import('./pages/Resources/QuickNotes'));
const QuickNotesList = lazy(() => import('./pages/Resources/QuickNotesList'));

// PYQs
const PyqList = lazy(() => import('./pages/Pyqs/PyqList'));
const PyqDetail = lazy(() => import('./pages/Pyqs/PyqDetail'));
const PyqSolutionPage = lazy(() => import('./pages/Pyqs/PyqSolutionPage'));
const PyqSolutionList = lazy(() => import('./pages/Pyqs/PyqSolutionList'));

// Notes
const NotesList = lazy(() => import('./pages/Notes/NotesList'));
const NotesDetail = lazy(() => import('./pages/Notes/NotesDetail'));

// Syllabus
const SyllabusList = lazy(() => import('./pages/Syllabus/SyllabusList'));
const SyllabusDetail = lazy(() => import('./pages/Syllabus/SyllabusDetail'));

// Store/Products
const ProductList = lazy(() => import('./pages/Store/ProductList'));
const ProductDetail = lazy(() => import('./pages/Store/ProductDetail'));

// Seniors
const SeniorList = lazy(() => import('./pages/Senior/SeniorList'));
const SeniorDetail = lazy(() => import('./pages/Senior/SeniorDetail'));

// Groups
const GroupList = lazy(() => import('./pages/Group/GroupList'));
const GroupDetail = lazy(() => import('./pages/Group/GroupDetail'));

// Opportunities
const OpportunityList = lazy(
    () => import('./pages/Opportunity/OpportunityList'),
);
const OpportunityDetail = lazy(
    () => import('./pages/Opportunity/OpportunityDetail'),
);

// Lost & Found
const LostFoundList = lazy(() => import('./pages/LostFound/LostFoundList'));
const LostFoundDetail = lazy(() => import('./pages/LostFound/LostFoundDetail'));

// Videos
const VideoList = lazy(() => import('./pages/Videos/VideoList'));
const VideoDetail = lazy(() => import('./pages/Videos/VideoDetail'));

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
                                    path='/tasks'
                                    element={
                                        <ProtectedRoute>
                                            <Tasks />
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

                                <Route
                                    path='/affiliate-products'
                                    element={
                                        <ProtectedRoute>
                                            <AffiliateProducts />
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
                                    path='/reports/subscriptions'
                                    element={
                                        <ProtectedRoute>
                                            <Subscriptions />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path='/reports/content-purchases'
                                    element={
                                        <ProtectedRoute>
                                            <ContentPurchases />
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
                                    path='/reports/branches/:branchId/subjects'
                                    element={
                                        <ProtectedRoute>
                                            <BranchSubjects />
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
                                <Route
                                    path='/reports/subjects/:subjectId/quick-notes'
                                    element={
                                        <ProtectedRoute>
                                            <QuickNotes />
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

                                <Route
                                    path='/:collegeslug/pyqs/:pyqid/aisolution'
                                    element={
                                        <ProtectedRoute>
                                            <PyqSolutionPage />
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

                                {/* Pyqs routes */}
                                <Route
                                    path='/:collegeslug/pyqs-solutions'
                                    element={
                                        <ProtectedRoute>
                                            <PyqSolutionList />
                                        </ProtectedRoute>
                                    }
                                />

                                <Route
                                    path='/:collegeslug/quick-notes'
                                    element={
                                        <ProtectedRoute>
                                            <QuickNotesList />
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
