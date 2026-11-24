
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          setErrorMessage(error.message);
          setLoading(false);
          return;
        }

        router.push("/");
        router.refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
            },
          },
        });

        if (error) {
          setErrorMessage(error.message);
          setLoading(false);
          return;
        }

        if (data.session) {
          setSuccessMessage("Account created successfully!");
          router.push("/");
          router.refresh();
        } else {
          setSuccessMessage(
            "Account created! Please check your email to verify your account before logging in."
          );
          setMode("login");
          setPassword("");
        }
      }
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
    }

    setLoading(false);
  }

  const inputStyle =
    "w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-500 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100";

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-8">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl sm:p-8">

        {/* Branding */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
            💰
          </div>

          <h1 className="text-3xl font-extrabold text-green-700">
            CommunitySave
          </h1>

          <p className="mt-2 text-gray-600">
            Community Savings Group Manager
          </p>
        </div>

        {/* Login / Signup Tabs */}
        <div className="mb-6 grid grid-cols-2 rounded-lg bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setErrorMessage("");
              setSuccessMessage("");
            }}
            className={`rounded-md py-2.5 font-semibold transition ${
              mode === "login"
                ? "bg-white text-green-700 shadow"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Sign In
          </button>

          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setErrorMessage("");
              setSuccessMessage("");
            }}
            className={`rounded-md py-2.5 font-semibold transition ${
              mode === "signup"
                ? "bg-white text-green-700 shadow"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Heading */}
        <h2 className="mb-2 text-2xl font-bold text-gray-900">
          {mode === "login" ? "Welcome Back!" : "Create Your Account"}
        </h2>

        <p className="mb-6 text-sm text-gray-600">
          {mode === "login"
            ? "Sign in to manage your savings groups."
            : "Join CommunitySave and manage your savings."}
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Full Name (Signup only) */}
          {mode === "signup" && (
            <div>
              <label
                htmlFor="fullName"
                className="mb-2 block font-semibold text-gray-800"
              >
                Full Name
              </label>

              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                required
                autoComplete="name"
                className={inputStyle}
              />
            </div>
          )}

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="mb-2 block font-semibold text-gray-800"
            >
              Email Address
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              required
              autoComplete="email"
              className={inputStyle}
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="mb-2 block font-semibold text-gray-800"
            >
              Password
            </label>

            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                minLength={6}
                autoComplete={
                  mode === "login"
                    ? "current-password"
                    : "new-password"
                }
                className={`${inputStyle} pr-20`}
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-green-700 hover:text-green-900"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            {mode === "signup" && (
              <p className="mt-1 text-xs text-gray-600">
                Password must contain at least 6 characters.
              </p>
            )}
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
              {errorMessage}
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-800">
              {successMessage}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-green-700 py-3.5 font-bold text-white shadow-sm transition hover:bg-green-800 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Please wait..."
              : mode === "login"
              ? "Sign In"
              : "Create Account"}
          </button>
        </form>

        {/* Toggle text */}
        <div className="mt-6 text-center text-sm text-gray-700">
          {mode === "login" ? (
            <>
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setErrorMessage("");
                  setSuccessMessage("");
                }}
                className="font-bold text-green-700 hover:underline"
              >
                Sign Up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setErrorMessage("");
                  setSuccessMessage("");
                }}
                className="font-bold text-green-700 hover:underline"
              >
                Sign In
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-gray-500">
          Secure authentication powered by Supabase.
        </p>
      </div>
    </main>
  );
}