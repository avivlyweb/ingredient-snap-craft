import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, FileText, Shield } from "lucide-react";

interface MedicalDisclaimerProps {
  onAccept: () => void;
}

const MedicalDisclaimer = ({ onAccept }: MedicalDisclaimerProps) => {
  const [accepted, setAccepted] = useState(false);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full border-2 border-primary/20">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Post-Operative Recovery Support</CardTitle>
          <CardDescription className="text-base">
            Personalized nutrition guidance to support your recovery journey
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-foreground">Important Medical Disclaimer</p>
              <p className="text-muted-foreground">
                This tool provides general nutritional guidance and is <strong>not a substitute for professional medical advice</strong>. 
                Always consult with your healthcare team, dietitian, or physician before making changes to your diet, 
                especially during post-operative recovery.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <FileText className="w-4 h-4 text-secondary" />
              Evidence-Based Approach
            </h4>
            <p className="text-sm text-muted-foreground">
              Our recommendations are informed by clinical nutrition research, including guidelines for 
              protein intake (1.5g/kg body weight) and caloric needs during recovery. However, individual 
              requirements may vary based on your specific condition, medications, and medical history.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium">This tool can help you:</h4>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-secondary">✓</span>
                Calculate personalized protein and calorie targets based on your weight
              </li>
              <li className="flex items-start gap-2">
                <span className="text-secondary">✓</span>
                Find recipes designed for common recovery challenges (nausea, low appetite)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-secondary">✓</span>
                Track your daily nutritional progress toward recovery goals
              </li>
            </ul>
          </div>

          <div className="border-t pt-4 space-y-4">
            <div className="flex items-start gap-3">
              <Checkbox 
                id="accept" 
                checked={accepted} 
                onCheckedChange={(checked) => setAccepted(checked === true)}
              />
              <label 
                htmlFor="accept" 
                className="text-sm text-muted-foreground cursor-pointer leading-relaxed"
              >
                I understand that this tool provides general guidance only and does not replace professional 
                medical advice. I will consult my healthcare provider for personalized medical recommendations.
              </label>
            </div>

            <Button 
              onClick={onAccept} 
              disabled={!accepted}
              className="w-full"
              size="lg"
            >
              Continue to Recovery Support
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MedicalDisclaimer;
