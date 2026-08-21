import { motion } from "framer-motion";

interface YamazumiChartProps {
  data: {
    stationNumber: number;
    actualTime: number;
    operatorName?: string;
  }[];
  taktTime: number;
}

export function YamazumiChart({ data, taktTime }: YamazumiChartProps) {
  // Find the maximum time to scale the chart properly (either takt time or the max actual time)
  const maxTime = Math.max(taktTime, ...data.map(d => d.actualTime)) * 1.2; // Add 20% headroom
  
  if (data.length === 0 || maxTime === 0) return null;

  // Calculate the Y position for the Takt Time line (0 is bottom, 100% is top)
  const taktTimePercent = (taktTime / maxTime) * 100;

  return (
    <div className="bg-white border border-[#E0D8C0] shadow-sm p-6 h-[400px] flex flex-col relative">
      <h3 className="font-serif text-xl text-[#26231D] mb-6">Line Balance (Yamazumi)</h3>
      
      <div className="flex-1 relative flex items-end justify-between px-4 pb-8 pt-4">
        
        {/* Takt Time Line */}
        <div 
          className="absolute left-0 right-0 border-t-2 border-dashed border-[#8B4A3C] z-10 flex items-end transition-all duration-500"
          style={{ bottom: `calc(${taktTimePercent}% + 32px)` }}
        >
          <span className="absolute -top-6 right-0 text-xs font-semibold text-[#8B4A3C] bg-white px-2">
            Takt Time: {taktTime.toFixed(2)}m
          </span>
        </div>

        {/* Y-Axis scale markers (rough approximations for visual aid) */}
        <div className="absolute left-0 top-0 bottom-8 border-r border-[#E0D8C0] w-8 flex flex-col justify-between text-[10px] text-[#8A8270] pb-2 pt-4">
          <span>{maxTime.toFixed(1)}</span>
          <span>{(maxTime/2).toFixed(1)}</span>
          <span>0</span>
        </div>

        {/* Bars */}
        <div className="flex-1 flex justify-around items-end h-full ml-10 z-0 gap-2">
          {data.map((station) => {
            const heightPercent = (station.actualTime / maxTime) * 100;
            const isBottleneck = station.actualTime > taktTime;
            const isUnassigned = station.actualTime === 0;

            return (
              <div key={station.stationNumber} className="relative flex flex-col items-center group w-full max-w-[60px] h-full justify-end">
                {/* Tooltip on hover */}
                <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-[#26231D] text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-20 pointer-events-none">
                  {station.operatorName || "Unassigned"}<br/>
                  {station.actualTime.toFixed(2)} min
                </div>

                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${heightPercent}%` }}
                  transition={{ type: "spring", stiffness: 60, damping: 15 }}
                  className={`w-full max-w-[40px] rounded-t-sm shadow-sm ${
                    isUnassigned ? 'bg-transparent' :
                    isBottleneck ? 'bg-[#D89A5C]' : 'bg-[#3C5245]'
                  }`}
                  style={{
                    opacity: isUnassigned ? 0 : 1
                  }}
                >
                  {/* Highlight the portion above takt time in a different color */}
                  {isBottleneck && (
                    <motion.div 
                      className="w-full bg-[#8B4A3C] rounded-t-sm"
                      initial={{ height: 0 }}
                      animate={{ height: `${((station.actualTime - taktTime) / station.actualTime) * 100}%` }}
                      transition={{ delay: 0.3 }}
                    />
                  )}
                </motion.div>
                
                {/* Station Label */}
                <div className="absolute -bottom-6 text-[10px] font-mono text-[#6E6656]">
                  ST-{station.stationNumber}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
