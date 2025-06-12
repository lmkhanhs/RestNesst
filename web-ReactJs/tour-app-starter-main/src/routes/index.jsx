/* eslint-disable react/display-name */
import { Suspense, lazy } from "react";
import { Navigate, useRoutes, useLocation } from "react-router-dom";
// components
import LoadingScreen from "../components/LoadingScreen";
import MainLayout from "../layout/Main";
import ProtectedRoute from "../components/ProtectedRoute";

// ----------------------------------------------------------------------

const Loadable = (Component) => (props) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { pathname } = useLocation();

  return (
    <Suspense
      fallback={<LoadingScreen isDashboard={pathname.includes("/dashboard")} />}
    >
      <Component {...props} />
    </Suspense>
  );
};

export default function Router() {
  return useRoutes([
    {
      path: "/",
      element: <MainLayout />,
      children: [
        { element: <HomePage />, index: true },
        { element: <PropertyPage />, path: "property/:id" },
        { element: <ReservationPage />, path: "reservation" },
        {
          element: (
            <ProtectedRoute requiredRole="profile">
              {(() => {
                const roles =
                  JSON.parse(localStorage.getItem("user") || "{}")?.roles || [];
                if (roles.includes("HOST") || roles.includes("ADMIN")) {
                  return <HostAdminProfilePage />;
                }
                return <UserProfilePage />;
              })()}
            </ProtectedRoute>
          ),
          path: "profile",
        },
        {
          element: (
            <ProtectedRoute requiredRole="host">
              <HostPage />
            </ProtectedRoute>
          ),
          path: "host",
        },
        {
          element: (
            <ProtectedRoute requiredRole="admin">
              <AdminPage />
            </ProtectedRoute>
          ),
          path: "admin",
        },
      ],
    },
    {
      path: "login",
      element: <LoginPage />,
    },
    {
      path: "signup",
      element: <SignupPage />,
    },
    { path: "*", element: <Navigate to="/404" replace /> },
  ]);
}

// IMPORT COMPONENTS

const HomePage = Loadable(lazy(() => import("../pages/Home")));
const PropertyPage = Loadable(lazy(() => import("../pages/Property")));
const LoginPage = Loadable(lazy(() => import("../pages/Login")));
const SignupPage = Loadable(lazy(() => import("../pages/Signup")));
const ReservationPage = Loadable(
  lazy(() => import("../pages/ReservationPage"))
);
const UserProfilePage = Loadable(lazy(() => import("../pages/UserProfile")));
const HostPage = Loadable(lazy(() => import("../pages/Host")));
const AdminPage = Loadable(lazy(() => import("../pages/Admin")));
const HostAdminProfilePage = Loadable(
  lazy(() => import("../pages/HostAdminProfile"))
);
