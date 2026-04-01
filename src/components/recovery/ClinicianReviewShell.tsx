/**
 * Clinician Review Dashboard Shell
 * 
 * Lists patient-day entries for review and labeling.
 * UI scaffolding only — no rule-engine logic.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Stethoscope,
  ClipboardCheck,
  AlertTriangle,
  Save,
} from "lucide-react";
import { useState } from "react";

const mainProblems = [
  "protein_intake_low",
  "calorie_intake_low",
  "combined_low_intake",
  "low_activity",
  "high_symptom_burden",
  "nausea_limiting_intake",
  "pain_limiting_activity",
  "fatigue_limiting_intake_or_activity",
  "low_appetite_limiting_intake",
  "possible_dehydration",
  "safety_escalation_needed",
  "stable_progress",
  "insufficient_data",
];

const urgencyLevels = ["routine", "same_day_attention", "urgent_clinical_review"];

const bestActions = [
  "encourage_high_protein_snack",
  "recommend_high_energy_small_meal",
  "suggest_protein_shake_or_oral_nutrition_supplement",
  "recommend_short_walk",
  "recommend_light_activity_breaks",
  "suggest_rest_and_recovery_pacing",
  "suggest_nausea_friendly_foods",
  "suggest_low_effort_meal_strategy",
  "prompt_hydration_support",
  "prompt_symptom_check_in",
  "alert_care_team",
  "dietitian_referral",
  "physio_or_activity_adjustment",
  "no_change_continue_plan",
];

export function ClinicianReviewShell() {
  const [mainProblem, setMainProblem] = useState("");
  const [urgency, setUrgency] = useState("");
  const [bestAction, setBestAction] = useState("");
  const [confidence, setConfidence] = useState(3);
  const [reason, setReason] = useState("");

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
          <Stethoscope className="w-6 h-6 text-secondary" />
          Clinician Review
        </h2>
        <p className="text-muted-foreground text-sm">
          Label patient-day entries for clinical validation
        </p>
      </div>

      {/* Placeholder for patient-day list */}
      <Card className="border-dashed border-2 border-muted-foreground/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-muted-foreground">Patient-Day List</CardTitle>
          <CardDescription>
            Patient-day records will appear here once the <code>patient_day_data</code> table is populated.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground text-sm">
            No patient-day records available yet.
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Labeling form based on patient_day_labels schema */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-primary" />
            Clinician Label
          </CardTitle>
          <CardDescription>
            Classify the selected patient-day for validation studies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Main Problem</Label>
              <Select value={mainProblem} onValueChange={setMainProblem}>
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {mainProblems.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Urgency</Label>
              <Select value={urgency} onValueChange={setUrgency}>
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {urgencyLevels.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>Best Action</Label>
              <Select value={bestAction} onValueChange={setBestAction}>
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {bestActions.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <Label>Clinician Confidence</Label>
              <span className="font-medium">{confidence} / 5</span>
            </div>
            <Slider min={1} max={5} step={1} value={[confidence]} onValueChange={([v]) => setConfidence(v)} />
          </div>

          <div className="space-y-2">
            <Label>Reason for Best Action</Label>
            <Textarea
              placeholder="Why is this the best action for this patient-day?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          {/* Algorithm comparison placeholder */}
          <div className="p-4 rounded-lg bg-muted/30 border border-dashed space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="w-4 h-4" />
              Algorithm vs Clinician Comparison
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-muted-foreground">agreement_class: —</Badge>
              <Badge variant="outline" className="text-muted-foreground">unsafe_mismatch: —</Badge>
            </div>
            <p className="text-xs text-muted-foreground italic">
              Populated after rule engine produces its prediction for this patient-day.
            </p>
          </div>

          <Button className="w-full" disabled>
            <Save className="w-4 h-4 mr-2" />
            Save Label (pending table creation)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
