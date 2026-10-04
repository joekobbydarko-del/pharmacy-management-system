import {
  useEffect,
} from "react";

import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";


import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";

import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

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

import AdminDashboard from "./pages/AdminDashboard";

import PatientLayout from "./components/PatientLayout";

import {
  getStoredUserRole,
  isLoggedIn,
} from "./api";


import "./PatientMobile.css";


function ProtectedPatientRoute({
  children,
}) {
  const loggedIn =
    isLoggedIn();

  const role =
    String(
      getStoredUserRole() || ""
    ).toLowerCase();


  if (!loggedIn) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }


  if (
    role &&
    role !== "patient"
  ) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }


  return children;
}


function ProtectedAdminRoute({
  children,
}) {
  const loggedIn =
    isLoggedIn();

  const role =
    String(
      getStoredUserRole() || ""
    ).toLowerCase();


  if (!loggedIn) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }


  if (
    role &&
    role !== "admin"
  ) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }


  return children;
}


function App() {

  useEffect(() => {
    const savedTheme =
      localStorage.getItem(
        "patient_theme"
      ) || "light";


    document.documentElement
      .setAttribute(
        "data-theme",
        savedTheme
      );
  }, []);


  return (
    <BrowserRouter>

      <Routes>

        {/* ===============================================
            PUBLIC AUTH ROUTES
        =============================================== */}

        <Route
          path="/login"
          element={
            <LoginPage />
          }
        />


        <Route
          path="/signup"
          element={
            <SignUpPage />
          }
        />


        <Route
          path="/forgot-password"
          element={
            <ForgotPasswordPage />
          }
        />


        <Route
          path="/reset-password"
          element={
            <ResetPasswordPage />
          }
        />


        {/* ===============================================
            PATIENT PORTAL
        =============================================== */}

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
            element={
              <PatientDashboard />
            }
          />


          <Route
            path="appointments"
            element={
              <AppointmentsPage />
            }
          />


          <Route
            path="prescriptions"
            element={
              <PrescriptionsPage />
            }
          />


          <Route
            path="orders"
            element={
              <OrderMedicinesPage />
            }
          />


          <Route
            path="refills"
            element={
              <RefillRequestsPage />
            }
          />


          <Route
            path="order-history"
            element={
              <OrderHistoryPage />
            }
          />


          <Route
            path="activity"
            element={
              <PatientActivityPage />
            }
          />


          <Route
            path="contact-pharmacist"
            element={
              <ContactPharmacistPage />
            }
          />


          <Route
            path="profile"
            element={
              <PatientProfilePage />
            }
          />


          <Route
            path="settings"
            element={
              <PatientSettingsPage />
            }
          />


          <Route
            path="support"
            element={
              <TechnicalSupportPage />
            }
          />

        </Route>


        {/* ===============================================
            ADMIN
        =============================================== */}

        <Route
          path="/admin"
          element={
            <ProtectedAdminRoute>

              <AdminDashboard />

            </ProtectedAdminRoute>
          }
        />


        {/* ===============================================
            DEFAULT
        =============================================== */}

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