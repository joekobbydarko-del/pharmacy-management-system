import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";

import PatientLayout from "./components/PatientLayout";

import PatientDashboard from "./pages/PatientDashboard";
import AppointmentsPage from "./pages/AppointmentsPage";
import PrescriptionsPage from "./pages/PrescriptionsPage";
import OrderMedicinesPage from "./pages/OrderMedicinesPage";
import RefillRequestsPage from "./pages/RefillRequestsPage";
import OrderHistoryPage from "./pages/OrderHistoryPage";

import PatientActivityPage from "./pages/PatientActivityPage";

import TechnicalSupportPage from "./pages/TechnicalSupportPage";
import ContactPharmacistPage from "./pages/ContactPharmacistPage";

import PatientProfilePage from "./pages/PatientProfilePage";
import PatientSettingsPage from "./pages/PatientSettingsPage";

import AdminDashboard from "./pages/AdminDashboard";


function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* AUTH */}

        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route
          path="/signup"
          element={<SignUpPage />}
        />


        {/* PATIENT PORTAL */}

        <Route
          path="/patient"
          element={<PatientLayout />}
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

          {/* NEW ACTIVITY HISTORY */}

          <Route
            path="activity"
            element={
              <PatientActivityPage />
            }
          />

          <Route
            path="support"
            element={
              <TechnicalSupportPage />
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

        </Route>


        {/* ADMIN */}

        <Route
          path="/admin"
          element={
            <AdminDashboard />
          }
        />


        {/* DEFAULT */}

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