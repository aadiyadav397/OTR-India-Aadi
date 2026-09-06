import { AuthProvider, useAuth } from "./auth/AuthContext";
import { RouterProvider, useRouter } from "./router";
import { Register } from "./pages/Register";
import { Login } from "./pages/Login";
import { Profile } from "./pages/Profile";
import { HealthCheck } from "./pages/HealthCheck";
import { GovernmentServices } from "./pages/GovernmentServices";
import { Applications } from "./pages/Applications";
import { Dashboard } from "./pages/Dashboard";

function Screen() {
  const { path, navigate } = useRouter();
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return <p style={{ fontFamily: "sans-serif", padding: "2rem" }}>Loading...</p>;
  }

  if (path === "/register") return <Register />;
  if (path === "/login") return <Login />;

  if (path === "/dashboard") {
    if (!token) {
      navigate("/login");
      return null;
    }
    return <Dashboard />;
  }

  if (path === "/profile") {
    if (!token) {
      // Unauthenticated users cannot access /profile.
      navigate("/login");
      return null;
    }
    return <Profile />;
  }

  if (path === "/services") {
    if (!token) {
      navigate("/login");
      return null;
    }
    return <GovernmentServices />;
  }

  if (path === "/applications") {
    if (!token) {
      navigate("/login");
      return null;
    }
    return <Applications />;
  }

  // Root route: authenticated users land on the Dashboard; anonymous
  // visitors see the Milestone 1 health check plus quick links.
  if (path === "/") {
    if (token) {
      navigate("/dashboard");
      return null;
    }
    return (
      <div>
        <HealthCheck />
        <div style={{ fontFamily: "sans-serif", padding: "0 2rem 2rem", maxWidth: 480 }}>
          <h2>OTR Demo</h2>
          <p>
            <a href="/register" onClick={(e) => { e.preventDefault(); navigate("/register"); }}>
              Register
            </a>
            {" · "}
            <a href="/login" onClick={(e) => { e.preventDefault(); navigate("/login"); }}>
              Log In
            </a>
          </p>
        </div>
      </div>
    );
  }

  // Fallback for any unrecognized path.
  return (
    <div style={{ fontFamily: "sans-serif", padding: "2rem" }}>
      <p>Page not found.</p>
      <a href="/" onClick={(e) => { e.preventDefault(); navigate("/"); }}>
        Go home
      </a>
    </div>
  );
}

export default function App() {
  return (
    <RouterProvider>
      <AuthProvider>
        <Screen />
      </AuthProvider>
    </RouterProvider>
  );
}
