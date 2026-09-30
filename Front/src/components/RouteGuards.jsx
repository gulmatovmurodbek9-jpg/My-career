import { Navigate, Outlet, useLocation } from "react-router";
import { useAuthStore } from "../store/authStore";

// Баъд аз вуруд корбар ба ҳамон ҷое бармегардад, ки мехост (?next=/quiz).
// Танҳо роҳҳои дохилӣ: «//evil.com» ва «https://…» қабул намешаванд.
export const nextPath = (search, fallback = "/dashboard") => {
    const next = new URLSearchParams(search).get("next");
    return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
};

export const loginUrl = (path) => `/login?next=${encodeURIComponent(path)}`;

export const ProtectedRoute = () => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to={loginUrl(location.pathname + location.search)} replace />;
    }

    return <Outlet />;
};

export const PublicRoute = () => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const location = useLocation();

    if (isAuthenticated) {
        return <Navigate to={nextPath(location.search)} replace />;
    }

    return <Outlet />;
};

export const AdminRoute = () => {
    const { isAuthenticated, user } = useAuthStore();

    if (!isAuthenticated || user?.role !== "admin") {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};
