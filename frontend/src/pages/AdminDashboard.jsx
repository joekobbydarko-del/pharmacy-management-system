import { Navigate, useNavigate } from "react-router-dom";
import "../App.css";
import logo from "../assets/dr-evans-logo.png";

function AdminDashboard() {
  const navigate = useNavigate();

  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  if (!user || user.role !== "admin") {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="patient-dashboard">

      {/* TOP BAR */}
      <header className="patient-topbar">

        <div className="patient-brand">

          <img
            src={logo}
            alt="Dr. Evans Pharmacy logo"
          />

          <div>
            <h1>Dr. Evans Pharmacy</h1>
            <p>Pharmacy Administration</p>
          </div>

        </div>

        <div className="patient-user-area">

          <div className="patient-user-text">
            <span>Signed in as</span>
            <strong>{user.full_name}</strong>
          </div>

          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>

        </div>

      </header>

      {/* MAIN CONTENT */}
      <main className="patient-dashboard-content">

        <section className="patient-welcome">

          <p className="patient-badge">
            ADMIN DASHBOARD
          </p>

          <h2>
            Welcome back, {user.full_name}
          </h2>

          <p>
            Manage patients, prescriptions, medicine orders,
            and refill requests from one place.
          </p>

        </section>

        {/* DASHBOARD CARDS */}
        <section className="patient-card-grid">

          {/* PATIENTS */}

          <div className="patient-card">

            <div className="patient-card-icon">
              👥
            </div>

            <h3>Patients</h3>

            <p>
              View and manage registered pharmacy patients.
            </p>

            <button
              type="button"
              onClick={() => navigate("/admin/patients")}
            >
              Manage Patients
            </button>

          </div>


          {/* PRESCRIPTIONS */}

          <div className="patient-card">

            <div className="patient-card-icon">
              💊
            </div>

            <h3>Prescriptions</h3>

            <p>
              Create and manage patient prescriptions.
            </p>

            <button
              type="button"
              onClick={() => navigate("/admin/prescriptions")}
            >
              Manage Prescriptions
            </button>

          </div>


          {/* MEDICINE ORDERS */}

          <div className="patient-card">

            <div className="patient-card-icon">
              📦
            </div>

            <h3>Medicine Orders</h3>

            <p>
              Review and process patient medicine orders.
            </p>

            <button
              type="button"
              onClick={() => navigate("/admin/orders")}
            >
              View Medicine Orders
            </button>

          </div>


          {/* REFILL REQUESTS */}

          <div className="patient-card">

            <div className="patient-card-icon">
              🔄
            </div>

            <h3>Refill Requests</h3>

            <p>
              Review and process patient refill requests.
            </p>

            <button
              type="button"
              onClick={() => navigate("/admin/refills")}
            >
              View Refill Requests
            </button>

          </div>

        </section>

      </main>

    </div>
  );
}

export default AdminDashboard;