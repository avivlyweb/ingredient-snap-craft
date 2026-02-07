import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface VoiceConversationOptions {
  onTranscript?: (text: string, isFinal: boolean) => void;
  onAIResponse?: (text: string) => void;
  onToolCall?: (toolName: string, args: Record<string, unknown>) => void;
  onError?: (error: Error) => void;
  recoveryContext?: {
    contextType?: string;
    proteinTarget?: number;
    calorieTarget?: number;
  };
}

interface VoiceConversationState {
  isConnected: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  isConnecting: boolean;
  error: string | null;
}

export function useVoiceConversation(options: VoiceConversationOptions = {}) {
  const [state, setState] = useState<VoiceConversationState>({
    isConnected: false,
    isListening: false,
    isSpeaking: false,
    isConnecting: false,
    error: null,
  });

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Clean up resources
  const cleanup = useCallback(() => {
    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setState(prev => ({
      ...prev,
      isConnected: false,
      isListening: false,
      isSpeaking: false,
    }));
  }, []);

  // Handle tool calls from the AI
  const handleToolCall = useCallback(async (toolName: string, args: Record<string, unknown>, transcript?: string) => {
    options.onToolCall?.(toolName, args);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.warn("No user session - cannot log health data");
        return { success: false, error: "User not authenticated" };
      }

      // Map tool names to log types
      const logTypeMap: Record<string, string> = {
        log_food: "food",
        log_activity: "activity",
        log_symptom: "symptom",
      };

      const logType = logTypeMap[toolName];
      if (!logType) {
        console.warn("Unknown tool:", toolName);
        return { success: false, error: "Unknown tool" };
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-log-health`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            logType,
            data: args,
            transcript,
          }),
        }
      );

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Failed to log health data:", error);
      return { success: false, error: String(error) };
    }
  }, [options]);

  // Connect to OpenAI Realtime API
  const connect = useCallback(async () => {
    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 24000,
        } 
      });
      streamRef.current = stream;

      // Get ephemeral token from edge function
      const { data: sessionData, error: sessionError } = await supabase.functions.invoke(
        "openai-realtime-session",
        {
          body: {
            voice: "shimmer", // Warm, empathetic voice
            recoveryContext: options.recoveryContext,
          },
        }
      );

      if (sessionError || !sessionData?.client_secret) {
        throw new Error(sessionError?.message || "Failed to get session token");
      }

      // Create peer connection
      const pc = new RTCPeerConnection();
      peerConnectionRef.current = pc;

      // Set up audio output
      const audioEl = new Audio();
      audioEl.autoplay = true;
      
      pc.ontrack = (event) => {
        audioEl.srcObject = event.streams[0];
        setState(prev => ({ ...prev, isSpeaking: true }));
      };

      // Add microphone track
      const audioTrack = stream.getAudioTracks()[0];
      pc.addTrack(audioTrack, stream);

      // Set up data channel for events
      const dc = pc.createDataChannel("oai-events");
      dataChannelRef.current = dc;

      dc.onopen = () => {
        setState(prev => ({ ...prev, isConnected: true, isListening: true }));
      };

      dc.onmessage = async (event) => {
        try {
          const message = JSON.parse(event.data);
          
          switch (message.type) {
            case "conversation.item.input_audio_transcription.completed":
              options.onTranscript?.(message.transcript, true);
              break;
              
            case "response.audio_transcript.delta":
              options.onAIResponse?.(message.delta);
              break;
              
            case "response.audio.started":
              setState(prev => ({ ...prev, isSpeaking: true }));
              break;
              
            case "response.audio.done":
              setState(prev => ({ ...prev, isSpeaking: false }));
              break;
              
            case "response.function_call_arguments.done":
              if (message.name && message.arguments) {
                try {
                  const args = JSON.parse(message.arguments);
                  const result = await handleToolCall(message.name, args);
                  
                  // Send tool result back to AI
                  if (dc.readyState === "open") {
                    dc.send(JSON.stringify({
                      type: "conversation.item.create",
                      item: {
                        type: "function_call_output",
                        call_id: message.call_id,
                        output: JSON.stringify(result),
                      },
                    }));
                    dc.send(JSON.stringify({ type: "response.create" }));
                  }
                } catch (e) {
                  console.error("Failed to parse tool call args:", e);
                }
              }
              break;
              
            case "input_audio_buffer.speech_started":
              setState(prev => ({ ...prev, isListening: true }));
              break;
              
            case "input_audio_buffer.speech_stopped":
              setState(prev => ({ ...prev, isListening: false }));
              break;
          }
        } catch (e) {
          console.error("Failed to parse message:", e);
        }
      };

      dc.onerror = (error) => {
        console.error("Data channel error:", error);
        options.onError?.(new Error("Connection error"));
      };

      dc.onclose = () => {
        setState(prev => ({ ...prev, isConnected: false, isListening: false }));
      };

      // Create and set local description
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Connect to OpenAI Realtime
      const baseUrl = "https://api.openai.com/v1/realtime";
      const model = "gpt-4o-realtime-preview-2024-12-17";
      
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sessionData.client_secret.value}`,
          "Content-Type": "application/sdp",
        },
        body: offer.sdp,
      });

      if (!sdpResponse.ok) {
        throw new Error(`Failed to connect: ${sdpResponse.status}`);
      }

      const answerSdp = await sdpResponse.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

      setState(prev => ({ ...prev, isConnecting: false }));
    } catch (error) {
      console.error("Connection error:", error);
      cleanup();
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: error instanceof Error ? error.message : "Connection failed",
      }));
      options.onError?.(error instanceof Error ? error : new Error("Connection failed"));
    }
  }, [cleanup, handleToolCall, options]);

  // Disconnect from the session
  const disconnect = useCallback(() => {
    cleanup();
  }, [cleanup]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    ...state,
    connect,
    disconnect,
  };
}
