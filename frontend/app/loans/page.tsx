
"use client";
import StudentIdentification from "@/components/StudentIdentification";
import CommunityLoading from "@/components/CommunityLoading";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { apiGet, apiPost } from "@/lib/api";
import { supabase } from "@/lib/supabase";

type Member = {
  id: number;
  name: string;
  group: number;
};

type Loan = {
  id: number;
  member: number;
  amount: number | string;
  balance: number | string;
};

type Repayment = {
  id: number;
  loan: number;
  amount: number | string;
  payment_date: string;
  created_at: string;
};

function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [repayments, setRepayments] = useState<Repayment[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // New loan form
  const [selectedMember, setSelectedMember] = useState("");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);

  // Repayment form
  const [selectedLoan, setSelectedLoan] = useState("");
  const [repaymentAmount, setRepaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [repaying, setRepaying] = useState(false);

  // User role
  const [userRole, setUserRole] = useState<"chair" | "member" | null>(null);

  // Feedback
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success"
  );

  // Load the logged-in user's role from Supabase
  useEffect(() => {
    async function loadUserRole() {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("AUTH USER ERROR:", userError);
        console.error("No authenticated user found.");
        setUserRole("member");
        return;
      }

      console.log("SIGNED-IN USER EMAIL:", user.email);
      console.log("SIGNED-IN USER ID:", user.id);

      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      console.log("PROFILE DATA:", data);
      console.log("PROFILE QUERY ERROR:", error);

      setUserRole(!error && data?.role === "chair" ? "chair" : "member");
    }

    loadUserRole();
  }, []);

  // Load loans, members and repayment history
  const loadData = useCallback(async () => {
    try {
      const [loanData, memberData, repaymentData] = await Promise.all([
        apiGet("/loans/"),
        apiGet("/members/"),
        apiGet("/loan-repayments/"),
      ]);

      setLoans(loanData);
      setMembers(memberData);
      setRepayments(repaymentData);
      setError("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    setPaymentDate(getTodayDate());
  }, [loadData]);

  // Register a new loan
  async function handleCreateLoan(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!selectedMember || !amount || Number(amount) <= 0) {
      setMessageType("error");
      setMessage("Please select a member and enter a valid loan amount.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      await apiPost("/loans/", {
        member: Number(selectedMember),
        amount: Number(amount),
      });

      setSelectedMember("");
      setAmount("");

      setMessageType("success");
      setMessage("Loan registered successfully!");

      await loadData();
    } catch (err) {
      setMessageType("error");
      setMessage(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

  // Record a loan repayment
  async function handleRepayment(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const loan = loans.find(
      (item) => item.id === Number(selectedLoan)
    );

    if (!loan) {
      setMessageType("error");
      setMessage("Please select a valid loan.");
      return;
    }

    const payment = Number(repaymentAmount);
    const outstanding = Number(loan.balance);

    if (!repaymentAmount || !Number.isFinite(payment) || payment <= 0) {
      setMessageType("error");
      setMessage("Enter a repayment amount greater than zero.");
      return;
    }

    if (payment > outstanding) {
      setMessageType("error");
      setMessage(
        `Repayment cannot exceed the outstanding balance of ${formatMoney(
          outstanding
        )}.`
      );
      return;
    }

    if (!paymentDate) {
      setMessageType("error");
      setMessage("Please select the payment date.");
      return;
    }

    setRepaying(true);
    setMessage("");

    try {
      const data = await apiPost("/loan-repayments/", {
        loan: Number(selectedLoan),
        amount: payment.toFixed(2),
        payment_date: paymentDate,
      });

      setMessageType("success");
      setMessage(
        `Repayment recorded successfully! Remaining balance: ${formatMoney(
          Number(data.remaining_balance)
        )}.`
      );

      setSelectedLoan("");
      setRepaymentAmount("");
      setPaymentDate(getTodayDate());

      await loadData();
    } catch (err) {
      setMessageType("error");
      setMessage(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setRepaying(false);
    }
  }

  // Total principal
  const totalPrincipal = loans.reduce(
    (total, loan) => total + Number(loan.amount),
    0
  );

  // Total outstanding balances
  const totalOutstanding = loans.reduce(
    (total, loan) => total + Number(loan.balance),
    0
  );

  // Original 5% flat interest calculated on principal
  const totalInterest = loans.reduce(
    (total, loan) => total + Number(loan.amount) * 0.05,
    0
  );

  // Format money
  function formatMoney(value: number) {
    return new Intl.NumberFormat("en-RW", {
      style: "currency",
      currency: "RWF",
      maximumFractionDigits: 0,
    }).format(value);
  }

  if (loading) {
    return <CommunityLoading message="LOADING YOUR DASHBOARD..." />;
  }

  if (error) {
    return (
      <main className="p-10 text-red-600">
        {error}
        <button
          onClick={loadData}
          className="ml-4 rounded bg-emerald-600 px-4 py-2 text-white"
        >
          Try Again
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen dashboard-photo-bg text-slate-800">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-64 bg-slate-900 p-6 text-white md:block">
          <h1 className="mb-10 text-xl font-bold">
            Community<span className="text-emerald-400">Save</span>
          </h1>

          <nav className="space-y-5">
            <Link
              href="/"
              className="block rounded-lg px-4 py-3 text-slate-300 hover:bg-slate-700"
            >
              ▦ Dashboard
            </Link>

            <Link
              href="/members"
              className="block rounded-lg px-4 py-3 text-slate-300 hover:bg-slate-700"
            >
              👥 Members
            </Link>

            <Link
              href="/savings"
              className="block rounded-lg px-4 py-3 text-slate-300 hover:bg-slate-700"
            >
              💰 Savings
            </Link>

            <p className="rounded-lg bg-emerald-600 px-4 py-3">
              💳 Loans
            </p>
          </nav>
        </aside>

        {/* Main Content */}
        <section className="flex-1 p-5 md:p-8">
         
          <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">Loan Management</h2>
              <p className="text-sm text-slate-500">
                Register loans, record repayments and monitor balances
              </p>
            </div>

            <Link
              href="/"
              className="text-sm font-medium text-emerald-700 hover:underline"
            >
              ← Back Back to Dashboard
            </Link>
          </header>

          {/* Statistics */}
          <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              title="Total Principal"
              value={formatMoney(totalPrincipal)}
              icon="💵"
            />

            <StatCard
              title="Calculated Interest (5%)"
              value={formatMoney(totalInterest)}
              icon="📈"
            />

            <StatCard
              title="Outstanding Loans"
              value={formatMoney(totalOutstanding)}
              icon="💳"
            />
          </div>

          {/* Feedback */}
          {message && (
            <div
              className={`mb-6 rounded-lg p-4 text-sm ${
                messageType === "success"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {message}
            </div>
          )}

          {/* Register Loan Form */}
          {userRole === "chair" && (
            <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
              <h3 className="mb-2 text-lg font-bold">
                Register a New Loan
              </h3>

              <p className="mb-5 text-sm text-slate-500">
                Members can borrow up to three times their total savings.
                Interest is calculated automatically by the backend.
              </p>

              <form onSubmit={handleCreateLoan}>
                <label className="mb-2 block text-sm font-medium">
                  Select Member
                </label>

                <select
                  value={selectedMember}
                  onChange={(e) => setSelectedMember(e.target.value)}
                  required
                  className="mb-4 w-full rounded-lg border border-slate-300 bg-white p-3"
                >
                  <option value="">Choose a member</option>

                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} (ID: {member.id})
                    </option>
                  ))}
                </select>

                <label className="mb-2 block text-sm font-medium">
                  Loan Amount (RWF)
                </label>

                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter loan amount"
                  required
                  className="mb-5 w-full rounded-lg border border-slate-300 p-3"
                />

                <button
                  type="submit"
                  disabled={saving || members.length === 0}
                  className="rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {saving ? "Registering..." : "Register Loan"}
                </button>
              </form>

              {members.length === 0 && (
                <p className="mt-3 text-sm text-red-600">
                  Register a member before creating a loan.
                </p>
              )}
            </div>
          )}

          {/* Repayment Form */}
          {userRole === "chair" && (
            <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
              <h3 className="mb-2 text-lg font-bold">
                Record Loan Repayment
              </h3>

              <p className="mb-5 text-sm text-slate-500">
                Select an outstanding loan and enter the amount paid.
                The backend will update the loan balance automatically.
              </p>

              <form onSubmit={handleRepayment}>
                <label className="mb-2 block text-sm font-medium">
                  Select Loan
                </label>

                <select
                  value={selectedLoan}
                  onChange={(e) => setSelectedLoan(e.target.value)}
                  required
                  className="mb-4 w-full rounded-lg border border-slate-300 bg-white p-3"
                >
                  <option value="">Choose a loan</option>

                  {loans
                    .filter((loan) => Number(loan.balance) > 0)
                    .map((loan) => {
                      const member = members.find(
                        (person) => person.id === loan.member
                      );

                      return (
                        <option key={loan.id} value={loan.id}>
                          Loan #{loan.id} - {member?.name ?? `Member ${loan.member}`}
                          {" - "}
                          {formatMoney(Number(loan.balance))}
                        </option>
                      );
                    })}
                </select>

                {selectedLoan && (
                  <div className="mb-4 rounded-lg bg-emerald-50 p-4">
                    <p className="text-sm text-slate-600">
                      Current outstanding balance
                    </p>
                    <p className="text-xl font-bold text-emerald-700">
                      {formatMoney(
                        Number(
                          loans.find(
                            (loan) => loan.id === Number(selectedLoan)
                          )?.balance ?? 0
                        )
                      )}
                    </p>
                  </div>
                )}

                <label className="mb-2 block text-sm font-medium">
                  Repayment Amount (RWF)
                </label>

                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={repaymentAmount}
                  onChange={(e) => setRepaymentAmount(e.target.value)}
                  placeholder="Enter repayment amount"
                  required
                  className="mb-4 w-full rounded-lg border border-slate-300 p-3"
                />

                <label className="mb-2 block text-sm font-medium">
                  Payment Date
                </label>

                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  required
                  className="mb-5 w-full rounded-lg border border-slate-300 p-3"
                />

                <button
                  type="submit"
                  disabled={
                    repaying ||
                    !selectedLoan ||
                    Number(repaymentAmount) <= 0
                  }
                  className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {repaying ? "Recording..." : "Record Repayment"}
                </button>

                {loans.filter((loan) => Number(loan.balance) > 0).length ===
                  0 && (
                  <p className="mt-3 text-sm text-slate-500">
                    There are no outstanding loans to repay.
                  </p>
                )}
              </form>
            </div>
          )}

          {/* Loans Table */}
          <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
            <h3 className="mb-5 text-lg font-bold">Loan Records</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-slate-50 text-slate-500">
                  <tr>
                    <th className="p-3">Loan ID</th>
                    <th className="p-3">Member</th>
                    <th className="p-3">Principal</th>
                    <th className="p-3">Calculated Interest</th>
                    <th className="p-3">Outstanding Balance</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {loans.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-6 text-center text-slate-500"
                      >
                        No loans registered yet.
                      </td>
                    </tr>
                  ) : (
                    loans.map((loan) => {
                      const member = members.find(
                        (person) => person.id === loan.member
                      );

                      const principal = Number(loan.amount);
                      const balance = Number(loan.balance);
                      const interest = principal * 0.05;

                      return (
                        <tr key={loan.id} className="border-b">
                          <td className="p-3">{loan.id}</td>

                          <td className="p-3 font-medium">
                            {member?.name ?? `Member ${loan.member}`}
                          </td>

                          <td className="p-3">
                            {formatMoney(principal)}
                          </td>

                          <td className="p-3 text-amber-700">
                            {formatMoney(interest)}
                          </td>

                          <td className="p-3 font-semibold text-red-700">
                            {formatMoney(balance)}
                          </td>

                          <td className="p-3">
                            {balance <= 0 ? (
                              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                                Paid
                              </span>
                            ) : (
                              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                                Outstanding
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Repayment History */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="mb-5 text-lg font-bold">
              Repayment History
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-slate-50 text-slate-500">
                  <tr>
                    <th className="p-3">Repayment ID</th>
                    <th className="p-3">Loan ID</th>
                    <th className="p-3">Member</th>
                    <th className="p-3">Amount Paid</th>
                    <th className="p-3">Payment Date</th>
                  </tr>
                </thead>

                <tbody>
                  {repayments.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="p-6 text-center text-slate-500"
                      >
                        No repayments recorded yet.
                      </td>
                    </tr>
                  ) : (
                    repayments.map((repayment) => {
                      const loan = loans.find(
                        (item) => item.id === repayment.loan
                      );

                      const member = loan
                        ? members.find(
                            (person) => person.id === loan.member
                          )
                        : undefined;

                      return (
                        <tr key={repayment.id} className="border-b">
                          <td className="p-3">{repayment.id}</td>

                          <td className="p-3">
                            {repayment.loan}
                          </td>

                          <td className="p-3 font-medium">
                            {member?.name ??
                              (loan
                                ? `Member ${loan.member}`
                                : "Unknown member")}
                          </td>

                          <td className="p-3 font-semibold text-emerald-700">
                            {formatMoney(Number(repayment.amount))}
                          </td>

                          <td className="p-3">
                            {repayment.payment_date}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
       <StudentIdentification />
    </main>
  );
}

// Reusable Statistics Card
function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <div className="mb-3 text-2xl">{icon}</div>
      <p className="text-sm text-slate-500">{title}</p>
      <h3 className="mt-2 text-2xl font-bold">{value}</h3>
    </div>
  );
}


