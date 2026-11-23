"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        setMessage(error.message);
      } else if (data.user && !data.session) {
        setMessage("Registration successful! Please check your email to confirm your account.");
      } else {
        setMessage("Registration successful! Your account has been created.");
      }
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: "450px", margin: "60px auto", padding: "25px" }}>
      <h1 style={{ fontSize: "28px", fontWeight: "bold" }}>
        Create Account
      </h1>

      <p style={{ marginBottom: "25px", color: "#666" }}>
        Community Savings Group Manager
      </p>

      <form onSubmit={handleSignup}>
        <label>Full Name</label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          placeholder="Enter your full name"
          style={inputStyle}
        />

        <label>Email Address</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="Enter your email"
          style={inputStyle}
        />

        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          placeholder="At least 8 characters"
          style={inputStyle}
        />

        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? "Creating account..." : "Sign Up"}
        </button>
      </form>

      {message && (
        <p style={{ marginTop: "20px" }} role="status">
          {message}
        </p>
      )}
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "12px",
  marginTop: "8px",
  marginBottom: "18px",
  border: "1px solid #ccc",
  borderRadius: "6px",
};

const buttonStyle: React.CSSProperties = {
  width: "100%",
  padding: "13px",
  backgroundColor: "#166534",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
};
