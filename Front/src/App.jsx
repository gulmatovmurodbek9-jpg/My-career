import React, { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import ErrorBoundary from "./components/error/ErrorBoundary";
import Layout from "./pages/layout/Layout";
import Home from "./pages/home/home";
import { ProtectedRoute, PublicRoute, AdminRoute } from "./components/RouteGuards";

const NotFound = lazy(() => import("./pages/NotFound"));
const About = lazy(() => import("./pages/about/about"));
const Careers = lazy(() => import("./pages/careers/careers"));
const Universities = lazy(() => import("./pages/universities/Universities"));
const UniversityDetail = lazy(() => import("./pages/universities/UniversityDetail"));
const Info = lazy(() => import("./pages/info/info"));
const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const Quiz = lazy(() => import("./pages/quiz/Quiz"));
const Dashboard = lazy(() => import("./pages/dashboard/Dashboard"));
const AiChat = lazy(() => import("./pages/dashboard/AiChat"));
const CareerAdvisorReport = lazy(() => import("./pages/dashboard/CareerAdvisorReport"));
const CareerCompare = lazy(() => import("./pages/dashboard/CareerCompare"));
const AppointmentPanel = lazy(() => import("./pages/dashboard/AppointmentPanel"));
const ApplicationPlan = lazy(() => import("./pages/dashboard/ApplicationPlan"));
const Favorites = lazy(() => import("./pages/favorites/Favorites"));

const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminCareers = lazy(() => import("./pages/admin/AdminCareers"));
const AdminClusters = lazy(() => import("./pages/admin/AdminClusters"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminSpecialists = lazy(() => import("./pages/admin/AdminSpecialists"));

const RouteFallback = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="h-10 w-10 rounded-full border-2 border-primary/25 border-t-primary animate-spin" />
  </div>
);

const App = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/careers" element={<Careers />} />
              <Route path="/universities" element={<Universities />} />
              <Route path="/universities/:id" element={<UniversityDetail />} />
              <Route path="/clusters" element={<Navigate to="/#cluster-groups" replace />} />
              <Route path="/info/:id" element={<Info />} />

              <Route element={<ProtectedRoute />}>
                <Route path="/quiz" element={<Quiz />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/dashboard/ai-chat" element={<AiChat />} />
                <Route path="/dashboard/ai-advisor" element={<CareerAdvisorReport />} />
                <Route path="/dashboard/compare" element={<CareerCompare />} />
                <Route path="/dashboard/appointments" element={<AppointmentPanel />} />
                <Route path="/dashboard/plan" element={<ApplicationPlan />} />
                <Route path="/favorites" element={<Favorites />} />
              </Route>
            </Route>

            <Route element={<AdminRoute />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/careers" element={<AdminCareers />} />
                <Route path="/admin/clusters" element={<AdminClusters />} />
                <Route path="/admin/specialists" element={<AdminSpecialists />} />
                <Route path="/admin/users" element={<AdminUsers />} />
              </Route>
            </Route>

            <Route element={<PublicRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>

            <Route path="/forgot-password" element={<ForgotPassword />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
