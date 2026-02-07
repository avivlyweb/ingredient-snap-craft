import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useVoiceConversation } from "@/hooks/useVoiceConversation";
import { VoiceWaveform } from "./VoiceWaveform";
import { VoiceConsentModal } from "./VoiceConsentModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mic, MicOff, X, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface VoiceAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  recoveryContext?: {
    contextType?: string;
    proteinTarget?: number;
    calorieTarget?: number;
  };
}

interface TranscriptEntry {
  id: string;
  type: "user" | "assistant" | "tool";
  text: string;
  timestamp: Date;
}

export function VoiceAssistant({ isOpen, onClose, recoveryContext }: VoiceAssistantProps) {
  const [showConsent, setShowConsent] = useState(() => {
    return !localStorage.getItem("voiceConsentAccepted");
  });
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [currentAIResponse, setCurrentAIResponse] = useState("");

  const addTranscript = useCallback((type: TranscriptEntry["type"], text: string) => {
    setTranscripts(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type,
        text,
        timestamp: new Date(),
      },
    ]);
  }, []);

  const { 
    isConnected, 
    isListening, 
    isSpeaking, 
    isConnecting, 
    error,
    connect, 
    disconnect 
  } = useVoiceConversation({
    recoveryContext,
    onTranscript: (text, isFinal) => {
      if (isFinal && text.trim()) {
        addTranscript("user", text);
      }
    },
    onAIResponse: (delta) => {
      setCurrentAIResponse(prev => prev + delta);
    },
    onToolCall: (toolName, args) => {
      const toolMessages: Record<string, string> = {
        log_food: `📝 Logged food: ${(args.items as string[])?.join(", ") || "items"}`,
        log_activity: `🏃 Logged activity: ${args.activity_type}`,
        log_symptom: `💊 Logged symptoms`,
      };
      const message = toolMessages[toolName] || `Tool: ${toolName}`;
      addTranscript("tool", message);
    },
    onError: (err) => {
      toast.error(err.message || "Voice connection failed");
    },
  });

  // When AI finishes speaking, commit the response
  const handleAIResponseComplete = useCallback(() => {
    if (currentAIResponse.trim()) {
      addTranscript("assistant", currentAIResponse);
      setCurrentAIResponse("");
    }
  }, [currentAIResponse, addTranscript]);

  // Check when speaking stops to commit response
  if (!isSpeaking && currentAIResponse) {
    handleAIResponseComplete();
  }

  const handleConsentAccept = () => {
    localStorage.setItem("voiceConsentAccepted", "true");
    setShowConsent(false);
    connect();
  };

  const handleConsentDecline = () => {
    setShowConsent(false);
    onClose();
  };

  const handleToggleConnection = () => {
    if (isConnected) {
      disconnect();
    } else {
      if (showConsent) {
        setShowConsent(true);
      } else {
        connect();
      }
    }
  };

  const handleClose = () => {
    disconnect();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <VoiceConsentModal 
        open={showConsent && isOpen} 
        onAccept={handleConsentAccept}
        onDecline={handleConsentDecline}
      />

      <AnimatePresence>
        {isOpen && !showConsent && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-4 z-50 w-80 md:w-96"
          >
            <Card className="shadow-2xl border-2">
              <CardContent className="p-4 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      isConnected ? "bg-green-500" : "bg-muted-foreground"
                    }`} />
                    <span className="font-medium text-sm">
                      ZorgAssistent
                    </span>
                    {isConnected && (
                      <Badge variant="outline" className="text-xs">
                        {isSpeaking ? "Speaking" : isListening ? "Listening" : "Ready"}
                      </Badge>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleClose}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Error display */}
                {error && (
                  <div className="flex items-center gap-2 p-2 bg-destructive/10 text-destructive rounded-md text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    {error}
                  </div>
                )}

                {/* Transcript area */}
                <ScrollArea className="h-48 rounded-md border bg-muted/30 p-3">
                  {transcripts.length === 0 && !isConnected ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm text-center">
                      <p>Press the microphone button to start talking with ZorgAssistent</p>
                    </div>
                  ) : transcripts.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm text-center">
                      <p>Say something like:<br/>"I had eggs for breakfast"<br/>or "I walked for 10 minutes"</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {transcripts.map((entry) => (
                        <div
                          key={entry.id}
                          className={`text-sm ${
                            entry.type === "user" 
                              ? "text-foreground" 
                              : entry.type === "assistant"
                                ? "text-muted-foreground italic"
                                : "text-secondary text-xs"
                          }`}
                        >
                          {entry.type === "user" && <span className="font-medium">You: </span>}
                          {entry.type === "assistant" && <span className="font-medium">ZorgAssistent: </span>}
                          {entry.text}
                        </div>
                      ))}
                      {currentAIResponse && (
                        <div className="text-sm text-muted-foreground italic">
                          <span className="font-medium">ZorgAssistent: </span>
                          {currentAIResponse}
                        </div>
                      )}
                    </div>
                  )}
                </ScrollArea>

                {/* Waveform */}
                <div className="flex justify-center py-2">
                  <VoiceWaveform 
                    isActive={isConnected && (isListening || isSpeaking)} 
                    isSpeaking={isSpeaking}
                  />
                </div>

                {/* Controls */}
                <div className="flex justify-center">
                  <Button
                    size="lg"
                    variant={isConnected ? "destructive" : "default"}
                    className="rounded-full w-16 h-16"
                    onClick={handleToggleConnection}
                    disabled={isConnecting}
                  >
                    {isConnecting ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : isConnected ? (
                      <MicOff className="w-6 h-6" />
                    ) : (
                      <Mic className="w-6 h-6" />
                    )}
                  </Button>
                </div>

                <p className="text-xs text-center text-muted-foreground">
                  {isConnected 
                    ? "Click to disconnect" 
                    : "Click to start conversation"}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
