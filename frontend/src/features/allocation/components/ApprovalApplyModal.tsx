import { useState, type FormEvent } from "react";
import { X, CheckCircle2, ShieldCheck, AlertCircle, ClipboardCheck } from "lucide-react";

interface ApprovalApplyModalProps {
  mode: "APPROVE" | "APPLY";
  runCode: string;
  onClose: () => void;
  onConfirm: (payload: { name: string; notes: string }) => void;
}

export function ApprovalApplyModal({
  mode,
  runCode,
  onClose,
  onConfirm,
}: ApprovalApplyModalProps) {
  const isApprove = mode === "APPROVE";
  const [name, setName] = useState(isApprove ? "Priya Sharma (Senior IE Lead)" : "Rajesh Patel (Plant Operations Head)");
  const [notes, setNotes] = useState("");
  const [chk1, setChk1] = useState(true);
  const [chk2, setChk2] = useState(true);
  const [chk3, setChk3] = useState(true);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onConfirm({ name, notes });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg border border-[#E6DDCE] shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E6DDCE] flex items-center justify-between bg-[#FAF7F2]">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              isApprove ? "bg-[#2E6F40]/10 text-[#2E6F40]" : "bg-[#9C5B3C]/10 text-[#9C5B3C]"
            }`}>
              {isApprove ? <CheckCircle2 className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#221912]">
                {isApprove ? "IE Formal Plan Sign-Off & Approval" : "Deploy Operator Allocation to Floor Lines"}
              </h3>
              <p className="text-[11px] font-mono font-semibold text-[#8C7E6E]">
                Optimization Reference: {runCode}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#8C7E6E] hover:text-[#221912] hover:bg-[#E6DDCE]/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3.5 bg-[#F6F1E8] rounded-xl border border-[#E6DDCE] text-xs space-y-1.5">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-[#B48259] shrink-0 mt-0.5" />
              <p className="text-[#6B5E51] leading-relaxed">
                {isApprove
                  ? "Formal approval confirms that cycle times, machine certifications, and pitch times have been reviewed by Industrial Engineering and are achievable for the target shift."
                  : "Floor deployment will push these operator assignments directly to the live shift roster and digital shopfloor line boards across all designated sewing floors."}
              </p>
            </div>
          </div>

          {/* Electronic Governance Checklist */}
          <div className="space-y-2 pt-1">
            <span className="text-xs font-bold text-[#221912] flex items-center gap-1.5">
              <ClipboardCheck className="w-3.5 h-3.5 text-[#2E6F40]" />
              Pre-Release Verification Checklist:
            </span>
            <div className="space-y-2 text-xs">
              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-[#E6DDCE] bg-white cursor-pointer hover:bg-[#FAF7F2]/50">
                <input
                  type="checkbox"
                  checked={chk1}
                  onChange={(e) => setChk1(e.target.checked)}
                  className="w-4 h-4 accent-[#2E6F40] rounded-sm cursor-pointer"
                />
                <span className="text-[#221912] font-medium">
                  {isApprove ? "Verified bottleneck operations and SMV balance" : "Floor line supervisors briefed on operator reassignments"}
                </span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-[#E6DDCE] bg-white cursor-pointer hover:bg-[#FAF7F2]/50">
                <input
                  type="checkbox"
                  checked={chk2}
                  onChange={(e) => setChk2(e.target.checked)}
                  className="w-4 h-4 accent-[#2E6F40] rounded-sm cursor-pointer"
                />
                <span className="text-[#221912] font-medium">
                  {isApprove ? "Confirmed machine availability with maintenance team" : "Machine setups and folders verified for all workstations"}
                </span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-[#E6DDCE] bg-white cursor-pointer hover:bg-[#FAF7F2]/50">
                <input
                  type="checkbox"
                  checked={chk3}
                  onChange={(e) => setChk3(e.target.checked)}
                  className="w-4 h-4 accent-[#2E6F40] rounded-sm cursor-pointer"
                />
                <span className="text-[#221912] font-medium">
                  {isApprove ? "Checked multi-line floater buffer ratio" : "Digital floor boards synced for morning shift rollout"}
                </span>
              </label>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#221912]">
              {isApprove ? "Sign-off Authority Name & Title:" : "Authorizing Floor Manager:"}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#F6F1E8] border border-[#E6DDCE] rounded-xl text-xs font-semibold text-[#221912] focus:outline-hidden focus:border-[#9C5B3C]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#221912]">
              Operational Notes / Floor Instructions:
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Approved for Morning Shift execution. Floaters 03 & 04 on standby for sleeve attaching..."
              className="w-full px-3.5 py-2 bg-[#F6F1E8] border border-[#E6DDCE] rounded-xl text-xs text-[#221912] focus:outline-hidden focus:border-[#9C5B3C]"
            />
          </div>

          <div className="pt-3 border-t border-[#E6DDCE] flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#E6DDCE] hover:bg-[#FAF7F2] text-xs font-bold text-[#6B5E51] transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!chk1 || !chk2 || !chk3}
              className={`px-5 py-2 rounded-xl text-white text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                isApprove
                  ? "bg-[#2E6F40] hover:bg-[#245A33]"
                  : "bg-[#9C5B3C] hover:bg-[#7A452D]"
              }`}
            >
              {isApprove ? "Confirm IE Sign-Off & Approval" : "Deploy to Shopfloor Lines"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

