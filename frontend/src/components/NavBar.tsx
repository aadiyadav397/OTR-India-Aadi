import { useAuth } from "../auth/AuthContext";
import { useRouter } from "../router";

const NAV_ITEMS: Array<{ to: string; label: string }> = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/profile", label: "Profile" },
  { to: "/services", label: "Government Services" },
  { to: "/applications", label: "My Applications" },
  { to: "/consents", label: "Consent History" },
];

/**
 * Shared top navigation for every authenticated page. Highlights the
 * current route and always exposes a clear Log Out action. Existing
 * routes/behavior are unchanged - this only standardizes how they're
 * presented.
 */
export function NavBar({ title }: { title: string }) {
  const { path, navigate } = useRouter();
  const { logout } = useAuth();

  function go(to: string) {
    return (e: React.MouseEvent) => {
      e.preventDefault();
      navigate(to);
    };
  }

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="otr-navbar">
      <h1>{title}</h1>
      <nav className="otr-navlinks">
        {NAV_ITEMS.map((item) => (
          <a
            key={item.to}
            href={item.to}
            onClick={go(item.to)}
            className={`otr-navlink${path === item.to ? " active" : ""}`}
            aria-current={path === item.to ? "page" : undefined}
          >
            {item.label}
          </a>
        ))}
        <button onClick={handleLogout} className="otr-logout-btn">
          Log Out
        </button>
      </nav>
    </div>
  );
}
