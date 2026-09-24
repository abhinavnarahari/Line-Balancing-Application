import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { 
  ArrowRight, 
  GitFork, 
  Zap, 
  Maximize2, 
  Minimize2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Search, 
  X, 
  Scissors, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronRight, 
  ChevronLeft, 
  Workflow, 
  Sliders,
  Expand
} from "lucide-react";
import type { WorkstationAllocation, BalancingScenario } from "../bulletins/lineBalancingScenarios";

interface WorkstationFlowPreviewProps {
  scenario: BalancingScenario;
  onSelectStation?: (station: WorkstationAllocation) => void;
}

export function WorkstationFlowPreview({ scenario, onSelectStation }: WorkstationFlowPreviewProps) {
  const workstations = scenario?.workstations || [];
  
  // States
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isAutoFitted, setIsAutoFitted] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBottlenecksOnly, setFilterBottlenecksOnly] = useState(false);
  const [selectedStation, setSelectedStation] = useState<WorkstationAllocation | null>(null);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const lineContentRef = useRef<HTMLDivElement>(null);
  const fullscreenScrollAreaRef = useRef<HTMLDivElement>(null);
  const fullscreenLineContentRef = useRef<HTMLDivElement>(null);

  // Group stations logically for the straight flow pipeline (grouping parallel branches together)
  const stationGroups = useMemo(() => {
    const groups: {
      groupKey: string;
      baseNumber: number;
      type: "single" | "parallel" | "combined";
      stations: WorkstationAllocation[];
      primaryOpName: string;
    }[] = [];

    let currentParallelGroup: WorkstationAllocation[] = [];
    let currentBaseNum: number | null = null;

    workstations.forEach((ws) => {
      const isParallelSub = ws.workstationType === "parallel" || /[A-Z]$/.test(ws.stationCode);

      if (isParallelSub) {
        if (currentBaseNum === ws.stationNumber) {
          currentParallelGroup.push(ws);
        } else {
          if (currentParallelGroup.length > 0 && currentBaseNum !== null) {
            groups.push({
              groupKey: `parallel-${currentBaseNum}`,
              baseNumber: currentBaseNum,
              type: "parallel",
              stations: [...currentParallelGroup],
              primaryOpName: currentParallelGroup[0].operations[0]?.name || currentParallelGroup[0].stationName,
            });
          }
          currentBaseNum = ws.stationNumber;
          currentParallelGroup = [ws];
        }
      } else {
        if (currentParallelGroup.length > 0 && currentBaseNum !== null) {
          groups.push({
            groupKey: `parallel-${currentBaseNum}`,
            baseNumber: currentBaseNum,
            type: "parallel",
            stations: [...currentParallelGroup],
            primaryOpName: currentParallelGroup[0].operations[0]?.name || currentParallelGroup[0].stationName,
          });
          currentParallelGroup = [];
          currentBaseNum = null;
        }

        groups.push({
          groupKey: `station-${ws.stationNumber}-${ws.stationCode}`,
          baseNumber: ws.stationNumber,
          type: ws.workstationType,
          stations: [ws],
          primaryOpName: ws.stationName,
        });
      }
    });

    if (currentParallelGroup.length > 0 && currentBaseNum !== null) {
      groups.push({
        groupKey: `parallel-${currentBaseNum}`,
        baseNumber: currentBaseNum,
        type: "parallel",
        stations: [...currentParallelGroup],
        primaryOpName: currentParallelGroup[0].operations[0]?.name || currentParallelGroup[0].stationName,
      });
    }

    return groups;
  }, [workstations]);

  // Filter groups based on search / bottlenecks
  const filteredGroups = useMemo(() => {
    return stationGroups.filter((group) => {
      const matchesBottleneck = !filterBottlenecksOnly || group.stations.some((s) => s.isBottleneck);
      if (!matchesBottleneck) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return group.stations.some((s) => 
        s.stationCode.toLowerCase().includes(q) ||
        s.stationName.toLowerCase().includes(q) ||
        s.primaryMachineType.toLowerCase().includes(q) ||
        s.operations.some((op) => op.name.toLowerCase().includes(q) || (op.code && op.code.toLowerCase().includes(q)))
      );
    });
  }, [stationGroups, filterBottlenecksOnly, searchQuery]);

  // Calculate Auto-Fit Zoom so the whole straight line fits 100% in view
  const autoFitStraightLine = useCallback((fullscreen: boolean = isFullscreen) => {
    const container = fullscreen ? fullscreenScrollAreaRef.current : scrollAreaRef.current;
    const content = fullscreen ? fullscreenLineContentRef.current : lineContentRef.current;

    if (!container || !content) return;

    // Available width minus safety margins
    const availableWidth = container.clientWidth - (selectedStation ? 420 : 48);
    const contentWidth = content.scrollWidth || content.offsetWidth;

    if (availableWidth > 0 && contentWidth > 0) {
      // Calculate fit scale percentage between 20% and 100%
      const calculatedScale = Math.min(100, Math.max(20, Math.floor((availableWidth / contentWidth) * 100)));
      setZoomLevel(calculatedScale);
      setIsAutoFitted(true);
    }
  }, [isFullscreen, selectedStation]);

  // When opening full screen, lock body scroll and auto-fit the full line
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = "hidden";
      const timer = setTimeout(() => {
        autoFitStraightLine(true);
      }, 60);
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = "unset";
      };
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isFullscreen, autoFitStraightLine]);

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  // Re-fit on window resize
  useEffect(() => {
    const handleResize = () => {
      if (isAutoFitted) {
        autoFitStraightLine(isFullscreen);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isAutoFitted, isFullscreen, autoFitStraightLine]);

  const handleStationClick = (station: WorkstationAllocation) => {
    setSelectedStation(station);
    if (onSelectStation) {
      onSelectStation(station);
    }
  };

  const handleZoomChange = (newZoom: number) => {
    setZoomLevel(Math.max(20, Math.min(150, newZoom)));
    setIsAutoFitted(false);
  };

  // Find index of selected station for Next/Prev
  const currentStationIndex = useMemo(() => {
    if (!selectedStation) return -1;
    return workstations.findIndex((ws) => ws.stationCode === selectedStation.stationCode);
  }, [selectedStation, workstations]);

  const handleNextStation = () => {
    if (currentStationIndex >= 0 && currentStationIndex < workstations.length - 1) {
      handleStationClick(workstations[currentStationIndex + 1]);
    }
  };

  const handlePrevStation = () => {
    if (currentStationIndex > 0) {
      handleStationClick(workstations[currentStationIndex - 1]);
    }
  };

  const bottleneckSecs = (scenario.bottleneckCycleTime * 60).toFixed(1);
  const pitchSecs = (scenario.pitchTime * 60).toFixed(1);
  const totalBottlenecks = workstations.filter((ws) => ws.isBottleneck).length;

  // ── Render Straight Line Pipeline ──────────────────────────────────
  const renderStraightLine = (refContent: React.RefObject<HTMLDivElement | null>) => (
    <div 
      ref={refContent}
      className="flex items-center gap-2.5 px-3 py-4 min-w-max select-none"
    >
      {/* 1. Infeed Stage */}
      <div className="px-4 py-5 rounded-2xl border-2 border-[#E6DDCE] bg-[#F6F1E8] text-[#8C7E6E] flex flex-col items-center justify-center text-center shrink-0 shadow-2xs">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-800">Stage 0</span>
        <span className="text-xs font-black text-[#221912] mt-0.5">Infeed</span>
        <span className="text-[9px] text-[#8C7E6E] mt-0.5 font-mono">Cut Bundles</span>
      </div>

      {/* Flow Arrow */}
      <div className="flex items-center justify-center text-[#9C5B3C] shrink-0">
        <ArrowRight className="w-5 h-5" />
      </div>

      {/* 2. Workstations in One Continuous Straight Line */}
      {filteredGroups.map((group, groupIdx) => {
        const isLast = groupIdx === filteredGroups.length - 1;
        return (
          <React.Fragment key={group.groupKey}>
            <StationCardGroup
              group={group}
              scenario={scenario}
              selectedStation={selectedStation}
              onSelectStation={handleStationClick}
            />
            {!isLast && (
              <div className="flex items-center justify-center text-[#C5B9A8] shrink-0">
                <ArrowRight className="w-4 h-4" />
              </div>
            )}
          </React.Fragment>
        );
      })}

      {/* Flow Arrow to Outfeed */}
      <div className="flex items-center justify-center text-emerald-600 shrink-0">
        <ArrowRight className="w-5 h-5" />
      </div>

      {/* 3. Inspection & Output Stage */}
      <div className="px-4 py-5 rounded-2xl border-2 border-emerald-300 bg-emerald-50 text-emerald-900 flex flex-col items-center justify-center text-center shrink-0 shadow-2xs">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700">Stage End</span>
        <span className="text-xs font-black text-emerald-950 mt-0.5">QC Inspection</span>
        <span className="text-[9px] text-emerald-700 mt-0.5 font-mono">Packing Output</span>
      </div>
    </div>
  );

  // ── Top Bar Content (Scenario, Metrics, etc.) ──────────────────────
  const renderHeader = (inFullscreen: boolean) => (
    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 border-b border-[#E6DDCE] pb-3 shrink-0">
      {/* Title & Scenario Tags */}
      <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap min-w-0">
        <div className="w-7 h-7 rounded-xl bg-[#F6F1E8] border border-[#E6DDCE] flex items-center justify-center text-[#9C5B3C] shadow-2xs shrink-0">
          <Workflow className="w-4 h-4" />
        </div>
        <h2 className="text-xs sm:text-sm font-black uppercase text-[#221912] tracking-wider whitespace-nowrap">
          Workstation Layout Architecture Preview
        </h2>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-mono font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#F6F1E8] text-[#9C5B3C] border border-[#E6DDCE] whitespace-nowrap">
            {workstations.length} Stations
          </span>
          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 whitespace-nowrap">
            {scenario.name}
          </span>
        </div>
        {inFullscreen && (
          <span className="text-[10px] font-mono text-[#8C7E6E] bg-stone-100 px-2 py-0.5 rounded-md whitespace-nowrap shrink-0">
            Full Straight Line View • Press [Esc] to Exit
          </span>
        )}
      </div>

      {/* Key Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:flex items-center gap-2 text-xs font-mono shrink-0">
        <div className="flex items-center justify-between sm:justify-start gap-1.5 px-2.5 py-1 bg-[#F6F1E8] rounded-xl border border-[#E6DDCE] whitespace-nowrap">
          <span className="text-[10px] font-sans text-[#8C7E6E]">Pitch (PT):</span>
          <span className="font-bold text-[#9C5B3C]">{pitchSecs}s</span>
        </div>
        <div className={`flex items-center justify-between sm:justify-start gap-1.5 px-2.5 py-1 rounded-xl border whitespace-nowrap ${
          totalBottlenecks > 0 ? "bg-rose-50 border-rose-200" : "bg-[#F6F1E8] border-[#E6DDCE]"
        }`}>
          <span className="text-[10px] font-sans text-[#8C7E6E]">Bottleneck:</span>
          <span className={`font-bold ${totalBottlenecks > 0 ? "text-rose-600" : "text-[#221912]"}`}>
            {bottleneckSecs}s
          </span>
        </div>
        <div className="flex items-center justify-between sm:justify-start gap-1.5 px-2.5 py-1 bg-emerald-50 rounded-xl border border-emerald-200 whitespace-nowrap">
          <span className="text-[10px] font-sans text-emerald-800">Output @{scenario.plannedEfficiency || 80}%:</span>
          <span className="font-bold text-emerald-700">{scenario.hourlyOutputPlanned} pcs/hr</span>
        </div>
        <div className="flex items-center justify-between sm:justify-start gap-1.5 px-2.5 py-1 bg-indigo-50 rounded-xl border border-indigo-200 whitespace-nowrap">
          <span className="text-[10px] font-sans text-indigo-800">Efficiency:</span>
          <span className="font-bold text-indigo-700">{scenario.lineBalanceEfficiency.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );

  // ── Control Toolbar ───────────────────────────────────────────────
  const renderToolbar = (inFullscreen: boolean) => (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#F6F1E8]/70 p-2.5 rounded-2xl border border-[#E6DDCE] shrink-0">
      
      {/* Left: Search & Bottleneck Filter */}
      <div className="flex items-center gap-2 flex-1 max-w-md">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-[#8C7E6E] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search station, machine, or operation..."
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#E6DDCE] rounded-xl text-xs text-[#221912] placeholder-[#8C7E6E] focus:outline-none focus:border-[#9C5B3C] focus:ring-1 focus:ring-[#9C5B3C]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8C7E6E] hover:text-[#221912]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          onClick={() => setFilterBottlenecksOnly(!filterBottlenecksOnly)}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all shrink-0 ${
            filterBottlenecksOnly
              ? "bg-rose-50 border-rose-300 text-rose-700 shadow-2xs"
              : "bg-white border-[#E6DDCE] text-[#8C7E6E] hover:text-[#221912]"
          }`}
        >
          <Zap className={`w-3.5 h-3.5 ${filterBottlenecksOnly ? "fill-rose-600 text-rose-600" : ""}`} />
          <span>Bottlenecks ({totalBottlenecks})</span>
        </button>
      </div>

      {/* Right: Straight Line Zoom Controls & Fullscreen Toggle */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-[#E6DDCE] text-xs font-mono shadow-2xs">
          <button
            onClick={() => handleZoomChange(zoomLevel - 10)}
            className="p-1 text-[#8C7E6E] hover:text-[#221912] rounded hover:bg-[#F6F1E8]"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          {/* Zoom Slider */}
          <input
            type="range"
            min="20"
            max="150"
            step="5"
            value={zoomLevel}
            onChange={(e) => handleZoomChange(Number(e.target.value))}
            className="w-16 sm:w-24 h-1.5 bg-[#E6DDCE] rounded-lg appearance-none cursor-pointer accent-[#9C5B3C]"
            title="Adjust Straight Line Scale"
          />

          <span className="w-9 text-center font-bold text-[#221912] text-[11px]">
            {zoomLevel}%
          </span>

          <button
            onClick={() => handleZoomChange(zoomLevel + 10)}
            className="p-1 text-[#8C7E6E] hover:text-[#221912] rounded hover:bg-[#F6F1E8]"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          {/* Auto-Fit Full Line to Screen */}
          <button
            onClick={() => autoFitStraightLine(inFullscreen)}
            className={`px-2.5 py-1 text-[11px] font-sans font-extrabold rounded-lg transition-all ${
              isAutoFitted
                ? "bg-[#9C5B3C] text-white shadow-2xs"
                : "bg-[#F6F1E8] text-[#9C5B3C] hover:bg-[#E6DDCE]"
            }`}
            title="Auto-Fit Whole Line in One View"
          >
            Fit Full Line
          </button>

          {/* Reset to 100% */}
          <button
            onClick={() => handleZoomChange(100)}
            className="p-1 text-[#8C7E6E] hover:text-[#221912] rounded hover:bg-[#F6F1E8]"
            title="Actual Size (100%)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Full Screen Toggle Button */}
        <button
          onClick={() => {
            if (!isFullscreen) {
              setIsFullscreen(true);
            } else {
              setIsFullscreen(false);
            }
          }}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all shadow-2xs ${
            inFullscreen
              ? "bg-rose-600 text-white hover:bg-rose-700"
              : "bg-[#9C5B3C] text-white hover:bg-[#854B2F]"
          }`}
        >
          {inFullscreen ? (
            <>
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Exit Full Screen</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Full Screen View</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  // ── Station Inspector Drawer ───────────────────────────────────────
  const renderStationInspector = () => {
    if (!selectedStation) return null;

    return (
      <div className="absolute right-0 top-0 bottom-0 w-full sm:w-96 bg-white border-l border-[#E6DDCE] shadow-2xl z-30 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 bg-[#FDFCFB] border-b border-[#E6DDCE] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono font-black text-sm text-[#9C5B3C] px-2 py-0.5 rounded-lg bg-[#F6F1E8] border border-[#E6DDCE]">
              {selectedStation.stationCode}
            </span>
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
              selectedStation.isBottleneck 
                ? "bg-rose-100 text-rose-800 border border-rose-300"
                : selectedStation.workstationType === "parallel"
                  ? "bg-indigo-100 text-indigo-800 border border-indigo-300"
                  : "bg-emerald-100 text-emerald-800 border border-emerald-300"
            }`}>
              {selectedStation.isBottleneck ? "Pacing Bottleneck" : `${selectedStation.workstationType} Station`}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevStation}
              disabled={currentStationIndex <= 0}
              className="p-1 rounded-lg text-[#8C7E6E] hover:text-[#221912] hover:bg-[#F6F1E8] disabled:opacity-30"
              title="Previous Station"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextStation}
              disabled={currentStationIndex >= workstations.length - 1}
              className="p-1 rounded-lg text-[#8C7E6E] hover:text-[#221912] hover:bg-[#F6F1E8] disabled:opacity-30"
              title="Next Station"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSelectedStation(null)}
              className="p-1 rounded-lg text-[#8C7E6E] hover:text-[#221912] hover:bg-[#F6F1E8] ml-1"
              title="Close Inspector"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs custom-scrollbar">
          <div>
            <h3 className="text-sm font-black text-[#221912] leading-tight">
              {selectedStation.stationName}
            </h3>
            <p className="text-[11px] text-[#8C7E6E] mt-1 font-mono">
              Machine: <span className="font-bold text-[#221912]">{selectedStation.primaryMachineType}</span> • Manning: <span className="font-bold text-[#221912]">{selectedStation.allocatedOperators} op(s)</span>
            </p>
          </div>

          {/* Bottleneck Warning */}
          {selectedStation.isBottleneck && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Pacing Bottleneck Bench</span>
              </div>
              <p className="text-[11px] text-rose-800 leading-relaxed">
                This station dictates line cycle time ({(selectedStation.effectiveCycleTime * 60).toFixed(1)}s). Consider parallel bench splitting or helper allocation to relieve this constraint.
              </p>
            </div>
          )}

          {/* Gauges */}
          <div className="grid grid-cols-2 gap-2.5 font-mono">
            <div className="p-3 bg-[#F6F1E8] rounded-xl border border-[#E6DDCE]">
              <span className="text-[10px] text-[#8C7E6E] block font-sans">Effective Cycle Time</span>
              <span className="text-base font-black text-[#9C5B3C]">
                {(selectedStation.effectiveCycleTime * 60).toFixed(1)}s
              </span>
              <span className="text-[10px] text-[#8C7E6E] block mt-0.5">
                ({selectedStation.effectiveCycleTime.toFixed(3)} min)
              </span>
            </div>

            <div className="p-3 bg-[#F6F1E8] rounded-xl border border-[#E6DDCE]">
              <span className="text-[10px] text-[#8C7E6E] block font-sans">Manning Ratio (T_i)</span>
              <span className="text-base font-black text-[#221912]">
                {(selectedStation.theoreticalManning || (selectedStation.totalStationSmv / scenario.pitchTime)).toFixed(2)}
              </span>
              <span className="text-[10px] text-emerald-700 font-sans block mt-0.5 font-bold">
                Target: ≈ 1.00
              </span>
            </div>

            <div className="p-3 bg-white rounded-xl border border-[#E6DDCE]">
              <span className="text-[10px] text-[#8C7E6E] block font-sans">Station Output @100%</span>
              <span className="text-sm font-bold text-[#221912]">
                {selectedStation.stationCapacity100 ? `${Math.round(selectedStation.stationCapacity100)} pcs/hr` : "—"}
              </span>
            </div>

            <div className="p-3 bg-white rounded-xl border border-[#E6DDCE]">
              <span className="text-[10px] text-[#8C7E6E] block font-sans">Station Output @85%</span>
              <span className="text-sm font-bold text-emerald-700">
                {selectedStation.stationCapacity85 ? `${Math.round(selectedStation.stationCapacity85)} pcs/hr` : "—"}
              </span>
            </div>
          </div>

          {/* Operations Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-[#E6DDCE] pb-1">
              <span className="font-bold text-[#221912] uppercase tracking-wider text-[11px]">
                Assigned Operations ({selectedStation.operations.length})
              </span>
              <span className="font-mono text-[10px] text-[#8C7E6E]">
                Sum SMV: {(selectedStation.totalStationSmv * 60).toFixed(1)}s
              </span>
            </div>

            <div className="space-y-1.5">
              {selectedStation.operations.map((op, idx) => (
                <div 
                  key={op.id || idx}
                  className="p-2.5 bg-[#FDFCFB] rounded-xl border border-[#E6DDCE] space-y-1"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] font-bold text-[#8C7E6E] px-1.5 py-0.2 bg-[#F6F1E8] rounded">
                        #{op.sequence || idx + 1}
                      </span>
                      <span className="font-bold text-[#221912] leading-snug">
                        {op.name}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-xs text-[#9C5B3C] shrink-0">
                      {(op.smv * 60).toFixed(1)}s
                    </span>
                  </div>
                  <div className="text-[10.5px] text-[#8C7E6E] flex items-center justify-between">
                    <span>{op.machineType}</span>
                    <span className="font-mono">{op.smv.toFixed(3)} min</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-3 bg-[#FDFCFB] border-t border-[#E6DDCE] flex items-center justify-between text-xs font-mono text-[#8C7E6E]">
          <span>Station {currentStationIndex + 1} of {workstations.length}</span>
          <button
            onClick={() => setSelectedStation(null)}
            className="px-3 py-1 bg-[#F6F1E8] hover:bg-[#E6DDCE] text-[#221912] font-sans font-bold rounded-lg transition-colors"
          >
            Close Drawer
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* ── 1. Embedded In-Page View ───────────────────────────────── */}
      <div className="bg-[#FDFCFB] border border-[#E6DDCE] rounded-3xl p-5 shadow-2xs space-y-4">
        {renderHeader(false)}
        {renderToolbar(false)}

        {/* Straight Line Canvas */}
        <div className="relative border border-[#E6DDCE] rounded-2xl bg-white overflow-hidden min-h-[220px]">
          <div 
            ref={scrollAreaRef}
            className="overflow-x-auto overflow-y-hidden p-4 custom-scrollbar flex items-center"
          >
            <div 
              style={{ 
                transform: `scale(${zoomLevel / 100})`, 
                transformOrigin: "top left",
                width: "max-content"
              }}
              className="transition-transform duration-150"
            >
              {renderStraightLine(lineContentRef)}
            </div>
          </div>

          {/* Embedded Inspector Drawer */}
          {renderStationInspector()}
        </div>
      </div>

      {/* ── 2. Full-Screen Viewport Modal (Rendered via Portal) ─────── */}
      {isFullscreen && createPortal(
        <div className="fixed inset-0 z-[9999] bg-[#FDFCFB] flex flex-col w-screen h-screen overflow-hidden p-5 sm:p-6 select-none animate-in fade-in duration-200">
          
          {/* Header & Metrics */}
          {renderHeader(true)}

          {/* Control Toolbar */}
          <div className="my-3">
            {renderToolbar(true)}
          </div>

          {/* Main Full-Screen Straight Line Canvas */}
          <div className="flex-1 relative border border-[#E6DDCE] rounded-3xl bg-white shadow-inner flex overflow-hidden">
            <div 
              ref={fullscreenScrollAreaRef}
              className={`flex-1 overflow-x-auto overflow-y-auto p-6 custom-scrollbar flex items-center justify-start transition-all ${
                selectedStation ? "mr-96" : ""
              }`}
            >
              <div 
                style={{ 
                  transform: `scale(${zoomLevel / 100})`, 
                  transformOrigin: "center left",
                  width: "max-content"
                }}
                className="transition-transform duration-150 my-auto"
              >
                {renderStraightLine(fullscreenLineContentRef)}
              </div>
            </div>

            {/* Fullscreen Inspector Drawer */}
            {renderStationInspector()}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

// ── SUB-COMPONENT: Station Card Group in Straight Line ─────────────
interface StationCardGroupProps {
  group: {
    groupKey: string;
    baseNumber: number;
    type: "single" | "parallel" | "combined";
    stations: WorkstationAllocation[];
    primaryOpName: string;
  };
  scenario: BalancingScenario;
  selectedStation: WorkstationAllocation | null;
  onSelectStation: (station: WorkstationAllocation) => void;
}

function StationCardGroup({ group, scenario, selectedStation, onSelectStation }: StationCardGroupProps) {
  const hasBottleneck = group.stations.some((s) => s.isBottleneck);

  // Single or Combined Workstation Card
  if (group.type !== "parallel" && group.stations.length === 1) {
    const ws = group.stations[0];
    const isSelected = selectedStation?.stationCode === ws.stationCode;
    const cycleSecs = (ws.effectiveCycleTime * 60).toFixed(1);

    return (
      <div
        onClick={() => onSelectStation(ws)}
        className={`w-48 sm:w-52 p-3 rounded-2xl border transition-all duration-200 shrink-0 bg-white hover:-translate-y-1 hover:shadow-md cursor-pointer ${
          isSelected
            ? "border-[#9C5B3C] ring-2 ring-[#9C5B3C]/40 shadow-lg"
            : hasBottleneck
              ? "border-rose-400 ring-2 ring-rose-300/50 bg-rose-50/30"
              : "border-[#E6DDCE] hover:border-[#9C5B3C]"
        }`}
      >
        <div className="flex items-center justify-between font-mono">
          <span className="font-black text-xs text-[#9C5B3C] bg-[#F6F1E8] px-2 py-0.5 rounded-lg border border-[#E6DDCE]">
            {ws.stationCode}
          </span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
            hasBottleneck ? "bg-rose-100 text-rose-800" : "bg-[#F6F1E8] text-[#8C7E6E]"
          }`}>
            {cycleSecs}s
          </span>
        </div>

        <div className="font-bold text-xs text-[#221912] truncate mt-1.5" title={ws.stationName}>
          {ws.stationName}
        </div>

        <div className="text-[10.5px] text-[#8C7E6E] truncate mt-0.5 flex items-center justify-between font-mono">
          <span className="truncate">{ws.primaryMachineType}</span>
          <span className="shrink-0 font-medium ml-1">({ws.allocatedOperators} op)</span>
        </div>

        {hasBottleneck ? (
          <div className="mt-2 pt-1.5 border-t border-rose-200 flex items-center gap-1 text-[9.5px] font-bold text-rose-700">
            <Zap className="w-3 h-3 fill-current text-rose-600" />
            <span>Pacing Bottleneck</span>
          </div>
        ) : ws.workstationType === "combined" ? (
          <div className="mt-2 pt-1.5 border-t border-amber-200 flex items-center gap-1 text-[9.5px] font-bold text-amber-700">
            <Scissors className="w-3 h-3" />
            <span>Combined Ops</span>
          </div>
        ) : (
          <div className="mt-2 pt-1.5 border-t border-stone-100 flex items-center justify-between text-[9.5px] font-mono text-[#8C7E6E]">
            <span>T_i: {(ws.theoreticalManning || (ws.totalStationSmv / scenario.pitchTime)).toFixed(2)}</span>
            <span className="text-emerald-700 font-bold">Standard</span>
          </div>
        )}
      </div>
    );
  }

  // Parallel Split Group (e.g. WS-02A & WS-02B)
  return (
    <div className="p-2.5 rounded-2xl border-2 border-indigo-200 bg-indigo-50/30 shrink-0 space-y-2">
      <div className="flex items-center justify-between px-1">
        <span className="flex items-center gap-1 text-[9.5px] font-mono font-bold text-indigo-900 uppercase">
          <GitFork className="w-3 h-3 text-indigo-600" />
          <span>Parallel Split ({group.stations.length} Benches)</span>
        </span>
        <span className="text-[9.5px] font-mono font-bold text-indigo-600 bg-white px-1.5 py-0.2 rounded border border-indigo-100">
          {Math.round(100 / group.stations.length)}% each
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        {group.stations.map((subStation) => {
          const isSelected = selectedStation?.stationCode === subStation.stationCode;
          const cycleSecs = (subStation.effectiveCycleTime * 60).toFixed(1);

          return (
            <div
              key={subStation.stationCode}
              onClick={() => onSelectStation(subStation)}
              className={`w-48 sm:w-52 p-2.5 bg-white rounded-xl border transition-all cursor-pointer shadow-2xs hover:shadow-xs ${
                isSelected
                  ? "border-[#9C5B3C] ring-2 ring-[#9C5B3C]/40 shadow-md"
                  : "border-indigo-200 hover:border-[#9C5B3C]"
              }`}
            >
              <div className="flex items-center justify-between font-mono">
                <span className="font-black text-xs text-[#9C5B3C] bg-[#F6F1E8] px-1.5 py-0.2 rounded border border-[#E6DDCE]">
                  {subStation.stationCode}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-[#F6F1E8] text-[#8C7E6E]">
                  {cycleSecs}s
                </span>
              </div>
              <div className="font-bold text-[11px] text-[#221912] truncate mt-1">
                {subStation.stationName}
              </div>
              <div className="text-[10px] text-[#8C7E6E] truncate mt-0.5 flex items-center justify-between font-mono">
                <span className="truncate">{subStation.primaryMachineType}</span>
                <span className="shrink-0 font-medium ml-1">(1 op)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
