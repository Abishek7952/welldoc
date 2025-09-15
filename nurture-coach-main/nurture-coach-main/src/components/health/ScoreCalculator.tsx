// src/components/health/ScoreCalculator.tsx

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiService, ScoreRequest, ScoreResponse } from "@/lib/api";
import { Calculator, TrendingUp, AlertCircle } from "lucide-react";

interface ScoreCalculatorProps {
  ageGroup: "child" | "adult" | "senior";
}

const ScoreCalculator = ({ ageGroup }: ScoreCalculatorProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [scoreResult, setScoreResult] = useState<ScoreResponse | null>(null);
  const [formData, setFormData] = useState({
    // Basic patient info
    patientId: 1,
    
    // Diabetes baseline features
    gender: "Male",
    age: 35,
    hypertension: 0,
    heartDisease: 0,
    smokingHistory: "never",
    bmi: 25.0,
    hba1cLevel: 5.5,
    bloodGlucoseLevel: 100,
    
    // Glucose realtime features (simplified for demo)
    meanGlucWeak: 120.0,
    stdGluc: 15.0,
    cov: 0.125,
    iqr: 20.0,
    meanSlope: 0.5,
    maxSlope: 2.0,
    skew: 0.3,
    kurtosis: 2.8,
    pctAbove140: 10.0,
    circadianDiff: 5.0,
    sampEntropy: 1.2,
    medianRise: 3.0,
    shortSpikes: 2,
    sustainedSpikes: 1,
    
    // Hypertension features (placeholder)
    placeholderFeature1: 1.0,
    placeholderFeature2: 1,
    
    // Heart disease features (placeholder)
    placeholderFeatureA: 1.0,
    placeholderFeatureB: "normal"
  });

  const generateGlucoseSequence = (): number[] => {
    // Generate a realistic 96-point glucose sequence (24 hours, 15-min intervals)
    const sequence: number[] = [];
    const baseGlucose = formData.bloodGlucoseLevel;
    
    for (let i = 0; i < 96; i++) {
      // Simulate circadian rhythm and meal effects
      const hour = (i * 0.25) % 24;
      let glucose = baseGlucose;
      
      // Add circadian variation
      glucose += 10 * Math.sin((hour - 6) * Math.PI / 12);
      
      // Add meal spikes (breakfast, lunch, dinner)
      if ((hour >= 7 && hour <= 9) || (hour >= 12 && hour <= 14) || (hour >= 18 && hour <= 20)) {
        glucose += 20 + Math.random() * 30;
      }
      
      // Add some random variation
      glucose += (Math.random() - 0.5) * 20;
      
      // Ensure reasonable bounds
      glucose = Math.max(70, Math.min(300, glucose));
      sequence.push(Math.round(glucose));
    }
    
    return sequence;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const scoreRequest: ScoreRequest = {
        patient_id: formData.patientId,
        diabetes_baseline_features: {
          gender: formData.gender,
          age: formData.age,
          hypertension: formData.hypertension,
          heart_disease: formData.heartDisease,
          smoking_history: formData.smokingHistory,
          bmi: formData.bmi,
          HbA1c_level: formData.hba1cLevel,
          blood_glucose_level: formData.bloodGlucoseLevel
        },
        glucose_realtime_features: {
          mean_gluc_weak: formData.meanGlucWeak,
          std_gluc: formData.stdGluc,
          cov: formData.cov,
          iqr: formData.iqr,
          mean_slope: formData.meanSlope,
          max_slope: formData.maxSlope,
          skew: formData.skew,
          kurtosis: formData.kurtosis,
          pct_above_140: formData.pctAbove140,
          circadian_diff: formData.circadianDiff,
          samp_entropy: formData.sampEntropy,
          median_rise: formData.medianRise,
          short_spikes: formData.shortSpikes,
          sustained_spikes: formData.sustainedSpikes,
          glucose_sequence: generateGlucoseSequence()
        },
        hypertension_features: {
          placeholder_feature_1: formData.placeholderFeature1,
          placeholder_feature_2: formData.placeholderFeature2
        },
        heart_disease_features: {
          placeholder_feature_a: formData.placeholderFeatureA,
          placeholder_feature_b: formData.placeholderFeatureB
        }
      };

      const result = await apiService.getScore(scoreRequest);
      setScoreResult(result);
      
      toast({
        title: "Score calculated successfully!",
        description: "Your health risk assessment has been updated.",
      });
    } catch (error) {
      toast({
        title: "Score calculation failed",
        description: error instanceof Error ? error.message : "Failed to calculate score",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (ageGroup) {
      case "child":
        return "🎯 Health Check Calculator";
      case "senior":
        return "Health Risk Assessment";
      default:
        return "Get Your Health Score";
    }
  };

  return (
    <div className="space-y-6">
      <Card className="health-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calculator className="h-5 w-5" />
            <span>{getTitle()}</span>
          </CardTitle>
          <CardDescription>
            {ageGroup === "child" 
              ? "Let's check how healthy you are!" 
              : "Enter your health information to get a personalized risk assessment"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                  min="1"
                  max="120"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bmi">BMI</Label>
                <Input
                  id="bmi"
                  type="number"
                  step="0.1"
                  value={formData.bmi}
                  onChange={(e) => setFormData({ ...formData, bmi: parseFloat(e.target.value) || 0 })}
                  min="10"
                  max="50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hba1c">HbA1c Level</Label>
                <Input
                  id="hba1c"
                  type="number"
                  step="0.1"
                  value={formData.hba1cLevel}
                  onChange={(e) => setFormData({ ...formData, hba1cLevel: parseFloat(e.target.value) || 0 })}
                  min="3"
                  max="15"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="glucose">Blood Glucose Level</Label>
                <Input
                  id="glucose"
                  type="number"
                  value={formData.bloodGlucoseLevel}
                  onChange={(e) => setFormData({ ...formData, bloodGlucoseLevel: parseInt(e.target.value) || 0 })}
                  min="50"
                  max="400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="smoking">Smoking History</Label>
                <Select value={formData.smokingHistory} onValueChange={(value) => setFormData({ ...formData, smokingHistory: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">Never</SelectItem>
                    <SelectItem value="former">Former</SelectItem>
                    <SelectItem value="current">Current</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Calculating..." : (ageGroup === "child" ? "Check My Health! 🌟" : "Calculate Health Score")}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Score Results */}
      {scoreResult && (
        <Card className="health-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Your Health Risk Assessment</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-primary/10 rounded-lg">
                <h4 className="font-semibold mb-2">Diabetes Risk</h4>
                <p className="text-sm text-muted-foreground">
                  {JSON.stringify(scoreResult.risk_profile.diabetes_baseline_risk)}
                </p>
              </div>
              
              <div className="p-4 bg-secondary/10 rounded-lg">
                <h4 className="font-semibold mb-2">Glucose Events</h4>
                <p className="text-sm text-muted-foreground">
                  {JSON.stringify(scoreResult.risk_profile.glucose_realtime_risk)}
                </p>
              </div>
              
              <div className="p-4 bg-warning/10 rounded-lg">
                <h4 className="font-semibold mb-2">Hypertension Risk</h4>
                <p className="text-sm text-muted-foreground">
                  {JSON.stringify(scoreResult.risk_profile.hypertension_risk)}
                </p>
              </div>
              
              <div className="p-4 bg-danger/10 rounded-lg">
                <h4 className="font-semibold mb-2">Heart Disease Risk</h4>
                <p className="text-sm text-muted-foreground">
                  {JSON.stringify(scoreResult.risk_profile.heart_disease_risk)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 p-3 bg-success/10 rounded-lg">
              <AlertCircle className="h-4 w-4 text-success" />
              <span className="text-sm font-medium">Data saved to database: {scoreResult.database_status}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ScoreCalculator;
