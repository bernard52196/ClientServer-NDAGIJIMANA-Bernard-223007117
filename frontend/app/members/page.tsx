
"use client";
import StudentIdentification from "@/components/StudentIdentification";
import CommunityLoading from "@/components/CommunityLoading";
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
type PendingRegistration = {
  id: string;
  full_name: string;
  email: string | null;
  requested_group_id: number | null;
  requested_group_name: string | null;
  created_at: string;
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
  // Link Member Account states
 const [linkingMember, setLinkingMember] = useState<number | null>(null);
 const [linkEmail, setLinkEmail] = useState("");
 const [linking, setLinking] = useState(false);
 // Pending registration states
const [pendingRegistrations, setPendingRegistrations] =
  useState<PendingRegistration[]>([]);
const [loadingPending, setLoadingPending] = useState(false);


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
  // Load pending registrations for the Chair
useEffect(() => {
  if (userRole !== "chair") return;

  async function loadPendingRegistrations() {
    setLoadingPending(true);

    try {
      const data = await apiGet("/pending-member-registrations/");
      setPendingRegistrations(data.pending_registrations ?? []);
    } catch (err) {
      console.error("Unable to load pending registrations:", err);
    } finally {
      setLoadingPending(false);
    }
  }

  loadPendingRegistrations();
}, [userRole]);

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
  // Link an existing member to a registered Supabase account
async function handleLinkAccount(e: FormEvent<HTMLFormElement>) {
  e.preventDefault();

  if (linkingMember === null || !linkEmail.trim()) {
    setMessageType("error");
    setMessage("Please enter the registered email address.");
    return;
  }

  setLinking(true);
  setMessage("");

  try {
    await apiPost("/link-member-account/", {
      member_id: linkingMember,
      email: linkEmail.trim(),
    });

    setMessageType("success");
    setMessage("Member account linked successfully!");

    setLinkingMember(null);
    setLinkEmail("");
  } catch (err) {
    setMessageType("error");
    setMessage(
      err instanceof Error ? err.message : "Unable to link account."
    );
  } finally {
    setLinking(false);
  }
}
// Approve registration and create a new member
async function handleApproveRegistration(
  registration: PendingRegistration
) {
  try {
    await apiPost("/link-member-account/", {
      profile_id: registration.id,
    });

    setPendingRegistrations((current) =>
      current.filter((item) => item.id !== registration.id)
    );

    setMessageType("success");
    setMessage(
      `${registration.full_name} has been approved and added to ${
        registration.requested_group_name || "the selected group"
      }.`
    );

    await loadData();
  } catch (err) {
    setMessageType("error");
    setMessage(
      err instanceof Error ? err.message : "Unable to approve registration."
    );
  }
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
              ▦ Dashboard
            </Link>

            <Link
              href="/"
              className="block px-4 py-3 text-slate-300 hover:bg-slate-700"
            >
              👥 Savings Groups
            </Link>

            <p className="rounded-lg bg-emerald-600 px-4 py-3">
              👤 Members
            </p>

            <p className="px-4 py-3 text-slate-300">💰 Savings</p>
            <p className="px-4 py-3 text-slate-300">💳 Loans</p>
            <p className="px-4 py-3 text-slate-300">📊 Reports</p>
          </nav>
        </aside>

        {/* Main Content */}
        <section className="flex-1 p-5 md:p-8">
           

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
              Back to Dashboard
            </Link>
          </header>

          {/* Statistics */}
          <div className="mb-8 grid gap-5 sm:grid-cols-2">
            <StatCard
              title="Total Members"
              value={members.length.toString()}
              icon="👥"
            />

            <StatCard
              title="Registered Groups"
              value={groups.length.toString()}
              icon="🏠"
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
             {/* Link Member Account Form */}
{userRole === "chair" && linkingMember !== null && (
  <form
    onSubmit={handleLinkAccount}
    className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-5"
  >
    <h4 className="mb-3 font-semibold">Link Member Account</h4>

    <p className="mb-3 text-sm text-slate-600">
      Member: {members.find((m) => m.id === linkingMember)?.name}
    </p>

    <label className="mb-2 block text-sm font-medium">
      Registered Email Address
    </label>

    <input
      type="email"
      value={linkEmail}
      onChange={(e) => setLinkEmail(e.target.value)}
      placeholder="Enter the member's registered email"
      required
      className="mb-4 w-full rounded-lg border border-slate-300 bg-white p-3"
    />

    <div className="flex gap-3">
      <button
        type="submit"
        disabled={linking}
        className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {linking ? "Linking..." : "Link Account"}
      </button>

      <button
        type="button"
        onClick={() => {
          setLinkingMember(null);
          setLinkEmail("");
        }}
        disabled={linking}
        className="rounded-lg bg-slate-200 px-5 py-2 text-slate-700"
      >
        Cancel
      </button>
    </div>
  </form>
)}
{/* Pending Member Registrations */}
{userRole === "chair" && (
  <div className="mb-8 rounded-lg border border-amber-200 bg-amber-50 p-5">
    <div className="mb-4 flex items-center justify-between">
      <h3 className="text-lg font-bold text-slate-800">
        Pending Member Registrations
      </h3>
      <span className="rounded-full bg-amber-200 px-3 py-1 text-sm font-semibold text-amber-800">
        {pendingRegistrations.length} Pending
      </span>
    </div>

    {loadingPending ? (
      <p>Loading registrations...</p>
    ) : pendingRegistrations.length === 0 ? (
      <p>No pending registrations found.</p>
    ) : (
      <div className="space-y-4">
        {pendingRegistrations.map((registration) => (
          <div key={registration.id} className="rounded-lg border bg-white p-4">
            <h4 className="font-semibold">{registration.full_name}</h4>

            <p className="text-sm text-slate-600">
              {registration.email || "No email available"}
            </p>

            <p className="my-3 text-sm">
              <span className="font-semibold">Requested savings group: </span>
              <span className="text-emerald-700">
                {registration.requested_group_name || "No group selected"}
              </span>
            </p>

            <button
              type="button"
              onClick={() => handleApproveRegistration(registration)}
              disabled={!registration.requested_group_id}
              className="rounded-lg bg-emerald-600 px-5 py-2 text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              Approve and Create Member
            </button>
          </div>
        ))}
      </div>
    )}
  </div>
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
                              <div className="flex flex-wrap gap-2">
  <button
    type="button"
    onClick={() => startEditing(member)}
    className="rounded-lg bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700"
  >
    Edit
  </button>

  <button
    type="button"
    onClick={() => {
      setLinkingMember(member.id);
      setLinkEmail("");
      setMessage("");
    }}
    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-white hover:bg-emerald-700"
  >
    Link Account
  </button>
</div>
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


  




