import React, { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import ErrorBoundary from "./components/error/ErrorBoundary";
import Layout from "./pages/layout/Layout";
import Home from "./pages/home/home";
import { ProtectedRoute, PublicRoute, AdminRoute } from "./components/RouteGuards";

// lazy бо «пешбор»: агар модул аллакай бор шуда бошад, бе Suspense нишон дода мешавад.
// Барои саҳифаҳои пешсохта (SSR) — main.jsx аввал модулро бор мекунад, баъд React-ро:
// он гоҳ HTML-и тайёр бевосита бо ҳамон саҳифа иваз мешавад, бе спиннер дар байн.
function lazyPreload(factory) {
  let loaded = null;
  const Lazy = lazy(factory);
  const Component = (props) => (loaded ? <loaded.default {...props} /> : <Lazy {...props} />);
  Component.preload = () => factory().then((module) => {
    loaded = module;
    return module;
  });
  return Component;
}

const NotFound = lazy(() => import("./pages/NotFound"));
const About = lazy(() => import("./pages/about/about"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Trial = lazy(() => import("./pages/trial/Trial"));
const TrialHub = lazy(() => import("./pages/trial/TrialHub"));
const Careers = lazy(() => import("./pages/careers/careers"));
const Universities = lazy(() => import("./pages/universities/Universities"));
const UniversityDetail = lazyPreload(() => import("./pages/universities/UniversityDetail"));
const Info = lazyPreload(() => import("./pages/info/info"));

// Саҳифаи пешсохта: модули ҳамин масирро пеш аз оғози React бор мекунем.
export function preloadRoute(pathname) {
  if (/^\/info\/[^/]+\/?$/.test(pathname)) return Info.preload();
  if (/^\/universities\/[^/]+\/?$/.test(pathname)) return UniversityDetail.preload();
  return Promise.resolve();
}
const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const Quiz = lazy(() => import("./pages/quiz/Quiz"));
const Dashboard = lazy(() => import("./pages/dashboard/Dashboard"));
const AiChat = lazy(() => import("./pages/dashboard/AiChat"));
const CareerAdvisorReport = lazy(() => import("./pages/dashboard/CareerAdvisorReport"));
const CareerCompare = lazy(() => import("./pages/dashboard/CareerCompare"));
const ApplicationPlan = lazy(() => import("./pages/dashboard/ApplicationPlan"));
const Favorites = lazy(() => import("./pages/favorites/Favorites"));

const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminCareers = lazy(() => import("./pages/admin/AdminCareers"));
const AdminClusters = lazy(() => import("./pages/admin/AdminClusters"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));

const RouteFallback = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="h-10 w-10 rounded-full border-2 border-primary/25 border-t-primary animate-spin" />
  </div>
);

// Масирҳо алоҳида: браузер онҳоро дар BrowserRouter, пешсозӣ (SSR) дар StaticRouter истифода мебарад.
export const AppRoutes = () => (
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/trial" element={<TrialHub />} />
              <Route path="/trial/career/:careerId" element={<Trial />} />
              <Route path="/trial/:family" element={<Trial />} />
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
                <Route path="/dashboard/appointments" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard/plan" element={<ApplicationPlan />} />
                <Route path="/favorites" element={<Favorites />} />
              </Route>
            </Route>

            <Route element={<AdminRoute />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/careers" element={<AdminCareers />} />
                <Route path="/admin/clusters" element={<AdminClusters />} />
                <Route path="/admin/specialists" element={<Navigate to="/admin" replace />} />
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
);

const App = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
