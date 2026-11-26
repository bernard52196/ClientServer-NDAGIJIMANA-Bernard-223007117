"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Group = {
  id: number;
  name: string;
};

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadGroups() {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/public-groups/`
        );

        if (!response.ok) {
          throw new Error("Unable to load savings groups.");
        }

        const data = await response.json();
        setGroups(data);
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to load savings groups."
        );
      } finally {
        setLoadingGroups(false);
      }
    }

    loadGroups();
  }, []);

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    if (!selectedGroup) {
      setMessage("Please select a savings group.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            requested_group_id: Number(selectedGroup),
          },
        },
      });

      if (error) {
        setMessage(error.message);
      } else if (data.user && !data.session) {
        setMessage(
          "Registration successful! Please check your email to confirm your account. Your registration is awaiting Chair approval."
        );
      } else {
        setMessage(
          "Registration successful! Your account is awaiting Chair approval."
        );
      }
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const fieldStyle: React.CSSProperties = {
    display: "block",
    width: "100%",
    height: "48px",
    padding: "0 14px",
    marginTop: "8px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    backgroundColor: "#ffffff",
    color: "#0f172a",
    fontSize: "15px",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    marginTop: "20px",
    color: "#1e293b",
    fontSize: "14px",
    fontWeight: 600,
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-9">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900">
            Create Account
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            Join CommunitySave and become part of a savings group.
          </p>

          <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-emerald-600" />
        </div>

        <form onSubmit={handleSignup}>
          <div>
            <label htmlFor="fullName" style={labelStyle}>
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              autoComplete="name"
              placeholder="Enter your full name"
              style={fieldStyle}
            />
          </div>

          <div>
            <label htmlFor="email" style={labelStyle}>
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="Enter your email address"
              style={fieldStyle}
            />
          </div>

          <div>
            <label htmlFor="password" style={labelStyle}>
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Enter at least 8 characters"
              style={fieldStyle}
            />
            <p className="mt-1 text-xs text-slate-500">
              Password must contain at least 8 characters.
            </p>
          </div>

          <div>
            <label htmlFor="group" style={labelStyle}>
              Choose Your Savings Group
            </label>
            <select
              id="group"
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              required
              disabled={loadingGroups || groups.length === 0}
              style={{
                ...fieldStyle,
                cursor: loadingGroups || groups.length === 0 ? "not-allowed" : "pointer",
              }}
            >
              <option value="">
                {loadingGroups ? "Loading savings groups..." : "Select your savings group"}
              </option>

              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>

            {!loadingGroups && groups.length === 0 && (
              <p className="mt-2 text-sm text-red-600">
                No savings groups are available. Please contact the Chair.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || loadingGroups || groups.length === 0}
            className="mt-8 w-full rounded-lg bg-emerald-700 px-5 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Create My Account"}
          </button>
        </form>

        {message && (
          <div
            className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700"
            role="status"
          >
            {message}
          </div>
        )}

        <p className="mt-7 text-center text-xs leading-5 text-slate-500">
          Your registration will be reviewed by the Chair before your membership
          is activated.
        </p>
      </div>
    </main>
  );
}
