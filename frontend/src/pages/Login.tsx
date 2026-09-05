import { useState } from "react";
import type { FormEvent } from "react";
import { loginUser, ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { useRouter } from "../router";

export function Login() {
  const { login } = useAuth();
  const { navigate } = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await loginUser({ email, password });
      login(result.token, result.user);
      navigate("/profile");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div style={{ fontFamily: "sans-serif", padding: "2rem", maxWidth: 420, margin: "0 auto" }}>
      <h1>Log In</h1>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={inputStyle}
          />
        </label>

        {error && <p style={{ color: "crimson", fontSize: "0.85rem", margin: 0 }}>{error}</p>}

        <button type="submit" disabled={isSubmitting} style={buttonStyle}>
          {isSubmitting ? "Logging in..." : "Log In"}
        </button>
      </form>

      <p style={{ fontSize: "0.85rem", marginTop: "1rem" }}>
        Don&apos;t have an account?{" "}
        <a href="/register" onClick={(e) => { e.preventDefault(); navigate("/register"); }}>
          Register
        </a>
      </p>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "0.5rem",
  marginTop: "0.25rem",
  boxSizing: "border-box",
};

const buttonStyle: React.CSSProperties = {
  padding: "0.6rem",
  cursor: "pointer",
};
