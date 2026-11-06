/* eslint-disable react/display-name */
import { Suspense, lazy } from "react";
import { Link as RouterLink, useRoutes, useLocation } from "react-router-dom";
import { Box, Button, Container, Typography } from "@mui/material";
// components
import LoadingScreen from "@/shared/components/LoadingScreen.jsx";
import MainLayout from "@/app/layouts/main/MainLayout.jsx";
import ProtectedRoute from "@/features/auth/components/ProtectedRoute.jsx";

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
    {
      path: "*",
      element: (
        <Container maxWidth="sm">
          <Box component="main" sx={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, textAlign: "center", py: 4 }}>
            <Typography color="primary" variant="h2" component="p">404</Typography>
            <Typography variant="h4" component="h1">Không tìm thấy trang</Typography>
            <Typography color="text.secondary">Đường dẫn này chưa có hoặc đã thay đổi. Bạn có thể quay về trang chủ để tiếp tục tìm chỗ ở.</Typography>
            <Button component={RouterLink} to="/" variant="contained" size="large">Về trang chủ</Button>
          </Box>
        </Container>
      ),
    },
  ]);
}

// IMPORT COMPONENTS

const HomePage = Loadable(lazy(() => import("@/features/search/pages/HomePage.jsx")));
const PropertyPage = Loadable(lazy(() => import("@/features/listings/pages/PropertyPage.jsx")));
const LoginPage = Loadable(lazy(() => import("@/features/auth/pages/LoginPage.jsx")));
const SignupPage = Loadable(lazy(() => import("@/features/auth/pages/SignupPage.jsx")));
const ReservationPage = Loadable(
  lazy(() => import("@/features/bookings/pages/ReservationPage.jsx"))
);
const UserProfilePage = Loadable(lazy(() => import("@/features/profile/pages/GuestProfilePage.jsx")));
const HostPage = Loadable(lazy(() => import("@/features/host/pages/HostPage.jsx")));
const AdminPage = Loadable(lazy(() => import("@/features/admin/pages/AdminPage.jsx")));
const HostAdminProfilePage = Loadable(
  lazy(() => import("@/features/profile/pages/StaffProfilePage.jsx"))
);
