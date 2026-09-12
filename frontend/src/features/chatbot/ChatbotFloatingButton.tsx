import React, { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface ChatbotFloatingButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

export const ChatbotFloatingButton: React.FC<ChatbotFloatingButtonProps> = ({ onClick, isOpen }) => {
  const [isDragging, setIsDragging] = useState(false);

  if (isOpen) return null;

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0.08}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => {
        // Small delay to prevent click firing at the end of a drag movement
        setTimeout(() => setIsDragging(false), 120);
      }}
      whileHover={{ scale: 1.03 }}
      whileDrag={{ scale: 1.08, zIndex: 100 }}
      className="fixed bottom-6 right-6 z-40 touch-none select-none"
    >
      <button
        type="button"
        onClick={() => {
          if (!isDragging) {
            onClick();
          }
        }}
        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#9C5B3C] via-[#8B4E32] to-[#723E28] hover:from-[#8B4E32] hover:to-[#5E321F] text-white rounded-full shadow-2xl hover:shadow-3xl transition-shadow duration-200 cursor-grab active:cursor-grabbing border border-[#B36F4D]/60 relative backdrop-blur-xs"
        title="SewNexa AI"
      >
        <Sparkles className="h-4 w-4 text-amber-200 group-hover:rotate-12 transition-transform duration-300 shrink-0" />
        <span className="text-xs font-bold tracking-wide select-none">SewNexa AI</span>
      </button>
    </motion.div>
  );
};
