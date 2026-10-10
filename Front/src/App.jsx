import React, { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import ScrollRestorer from "./components/ScrollRestorer";
import ErrorBoundary from "./components/error/ErrorBoundary";
import Layout from "./pages/layout/Layout";
import Home from "./pages/home/home";
import { ProtectedRoute, PublicRoute, AdminRoute, QuizRoute } from "./components/RouteGuards";
import { registerPreload } from "./lib/routePreload";

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
const Help = lazy(() => import("./pages/Help"));
const Trial = lazyPreload(() => import("./pages/trial/Trial"));
const TrialHub = lazyPreload(() => import("./pages/trial/TrialHub"));
const Careers = lazyPreload(() => import("./pages/careers/careers"));
const Universities = lazyPreload(() => import("./pages/universities/Universities"));
const UniversityDetail = lazyPreload(() => import("./pages/universities/UniversityDetail"));
const Info = lazyPreload(() => import("./pages/info/info"));

// Саҳифаи пешсохта: модули ҳамин масирро пеш аз оғози React бор мекунем.
export function preloadRoute(pathname) {
  if (/^\/info\/[^/]+\/?$/.test(pathname)) return Info.preload();
  if (/^\/universities\/[^/]+\/?$/.test(pathname)) return UniversityDetail.preload();
  return Promise.resolve();
}
const Login = lazyPreload(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const Quiz = lazyPreload(() => import("./pages/quiz/Quiz"));
const Dashboard = lazyPreload(() => import("./pages/dashboard/Dashboard"));
const AiChat = lazyPreload(() => import("./pages/dashboard/AiChat"));
const CareerAdvisorReport = lazy(() => import("./pages/dashboard/CareerAdvisorReport"));
const CareerCompare = lazy(() => import("./pages/dashboard/CareerCompare"));
const ApplicationPlan = lazy(() => import("./pages/dashboard/ApplicationPlan"));
const TeacherHome = lazy(() => import("./pages/teacher/TeacherHome"));
const TeacherClass = lazy(() => import("./pages/teacher/TeacherClass"));
const ClassJoin = lazy(() => import("./pages/teacher/ClassJoin"));
const Favorites = lazyPreload(() => import("./pages/favorites/Favorites"));

const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminImpact = lazy(() => import("./pages/admin/AdminImpact"));
const AdminCareers = lazy(() => import("./pages/admin/AdminCareers"));
const AdminClusters = lazy(() => import("./pages/admin/AdminClusters"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));

// Пешбор: панели поён (ламс) ва браузер (вақти холӣ) — ниг. lib/routePreload.js.
registerPreload(/^\/$/, () => Promise.resolve());
registerPreload(/^\/careers/, Careers.preload);
registerPreload(/^\/universities\/?$/, Universities.preload);
registerPreload(/^\/universities\/[^/]+/, UniversityDetail.preload);
registerPreload(/^\/info\//, Info.preload);
registerPreload(/^\/trial\/?$/, TrialHub.preload);
registerPreload(/^\/trial\/.+/, Trial.preload);
registerPreload(/^\/quiz/, Quiz.preload);
registerPreload(/^\/dashboard\/ai-chat/, AiChat.preload);
registerPreload(/^\/dashboard\/?$/, Dashboard.preload);
registerPreload(/^\/favorites/, Favorites.preload);
registerPreload(/^\/login/, Login.preload);

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
              <Route path="/help" element={<Help />} />
              <Route path="/trial" element={<TrialHub />} />
              <Route path="/trial/career/:careerId" element={<Trial />} />
              <Route path="/trial/:family" element={<Trial />} />
              <Route path="/careers" element={<Careers />} />
              <Route path="/universities" element={<Universities />} />
              <Route path="/universities/:id" element={<UniversityDetail />} />
              <Route path="/clusters" element={<Navigate to="/#cluster-groups" replace />} />
              <Route path="/info/:id" element={<Info />} />

              <Route path="/class" element={<ClassJoin />} />
              <Route path="/class/:code" element={<ClassJoin />} />
              <Route element={<QuizRoute />}>
                <Route path="/quiz" element={<Quiz />} />
              </Route>

              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/dashboard/teacher" element={<TeacherHome />} />
                <Route path="/dashboard/teacher/:id" element={<TeacherClass />} />
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
                <Route path="/admin/impact" element={<AdminImpact />} />
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
        <ScrollRestorer />
        <AppRoutes />
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
