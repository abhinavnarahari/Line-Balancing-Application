import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, CheckCircle2, ChevronRight } from "lucide-react";
import type { Order } from "../orders/api";
import type { OperationBulletin } from "../bulletins/api";
import type { SewingLine } from "../lines/api";
import type { Shift } from "../shifts/types";
import { CustomSelect } from "../../components/ui/CustomSelect";
import { cn } from "../../utils/cn";
import { lineRunsStyle, lineStyleNo } from "../lines/lineStyle";

/*
 * Shows how a line plan is put together, left to right:
 *   Production order → its style → the style's operation bulletin (the operations) → sewing line → shift.
 * The order and the line are chosen here; the bulletin is found through the order's style.
 */

interface PlanSetupChainProps {
  order?: Order;
  /** Bulletins linked to the order's style */
  bulletins: OperationBulletin[];
  bulletin: OperationBulletin | null;
  onPickBulletin: (id: string) => void;
  line?: SewingLine;
  /** Set when this order was planned on a different line than the one selected */
  plannedLineName: string | null;
  /** Whether this order already has a saved plan */
  isPlanned: boolean;
  /** All lines set up for the order's style, with how many open orders each already has */
  lineChoices: { id: string; code: string; planned: number }[];
  onPickLine: (id: string) => void;
  shift?: Shift;
  shiftHours: number;
}

function Step({ label, ok, children, last }: { label: string; ok: boolean; children: ReactNode; last?: boolean }) {
  return (
    <div className="flex items-stretch gap-2 min-w-0">
      <div
        className={cn(
          "flex-1 min-w-0 rounded-xl border px-3 py-2",
          ok ? "border-[#E6DDCE] bg-white" : "border-amber-300 bg-amber-50"
        )}
      >
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#8C7E6E]">
          {ok ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <AlertTriangle className="w-3 h-3 text-amber-600" />}
          {label}
        </div>
        <div className="mt-0.5 text-xs text-[#221912] min-w-0">{children}</div>
      </div>
      {!last && <ChevronRight className="w-4 h-4 text-[#C5B9A8] self-center shrink-0 hidden lg:block" aria-hidden />}
    </div>
  );
}

export function PlanSetupChain({ order, bulletins, bulletin, onPickBulletin, line, plannedLineName, isPlanned, lineChoices, onPickLine, shift, shiftHours }: PlanSetupChainProps) {
  const opCount = bulletin?.lines?.length ?? 0;
  const smvSec = bulletin ? (bulletin.lines || []).reduce((s, l) => s + Number(l.smv || 0), 0) * 60 : 0;

  return (
    <section aria-label="Plan setup" className="mb-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
        <Step label="1 · Production order" ok={!!order}>
          {order ? (
            <>
              <span className="font-bold">{order.orderNo}</span>
              <span className="block text-[10.5px] text-[#8C7E6E] truncate">
                {(order.totalQuantity ?? 0).toLocaleString()} pcs · {order.color}{order.buyer ? ` · ${order.buyer}` : ""}
              </span>
            </>
          ) : (
            <span className="text-[#8C7E6E]">Select an order below</span>
          )}
        </Step>

        <Step label="2 · Style" ok={!!order?.styleNo}>
          {order ? (
            <>
              <span className="font-bold">{order.styleNo || "—"}</span>
              <span className="block text-[10.5px] text-[#8C7E6E] truncate">From the order; links it to a bulletin</span>
            </>
          ) : (
            <span className="text-[#8C7E6E]">—</span>
          )}
        </Step>

        <Step label="3 · Operation bulletin" ok={!!bulletin && opCount > 0}>
          {!order ? (
            <span className="text-[#8C7E6E]">—</span>
          ) : bulletins.length === 0 ? (
            <span className="block text-[10.5px] text-amber-900 leading-snug">
              No bulletin is linked to style <b>{order.styleNo}</b>, so there are no operations to balance.{" "}
              <Link to="/operation-bulletins" className="font-bold underline">Link or import one</Link>
            </span>
          ) : bulletins.length > 1 ? (
            <>
              <CustomSelect
                value={bulletin ? String(bulletin.id) : ""}
                onChange={onPickBulletin}
                options={bulletins.map(b => ({ value: String(b.id), label: `${b.bulletinCode} · ${b.name}`, sublabel: `${b.lines?.length ?? 0} ops · ${b.status}` }))}
              />
              <span className="block text-[10.5px] text-[#8C7E6E] mt-0.5">{bulletins.length} bulletins for this style; pick one</span>
            </>
          ) : (
            <>
              <span className="font-bold truncate block" title={bulletin?.name}>{bulletin?.bulletinCode} · {bulletin?.name}</span>
              <span className="block text-[10.5px] text-[#8C7E6E] truncate">
                {opCount} operations · {smvSec.toFixed(1)} s total SMV · {bulletin?.status}
              </span>
            </>
          )}
        </Step>

        <Step label="4 · Sewing line" ok={!!line && !plannedLineName && (!order?.styleNo || lineRunsStyle(line, order.styleNo))}>
          {line ? (
            <>
              <span className="font-bold truncate block">{line.lineCode} · {line.lineName}</span>
              <span className="block text-[10.5px] leading-snug text-[#8C7E6E]">
                {plannedLineName ? (
                  <span className="text-amber-900">This order is planned on {plannedLineName}</span>
                ) : !lineStyleNo(line) ? (
                  <span className="text-amber-900">
                    No active style set for this line.{" "}
                    <Link to="/settings/lines" className="font-bold underline">Set it in Sewing Lines</Link>
                  </span>
                ) : order?.styleNo && !lineRunsStyle(line, order.styleNo) ? (
                  <span className="text-amber-900">Runs {lineStyleNo(line)}, not this order's {order.styleNo}</span>
                ) : (
                  `Runs ${lineStyleNo(line)}${isPlanned ? " · planned here" : " · not planned yet"}`
                )}
              </span>
              {order && !isPlanned && lineChoices.length > 1 && (
                <div className="mt-1 flex flex-wrap gap-1" role="group" aria-label={`Lines that run ${order.styleNo}`}>
                  {lineChoices.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => onPickLine(c.id)}
                      aria-pressed={String(line.id) === c.id}
                      title={`${c.planned} open order${c.planned === 1 ? "" : "s"} already planned on ${c.code}`}
                      className={cn(
                        "px-1.5 py-0.5 rounded-md border text-[10px] font-bold cursor-pointer",
                        String(line.id) === c.id
                          ? "bg-[#9C5B3C] border-[#9C5B3C] text-white"
                          : "bg-white border-[#E6DDCE] text-[#9C5B3C] hover:bg-[#F6F1E8]"
                      )}
                    >
                      {c.code.replace(/^LINE-?/i, "L")} · {c.planned}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <span className="text-[#8C7E6E]">Add a line in Settings → Sewing Lines</span>
          )}
        </Step>

        <Step label="5 · Shift" ok={!!shift} last>
          {shift ? (
            <>
              <span className="font-bold">{shift.shiftName}</span>
              <span className="block text-[10.5px] text-[#8C7E6E] truncate">
                {shift.startTime?.slice(0, 5)}–{shift.endTime?.slice(0, 5)} · {shiftHours.toFixed(1)}h working
              </span>
            </>
          ) : (
            <span className="text-[#8C7E6E]">Add a shift in Settings → Shifts</span>
          )}
        </Step>
      </div>
    </section>
  );
}
