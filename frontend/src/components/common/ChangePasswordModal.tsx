import { useState } from "react";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { useAuth } from "../../features/auth/AuthContext";
import { getErrorMessage } from "../../lib/api";

/** Same rule as the backend (AuthDtos.PASSWORD_REGEX). */
export const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,100}$/;
export const PASSWORD_HINT = "At least 8 characters, including a letter and a digit.";

export function ChangePasswordModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { changePassword } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const reset = () => {
    setCurrent("");
    setNext("");
    setConfirm("");
    setError(null);
    setDone(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!PASSWORD_RULE.test(next)) return setError(PASSWORD_HINT);
    if (next !== confirm) return setError("The new passwords do not match.");
    setSaving(true);
    setError(null);
    try {
      await changePassword(current, next);
      setDone(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={close} title="Change Password" maxWidth="max-w-md">
      {done ? (
        <div className="space-y-4">
          <p className="text-xs text-[#5C4D3E]">Your password has been changed.</p>
          <div className="flex justify-end">
            <Button size="sm" onClick={close}>Close</Button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {error && (
            <div role="alert" className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-semibold">
              {error}
            </div>
          )}
          <Input id="cp-current" label="Current password" type="password" autoComplete="current-password"
                 value={current} onChange={(e) => setCurrent(e.target.value)} required />
          <Input id="cp-new" label="New password" type="password" autoComplete="new-password"
                 value={next} onChange={(e) => setNext(e.target.value)} hint={PASSWORD_HINT} required />
          <Input id="cp-confirm" label="Confirm new password" type="password" autoComplete="new-password"
                 value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" size="sm" onClick={close}>Cancel</Button>
            <Button type="submit" size="sm" loading={saving} disabled={saving || !current || !next || !confirm}>
              Change Password
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
