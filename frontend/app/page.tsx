"use client";
import StudentIdentification from "@/components/StudentIdentification";
import { useCallback, useEffect, useState } from "react";
import { apiGet, apiPost } from "../lib/api";

type Group = {
  id: number;
  name: string;
};

type Member = {
  id: number;
  group: number;
  name: string;
};

type Loan = {
  id: number;
  amount: string;
  balance: string;
};

type Analytics = {
  group_id: number;
  group_name: string;
  total_savings: string;
};

export default function Home() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [analytics, setAnalytics] = useState<Analytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [savingGroup, setSavingGroup] = useState(false);
  const [formMessage, setFormMessage] = useState("");

  // Load dashboard data using authenticated GET requests
  const loadDashboard = useCallback(async () => {
    try {
      const [groupData, memberData, loanData, analyticsData] =
        await Promise.all([
          apiGet("/groups/"),
          apiGet("/members/"),
          apiGet("/loans/"),
          apiGet("/analytics/group-savings/"),
        ]);

      setGroups(groupData);
      setMembers(memberData);
      setLoans(loanData);
      setAnalytics(analyticsData);
      setError("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Create a savings group using an authenticated POST request
  async function handleCreateGroup(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!groupName.trim()) {
      setFormMessage("Please enter a group name.");
      return;
    }

    setSavingGroup(true);
    setFormMessage("");

    try {
      await apiPost("/groups/", {
        name: groupName.trim(),
      });

      setGroupName("");
      setShowForm(false);
      setFormMessage("Group created successfully!");

      await loadDashboard();
    } catch (err) {
      setFormMessage(
        err instanceof Error
          ? err.message
          : "Unable to create group."
      );
    } finally {
      setSavingGroup(false);
    }
  }

  const totalSavings = analytics.reduce(
    (total, group) => total + Number(group.total_savings),
    0
  );

  const totalLoans = loans.reduce(
    (total, loan) => total + Number(loan.balance),
    0
  );

  if (loading) {
    return <main className="p-10">Loading dashboard...</main>;
  }

  if (error) {
    return (
      <main className="p-10 text-red-600">
        {error}
        <button
          onClick={loadDashboard}
          className="ml-4 rounded bg-emerald-600 px-4 py-2 text-white"
        >
          Retry
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-800">
      <div className="flex min-h-screen">

        {/* Sidebar */}
        <aside className="hidden w-64 bg-slate-900 p-6 text-white md:block">
          <h1 className="mb-10 text-xl font-bold">
            Community<span className="text-emerald-400">Save</span>
          </h1>

          <nav className="space-y-5">
            <p className="rounded-lg bg-emerald-600 px-4 py-3">
              ▦ Dashboard
            </p>
            <a href="/groups" className="block px-4 py-3 text-slate-300">
              👥 Savings Groups
            </a>
            <a href="/members" className="block px-4 py-3 text-slate-300">
              👤 Members
            </a>
            <a href="/savings" className="block px-4 py-3 text-slate-300">
              💰 Savings
            </a>
            <a href="/loans" className="block px-4 py-3 text-slate-300">
              💳 Loans
            </a>
            <a href="/reports" className="block px-4 py-3 text-slate-300 hover:text-white">
  📊 Reports
</a>
          </nav>
        </aside>

        {/* Main Dashboard */}
        <section className="flex-1 p-5 md:p-8">
          

          <header className="mb-8">
            <h2 className="text-2xl font-bold">Dashboard</h2>
            <p className="text-sm text-slate-500">
              Welcome to your Community Savings Group Manager
            </p>
          </header>

          {/* Statistics */}
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total Groups"
              value={groups.length.toString()}
              icon="👥"
            />

            <StatCard
              title="Total Members"
              value={members.length.toString()}
              icon="🧑"
            />

            <StatCard
              title="Total Savings"
              value={`${totalSavings.toLocaleString()} RWF`}
              icon="💰"
            />

            <StatCard
              title="Outstanding Loans"
              value={`${totalLoans.toLocaleString()} RWF`}
              icon="💳"
            />
          </div>

          {/* Savings Groups */}
          <div className="mt-8 rounded-xl bg-white p-6 shadow-sm">

            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold">Savings Groups</h3>
                <p className="text-sm text-slate-500">
                  Overview of registered savings groups
                </p>
              </div>

              <button
                onClick={() => {
                  setShowForm(!showForm);
                  setFormMessage("");
                }}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                + Create Group
              </button>
            </div>

            {/* Create Group Form */}
            {showForm && (
              <form
                onSubmit={handleCreateGroup}
                className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-5"
              >
                <h4 className="mb-4 font-semibold">
                  Register a New Savings Group
                </h4>

                <label className="mb-2 block text-sm font-medium">
                  Group Name
                </label>

                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Enter savings group name"
                  required
                  className="mb-4 w-full rounded-lg border border-slate-300 bg-white p-3 outline-none focus:border-emerald-500"
                />

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={savingGroup}
                    className="rounded-lg bg-emerald-600 px-5 py-2 text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {savingGroup ? "Saving..." : "Save Group"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setGroupName("");
                      setFormMessage("");
                    }}
                    className="rounded-lg bg-slate-200 px-5 py-2 text-slate-700 hover:bg-slate-300"
                  >
                    Cancel
                  </button>
                </div>

                {formMessage && (
                  <p className="mt-3 text-sm text-red-600">
                    {formMessage}
                  </p>
                )}
              </form>
            )}

            {formMessage && !showForm && (
              <p className="mb-4 text-sm text-emerald-700">
                {formMessage}
              </p>
            )}

            {/* Groups Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-slate-50 text-slate-500">
                  <tr>
                    <th className="p-3">Group Name</th>
                    <th className="p-3">Members</th>
                    <th className="p-3">Total Savings</th>
                  </tr>
                </thead>

                <tbody>
                  {groups.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-6 text-center text-slate-500">
                        No savings groups found.
                      </td>
                    </tr>
                  ) : (
                    groups.map((group) => {
                      const groupSavings = analytics.find(
                        (item) => item.group_id === group.id
                      );

                      const groupMembers = members.filter(
                        (member) => member.group === group.id
                      ).length;

                      return (
                        <tr key={group.id} className="border-b">
                          <td className="p-3 font-medium">
                            <a
                              href={`/groups/${group.id}`}
                              className="text-emerald-700 hover:underline"
                            >
                              {group.name}
                            </a>
                          </td>

                          <td className="p-3">{groupMembers}</td>

                          <td className="p-3">
                            {Number(
                              groupSavings?.total_savings ?? 0
                            ).toLocaleString()} RWF
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
