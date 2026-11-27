"use client";
import StudentIdentification from "@/components/StudentIdentification";
import CommunityLoading from "@/components/CommunityLoading";
import { useCallback, useEffect, useState } from "react";
import { apiGet } from "@/lib/api";

type Analytics = {
  group_id: number;
  group_name: string;
  total_savings: string;
};

export default function ReportsPage() {
  const [analytics, setAnalytics] = useState<Analytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet("/analytics/group-savings/");
      setAnalytics(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load reports."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  const totalSavings = analytics.reduce(
    (total, item) => total + Number(item.total_savings),
    0
  );

  const maxSavings = Math.max(
    0,
    ...analytics.map((item) => Number(item.total_savings))
  );

  if (loading) {
    return <CommunityLoading message="LOADING YOUR DASHBOARD..." />;
  }

  return (
    <div className="min-h-screen dashboard-photo-bg text-slate-800 md:flex">
      <aside className="w-full bg-slate-900 p-6 text-white md:min-h-screen md:w-64">
        <h1 className="mb-2 text-2xl font-bold">CommunitySave</h1>
        <p className="mb-8 text-sm text-slate-400">
          Community Savings Manager
        </p>

        <nav className="space-y-3">
          <a href="/" className="block px-4 py-3 text-slate-300">Dashboard</a>
          <a href="/groups" className="block px-4 py-3 text-slate-300">Savings Groups</a>
          <a href="/members" className="block px-4 py-3 text-slate-300">Members</a>
          <a href="/savings" className="block px-4 py-3 text-slate-300">Savings</a>
          <a href="/loans" className="block px-4 py-3 text-slate-300">Loans</a>
          <a href="/reports" className="block rounded-lg bg-emerald-600 px-4 py-3">Reports</a>
        </nav>
      </aside>

      <main className="flex-1 p-6 md:p-10">
        
        <div className="mb-8">
          <h2 className="text-3xl font-bold">Reports & Analytics</h2>
          <p className="mt-2 text-slate-500">
            Overview of savings across all community groups.
          </p>
        </div>

        {loading && (
          <p className="rounded-xl bg-white p-6 shadow-sm">
            Loading reports...
          </p>
        )}

        {error && (
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="mb-4 text-red-600">{error}</p>
            <button
              onClick={() => void loadReports()}
              className="rounded-lg bg-emerald-600 px-5 py-2 text-white"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="mb-8 grid gap-5 md:grid-cols-2">
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <p className="text-sm text-slate-500">Total Group Savings</p>
                <h3 className="mt-2 text-3xl font-bold text-emerald-600">
                  {totalSavings.toLocaleString()} RWF
                </h3>
              </div>

              <div className="rounded-xl bg-white p-6 shadow-sm">
                <p className="text-sm text-slate-500">Number of Groups</p>
                <h3 className="mt-2 text-3xl font-bold">
                  {analytics.length}
                </h3>
              </div>
            </div>

            <section className="mb-8 rounded-xl bg-white p-6 shadow-sm">
              <h3 className="mb-5 text-xl font-bold">Savings by Group</h3>

              {analytics.length === 0 ? (
                <p className="text-slate-500">No savings reports available yet.</p>
              ) : (
                <div className="space-y-5">
                  {analytics.map((item) => {
                    const amount = Number(item.total_savings);
                    const percentage =
                      maxSavings > 0 ? (amount / maxSavings) * 100 : 0;

                    return (
                      <div key={item.group_id}>
                        <div className="mb-2 flex justify-between gap-4">
                          <span className="font-medium">{item.group_name}</span>
                          <span className="font-semibold">
                            {amount.toLocaleString()} RWF
                          </span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="rounded-xl bg-white p-6 shadow-sm">
              <h3 className="mb-5 text-xl font-bold">Group Savings Details</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b text-sm text-slate-500">
                      <th className="p-3">Group</th>
                      <th className="p-3">Group ID</th>
                      <th className="p-3">Total Savings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.map((item) => (
                      <tr key={item.group_id} className="border-b">
                        <td className="p-3 font-medium">{item.group_name}</td>
                        <td className="p-3">{item.group_id}</td>
                        <td className="p-3">
                          {Number(item.total_savings).toLocaleString()} RWF
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
         <StudentIdentification />
      </main>
    </div>
  );
}

