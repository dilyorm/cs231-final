import { useEffect, useState } from "react";
import { ShieldCheck, PenLine, Eye, Trash2, RefreshCw } from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "../../contexts/AuthContext";
import type { User } from "../../types";

const ROLES = ["admin", "contributor", "viewer"] as const;

const ROLE_STYLE: Record<string, string> = {
  admin: "text-indigo-700 bg-indigo-50 border-indigo-200",
  contributor: "text-emerald-700 bg-emerald-50 border-emerald-200",
  viewer: "text-gray-600 bg-gray-50 border-gray-200",
};

const ROLE_ICON: Record<string, typeof Eye> = {
  admin: ShieldCheck,
  contributor: PenLine,
  viewer: Eye,
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const { user: me } = useAuth();

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await api.listUsers();
      setUsers(data);
    } finally {
      setLoading(false);
    }
  }

  async function changeRole(userId: number, role: string) {
    setUpdating(userId);
    try {
      const updated = await api.setUserRole(userId, role);
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    } catch (err: any) {
      alert(err.message ?? "Failed to update role");
    } finally {
      setUpdating(null);
    }
  }

  async function remove(userId: number, username: string) {
    if (!confirm(`Delete user "${username}"? This cannot be undone.`)) return;
    try {
      await api.deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err: any) {
      alert(err.message ?? "Failed to delete user");
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-500 text-sm mt-1">{users.length} registered users</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No users yet.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">User</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Role</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Joined</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => {
                const Icon = ROLE_ICON[u.role] ?? Eye;
                const isMe = u.id === me?.id;
                return (
                  <tr key={u.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                          {u.username[0].toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{u.username}</span>
                        {isMe && (
                          <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">(you)</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {isMe ? (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${ROLE_STYLE[u.role]}`}>
                          <Icon className="w-3 h-3" />
                          {u.role}
                        </span>
                      ) : (
                        <select
                          value={u.role}
                          disabled={updating === u.id}
                          onChange={(e) => changeRole(u.id, e.target.value)}
                          className={`text-xs font-semibold px-2 py-1 rounded-full border cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-300 ${ROLE_STYLE[u.role]} disabled:opacity-60`}
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-400">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {!isMe && (
                        <button
                          onClick={() => remove(u.id, u.username)}
                          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete user"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-4 text-xs text-gray-400">
        Change a user's role by selecting from the dropdown. Admins have full access. Contributors can add and edit their own questions (subject to AI review). Viewers can only browse approved questions.
      </div>
    </div>
  );
}
