import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '500',
                background: '#ffffff',
                color: '#0f172a',
                border: '1px solid #e2e8f0',
                boxShadow: '0 12px 40px -12px rgba(15, 23, 42, 0.28)',
              },
              success: {
                style: {
                  background: '#ecfdf5',
                  color: '#065f46',
                  border: '1px solid #6ee7b7',
                  boxShadow: '0 12px 40px -12px rgba(6, 95, 70, 0.2)',
                },
                iconTheme: { primary: '#059669', secondary: '#ecfdf5' },
              },
              error: {
                style: {
                  background: '#fef2f2',
                  color: '#991b1b',
                  border: '1px solid #fca5a5',
                  boxShadow: '0 12px 40px -12px rgba(153, 27, 27, 0.2)',
                },
                iconTheme: { primary: '#ffffff', secondary: '#dc2626' },
              },
              loading: {
                style: {
                  background: '#f8fafc',
                  color: '#1e293b',
                  border: '1px solid #cbd5e1',
                },
              },
            }}
          />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/signup" element={<Register />} />
            <Route path="/verify-email" element={<Navigate to="/dashboard" replace />} />
            <Route path="/resume-verification" element={<Navigate to="/login" replace />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/projects/:id" element={<ProjectDetail />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
