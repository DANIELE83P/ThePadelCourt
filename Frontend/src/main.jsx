import { createRoot } from "react-dom/client";
import { Suspense } from "react";
import "./i18n";
import App from "./App.jsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";

import ErrorPage from "./pages/ErrorPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import Owner from "./Owner/owner.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import Home from "./pages/HomePage.jsx";
import CourtPage from "./components/CourtPage/CourtPage.jsx";
import { AuthProvider } from "./Contexts/AuthContext.jsx";
import { ThemeProvider } from "./Contexts/ThemeContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

import ProfilePage from "./pages/ProfilePage.jsx";
import AccountSettings from "./components/UserProfile/AccountSettings.jsx";
import ChangePassword from "./components/UserProfile/ChangePassword.jsx";
import YourReservations from "./components/UserProfile/YourReservations.jsx";
import UserCards from "./pages/UserCards.jsx"; // Enhanced version with tabs
import Bookk from "./components/Home/bookk.jsx";
import ForcePasswordChange from "./pages/ForcePasswordChange.jsx";

const router = createBrowserRouter([
  // Owner Dashboard - Standalone route (no navbar/footer)
  {
    path: "ownerpage",
    element: (
      <ProtectedRoute allowedRoles={['owner', 'admin']}>
        <Owner />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  // Client-facing routes with navbar/footer
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "login",
        element: <LoginPage />,
      },
      {
        path: "/register",
        element: <RegisterPage />,
      },
      {
        path: "courts",
        element: <CourtPage />,
      },
      {
        path: "court/:id",
        element: <Bookk />,
      },
      {
        path: "force-password-change",
        element: (
          <ProtectedRoute>
            <ForcePasswordChange />
          </ProtectedRoute>
        ),
      },
      {
        path: "/profile",
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
        children: [
          {
            index: true,
            element: <AccountSettings />,
          },
          {
            path: "changepassword",
            element: <ChangePassword />,
          },
          {
            path: "reservations",
            element: <YourReservations />,
          },
          {
            path: "cards",
            element: <UserCards />,
          },
        ],
      },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <ThemeProvider>
    <AuthProvider>
      <Suspense fallback="loading">
        <RouterProvider router={router} />
      </Suspense>
    </AuthProvider>
  </ThemeProvider>
);
