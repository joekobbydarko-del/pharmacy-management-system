import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
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

import TechnicalSupportPage from "./pages/TechnicalSupportPage";
import ContactPharmacistPage from "./pages/ContactPharmacistPage";

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
            path="support"
            element={<TechnicalSupportPage />}
          />

          <Route
            path="contact-pharmacist"
            element={<ContactPharmacistPage />}
          />
        </Route>

        {/* ADMIN */}

        <Route
          path="/admin"
          element={<AdminDashboard />}
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