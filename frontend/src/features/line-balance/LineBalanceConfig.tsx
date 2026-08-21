import { Input } from "../../components/ui/Input";

interface LineBalanceConfigProps {
  styleName: string;
  targetOutput: number;
  shiftDuration: number;
  onTargetOutputChange: (val: number) => void;
  onShiftDurationChange: (val: number) => void;
  taktTime: number;
}

export function LineBalanceConfig({
  styleName,
  targetOutput,
  shiftDuration,
  onTargetOutputChange,
  onShiftDurationChange,
  taktTime
}: LineBalanceConfigProps) {
  return (
    <div className="bg-white p-6 border border-[#E0D8C0] shadow-sm flex flex-col md:flex-row gap-8 items-center justify-between">
      
      {/* Style Info */}
      <div className="flex-1">
        <h2 className="text-[11px] font-semibold tracking-[0.2em] text-[#8A8270] uppercase mb-1">
          Active Plan
        </h2>
        <p className="font-serif text-2xl text-[#26231D]">{styleName}</p>
      </div>

      {/* Config Inputs */}
      <div className="flex flex-1 gap-6 items-end">
        <Input
          label="Target Output (pcs)"
          type="number"
          min="1"
          value={targetOutput}
          onChange={(e) => onTargetOutputChange(parseInt(e.target.value) || 0)}
          className="w-full bg-[#FBF8F0]"
        />
        <Input
          label="Shift Duration (mins)"
          type="number"
          min="1"
          value={shiftDuration}
          onChange={(e) => onShiftDurationChange(parseInt(e.target.value) || 0)}
          className="w-full bg-[#FBF8F0]"
        />
      </div>

      {/* Takt Time Display */}
      <div className="flex-1 flex justify-end">
        <div className="bg-[#26231D] px-6 py-4 rounded-sm border border-[#4A453A] flex flex-col items-end min-w-[160px]">
          <span className="text-[10px] text-[#8A8270] uppercase tracking-[0.15em] mb-1">Takt Time</span>
          <div className="flex items-baseline gap-1">
            <span className="font-mono text-3xl text-[#E0D8C0]">{taktTime.toFixed(2)}</span>
            <span className="text-[#8A8270] text-sm">min</span>
          </div>
        </div>
      </div>

    </div>
  );
}
