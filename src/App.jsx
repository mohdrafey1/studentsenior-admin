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
import AppLayout from './components/layout/AppLayout';
import { CollegeProvider } from './context/CollegeContext';

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
const Refunds = lazy(() => import('./pages/Financial/Refunds'));
const Redemptions = lazy(() => import('./pages/Financial/Redemptions'));
const Transactions = lazy(() => import('./pages/Financial/Transactions'));
const Subscriptions = lazy(() => import('./pages/Financial/Subscriptions'));
const ContentPurchases = lazy(
    () => import('./pages/Financial/ContentPurchases'),
);

// Users
const SupportInbox = lazy(() => import('./pages/Support/SupportInbox'));
const Users = lazy(() => import('./pages/Users/Users'));
const UserDetail = lazy(() => import('./pages/Users/UserDetail'));
const DashboardUsers = lazy(() => import('./pages/Users/DashboardUsers'));
const Tasks = lazy(() => import('./pages/Tasks/Tasks'));
const AffiliateProducts = lazy(() => import('./pages/AffiliateProducts'));

// Blog (merged in from ss-blog-dashboard)
const BlogShell = lazy(() => import('./pages/Blog/BlogShell'));
const BlogList = lazy(() => import('./pages/Blog/BlogList'));
const BlogCreate = lazy(() => import('./pages/Blog/BlogCreate'));
const BlogEdit = lazy(() => import('./pages/Blog/BlogEdit'));
const BlogAnalytics = lazy(() => import('./pages/Blog/BlogAnalytics'));

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
const PyqBulkImport = lazy(() => import('./pages/Pyqs/BulkImport'));

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

