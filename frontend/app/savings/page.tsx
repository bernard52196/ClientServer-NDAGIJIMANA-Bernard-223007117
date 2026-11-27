
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

type Saving = {
  id: number;
  member: number;
  amount: string | number;
  week: string;
};

export default function SavingsPage() {
  const [savings, setSavings] = useState<Saving[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedMember, setSelectedMember] = useState("");
  const [amount, setAmount] = useState("");
  const [week, setWeek] = useState("");
  const [saving, setSaving] = useState(false);
  const [userRole, setUserRole] = useState<"chair" | "member" | null>(null);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success"
  );

  // Load the logged-in user's role from Supabase
  useEffect(() => {
    async function loadUserRole() {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        setUserRole("member");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      setUserRole(!error && data?.role === "chair" ? "chair" : "member");
    }

    loadUserRole();
  }, []);
  // Load savings and members
  const loadData = useCallback(async () => {
    try {
      const [savingsData, membersData] = await Promise.all([
        apiGet("/savings/"),
        apiGet("/members/"),
      ]);

      setSavings(savingsData);
      setMembers(membersData);
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
  }, [loadData]);

  // Register savings
  async function handleCreateSaving(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!selectedMember || !amount || !week || Number(amount) <= 0) {
      setMessageType("error");
      setMessage("Please enter a valid member, amount and week.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      await apiPost("/savings/", {
        member: Number(selectedMember),
        amount: Number(amount),
        week,
      });

      setSelectedMember("");
      setAmount("");
      setWeek("");

      setMessageType("success");
      setMessage("Savings recorded successfully!");

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

  // Calculate total savings
  const totalSavings = savings.reduce(
    (total, item) => total + Number(item.amount),
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
              â–¦ Dashboard
            </Link>

            <Link
              href="/members"
              className="block rounded-lg px-4 py-3 text-slate-300 hover:bg-slate-700"
            >
              ðŸ‘¥ Members
            </Link>

            <p className="rounded-lg bg-emerald-600 px-4 py-3">
              ðŸ’° Savings
            </p>

            <Link
              href="/loans"
              className="block rounded-lg px-4 py-3 text-slate-300 hover:bg-slate-700"
            >
              ðŸ’³ Loans
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <section className="flex-1 p-5 md:p-8">  
         
         

          <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">Savings Management</h2>
              <p className="text-sm text-slate-500">
                Record and monitor member savings
              </p>
            </div>

            <Link
              href="/"
              className="text-sm font-medium text-emerald-700 hover:underline"
            >
              â† Back to Dashboard
            </Link>
          </header>

          {/* Statistics */}
          <div className="mb-8 grid gap-5 sm:grid-cols-2">
            <StatCard
              title="Total Savings"
              value={formatMoney(totalSavings)}
              icon="ðŸ’°"
            />

            <StatCard
              title="Savings Records"
              value={savings.length.toString()}
              icon="ðŸ“Š"
            />
          </div>

          {/* Record Savings Form */}
          {userRole === "chair" && (
          <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
            <h3 className="mb-5 text-lg font-bold">
              Record Member Savings
            </h3>

            <form onSubmit={handleCreateSaving}>
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
                Savings Amount (RWF)
              </label>

              <input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                required
                className="mb-4 w-full rounded-lg border border-slate-300 p-3"
              />

              <label className="mb-2 block text-sm font-medium">
                Savings Week
              </label>

              <input
                type="date"
                value={week}
                onChange={(e) => setWeek(e.target.value)}
                required
                className="mb-5 w-full rounded-lg border border-slate-300 p-3"
              />

              <button
                type="submit"
                disabled={saving || members.length === 0}
                className="rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving ? "Recording..." : "Record Savings"}
              </button>
            </form>

            {message && (
              <p
                className={`mt-4 text-sm ${
                  messageType === "success"
                    ? "text-emerald-700"
                    : "text-red-600"
                }`}
              >
                {message}
              </p>
            )}

            {members.length === 0 && (
              <p className="mt-3 text-sm text-red-600">
                Register a member before recording savings.
              </p>
            )}
          </div>

          )}
          {/* Savings Records Table */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="mb-5 text-lg font-bold">
              Savings Records
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-slate-50 text-slate-500">
                  <tr>
                    <th className="p-3">Record ID</th>
                    <th className="p-3">Member</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Savings Week</th>
                  </tr>
                </thead>

                <tbody>
                  {savings.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="p-6 text-center text-slate-500"
                      >
                        No savings records available.
                      </td>
                    </tr>
                  ) : (
                    savings.map((item) => {
                      const member = members.find(
                        (person) => person.id === item.member
                      );

                      return (
                        <tr key={item.id} className="border-b">
                          <td className="p-3">{item.id}</td>

                          <td className="p-3 font-medium">
                            {member?.name ?? `Member ${item.member}`}
                          </td>

                          <td className="p-3 font-semibold text-emerald-700">
                            {formatMoney(Number(item.amount))}
                          </td>

                          <td className="p-3">{item.week}</td>
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


