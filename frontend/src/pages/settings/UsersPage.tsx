import { useCallback, useEffect, useState } from "react";
import { Plus, Edit2, KeyRound, UserCog } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { PageHeader, DataCard, DataCardHeader, EmptyState, SkeletonTable, StatusBadge } from "../../components/ui/PremiumUI";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";
import { PASSWORD_HINT, PASSWORD_RULE } from "../../components/common/ChangePasswordModal";
import { useAuth } from "../../features/auth/AuthContext";
import { ROLE_TITLES, type UserRole } from "../../features/auth/types";
import { usersApi, type AppUserAccount } from "../../features/users/api";
import { getErrorMessage } from "../../lib/api";

const ROLES = Object.keys(ROLE_TITLES) as UserRole[];

type FormState = {
  email: string;
  fullName: string;
  role: UserRole;
  department: string;
  active: boolean;
  password: string;
};

const EMPTY_FORM: FormState = {
  email: "", fullName: "", role: "INDUSTRIAL_ENGINEER", department: "", active: true, password: "",
};

function formatDateTime(value: string | null) {
  return value ? new Date(value).toLocaleString() : "Never";
}

/** User account administration (SYSTEM_ADMIN only; enforced by the backend). */
export function UsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<AppUserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [editing, setEditing] = useState<AppUserAccount | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [resetTarget, setResetTarget] = useState<AppUserAccount | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetDone, setResetDone] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setUsers(await usersApi.list());
    } catch (err) {
      setLoadError(getErrorMessage(err, "Could not load user accounts."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEdit = (u: AppUserAccount) => {
    setEditing(u);
    setForm({ email: u.email, fullName: u.fullName, role: u.role, department: u.department || "", active: u.active, password: "" });
    setFormError(null);
    setIsFormOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim()) return setFormError("Full name is required.");
    if (!editing && !PASSWORD_RULE.test(form.password)) return setFormError(PASSWORD_HINT);
    setSaving(true);
    setFormError(null);
    try {
      if (editing) {
        await usersApi.update(editing.id, {
          fullName: form.fullName, role: form.role, department: form.department, active: form.active,
        });
      } else {
        await usersApi.create({
          email: form.email, fullName: form.fullName, role: form.role, department: form.department, password: form.password,
        });
      }
      setIsFormOpen(false);
      await load();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const submitReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTarget) return;
    if (!PASSWORD_RULE.test(resetPassword)) return setResetError(PASSWORD_HINT);
    setSaving(true);
    setResetError(null);
    try {
      await usersApi.resetPassword(resetTarget.id, resetPassword);
      setResetDone(true);
    } catch (err) {
      setResetError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const closeReset = () => {
    setResetTarget(null);
    setResetPassword("");
    setResetError(null);
    setResetDone(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="User Accounts"
        description="Who can sign in, and what they can change. Supervisors record floor data; engineers and managers also change plans and master data."
        action={
          <Button variant="primary" size="md" onClick={openCreate} className="bg-[#9C5B3C] hover:bg-[#854D33] text-white shadow-sm">
            <Plus className="w-4 h-4 mr-1.5" />
            Add User
          </Button>
        }
      />

      {loadError && (
        <div role="alert" className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 font-semibold flex items-center justify-between gap-3">
          <span>{loadError}</span>
          <Button size="xs" variant="outline" onClick={load}>Retry</Button>
        </div>
      )}

      <DataCard noPad className="border border-slate-200/90 shadow-sm rounded-2xl overflow-hidden bg-white">
        <DataCardHeader title="All Accounts" subtitle="Sorted by name" count={users.length} />
        {loading ? (
          <SkeletonTable rows={4} cols={6} />
        ) : users.length === 0 ? (
          <EmptyState icon={<UserCog className="h-5 w-5" />} title="No user accounts" description="Add the first account to get started." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 border-b border-slate-200">
                  <TableHead className="text-slate-500 font-bold whitespace-nowrap">Name</TableHead>
                  <TableHead className="text-slate-500 font-bold whitespace-nowrap">Email</TableHead>
                  <TableHead className="text-slate-500 font-bold whitespace-nowrap">Role</TableHead>
                  <TableHead className="text-slate-500 font-bold whitespace-nowrap">Last sign-in</TableHead>
                  <TableHead className="text-center text-slate-500 font-bold whitespace-nowrap">Status</TableHead>
                  <TableHead className="text-right text-slate-500 font-bold whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id} className="border-b border-slate-100">
                    <TableCell className="font-semibold text-slate-900 whitespace-nowrap">
                      {u.fullName}
                      {String(u.id) === me?.id && <span className="ml-2 text-[10px] text-[#9C5B3C] font-bold">(you)</span>}
                      {u.department && <div className="text-[11px] text-slate-500 font-normal">{u.department}</div>}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-700">{u.email}</TableCell>
                    <TableCell className="text-xs text-slate-700 whitespace-nowrap">{u.roleTitle}</TableCell>
                    <TableCell className="text-xs text-slate-500 whitespace-nowrap">{formatDateTime(u.lastLoginAt)}</TableCell>
                    <TableCell className="text-center">
                      <StatusBadge status={u.active ? "active" : "inactive"} label={u.active ? "Active" : "Disabled"} />
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <div className="inline-flex gap-1">
                        <Button size="xs" variant="ghost" onClick={() => openEdit(u)} aria-label={`Edit ${u.fullName}`} title="Edit">
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="xs" variant="ghost" onClick={() => setResetTarget(u)} aria-label={`Reset password for ${u.fullName}`} title="Reset password">
                          <KeyRound className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DataCard>

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editing ? `Edit ${editing.fullName}` : "Add User Account"}
        subtitle={editing ? "Changing role or status signs the user out of active sessions." : "The user can change this password after signing in."}
      >
        <form onSubmit={submit} className="space-y-4">
          {formError && (
            <div role="alert" className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-semibold">{formError}</div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input id="user-email" label="Work email" type="email" value={form.email} disabled={!!editing}
                   onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
            <Input id="user-name" label="Full name" value={form.fullName}
                   onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} required />
            <div className="flex flex-col space-y-1.5">
              <label htmlFor="user-role" className="text-[11px] font-bold tracking-wider uppercase text-slate-500">Role</label>
              <select
                id="user-role"
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))}
                className="w-full h-10 bg-white text-xs font-semibold text-slate-800 border border-slate-200/90 rounded-xl px-3"
              >
                {ROLES.map((r) => <option key={r} value={r}>{ROLE_TITLES[r]}</option>)}
              </select>
            </div>
            <Input id="user-dept" label="Department" value={form.department}
                   onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))} />
            {!editing && (
              <Input id="user-password" label="Initial password" type="password" autoComplete="new-password" value={form.password}
                     onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} hint={PASSWORD_HINT} required />
            )}
            {editing && (
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 pt-6">
                <input type="checkbox" checked={form.active} disabled={String(editing.id) === me?.id}
                       onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                       className="w-4 h-4 accent-[#9C5B3C]" />
                Account active
              </label>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" size="md" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" size="md" loading={saving} className="bg-[#9C5B3C] hover:bg-[#854D33] text-white">
              {editing ? "Save Changes" : "Create User"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!resetTarget} onClose={closeReset} title="Reset Password" subtitle={resetTarget?.email} maxWidth="max-w-md">
        {resetDone ? (
          <div className="space-y-4">
            <p className="text-xs text-slate-700">Password reset. The user has been signed out of any active sessions — share the new password with them securely.</p>
            <div className="flex justify-end"><Button size="sm" onClick={closeReset}>Close</Button></div>
          </div>
        ) : (
          <form onSubmit={submitReset} className="space-y-4">
            {resetError && (
              <div role="alert" className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-semibold">{resetError}</div>
            )}
            <Input id="reset-password" label="New password" type="password" autoComplete="new-password" value={resetPassword}
                   onChange={(e) => setResetPassword(e.target.value)} hint={PASSWORD_HINT} required />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={closeReset}>Cancel</Button>
              <Button type="submit" size="sm" loading={saving}>Reset Password</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