// Community moderation
const CommunityModeration = lazy(
    () => import('./pages/Community/CommunityModeration'),
);

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
                    <CollegeProvider>
                        <ErrorBoundary>
                            <OfflineIndicator />
                            <Toaster
                                position='bottom-right'
                                toastOptions={{
                                    duration: 5000,
                                    style: {
                                        background: 'var(--ss-inverse)',
                                        color: 'var(--ss-on-inverse)',
                                        borderRadius: '12px',
                                        fontSize: '13.5px',
                                        padding: '10px 14px',
                                        boxShadow:
                                            '0 8px 24px rgba(20, 19, 17, 0.2)',
                                    },
                                    success: {
                                        iconTheme: {
                                            primary: 'var(--ss-ok)',
                                            secondary: '#ffffff',
                                        },
                                    },
                                    error: {
                                        duration: 6000,
                                        iconTheme: {
                                            primary: 'var(--ss-bad)',
                                            secondary: '#ffffff',
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
                                        element={
                                            <ProtectedRoute>
                                                <AppLayout />
                                            </ProtectedRoute>
                                        }
                                    >
                                        <Route
                                            path='/reports/refunds'
                                            element={<Refunds />}
                                        />
                                        <Route
                                            path='/dashboard'
                                            element={<Dashboard />}
                                        />

                                        <Route
                                            path='/analytics'
                                            element={<Analytics />}
                                        />

                                        <Route
                                            path='/tasks'
                                            element={<Tasks />}
                                        />

                                        <Route
                                            path='/notifications'
                                            element={<Notifications />}
                                        />

                                        <Route
                                            path='/affiliate-products'
                                            element={<AffiliateProducts />}
                                        />

                                        {/* Blog — not college-scoped, so these sit
                                    at the top level rather than under a slug */}
                                        <Route
                                            path='/blog'
                                            element={
                                                <BlogShell>
                                                    <BlogList />
                                                </BlogShell>
                                            }
                                        />
                                        <Route
                                            path='/blog/create'
                                            element={
                                                <BlogShell>
                                                    <BlogCreate />
                                                </BlogShell>
                                            }
                                        />
                                        <Route
                                            path='/blog/analytics'
                                            element={
                                                <BlogShell>
                                                    <BlogAnalytics />
                                                </BlogShell>
                                            }
                                        />
                                        <Route
                                            path='/blog/edit/:id'
                                            element={
                                                <BlogShell>
                                                    <BlogEdit />
                                                </BlogShell>
                                            }
                                        />

                                        {/* Reports route */}
                                        <Route
                                            path='/reports'
                                            element={<Reports />}
                                        />

                                        {/* Community moderation */}
                                        <Route
                                            path='/community'
                                            element={<CommunityModeration />}
                                        />

                                        {/* Users routes */}
                                        <Route
                                            path='/users'
                                            element={<Users />}
                                        />
                                        <Route
                                            path='/users/:userId'
                                            element={<UserDetail />}
                                        />

                                        {/* Reports detail routes */}
                                        <Route
                                            path='/reports/payments'
                                            element={<Payments />}
                                        />
                                        <Route
                                            path='/reports/orders'
                                            element={<Order />}
                                        />
                                        <Route
                                            path='/reports/payments/:id'
                                            element={<PaymentDetail />}
                                        />
                                        <Route
                                            path='/support'
                                            element={<SupportInbox />}
                                        />
                                        <Route
                                            path='/support/:ticketId'
                                            element={<SupportInbox />}
                                        />
                                        {/* Contact requests became support tickets */}
                                        <Route
                                            path='/reports/contacts'
                                            element={
                                                <Navigate
                                                    to='/support'
                                                    replace
                                                />
                                            }
                                        />
                                        <Route
                                            path='/reports/redemptions'
                                            element={<Redemptions />}
                                        />
                                        <Route
                                            path='/reports/transactions'
                                            element={<Transactions />}
                                        />
                                        <Route
                                            path='/reports/subscriptions'
                                            element={<Subscriptions />}
                                        />
                                        <Route
                                            path='/reports/content-purchases'
                                            element={<ContentPurchases />}
                                        />
                                        <Route
                                            path='/reports/clients'
                                            element={<Users />}
                                        />
                                        <Route
                                            path='/reports/dashboard-users'
                                            element={<DashboardUsers />}
                                        />
                                        <Route
                                            path='/reports/courses'
                                            element={<Courses />}
                                        />
                                        <Route
                                            path='/reports/branches'
                                            element={<Branches />}
                                        />
                                        <Route
                                            path='/reports/branches/:branchId/subjects'
                                            element={<BranchSubjects />}
                                        />
                                        <Route
                                            path='/reports/subjects'
                                            element={<Subjects />}
                                        />
                                        <Route
                                            path='/reports/subjects/:subjectId/quick-notes'
                                            element={<QuickNotes />}
                                        />

                                        {/* PYQ routes */}
                                        <Route
                                            path='/:collegeslug/pyqs'
                                            element={<PyqList />}
                                        />
                                        <Route
                                            path='/:collegeslug/pyqs-bulk-import'
                                            element={<PyqBulkImport />}
                                        />
                                        <Route
                                            path='/:collegeslug/pyqs/:pyqid'
                                            element={<PyqDetail />}
                                        />

                                        <Route
                                            path='/:collegeslug/pyqs/:pyqid/aisolution'
                                            element={<PyqSolutionPage />}
                                        />
                                        {/* Notes routes */}
                                        <Route
                                            path='/:collegeslug/notes'
                                            element={<NotesList />}
                                        />
                                        <Route
                                            path='/:collegeslug/notes/:noteid'
                                            element={<NotesDetail />}
                                        />

                                        {/* Syllabus routes */}
                                        <Route
                                            path='/:collegeslug/syllabus'
                                            element={<SyllabusList />}
                                        />
                                        <Route
                                            path='/:collegeslug/syllabus/:syllabusid'
                                            element={<SyllabusDetail />}
                                        />

                                        {/* Product routes */}
                                        <Route
                                            path='/:collegeslug/products'
                                            element={<ProductList />}
                                        />
                                        <Route
                                            path='/:collegeslug/products/:productid'
                                            element={<ProductDetail />}
                                        />

                                        {/* Senior routes */}
                                        <Route
                                            path='/:collegeslug/seniors'
                                            element={<SeniorList />}
                                        />
                                        <Route
                                            path='/:collegeslug/seniors/:seniorid'
                                            element={<SeniorDetail />}
                                        />

                                        {/* Group routes */}
                                        <Route
                                            path='/:collegeslug/groups'
                                            element={<GroupList />}
                                        />
                                        <Route
                                            path='/:collegeslug/groups/:groupid'
                                            element={<GroupDetail />}
                                        />

                                        {/* Opportunity routes */}
                                        <Route
                                            path='/:collegeslug/opportunities'
                                            element={<OpportunityList />}
                                        />
                                        <Route
                                            path='/:collegeslug/opportunities/:opportunityid'
                                            element={<OpportunityDetail />}
                                        />

                                        {/* Lost & Found routes */}
                                        <Route
                                            path='/:collegeslug/lost-found'
                                            element={<LostFoundList />}
                                        />
                                        <Route
                                            path='/:collegeslug/lost-found/:itemid'
                                            element={<LostFoundDetail />}
                                        />
                                        {/* Video routes */}
                                        <Route
                                            path='/:collegeslug/videos'
                                            element={<VideoList />}
                                        />
                                        <Route
                                            path='/:collegeslug/videos/:videoid'
                                            element={<VideoDetail />}
                                        />

                                        {/* College detail route */}
                                        <Route
                                            path='/:collegeslug'
                                            element={<CollegeDetail />}
                                        />

                                        {/* Pyqs routes */}
                                        <Route
                                            path='/:collegeslug/pyqs-solutions'
                                            element={<PyqSolutionList />}
                                        />

                                        <Route
                                            path='/:collegeslug/quick-notes'
                                            element={<QuickNotesList />}
                                        />
                                    </Route>

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
                    </CollegeProvider>
                </Router>
            </SidebarProvider>
        </AuthProvider>
    );
}

export default App;
