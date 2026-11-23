
"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import { supabase } from "@/lib/supabase";

type Group = {
  id: number;
  name: string;
};

type Member = {
  id: number;
  group: number;
};

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [name, setName] = useState("");

  const [userRole, setUserRole] = useState<"chair" | "member" | null>(null);

  const [editingGroup, setEditingGroup] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load the logged-in user's role
  useEffect(() => {
    async function loadUserRole() {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setUserRole("member");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      setUserRole(
        !error && data?.role === "chair" ? "chair" : "member"
      );
    }

    void loadUserRole();
  }, []);

  // Load groups and members
  const loadGroups = useCallback(async () => {
    setLoading(true);

    try {
      const [groupData, memberData] = await Promise.all([
        apiGet("/groups/"),
        apiGet("/members/"),
      ]);

      setGroups(Array.isArray(groupData) ? groupData : []);
      setMembers(Array.isArray(memberData) ? memberData : []);
      setError("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load groups."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadGroups();
  }, [loadGroups]);

  // Create a group
  async function createGroup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Please enter a group name.");
      return;
    }

    setSaving(true);

    try {
      await apiPost("/groups/", { name: name.trim() });
      setName("");
      setSuccess("Savings group created successfully.");
      await loadGroups();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to create group."
      );
    } finally {
      setSaving(false);
    }
  }

  // Start editing a group
  function startEditing(group: Group) {
    setEditingGroup(group.id);
    setEditName(group.name);
    setError("");
    setSuccess("");
  }

  // Cancel editing
  function cancelEditing() {
    setEditingGroup(null);
    setEditName("");
  }

  // Save group changes
  async function updateGroup(groupId: number) {
    setError("");
    setSuccess("");

    if (!editName.trim()) {
      setError("Group name cannot be empty.");
      return;
    }

    setUpdating(true);

    try {
      await apiPatch("/groups/", {
        id: groupId,
        name: editName.trim(),
      });

      setEditingGroup(null);
      setEditName("");
      setSuccess("Group updated successfully.");
      await loadGroups();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update group."
      );
    } finally {
      setUpdating(false);
    }
  }

  // Delete a group
  async function deleteGroup(group: Group) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${group.name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await apiDelete("/groups/", { id: group.id });
      setSuccess("Group deleted successfully.");
      await loadGroups();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete group."
      );
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6 text-slate-800 md:p-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Savings Groups</h1>
          <p className="mt-2 text-slate-500">
            Manage and view community savings groups.
          </p>
        </div>

        <a
          href="/"
          className="rounded-lg bg-slate-900 px-5 py-3 text-white"
        >
          ← Dashboard
        </a>
      </header>

      {error && (
        <div className="mb-5 rounded-lg bg-red-100 p-4 text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-5 rounded-lg bg-emerald-100 p-4 text-emerald-700">
          {success}
        </div>
      )}

      <section className="mb-8 grid gap-5 sm:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Total Groups</p>
          <h2 className="mt-2 text-3xl font-bold">{groups.length}</h2>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Total Members</p>
          <h2 className="mt-2 text-3xl font-bold">{members.length}</h2>
        </div>
      </section>

      {userRole === "chair" && (
        <section className="mb-8 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-bold">
            Create a Savings Group
          </h2>

          <form onSubmit={createGroup} className="flex flex-wrap gap-3">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter group name"
              className="min-w-0 flex-1 rounded-lg border border-slate-300 p-3"
            />

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-emerald-600 px-6 py-3 text-white disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create Group"}
            </button>
          </form>

          <p className="mt-3 text-sm text-slate-500">
            Only Chair accounts can create groups.
          </p>
        </section>
      )}

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold">All Savings Groups</h2>

          <button
            onClick={() => void loadGroups()}
            className="rounded-lg border px-4 py-2 hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <p className="text-slate-500">Loading groups...</p>
        ) : groups.length === 0 ? (
          <p className="text-slate-500">No savings groups found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b bg-slate-50 text-sm text-slate-500">
                  <th className="p-3">Group ID</th>
                  <th className="p-3">Group Name</th>
                  <th className="p-3">Members</th>
                  <th className="p-3">View Details</th>
                  {userRole === "chair" && (
                    <th className="p-3">Actions</th>
                  )}
                </tr>
              </thead>

              <tbody>
                {groups.map((group) => (
                  <tr key={group.id} className="border-b">
                    <td className="p-3">{group.id}</td>

                    <td className="p-3 font-medium">
                      {editingGroup === group.id ? (
                        <input
                          value={editName}
                          onChange={(event) =>
                            setEditName(event.target.value)
                          }
                          className="w-full rounded-lg border border-slate-300 p-2"
                          placeholder="Enter group name"
                        />
                      ) : (
                        group.name
                      )}
                    </td>

                    <td className="p-3">
                      {
                        members.filter(
                          (member) => member.group === group.id
                        ).length
                      }
                    </td>

                    <td className="p-3">
                      <a
                        href={`/groups/${group.id}`}
                        className="font-medium text-emerald-700 hover:underline"
                      >
                        View Details →
                      </a>
                    </td>

                    {userRole === "chair" && (
                      <td className="p-3">
                        <div className="flex flex-wrap gap-2">
                          {editingGroup === group.id ? (
                            <>
                              <button
                                onClick={() => void updateGroup(group.id)}
                                disabled={updating}
                                className="rounded-lg bg-emerald-600 px-3 py-2 text-white disabled:opacity-50"
                              >
                                {updating ? "Saving..." : "Save"}
                              </button>

                              <button
                                onClick={cancelEditing}
                                disabled={updating}
                                className="rounded-lg bg-slate-200 px-3 py-2 text-slate-800"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEditing(group)}
                                className="rounded-lg bg-blue-600 px-3 py-2 text-white"
                              >
                                Edit
                              </button>

                              <button
                                onClick={() => void deleteGroup(group)}
                                className="rounded-lg bg-red-600 px-3 py-2 text-white"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
