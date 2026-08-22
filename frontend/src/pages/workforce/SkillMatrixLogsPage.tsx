import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Filter, Search, Clock } from "lucide-react";
import { api } from "../../lib/api";

interface HistoryLog {
  id: number;
  operatorId: number;
  operatorName: string;
  employeeId: string;
  operationId: number;
  operationName: string;
  operationCode: string;
  oldRating: number;
  newRating: number;
  updatedBy: string;
  updatedAt: string;
}

export function SkillMatrixLogsPage() {
  const [logs, setLogs] = useState<HistoryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRating, setFilterRating] = useState<string>("all");

  useEffect(() => {
    api.get<{ data: HistoryLog[] }>("/skill-matrix/history/logs")
      .then(res => {
        setLogs(res.data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.operatorName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          log.operationName.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    if (filterRating !== "all") {
      const changedTo = log.newRating.toString();
      if (changedTo !== filterRating) return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-[#FAFAF8] w-full animate-in fade-in duration-300 relative">
      <header className="h-14 shrink-0 bg-white border-b border-[#F0EAE0] px-6 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link to="/skill-matrix" className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#FAFAF8] text-[#8C7E6E] hover:text-[#221912] transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-bold text-[#221912] text-[15px]">Skill Matrix History Logs</h1>
            <p className="text-[11px] font-medium text-[#8C7E6E]">Audit trail of all skill level updates</p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-[#F0EAE0] shadow-sm">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C7E6E]" />
              <input
                type="text"
                placeholder="Search by operator or operation..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 h-9 bg-[#FAFAF8] border border-[#E6DDCE] rounded-lg text-sm text-[#221912] focus:outline-none focus:border-[#B48259] transition-colors"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-[#FAFAF8] border border-[#E6DDCE] rounded-lg px-3 h-9">
                <Filter className="w-4 h-4 text-[#8C7E6E]" />
                <select
                  value={filterRating}
                  onChange={e => setFilterRating(e.target.value)}
                  className="bg-transparent text-sm font-medium text-[#221912] focus:outline-none"
                >
                  <option value="all">All Ratings</option>
                  <option value="1">Changed to 1</option>
                  <option value="2">Changed to 2</option>
                  <option value="3">Changed to 3</option>
                  <option value="4">Changed to 4</option>
                  <option value="5">Changed to 5</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#F0EAE0] rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#FAFAF8] border-b border-[#F0EAE0] text-[10px] font-bold tracking-widest text-[#8C7E6E] uppercase">
                  <th className="py-4 px-5">Date & Time</th>
                  <th className="py-4 px-5">Operator</th>
                  <th className="py-4 px-5">Operation</th>
                  <th className="py-4 px-5">Change</th>
                  <th className="py-4 px-5">Updated By</th>
                </tr>
              </thead>
              <tbody className="text-[13px] text-[#221912] font-medium divide-y divide-[#F0EAE0]">
                {loading ? (
                  <tr><td colSpan={5} className="py-12 text-center text-[#8C7E6E]">Loading logs...</td></tr>
                ) : filteredLogs.length === 0 ? (
                  <tr><td colSpan={5} className="py-12 text-center text-[#8C7E6E]">No history logs found.</td></tr>
                ) : (
                  filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-[#FEFCF9] transition-colors group">
                      <td className="py-3 px-5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-[#B8A898]" />
                          {new Date(log.updatedAt).toLocaleString()}
                        </div>
                      </td>
                      <td className="py-3 px-5">
                        <div className="font-bold">{log.operatorName}</div>
                        <div className="text-[11px] text-[#8C7E6E] font-mono">{log.employeeId}</div>
                      </td>
                      <td className="py-3 px-5">
                        <div className="font-bold">{log.operationName}</div>
                        <div className="text-[11px] text-[#8C7E6E] font-mono">{log.operationCode}</div>
                      </td>
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 flex items-center justify-center rounded bg-[#FAFAF8] border border-[#E6DDCE] text-[#8C7E6E] font-bold">
                            {log.oldRating}
                          </span>
                          <span className="text-[#B8A898]">→</span>
                          <span className="w-6 h-6 flex items-center justify-center rounded bg-[#FBF4EC] border border-[#D1BFA5] text-[#9B5A32] font-bold">
                            {log.newRating}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-5">
                        <span className="inline-flex items-center px-2 py-1 rounded bg-[#FAFAF8] border border-[#F0EAE0] text-[11px]">
                          {log.updatedBy}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
