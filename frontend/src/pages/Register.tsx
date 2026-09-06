import { useState } from "react";
import type { FormEvent } from "react";
import { registerUser, ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { useRouter } from "../router";

export function Register() {
  const { login } = useAuth();
  const { navigate } = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors([]);
    setIsSubmitting(true);

    try {
      const result = await registerUser({ email, password, fullName, dateOfBirth, mobileNumber });
      login(result.token, result.user);
      navigate("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.details && err.details.length > 0 ? err.details : [err.message]);
      } else {
        setErrors(["Something went wrong. Please try again."]);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div style={{ fontFamily: "sans-serif", padding: "2rem", maxWidth: 420, margin: "0 auto" }}>
      <h1>Register</h1>
      <p style={{ color: "#666", fontSize: "0.9rem" }}>
        Create a demo citizen account for the OTR-India prototype. Synthetic data only.
      </p>

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
            minLength={8}
            style={inputStyle}
          />
        </label>
        <label>
          Full Name
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            style={inputStyle}
          />
        </label>
        <label>
          Date of Birth
          <input
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            required
            style={inputStyle}
          />
        </label>
        <label>
          Mobile Number
          <input
            type="tel"
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value)}
            placeholder="10 digit number"
            required
            style={inputStyle}
          />
        </label>

        {errors.length > 0 && (
          <ul style={{ color: "crimson", fontSize: "0.85rem", margin: 0, paddingLeft: "1.2rem" }}>
            {errors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        )}

        <button type="submit" disabled={isSubmitting} style={buttonStyle}>
          {isSubmitting ? "Creating account..." : "Register"}
        </button>
      </form>

      <p style={{ fontSize: "0.85rem", marginTop: "1rem" }}>
        Already have an account?{" "}
        <a href="/login" onClick={(e) => { e.preventDefault(); navigate("/login"); }}>
          Log in
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
