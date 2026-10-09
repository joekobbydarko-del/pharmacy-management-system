import { useEffect } from "react";

import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

/* =========================================================
   AUTH PAGES
   ========================================================= */

import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

/* =========================================================
   PATIENT PAGES
   ========================================================= */

import PatientDashboard from "./pages/PatientDashboard";
import AppointmentsPage from "./pages/AppointmentsPage";
import PrescriptionsPage from "./pages/PrescriptionsPage";
import OrderMedicinesPage from "./pages/OrderMedicinesPage";
import RefillRequestsPage from "./pages/RefillRequestsPage";
import OrderHistoryPage from "./pages/OrderHistoryPage";
import PatientActivityPage from "./pages/PatientActivityPage";
import ContactPharmacistPage from "./pages/ContactPharmacistPage";
import PatientProfilePage from "./pages/PatientProfilePage";
import PatientSettingsPage from "./pages/PatientSettingsPage";
import TechnicalSupportPage from "./pages/TechnicalSupportPage";

/* =========================================================
   PHARMACIST / ADMIN PAGES
   ========================================================= */

import AdminDashboard from "./pages/AdminDashboard";
import AdminOrdersPage from "./pages/AdminOrdersPage";
import AdminPatientsPage from "./pages/AdminPatientsPage";
import AdminInventoryPage from "./pages/AdminInventoryPage";
import AdminPOSPage from "./pages/AdminPOSPage";
import AdminSalesPage from "./pages/AdminSalesPage";
import AdminPurchasesPage from "./pages/AdminPurchasesPage";
import AdminSuppliersPage from "./pages/AdminSuppliersPage";
import AdminAppointmentsPage from "./pages/AdminAppointmentsPage";
import AdminReportsPage from "./pages/AdminReportsPage";
import AdminAlertsPage from "./pages/AdminAlertsPage";
import AdminSettingsPage from "./pages/AdminSettingsPage";
import AdminProfilePage from "./pages/AdminProfilePage";
import AdminSupportPage from "./pages/AdminSupportPage";

/* =========================================================
   LAYOUTS
   ========================================================= */

import PatientLayout from "./components/PatientLayout";
import AdminLayout from "./components/AdminLayout";

/* =========================================================
   API HELPERS
   ========================================================= */

import {
  getStoredUserRole,
  isLoggedIn,
} from "./api";

/* =========================================================
   MOBILE STYLES
   ========================================================= */

import "./PatientMobile.css";
import "./AdminMobile.css";

/* =========================================================
   PATIENT ROUTE PROTECTION
   ========================================================= */

function ProtectedPatientRoute({ children }) {
  const loggedIn = isLoggedIn();

  const role = String(
    getStoredUserRole() || ""
  )
    .trim()
    .toLowerCase();

  if (!loggedIn || role !== "patient") {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return children;
}

/* =========================================================
   PHARMACIST ROUTE PROTECTION
   ========================================================= */

function ProtectedAdminRoute({ children }) {
  const loggedIn = isLoggedIn();

  const role = String(
    getStoredUserRole() || ""
  )
    .trim()
    .toLowerCase();

  if (!loggedIn || role !== "admin") {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return children;
}

/* =========================================================
   MAIN APPLICATION
   ========================================================= */

function App() {
  useEffect(() => {
    const patientTheme =
      localStorage.getItem("patient_theme") ||
      "light";

    const adminTheme =
      localStorage.getItem("admin_theme") ||
      "light";

    document.documentElement.setAttribute(
      "data-theme",
      patientTheme
    );

    document.documentElement.setAttribute(
      "data-admin-theme",
      adminTheme
    );
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* ================================================
            PUBLIC AUTHENTICATION
           ================================================ */}

        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route
          path="/signup"
          element={<SignUpPage />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPasswordPage />}
        />

        <Route
          path="/reset-password"
          element={<ResetPasswordPage />}
        />

        {/* ================================================
            PATIENT PORTAL
           ================================================ */}

        <Route
          path="/patient"
          element={
            <ProtectedPatientRoute>
              <PatientLayout />
            </ProtectedPatientRoute>
          }
        >
          <Route
            index
            element={<PatientDashboard />}
          />

          <Route
            path="appointments"
            element={<AppointmentsPage />}
          />

          <Route
            path="prescriptions"
            element={<PrescriptionsPage />}
          />

          <Route
            path="orders"
            element={<OrderMedicinesPage />}
          />

          <Route
            path="refills"
            element={<RefillRequestsPage />}
          />

          <Route
            path="order-history"
            element={<OrderHistoryPage />}
          />

          <Route
            path="activity"
            element={<PatientActivityPage />}
          />

          <Route
            path="contact-pharmacist"
            element={<ContactPharmacistPage />}
          />

          <Route
            path="profile"
            element={<PatientProfilePage />}
          />

          <Route
            path="settings"
            element={<PatientSettingsPage />}
          />

          <Route
            path="support"
            element={<TechnicalSupportPage />}
          />
        </Route>

        {/* ================================================
            PHARMACIST / ADMIN PORTAL
           ================================================ */}

        <Route
          path="/admin"
          element={
            <ProtectedAdminRoute>
              <AdminLayout />
            </ProtectedAdminRoute>
          }
        >
          <Route
            index
            element={<AdminDashboard />}
          />

          {/* Main patient Orders management page */}

          <Route
            path="orders"
            element={<AdminOrdersPage />}
          />

          {/* Internal dispensing / checkout engine */}

          <Route
            path="pos"
            element={<AdminPOSPage />}
          />

          <Route
            path="inventory"
            element={<AdminInventoryPage />}
          />

          <Route
            path="sales"
            element={<AdminSalesPage />}
          />

          <Route
            path="purchases"
            element={<AdminPurchasesPage />}
          />

          <Route
            path="suppliers"
            element={<AdminSuppliersPage />}
          />

          <Route
            path="patients"
            element={<AdminPatientsPage />}
          />

          <Route
            path="appointments"
            element={<AdminAppointmentsPage />}
          />

          <Route
            path="reports"
            element={<AdminReportsPage />}
          />

          <Route
            path="alerts"
            element={<AdminAlertsPage />}
          />

          <Route
            path="support"
            element={<AdminSupportPage />}
          />

          <Route
            path="profile"
            element={<AdminProfilePage />}
          />

          <Route
            path="settings"
            element={<AdminSettingsPage />}
          />
        </Route>

        {/* ================================================
            DEFAULT ROUTES
           ================================================ */}

        <Route
          path="/"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;