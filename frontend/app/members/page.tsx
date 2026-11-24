
"use client";
import StudentIdentification from "@/components/StudentIdentification";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { apiGet, apiPost, apiPatch } from "@/lib/api";
import { supabase } from "@/lib/supabase";



type Group = {
  id: number;
  name: string;
};

type Member = {
  id: number;
  group: number;
  name: string;
};

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [userRole, setUserRole] = useState<"chair" | "member" | null>(null);

  // Register Member states
  const [memberName, setMemberName] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [saving, setSaving] = useState(false);

  // Feedback states
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success"
  );

  // Edit Member states
  const [editingMember, setEditingMember] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editGroup, setEditGroup] = useState("");
  const [updating, setUpdating] = useState(false);

  // Load the logged-in user role from Supabase
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

  // Load members and groups
  const loadData = useCallback(async () => {
    try {
      const [memberData, groupData] = await Promise.all([
        apiGet("/members/"),
        apiGet("/groups/"),
      ]);

      setMembers(memberData);
      setGroups(groupData);
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

  // Register a new member
  async function handleCreateMember(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!memberName.trim() || !selectedGroup) {
      setMessageType("error");
      setMessage("Please enter a member name and select a group.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      await apiPost("/members/", {
        name: memberName.trim(),
        group: Number(selectedGroup),
      });

      setMemberName("");
      setSelectedGroup("");
      setShowForm(false);

      setMessageType("success");
      setMessage("Member registered successfully!");

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

  // Start editing a member
  function startEditing(member: Member) {
    setEditingMember(member.id);
    setEditName(member.name);
    setEditGroup(member.group.toString());
    setMessage("");
  }

  // Cancel editing
  function cancelEditing() {
    setEditingMember(null);
    setEditName("");
    setEditGroup("");
  }

  // Update an existing member
  async function handleUpdateMember(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (
      editingMember === null ||
      !editName.trim() ||
      !editGroup
    ) {
      setMessageType("error");
      setMessage("Please enter a name and select a group.");
      return;
    }

    setUpdating(true);
    setMessage("");

    try {
      await apiPatch("/members/", {
        id: editingMember,
        name: editName.trim(),
        group: Number(editGroup),
      });

      cancelEditing();

      setMessageType("success");
      setMessage("Member updated successfully!");

      await loadData();
    } catch (err) {
      setMessageType("error");
      setMessage(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return <main className="p-10">Loading members...</main>;
  }

  if (error) {
    return (
      <main className="p-10 text-red-600">
        {error}
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
            <Link
              href="/"
              className="block rounded-lg px-4 py-3 text-slate-300 hover:bg-slate-700"
            >
              â–¦ Dashboard
            </Link>

            <Link
              href="/"
              className="block px-4 py-3 text-slate-300 hover:bg-slate-700"
            >
              ðŸ‘¥ Savings Groups
            </Link>

            <p className="rounded-lg bg-emerald-600 px-4 py-3">
              ðŸ‘¤ Members
            </p>

            <p className="px-4 py-3 text-slate-300">ðŸ’° Savings</p>
            <p className="px-4 py-3 text-slate-300">ðŸ’³ Loans</p>
            <p className="px-4 py-3 text-slate-300">ðŸ“Š Reports</p>
          </nav>
        </aside>

        {/* Main Content */}
        <section className="flex-1 p-5 md:p-8">
           <StudentIdentification />

          <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">Member Management</h2>
              <p className="text-sm text-slate-500">
                Register and manage savings group members
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
              title="Total Members"
              value={members.length.toString()}
              icon="ðŸ‘¥"
            />

            <StatCard
              title="Registered Groups"
              value={groups.length.toString()}
              icon="ðŸ˜ï¸"
            />
          </div>

          {/* Members Management */}
          <div className="rounded-xl bg-white p-6 shadow-sm">

            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold">Registered Members</h3>
                <p className="text-sm text-slate-500">
                  Overview of all savings group members
                </p>
              </div>

              {userRole === "chair" && (
                <button
                  onClick={() => {
                    setShowForm(!showForm);
                    setMessage("");
                  }}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  + Register Member
                </button>
              )}
            </div>

            {/* Register Member Form */}
            {userRole === "chair" && showForm && (
              <form
                onSubmit={handleCreateMember}
                className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-5"
              >
                <h4 className="mb-4 font-semibold">
                  Register a New Member
                </h4>

                <label className="mb-2 block text-sm font-medium">
                  Member Name
                </label>

                <input
                  type="text"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  placeholder="Enter full member name"
                  required
                  className="mb-4 w-full rounded-lg border border-slate-300 bg-white p-3 outline-none focus:border-emerald-500"
                />

                <label className="mb-2 block text-sm font-medium">
                  Select Savings Group
                </label>

                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  required
                  className="mb-4 w-full rounded-lg border border-slate-300 bg-white p-3 outline-none focus:border-emerald-500"
                >
                  <option value="">Choose a savings group</option>

                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-emerald-600 px-5 py-2 text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {saving ? "Registering..." : "Save Member"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setMemberName("");
                      setSelectedGroup("");
                      setMessage("");
                    }}
                    className="rounded-lg bg-slate-200 px-5 py-2 text-slate-700 hover:bg-slate-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Feedback Message */}
            {message && (
              <p
                className={`mb-4 text-sm ${
                  messageType === "success"
                    ? "text-emerald-700"
                    : "text-red-600"
                }`}
              >
                {message}
              </p>
            )}

            {/* Members Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-slate-50 text-slate-500">
                  <tr>
                    <th className="p-3">Member ID</th>
                    <th className="p-3">Member Name</th>
                    <th className="p-3">Savings Group</th>
                    {userRole === "chair" && (
                    <th className="p-3">Actions</th>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {members.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="p-6 text-center text-slate-500"
                      >
                        No members registered yet.
                      </td>
                    </tr>
                  ) : (
                    members.map((member) => {
                      const group = groups.find(
                        (item) => item.id === member.group
                      );

                      const isEditing = editingMember === member.id;

                      // Show editing form for selected member
                      if (isEditing && userRole === "chair") {
                        return (
                          <tr key={member.id} className="border-b">
                            <td className="p-3">{member.id}</td>

                            <td colSpan={3} className="p-3">
                              <form
                                onSubmit={handleUpdateMember}
                                className="flex flex-wrap items-center gap-3"
                              >
                                <input
                                  type="text"
                                  value={editName}
                                  onChange={(e) =>
                                    setEditName(e.target.value)
                                  }
                                  placeholder="Member name"
                                  required
                                  className="min-w-40 rounded-lg border border-slate-300 p-2"
                                />

                                <select
                                  value={editGroup}
                                  onChange={(e) =>
                                    setEditGroup(e.target.value)
                                  }
                                  required
                                  className="min-w-40 rounded-lg border border-slate-300 p-2"
                                >
                                  <option value="">
                                    Select group
                                  </option>

                                  {groups.map((item) => (
                                    <option
                                      key={item.id}
                                      value={item.id}
                                    >
                                      {item.name}
                                    </option>
                                  ))}
                                </select>

                                <button
                                  type="submit"
                                  disabled={updating}
                                  className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
                                >
                                  {updating ? "Saving..." : "Save"}
                                </button>

                                <button
                                  type="button"
                                  onClick={cancelEditing}
                                  disabled={updating}
                                  className="rounded-lg bg-slate-500 px-4 py-2 text-white hover:bg-slate-600"
                                >
                                  Cancel
                                </button>
                              </form>
                            </td>
                          </tr>
                        );
                      }

                      // Normal member row
                      return (
                        <tr key={member.id} className="border-b">
                          <td className="p-3">{member.id}</td>

                          <td className="p-3 font-medium">
                            {member.name}
                          </td>

                          <td className="p-3">
                            {group?.name ?? "Unknown Group"}
                          </td>

                          {userRole === "chair" && (
                            <td className="p-3">
                              <button
                                type="button"
                                onClick={() => startEditing(member)}
                              className="rounded-lg bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700"
                            >
                                Edit
                              </button>
                            </td>
                          )}
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





