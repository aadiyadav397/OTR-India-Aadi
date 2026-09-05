import { AuthProvider, useAuth } from "./auth/AuthContext";
import { RouterProvider, useRouter } from "./router";
import { Register } from "./pages/Register";
import { Login } from "./pages/Login";
import { Profile } from "./pages/Profile";
import { HealthCheck } from "./pages/HealthCheck";

function Screen() {
  const { path, navigate } = useRouter();
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return <p style={{ fontFamily: "sans-serif", padding: "2rem" }}>Loading...</p>;
  }

  if (path === "/register") return <Register />;
  if (path === "/login") return <Login />;

  if (path === "/profile") {
    if (!token) {
      // Unauthenticated users cannot access /profile.
      navigate("/login");
      return null;
    }
    return <Profile />;
  }

  // Default landing route: the Milestone 1 health check, plus quick links
  // into the new Milestone 2 auth screens.
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
          {" · "}
          <a href="/profile" onClick={(e) => { e.preventDefault(); navigate("/profile"); }}>
            My Profile
          </a>
        </p>
      </div>
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
