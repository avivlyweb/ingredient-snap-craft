/**
 * Patient Day Data Entry Form
 *
 * UI scaffolding for the patient_day_data schema from the handoff doc.
 * Does NOT implement the clinical rule engine — placeholders mark where
 * rule outputs will be injected from code.
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Clipboard,
  Droplets,
  Drumstick,
  Flame,
  Footprints,
  Moon,
  Thermometer,
  Activity,
  AlertCircle,
  Save,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface PatientDayFormData {
  calendarDate: string;
  postopDay: number;
  cancerType: string;
  surgeryType: string;
  treatmentPhase: string;
  weightKg: string;
  proteinTargetG: number;
  calorieTargetKcal: number;
  proteinActualG: string;
  caloriesActualKcal: string;
  stepsActual: string;
  activityMinutes: string;
  sleepHours: string;
  hydrationMl: string;
  nauseaScore: number;
  painScore: number;
  fatigueScore: number;
  appetiteScore: number;
  vomitingFlag: boolean;
  constipationFlag: boolean;
  diarrheaFlag: boolean;
  feverFlag: boolean;
  freeTextNotes: string;
}

interface PatientDayDataEntryProps {
  proteinTarget?: number;
  calorieTarget?: number;
  onSave?: (data: PatientDayFormData) => void;
}

const treatmentPhases = [
  "pre_operative",
  "immediate_post_op",
  "early_recovery",
  "late_recovery",
  "adjuvant_therapy",
  "surveillance",
];

export function PatientDayDataEntry({
  proteinTarget = 0,
  calorieTarget = 0,
  onSave,
}: PatientDayDataEntryProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<PatientDayFormData>({
    calendarDate: new Date().toISOString().split("T")[0],
    postopDay: 0,
    cancerType: "",
    surgeryType: "",
    treatmentPhase: "early_recovery",
    weightKg: "",
    proteinTargetG: proteinTarget,
    calorieTargetKcal: calorieTarget,
    proteinActualG: "",
    caloriesActualKcal: "",
    stepsActual: "",
    activityMinutes: "",
    sleepHours: "",
    hydrationMl: "",
    nauseaScore: 0,
    painScore: 0,
    fatigueScore: 0,
    appetiteScore: 5,
    vomitingFlag: false,
    constipationFlag: false,
    diarrheaFlag: false,
    feverFlag: false,
    freeTextNotes: "",
  });

  const update = <K extends keyof PatientDayFormData>(field: K, value: PatientDayFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // TODO: Insert into patient_day_data table when created
      onSave?.(formData);
      toast.success("Patient day data saved");
    } catch {
      toast.error("Failed to save data");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
          <Clipboard className="w-6 h-6 text-primary" />
          Patient Day Data
        </h2>
        <p className="text-muted-foreground text-sm">
          One form per patient per calendar day
        </p>
      </div>

      {/* Clinical Context */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Clinical Context</CardTitle>
          <CardDescription>Patient and treatment details</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="calendar-date">Date</Label>
            <Input
              id="calendar-date"
              type="date"
              value={formData.calendarDate}
              onChange={(e) => update("calendarDate", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="postop-day">Post-op Day</Label>
            <Input
              id="postop-day"
              type="number"
              min={0}
              value={formData.postopDay}
              onChange={(e) => update("postopDay", parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cancer-type">Cancer Type</Label>
            <Input
              id="cancer-type"
              placeholder="e.g. colorectal, gastric"
              value={formData.cancerType}
              onChange={(e) => update("cancerType", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="surgery-type">Surgery Type</Label>
            <Input
              id="surgery-type"
              placeholder="e.g. resection, colostomy"
              value={formData.surgeryType}
              onChange={(e) => update("surgeryType", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="treatment-phase">Treatment Phase</Label>
            <Select
              value={formData.treatmentPhase}
              onValueChange={(v) => update("treatmentPhase", v)}
            >
              <SelectTrigger id="treatment-phase">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {treatmentPhases.map((phase) => (
                  <SelectItem key={phase} value={phase}>
                    {phase.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="weight-kg">Weight (kg)</Label>
            <Input
              id="weight-kg"
              type="number"
              step="0.1"
              placeholder="e.g. 75"
              value={formData.weightKg}
              onChange={(e) => update("weightKg", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Intake */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Drumstick className="w-4 h-4 text-secondary" /> Nutritional Intake
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="protein-actual">Protein (g)</Label>
            <Input
              id="protein-actual"
              type="number"
              placeholder={`Target: ${proteinTarget}g`}
              value={formData.proteinActualG}
              onChange={(e) => update("proteinActualG", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="calories-actual">Calories (kcal)</Label>
            <Input
              id="calories-actual"
              type="number"
              placeholder={`Target: ${calorieTarget}`}
              value={formData.caloriesActualKcal}
              onChange={(e) => update("caloriesActualKcal", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hydration">
              <Droplets className="w-3 h-3 inline mr-1" />
              Hydration (ml)
            </Label>
            <Input
              id="hydration"
              type="number"
              placeholder="e.g. 1500"
              value={formData.hydrationMl}
              onChange={(e) => update("hydrationMl", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Activity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" /> Activity & Sleep
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="steps">
              <Footprints className="w-3 h-3 inline mr-1" /> Steps
            </Label>
            <Input
              id="steps"
              type="number"
              placeholder="e.g. 1200"
              value={formData.stepsActual}
              onChange={(e) => update("stepsActual", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="activity-minutes">Activity (min)</Label>
            <Input
              id="activity-minutes"
              type="number"
              placeholder="e.g. 15"
              value={formData.activityMinutes}
              onChange={(e) => update("activityMinutes", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sleep-hours">
              <Moon className="w-3 h-3 inline mr-1" /> Sleep (hrs)
            </Label>
            <Input
              id="sleep-hours"
              type="number"
              step="0.5"
              placeholder="e.g. 7"
              value={formData.sleepHours}
              onChange={(e) => update("sleepHours", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Symptoms */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-destructive" /> Symptoms
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sliders */}
          {[
            { key: "nauseaScore" as const, label: "Nausea", max: 10 },
            { key: "painScore" as const, label: "Pain", max: 10 },
            { key: "fatigueScore" as const, label: "Fatigue", max: 10 },
            { key: "appetiteScore" as const, label: "Appetite", max: 10 },
          ].map(({ key, label, max }) => (
            <div key={key} className="space-y-2">
              <div className="flex justify-between text-sm">
                <Label>{label}</Label>
                <span className="font-medium">{formData[key]} / {max}</span>
              </div>
              <Slider
                min={0}
                max={max}
                step={1}
                value={[formData[key]]}
                onValueChange={([v]) => update(key, v)}
              />
            </div>
          ))}

          <Separator />

          {/* Flags */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: "vomitingFlag" as const, label: "Vomiting" },
              { key: "constipationFlag" as const, label: "Constipation" },
              { key: "diarrheaFlag" as const, label: "Diarrhea" },
              { key: "feverFlag" as const, label: "Fever" },
            ].map(({ key, label }) => (
              <label
                key={key}
                className="flex items-center gap-2 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <Checkbox
                  checked={formData[key]}
                  onCheckedChange={(checked) => update(key, !!checked)}
                />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>

          {/* Safety escalation placeholder */}
          {(formData.feverFlag || (formData.vomitingFlag && formData.nauseaScore >= 6)) && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30">
              <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-destructive">Safety escalation may be needed</p>
                <p className="text-muted-foreground mt-1">
                  {/* PLACEHOLDER: Rule engine output will be injected here */}
                  Based on reported symptoms, consider clinical review. Final recommendation pending rule-engine evaluation.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Free-text observations..."
            value={formData.freeTextNotes}
            onChange={(e) => update("freeTextNotes", e.target.value)}
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Rule Engine Output Placeholder */}
      <Card className="border-dashed border-2 border-muted-foreground/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-muted-foreground flex items-center gap-2">
            <Flame className="w-4 h-4" />
            Recommended Action
          </CardTitle>
          <CardDescription>
            Populated by the clinical rule engine (not yet connected)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-muted-foreground">main_problem: —</Badge>
            <Badge variant="outline" className="text-muted-foreground">urgency: —</Badge>
            <Badge variant="outline" className="text-muted-foreground">best_action: —</Badge>
          </div>
          <p className="text-xs text-muted-foreground italic">
            Placeholder — rule outputs from <code>reasoning_rules</code> and <code>evidence_sources</code> tables will be rendered here.
          </p>
        </CardContent>
      </Card>

      {/* Save */}
      <Button onClick={handleSave} disabled={isSaving} size="lg" className="w-full">
        {isSaving ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
          </>
        ) : (
          <>
            <Save className="w-4 h-4 mr-2" /> Save Patient Day Data
          </>
        )}
      </Button>
    </div>
  );
}
