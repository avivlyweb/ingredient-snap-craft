import { motion } from "framer-motion";

interface VoiceWaveformProps {
  isActive: boolean;
  isSpeaking: boolean;
}

export function VoiceWaveform({ isActive, isSpeaking }: VoiceWaveformProps) {
  const barCount = 5;
  
  return (
    <div className="flex items-center justify-center gap-1 h-8">
      {Array.from({ length: barCount }).map((_, i) => (
        <motion.div
          key={i}
          className={`w-1 rounded-full ${
            isSpeaking 
              ? "bg-secondary" 
              : isActive 
                ? "bg-primary" 
                : "bg-muted-foreground/30"
          }`}
          animate={
            isActive
              ? {
                  height: [8, 24 + Math.random() * 8, 12, 28 + Math.random() * 4, 8],
                }
              : { height: 8 }
          }
          transition={
            isActive
              ? {
                  duration: 0.8 + Math.random() * 0.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.1,
                }
              : { duration: 0.3 }
          }
        />
      ))}
    </div>
  );
}
