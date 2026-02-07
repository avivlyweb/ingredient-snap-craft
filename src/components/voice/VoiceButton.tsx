import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { VoiceAssistant } from "./VoiceAssistant";
import { Mic } from "lucide-react";

interface VoiceButtonProps {
  recoveryContext?: {
    contextType?: string;
    proteinTarget?: number;
    calorieTarget?: number;
  };
}

export function VoiceButton({ recoveryContext }: VoiceButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              size="lg"
              className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-shadow"
              onClick={() => setIsOpen(true)}
            >
              <Mic className="w-6 h-6" />
              <span className="sr-only">Open voice assistant</span>
            </Button>
            
            {/* Pulse animation */}
            <motion.div
              className="absolute inset-0 rounded-full bg-primary/30 -z-10"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice Assistant Panel */}
      <VoiceAssistant
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        recoveryContext={recoveryContext}
      />
    </>
  );
}
