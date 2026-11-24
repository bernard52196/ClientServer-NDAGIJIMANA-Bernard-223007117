"use client";
import StudentIdentification from "@/components/StudentIdentification";
import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiGet } from "@/lib/api";

type Group = {
  id: number;
  name: string;
};

type Member = {
  id: number;
  group: number;
  name: string;
};

type Saving = {
  id: number;
  member: number;
  amount: string;
  week: string;
};

type Loan = {
  id: number;
  member: number;
  amount: string;
  balance: string;
};

function GroupDetailsContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const groupId = Number(params.id);

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [savings, setSavings] = useState<Saving[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadGroupDetails() {
      try {
        const [groupData, memberData, savingData, loanData] =
          await Promise.all([
            apiGet("/groups/"),
            apiGet("/members/"),
            apiGet("/savings/"),
            apiGet("/loans/"),
          ]);

        const selectedGroup = groupData.find(
          (item: Group) => item.id === groupId
        );

        if (!selectedGroup) {
          throw new Error("Group not found.");
        }

        setGroup(selectedGroup);
        setMembers(
          memberData.filter((item: Member) => item.group === groupId)
        );
        setSavings(savingData);
        setLoans(loanData);
        setError("");
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong."
        );
      } finally {
        setLoading(false);
      }
    }

    if (Number.isFinite(groupId) && groupId > 0) {
      loadGroupDetails();
    } else {
      setError("Invalid group ID.");
      setLoading(false);
    }
  }, [groupId]);

  const memberIds = members.map((member) => member.id);

  const groupSavings = savings.filter((saving) =>
    memberIds.includes(saving.member)
  );

  const groupLoans = loans.filter((loan) =>
    memberIds.includes(loan.member)
  );

  const totalSavings = groupSavings.reduce(
    (total, saving) => total + Number(saving.amount),
    0
  );

  const totalLoans = groupLoans.reduce(
    (total, loan) => total + Number(loan.balance),
    0
  );

  if (loading) {
    return <main className="p-10">Loading group details...</main>;
  }

  if (error || !group) {
    return (
      <main className="min-h-screen bg-slate-100 p-8">
        <p className="text-red-600">{error || "Group not found."}</p>
        <button
          onClick={() => router.push("/")}
          className="mt-4 rounded-lg bg-emerald-600 px-5 py-2 text-white"
        >
          Back to Dashboard
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-5 text-slate-800 md:p-8">
      <button
        onClick={() => router.push("/")}
        className="mb-6 text-emerald-700 hover:underline"
      >
        ← Back to Dashboard
      </button>

      <header className="mb-8">
          
        <p className="text-sm text-slate-500">Savings Group Details</p>
        <h1 className="mt-2 text-3xl font-bold">{group.name}</h1>
        <p className="mt-2 text-slate-500">Group ID: {group.id}</p>
      </header>

      <section className="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Members"
          value={members.length.toString()}
        />
        <StatCard
          title="Total Savings"
          value={`${totalSavings.toLocaleString()} RWF`}
        />
        <StatCard
          title="Outstanding Loans"
          value={`${totalLoans.toLocaleString()} RWF`}
        />
        <StatCard
          title="Available Members"
          value={members.length.toString()}
        />
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-xl font-bold">Group Members</h2>

        {members.length === 0 ? (
          <p className="text-slate-500">
            No members have been registered in this group yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-slate-50 text-slate-500">
                <tr>
                  <th className="p-3">Member Name</th>
                  <th className="p-3">Total Savings</th>
                  <th className="p-3">Outstanding Loan</th>
                </tr>
              </thead>

              <tbody>
                {members.map((member) => {
                  const memberSavings = savings
                    .filter((item) => item.member === member.id)
                    .reduce(
                      (total, item) => total + Number(item.amount),
                      0
                    );

                  const memberLoans = loans
                    .filter((item) => item.member === member.id)
                    .reduce(
                      (total, item) => total + Number(item.balance),
                      0
                    );

                  return (
                    <tr key={member.id} className="border-b">
                      <td className="p-3 font-medium">{member.name}</td>
                      <td className="p-3">
                        {memberSavings.toLocaleString()} RWF
                      </td>
                      <td className="p-3">
                        {memberLoans.toLocaleString()} RWF
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
         <StudentIdentification />
    </main>
  );
}

function StatCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>
      <h2 className="mt-2 text-2xl font-bold">{value}</h2>
    </div>
  );
}

export default function GroupDetailsPage() {
  return (
    <Suspense
      fallback={
        <main className="p-10">Loading group details...</main>
      }
    >
      <GroupDetailsContent />
    </Suspense>
  );
}
