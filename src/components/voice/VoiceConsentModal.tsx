import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Mic, ShieldCheck, MessageSquare } from "lucide-react";

interface VoiceConsentModalProps {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export function VoiceConsentModal({ open, onAccept, onDecline }: VoiceConsentModalProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-xl">
            <Mic className="w-5 h-5 text-primary" />
            Voice Assistant Privacy
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4 text-left">
              <p className="text-muted-foreground">
                ZorgAssistent uses voice to help track your recovery. Here's how it works:
              </p>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Mic className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Push-to-talk only</p>
                    <p className="text-sm text-muted-foreground">
                      Recording only happens while you hold the button
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ShieldCheck className="w-4 h-4 text-secondary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Audio is not stored</p>
                    <p className="text-sm text-muted-foreground">
                      Only text summaries are saved to track your progress
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MessageSquare className="w-4 h-4 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">You're in control</p>
                    <p className="text-sm text-muted-foreground">
                      You can delete your logs anytime from your profile
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel onClick={onDecline}>Not now</AlertDialogCancel>
          <AlertDialogAction onClick={onAccept}>
            I understand, enable voice
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
