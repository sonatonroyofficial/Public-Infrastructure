import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ReportIssue from './pages/ReportIssue';
import Profile from './pages/Profile';
import MyIssues from './pages/MyIssues';
import AssignedIssues from './pages/AssignedIssues';
import AllIssues from './pages/AllIssues';
import ManageIssues from './pages/ManageIssues';
import ManageUsers from './pages/ManageUsers';
import ManageStaff from './pages/ManageStaff';
import Payments from './pages/Payments';
import About from './pages/About';
import Contact from './pages/Contact';
import IssueDetails from './pages/IssueDetails';
import NotFound from './pages/NotFound';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function AppContent() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen font-sans text-gray-900 antialiased">
        <Navbar />
        <main className="flex-grow pt-[72px]">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/issues" element={<AllIssues />} />
            <Route path="/issues/:id" element={<IssueDetails />} />

            <Route
              path="/profile"
              element={
                <ProtectedRoute allowedRoles={['admin', 'staff', 'citizen']}>
                  <Profile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin', 'staff', 'citizen']}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/report-issue"
              element={
                <ProtectedRoute allowedRoles={['citizen']}>
                  <ReportIssue />
                </ProtectedRoute>
              }
            />

            <Route
              path="/assigned-issues"
              element={
                <ProtectedRoute allowedRoles={['staff']}>
                  <AssignedIssues />
                </ProtectedRoute>
              }
            />

            <Route
              path="/my-issues"
              element={
                <ProtectedRoute allowedRoles={['citizen']}>
                  <MyIssues />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/manage-issues"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ManageIssues />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manage-users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ManageUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manage-staff"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ManageStaff />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payments"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Payments />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-center" reverseOrder={false} />
      <AppContent />
    </AuthProvider>
  );
}

export default App;
