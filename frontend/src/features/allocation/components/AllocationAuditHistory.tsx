import { useState } from "react";
import { X, History, UserCheck, CheckCircle2, ShieldCheck, Search, Filter, Clock } from "lucide-react";
import type { AuditLogItem } from "../types";

interface AllocationAuditHistoryProps {
  logs: AuditLogItem[];
  runCode: string;
  onClose: () => void;
}

export function AllocationAuditHistory({
  logs,
  runCode,
  onClose,
}: AllocationAuditHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");

  const filteredLogs = logs.filter((log) => {
    const matchSearch =
      searchTerm === "" ||
      log.performedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.lineName && log.lineName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.stationCode && log.stationCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.justification && log.justification.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.newValue && log.newValue.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchAction = actionFilter === "ALL" || log.actionType === actionFilter;

    return matchSearch && matchAction;
  });

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl border border-[#E6DDCE] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#E6DDCE] flex items-center justify-between bg-[#FAF7F2] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#9C5B3C]/10 flex items-center justify-center text-[#9C5B3C]">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#221912]">
                Allocation Governance & Electronic Audit Trail
              </h3>
              <p className="text-[11px] font-mono font-semibold text-[#8C7E6E]">
                Run Reference: {runCode} • {logs.length} logged events
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

        {/* Filter Controls */}
        <div className="px-6 py-3 border-b border-[#E6DDCE] bg-white flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-[#8C7E6E] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search audit trail by user, reason, station..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#F6F1E8] border border-[#E6DDCE] rounded-xl text-xs font-medium text-[#221912] focus:outline-hidden focus:border-[#9C5B3C]"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-[#F6F1E8] px-3 py-1.5 rounded-xl border border-[#E6DDCE] text-xs">
            <Filter className="w-3.5 h-3.5 text-[#9C5B3C]" />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="bg-transparent font-bold text-[#221912] focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">All Event Types</option>
              <option value="APPROVE">APPROVE Sign-offs</option>
              <option value="APPLY">APPLY Releases</option>
              <option value="OVERRIDE">OVERRIDE Edits</option>
              <option value="OPTIMIZE">SOLVER Runs</option>
            </select>
          </div>
        </div>

        {/* Timeline Log List */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <History className="w-8 h-8 text-[#C4B5A5] mx-auto" />
              <p className="text-xs text-[#8C7E6E] font-medium">No matching audit events found.</p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E6DDCE]">
              {filteredLogs.map((log) => {
                let badgeColor = "bg-[#9C5B3C] text-white";
                let Icon = History;
                if (log.actionType === "APPROVE") {
                  badgeColor = "bg-[#2E6F40] text-white";
                  Icon = CheckCircle2;
                } else if (log.actionType === "APPLY") {
                  badgeColor = "bg-[#77876F] text-white";
                  Icon = ShieldCheck;
                } else if (log.actionType === "OVERRIDE") {
                  badgeColor = "bg-[#B48259] text-white";
                  Icon = UserCheck;
                }

                return (
                  <div key={log.id} className="relative group">
                    {/* Timeline Node Icon */}
                    <div className={`absolute -left-6 top-1 w-5 h-5 rounded-full ${badgeColor} flex items-center justify-center text-white ring-4 ring-white shadow-xs`}>
                      <Icon className="w-2.5 h-2.5" />
                    </div>

                    <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E6DDCE] space-y-2 hover:border-[#B48259] transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            log.actionType === "APPROVE"
                              ? "bg-[#2E6F40]/15 text-[#2E6F40]"
                              : log.actionType === "APPLY"
                              ? "bg-[#9C5B3C]/15 text-[#9C5B3C]"
                              : "bg-[#B48259]/15 text-[#B48259]"
                          }`}>
                            {log.actionType} Action
                          </span>
                          {log.lineName && (
                            <span className="text-xs font-bold text-[#221912]">
                              {log.lineName} {log.stationCode && `• Stn ${log.stationCode}`}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 text-[10px] font-mono text-[#8C7E6E]">
                          <Clock className="w-3 h-3 text-[#8C7E6E]" />
                          <span>{log.timestamp ? new Date(log.timestamp).toLocaleString() : "Recently"}</span>
                        </div>
                      </div>

                      <p className="text-xs text-[#6B5E51]">
                        Authority / User: <span className="font-bold text-[#221912]">{log.performedBy}</span>
                      </p>

                      {log.newValue && (
                        <div className="p-2.5 rounded-lg bg-white border border-[#E6DDCE] text-xs font-mono text-[#221912]">
                          {log.newValue}
                        </div>
                      )}

                      {log.justification && (
                        <p className="text-xs text-[#8C7E6E] italic bg-[#F6F1E8] px-3 py-1.5 rounded-lg border border-[#E6DDCE]/60">
                          "{log.justification}"
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-[#E6DDCE] bg-[#FAF7F2] flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-[#E6DDCE] hover:bg-[#F6F1E8] text-xs font-bold text-[#221912] transition-colors cursor-pointer"
          >
            Close Audit Trail
          </button>
        </div>
      </div>
    </div>
  );
}

