import React from "react";
import { BrowserRouter, Route, Routes } from "react-router";
import ErrorBoundary from "./components/error/ErrorBoundary";
import Layout from "./pages/layout/Layout";
import Home from "./pages/home/home";
import About from "./pages/about/about";
import Careers from "./pages/careers/careers";
import Universities from "./pages/universities/Universities";
import UniversityDetail from "./pages/universities/UniversityDetail";
import Clusters from "./pages/clusters/Clusters";
import Info from "./pages/info/info";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Quiz from "./pages/quiz/Quiz";
import Dashboard from "./pages/dashboard/Dashboard";
import AiChat from "./pages/dashboard/AiChat";
import CareerAdvisorReport from "./pages/dashboard/CareerAdvisorReport";
import CareerCompare from "./pages/dashboard/CareerCompare";
import AppointmentPanel from "./pages/dashboard/AppointmentPanel";
import Favorites from "./pages/favorites/Favorites";
import { ProtectedRoute, PublicRoute, AdminRoute } from "./components/RouteGuards";

// Admin Panel
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminCareers from "./pages/admin/AdminCareers";
import AdminClusters from "./pages/admin/AdminClusters";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminSpecialists from "./pages/admin/AdminSpecialists";

const App = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            {/* Public Shared Routes */}
            <Route index element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/universities" element={<Universities />} />
            <Route path="/universities/:id" element={<UniversityDetail />} />
            <Route path="/clusters" element={<Clusters />} />
            <Route path="/info/:id" element={<Info />} />

            {/* Protected Routes (Require Login) */}
            <Route element={<ProtectedRoute />}>
              <Route path="/quiz" element={<Quiz />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/ai-chat" element={<AiChat />} />
              <Route path="/dashboard/ai-advisor" element={<CareerAdvisorReport />} />
              <Route path="/dashboard/compare" element={<CareerCompare />} />
              <Route path="/dashboard/appointments" element={<AppointmentPanel />} />
              <Route path="/favorites" element={<Favorites />} />
            </Route>
          </Route>

          {/* Admin Routes — own layout with sidebar (no main navbar/footer) */}
          <Route element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/careers" element={<AdminCareers />} />
              <Route path="/admin/clusters" element={<AdminClusters />} />
              <Route path="/admin/specialists" element={<AdminSpecialists />} />
              <Route path="/admin/users" element={<AdminUsers />} />
            </Route>
          </Route>

          {/* Auth Routes (Only for non-logged in users) */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
