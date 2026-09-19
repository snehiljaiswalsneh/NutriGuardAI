import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/AppLayout'
import Landing from '@/pages/Landing'
import Login from '@/pages/auth/Login'
import Signup from '@/pages/auth/Signup'
import ForgotPassword from '@/pages/auth/ForgotPassword'
import OtpVerification from '@/pages/auth/OtpVerification'
import AuthCallback from '@/pages/auth/AuthCallback'
import Home from '@/pages/Home'
import AnalyzingLoading from '@/pages/AnalyzingLoading'
import Dashboard from '@/pages/Dashboard'
import IngredientDetail from '@/pages/IngredientDetail'
import ComparisonSetup, { ComparisonResult } from '@/pages/Comparison'
import History from '@/pages/History'
import Profile from '@/pages/Profile'
import HelpSources from '@/pages/HelpSources'
import FutureFeature from '@/pages/FutureFeature'
import { NotFound, ServerError, NetworkError, NoAnalysisFound } from '@/pages/ErrorPages'

import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { ThemeProvider } from '@/context/ThemeContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { AuthProvider } from '@/context/AuthContext';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/otp" element={<OtpVerification />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Authenticated app shell */}
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={<Home />} />
          <Route path="analyzing" element={<AnalyzingLoading />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="dashboard/:scanId" element={<Dashboard />} />
          <Route path="ingredient/:ingredientId" element={<IngredientDetail />} />
          <Route path="compare" element={<ComparisonSetup />} />
          <Route path="compare/result" element={<ComparisonResult />} />
          <Route path="history" element={<History />} />
          <Route path="profile" element={<Profile />} />
          <Route path="help" element={<HelpSources />} />
          <Route path="sources" element={<Navigate to="/app/help" replace />} />
          <Route path="future/:feature" element={<FutureFeature />} />
          <Route path="error/500" element={<ServerError />} />
          <Route path="error/network" element={<NetworkError />} />
          <Route path="error/no-analysis" element={<NoAnalysisFound />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
  )
}




