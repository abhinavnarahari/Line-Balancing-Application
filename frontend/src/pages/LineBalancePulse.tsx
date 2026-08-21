import { motion } from "framer-motion";

interface LineBalancePulseProps {
  className?: string;
}

export function LineBalancePulse({ className }: LineBalancePulseProps) {
  return (
    <div className={className} aria-hidden="true">
      <svg viewBox="0 0 244 128" className="w-full h-full overflow-visible">
        
        {/* Soft background spotlight */}
        <circle cx="110" cy="64" r="50" fill="#D89A5C" fillOpacity="0.08" filter="blur(8px)" />

        {/* --- THE OPERATOR (PERSON) --- */}
        {/* Torso/Shirt */}
        <path 
          d="M 160 128 L 160 65 Q 165 40 190 35 L 220 35 Q 240 35 244 55 L 244 128 Z" 
          fill="#E9E1CC" 
          stroke="#E0D8C0" 
          strokeWidth="2" 
        />
        {/* Head/Face Silhouette */}
        <circle cx="205" cy="22" r="14" fill="#D89A5C" />
        {/* Hair / Bun */}
        <circle cx="218" cy="15" r="7" fill="#8B4A3C" />
        
        {/* Left Arm (Background) guiding fabric behind needle */}
        <g opacity="0.6">
          <path d="M 175 60 Q 120 50 85 75" fill="none" stroke="#C08A4E" strokeWidth="6" strokeLinecap="round" />
          <circle cx="83" cy="76" r="3" fill="#C08A4E" />
        </g>

        {/* --- THE DRESS / FABRIC --- */}
        {/* Flowing, thick path representing the dress being sewn */}
        <motion.path
          d="M 230 135 C 190 100 130 87 45 87 C 20 87 0 97 -20 107"
          fill="none"
          stroke="#3C5245" /* Deep sage green dress */
          strokeWidth="14"
          strokeOpacity="0.85"
          strokeLinecap="round"
          animate={{ d: [
            "M 230 135 C 190 100 130 87 45 87 C 20 87 0 97 -20 107",
            "M 230 130 C 190 105 130 87 45 87 C 20 87 0 95 -20 105",
            "M 230 135 C 190 100 130 87 45 87 C 20 87 0 97 -20 107"
          ] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* --- THE SEWING MACHINE --- */}
        {/* Table/Base */}
        <rect x="25" y="86" width="115" height="7" rx="2" fill="#26231D" />
        
        {/* Main Body (Pillar & Arm) */}
        <path 
          d="M 125 86 L 125 25 Q 125 15 110 15 L 55 15 Q 40 15 40 25 L 40 65" 
          fill="none" 
          stroke="#26231D" 
          strokeWidth="16" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
        
        {/* Hand Wheel (Spinning) */}
        <motion.circle 
          cx="135" cy="45" r="9" 
          fill="none" stroke="#8A8270" strokeWidth="3" strokeDasharray="6 4"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.4, repeat: Infinity, ease: "linear" }}
          style={{ originX: "135px", originY: "45px" }}
        />

        {/* Thread Spool on top */}
        <rect x="95" y="0" width="4" height="15" fill="#8A8270" rx="1" />
        <rect x="93" y="3" width="8" height="10" fill="#B8763F" rx="1" />
        
        {/* Thread feeding into machine */}
        <path d="M 95 5 L 95 0 Q 60 -5 45 60" fill="none" stroke="#B8763F" strokeWidth="1" />

        {/* Needle Mechanism (Rapidly moving up and down) */}
        <motion.g
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 0.15, repeat: Infinity, ease: "linear" }}
        >
          {/* Needle Bar */}
          <rect x="44" y="55" width="2" height="25" fill="#8A8270" rx="1" />
          {/* Sharp Needle Tip */}
          <path d="M 44 80 L 46 80 L 45 86 Z" fill="#6E6656" />
        </motion.g>

        {/* Motion/Speed lines around needle to give it energy */}
        <motion.path 
          d="M 34 75 L 34 60 M 30 70 L 30 65" 
          stroke="#8A8270" 
          strokeWidth="1" 
          strokeLinecap="round"
          animate={{ opacity: [0, 0.6, 0], y: [0, -4, 0] }}
          transition={{ duration: 0.15, repeat: Infinity, delay: 0.05 }}
        />

        {/* Dashed Stitches appearing on the fabric */}
        <motion.line
          x1="45" y1="85" x2="-20" y2="95"
          stroke="#B8763F"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          animate={{ strokeDashoffset: [0, -8] }}
          transition={{ duration: 0.3, repeat: Infinity, ease: "linear" }}
        />

        {/* --- OPERATOR RIGHT ARM (Foreground) --- */}
        {/* Right arm overlapping the fabric and machine to show depth */}
        <g strokeLinecap="round" strokeLinejoin="round">
          <path d="M 190 45 L 165 70" stroke="#D89A5C" strokeWidth="8" />
          <path d="M 165 70 Q 145 82 125 85" stroke="#D89A5C" strokeWidth="7" />
          <circle cx="122" cy="85" r="3.5" fill="#D89A5C" />
        </g>
      </svg>
    </div>
  );
}
