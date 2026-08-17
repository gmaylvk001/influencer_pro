import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { Search, Loader2, MoreVertical, ShieldAlert, ShieldCheck, Eye, Edit2, LogIn, Trash2, PowerOff, Download, CheckSquare, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { admin } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { useNavigate } from "react-router";
import AdminUserEdit from "./AdminUserEdit";
import AdminUserDetails from "./AdminUserDetails";

export default function AdminUsers() {
  const { accountType, impersonate } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [updatingId, setUpdatingId] = useState(null);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  
  const [actionMenuId, setActionMenuId] = useState(null);
  const [editingUserId, setEditingUserId] = useState(null);
  const [viewingUserId, setViewingUserId] = useState(null);
  const [selectedUserIds, setSelectedUserIds] = useState(new Set());

  function load() {
    setLoading(true);
    admin.getUsers({ search, accountType: filterType, page })
      .then((data) => {
        setUsers(data.users || []);
        setTotalPages(data.totalPages || 1);
        setTotalUsers(data.total || 0);
      })
      .catch((err) => {
        toast.error("Failed to load users.");
        console.error(err);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (accountType === "admin") {
      const timer = setTimeout(load, 300);
      return () => clearTimeout(timer);
    }
  }, [accountType, search, filterType, page]);

  useEffect(() => {
    setPage(1);
  }, [search, filterType]);

  // Click outside to close action menu
  useEffect(() => {
    function handleClickOutside() {
      setActionMenuId(null);
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  if (accountType !== "admin") {
    return (
      <div className="surface-panel p-12 text-center">
        <p className="font-display text-lg">Admins only</p>
      </div>
    );
  }

  async function toggleSuspension(id, currentStatus) {
    if (accountType !== "admin") return;
    const confirmMessage = currentStatus 
      ? "Are you sure you want to unsuspend this user?" 
      : "Are you sure you want to suspend this user? They will not be able to log in.";
    if (!window.confirm(confirmMessage)) return;
    setUpdatingId(id);
    try {
      await admin.toggleSuspension(id, !currentStatus);
      toast.success(currentStatus ? "User unsuspended." : "User suspended.");
      load();
    } catch (err) {
      toast.error(err.message || "Failed to update user status.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleImpersonate(id) {
    if (!window.confirm("Are you sure you want to log in as this user?")) return;
    setUpdatingId(id);
    try {
      const res = await admin.impersonateUser(id);
      impersonate(res.token, res.user);
      toast.success("Impersonation successful.");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.message || "Impersonation failed.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("CRITICAL: Are you sure you want to permanently delete this user? This action cannot be undone and will delete all their data.")) return;
    setUpdatingId(id);
    try {
      await admin.deleteUser(id);
      toast.success("User deleted successfully.");
      load();
    } catch (err) {
      toast.error(err.message || "Failed to delete user.");
    } finally {
      setUpdatingId(null);
    }
  }

  function handleExportCSV() {
    if (users.length === 0) return toast.error("No users to export");
    const headers = ["ID,Full Name,Email,Account Type,Suspended,Joined\n"];
    const rows = users.map(u => `"${u.id}","${u.fullName || ''}","${u.email}","${u.accountType}","${u.isSuspended}","${u.createdAt}"`);
    const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `influbrand_users_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV Downloaded!");
  }

  function toggleAllSelection() {
    if (selectedUserIds.size === users.length) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(users.map(u => u.id)));
    }
  }

  function toggleSelection(id) {
    const newSet = new Set(selectedUserIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedUserIds(newSet);
  }

  async function handleBulkSuspend() {
    if (selectedUserIds.size === 0) return;
    if (!window.confirm(`Are you sure you want to toggle suspension for ${selectedUserIds.size} users?`)) return;
    
    setUpdatingId("bulk");
    let count = 0;
    try {
      for (const id of selectedUserIds) {
        const user = users.find(u => u.id === id);
        if (user && user.accountType !== "admin") {
          await admin.toggleSuspension(id, !user.isSuspended);
          count++;
        }
      }
      toast.success(`Successfully updated ${count} users.`);
      setSelectedUserIds(new Set());
      load();
    } catch (err) {
      toast.error("Failed to complete bulk action.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleBulkDelete() {
    if (selectedUserIds.size === 0) return;
    if (!window.confirm(`CRITICAL: Are you sure you want to PERMANENTLY delete ${selectedUserIds.size} users? This action cannot be undone.`)) return;
    
    setUpdatingId("bulk-delete");
    let count = 0;
    try {
      for (const id of selectedUserIds) {
        const user = users.find(u => u.id === id);
        if (user && user.accountType !== "admin") {
          await admin.deleteUser(id);
          count++;
        }
      }
      toast.success(`Successfully deleted ${count} users.`);
      setSelectedUserIds(new Set());
      load();
    } catch (err) {
      toast.error("Failed to complete bulk delete.");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-8 pb-32">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight">User Management</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage all brands and creators on the platform.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card"
            />
          </div>
          <Button onClick={handleExportCSV} variant="outline" className="gap-2 shrink-0 border-border hover:bg-muted">
            <Download className="size-4" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-border pb-px">
        <div className="flex items-center gap-2">
          {["all", "brand", "influencer"].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`capitalize px-4 py-2 text-sm font-semibold transition-colors border-b-2 ${
                filterType === type ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              {type === "all" ? "All Users" : type + "s"}
            </button>
          ))}
        </div>
        
        {selectedUserIds.size > 0 && (
          <div className="flex items-center gap-3 px-4 py-1.5 animate-in fade-in slide-in-from-right-4 duration-300 bg-muted/50 rounded-lg">
            <span className="text-sm font-semibold">{selectedUserIds.size} selected</span>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleBulkSuspend}
              disabled={updatingId === "bulk" || updatingId === "bulk-delete"}
              className="gap-2 h-7 px-3 text-xs border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
            >
              {updatingId === "bulk" ? <Loader2 className="size-3 animate-spin" /> : <PowerOff className="size-3" />}
              Toggle Suspend
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleBulkDelete}
              disabled={updatingId === "bulk" || updatingId === "bulk-delete"}
              className="gap-2 h-7 px-3 text-xs border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
            >
              {updatingId === "bulk-delete" ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />}
              Delete
            </Button>
          </div>
        )}
      </div>

      <div className="surface-panel overflow-hidden relative border border-border/50 shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-b from-card/50 to-transparent pointer-events-none" />
        <div className="overflow-x-auto min-h-[400px] relative z-10">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground sticky top-0 backdrop-blur-md">
              <tr>
                <th className="px-6 py-4 w-12">
                  <input 
                    type="checkbox" 
                    className="rounded border-border bg-card text-primary focus:ring-primary/20 accent-primary cursor-pointer w-4 h-4"
                    checked={users.length > 0 && selectedUserIds.size === users.length}
                    onChange={toggleAllSelection}
                  />
                </th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td colSpan="4" className="py-12 text-center text-muted-foreground">
                    <Loader2 className="mx-auto size-6 animate-spin mb-2 opacity-50" />
                    <p>Loading users...</p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-12 text-center text-muted-foreground">
                    <p>No users found.</p>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className={`transition-colors group ${selectedUserIds.has(user.id) ? 'bg-primary/5' : 'hover:bg-muted/50'}`}>
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox" 
                        className="rounded border-border bg-card text-primary focus:ring-primary/20 accent-primary cursor-pointer w-4 h-4"
                        checked={selectedUserIds.has(user.id)}
                        onChange={() => toggleSelection(user.id)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + user.email}
                          alt={user.fullName}
                          className={`size-10 rounded-full object-cover border border-border ${user.isSuspended ? "opacity-50 grayscale" : ""}`}
                        />
                        <div>
                          <p className={`font-bold ${user.isSuspended ? "text-muted-foreground line-through decoration-muted-foreground/50" : "text-foreground"}`}>
                            {user.fullName || "Unnamed User"}
                          </p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="capitalize font-medium text-muted-foreground">
                        {user.accountType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.isSuspended ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-destructive/20 bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive">
                          <ShieldAlert className="size-3.5" /> Suspended
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-green-500/20 bg-green-500/10 px-2.5 py-1 text-xs font-semibold text-green-600 dark:text-green-400">
                          <ShieldCheck className="size-3.5" /> Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {updatingId === user.id ? (
                        <div className="flex justify-end pr-4">
                          <Loader2 className="size-4 animate-spin text-muted-foreground" />
                        </div>
                      ) : (
                        <div className="relative inline-block text-left">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setActionMenuId(actionMenuId === user.id ? null : user.id);
                            }}
                            className="p-2 rounded-full hover:bg-border/50 text-muted-foreground transition-colors"
                          >
                            <MoreVertical className="size-4" />
                          </button>
                          {actionMenuId === user.id && (
                            <div className="absolute right-0 mt-1 w-48 rounded-xl border border-border bg-card shadow-lg z-50 overflow-hidden text-left animate-in fade-in zoom-in-95 duration-100">
                              <div className="py-1">
                                <button onClick={() => setViewingUserId(user.id)} className="w-full px-4 py-2 text-sm text-left hover:bg-muted flex items-center gap-2">
                                  <Eye className="size-4 text-muted-foreground" /> View Details
                                </button>
                                <button onClick={() => setEditingUserId(user.id)} className="w-full px-4 py-2 text-sm text-left hover:bg-muted flex items-center gap-2">
                                  <Edit2 className="size-4 text-muted-foreground" /> Edit Info
                                </button>
                                <button onClick={() => handleImpersonate(user.id)} className="w-full px-4 py-2 text-sm text-left hover:bg-muted flex items-center gap-2">
                                  <LogIn className="size-4 text-muted-foreground" /> Impersonate
                                </button>
                                <div className="h-px bg-border my-1" />
                                <button 
                                  onClick={() => toggleSuspension(user.id, user.isSuspended)} 
                                  className="w-full px-4 py-2 text-sm text-left hover:bg-muted flex items-center gap-2"
                                >
                                  <PowerOff className="size-4 text-muted-foreground" /> 
                                  {user.isSuspended ? "Unsuspend" : "Suspend"}
                                </button>
                                <button 
                                  onClick={() => handleDelete(user.id)} 
                                  className="w-full px-4 py-2 text-sm text-left hover:bg-destructive/10 text-destructive flex items-center gap-2"
                                >
                                  <Trash2 className="size-4" /> Delete Permanently
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border pt-4">
          <p className="text-sm text-muted-foreground">
            Showing page {page} of {totalPages} <span className="hidden sm:inline">({totalUsers} total users)</span>
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="gap-1"
            >
              <ChevronLeft className="size-4" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="gap-1"
            >
              Next <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
      
      {editingUserId && (
        <AdminUserEdit 
          userId={editingUserId} 
          onClose={() => setEditingUserId(null)} 
          onUpdated={load} 
        />
      )}
      
      {viewingUserId && (
        <AdminUserDetails 
          userId={viewingUserId} 
          onClose={() => setViewingUserId(null)} 
        />
      )}
    </div>
  );
}

