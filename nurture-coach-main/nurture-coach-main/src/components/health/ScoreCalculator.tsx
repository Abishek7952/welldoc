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

    // Personal Information
    gender: "Male",
    age: 35,
    height: 170, // cm
    weight: 70, // kg
    bmi: 25.0,

    // Medical History
    hypertension: 0,
    heartDisease: 0,
    diabetes: 0,
    familyHistoryDiabetes: 0,
    familyHistoryHeart: 0,
    familyHistoryHypertension: 0,

    // Lifestyle Factors
    smokingHistory: "never",
    alcoholConsumption: "moderate", // never, light, moderate, heavy
    exerciseFrequency: "regular", // sedentary, light, moderate, regular, intense
    sleepHours: 7,
    stressLevel: "moderate", // low, moderate, high

    // Vital Signs & Lab Results
    hba1cLevel: 5.5,
    bloodGlucoseLevel: 100,
    systolicBP: 120,
    diastolicBP: 80,
    cholesterolTotal: 180,
    cholesterolLDL: 100,
    cholesterolHDL: 50,
    triglycerides: 150,

    // Dietary Information
    dietType: "balanced", // vegetarian, vegan, keto, mediterranean, balanced
    mealsPerDay: 3,
    waterIntake: 8, // glasses per day
    fastFoodFrequency: "rarely", // never, rarely, sometimes, often, daily

    // Symptoms & Current Health
    currentSymptoms: [],
    medicationsCount: 0,
    recentIllness: 0,
    energyLevel: "good", // poor, fair, good, excellent

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
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary border-b border-primary/20 pb-2">
                👤 Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age">Age (years)</Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                    min="1"
                    max="120"
                    placeholder="35"
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
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    value={formData.height}
                    onChange={(e) => {
                      const height = parseInt(e.target.value) || 0;
                      const bmi = formData.weight / ((height / 100) ** 2);
                      setFormData({ ...formData, height, bmi: isFinite(bmi) ? parseFloat(bmi.toFixed(1)) : 0 });
                    }}
                    min="100"
                    max="250"
                    placeholder="170"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    value={formData.weight}
                    onChange={(e) => {
                      const weight = parseInt(e.target.value) || 0;
                      const bmi = weight / ((formData.height / 100) ** 2);
                      setFormData({ ...formData, weight, bmi: isFinite(bmi) ? parseFloat(bmi.toFixed(1)) : 0 });
                    }}
                    min="30"
                    max="300"
                    placeholder="70"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bmi">BMI (calculated)</Label>
                  <Input
                    id="bmi"
                    type="number"
                    step="0.1"
                    value={formData.bmi}
                    readOnly
                    className="bg-muted"
                  />
                </div>
              </div>
            </div>

            {/* Medical History Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary border-b border-primary/20 pb-2">
                🏥 Medical History
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Current Hypertension</Label>
                  <Select value={formData.hypertension.toString()} onValueChange={(value) => setFormData({ ...formData, hypertension: parseInt(value) })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">No</SelectItem>
                      <SelectItem value="1">Yes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Current Heart Disease</Label>
                  <Select value={formData.heartDisease.toString()} onValueChange={(value) => setFormData({ ...formData, heartDisease: parseInt(value) })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">No</SelectItem>
                      <SelectItem value="1">Yes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Current Diabetes</Label>
                  <Select value={formData.diabetes.toString()} onValueChange={(value) => setFormData({ ...formData, diabetes: parseInt(value) })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">No</SelectItem>
                      <SelectItem value="1">Yes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Family History - Diabetes</Label>
                  <Select value={formData.familyHistoryDiabetes.toString()} onValueChange={(value) => setFormData({ ...formData, familyHistoryDiabetes: parseInt(value) })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">No</SelectItem>
                      <SelectItem value="1">Yes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Family History - Heart Disease</Label>
                  <Select value={formData.familyHistoryHeart.toString()} onValueChange={(value) => setFormData({ ...formData, familyHistoryHeart: parseInt(value) })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">No</SelectItem>
                      <SelectItem value="1">Yes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Number of Medications</Label>
                  <Input
                    type="number"
                    value={formData.medicationsCount}
                    onChange={(e) => setFormData({ ...formData, medicationsCount: parseInt(e.target.value) || 0 })}
                    min="0"
                    max="20"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Lifestyle Factors Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary border-b border-primary/20 pb-2">
                🏃‍♂️ Lifestyle Factors
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                <div className="space-y-2">
                  <Label>Alcohol Consumption</Label>
                  <Select value={formData.alcoholConsumption} onValueChange={(value) => setFormData({ ...formData, alcoholConsumption: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="never">Never</SelectItem>
                      <SelectItem value="light">Light (1-2 drinks/week)</SelectItem>
                      <SelectItem value="moderate">Moderate (3-7 drinks/week)</SelectItem>
                      <SelectItem value="heavy">Heavy (8+ drinks/week)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Exercise Frequency</Label>
                  <Select value={formData.exerciseFrequency} onValueChange={(value) => setFormData({ ...formData, exerciseFrequency: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sedentary">Sedentary</SelectItem>
                      <SelectItem value="light">Light (1-2 times/week)</SelectItem>
                      <SelectItem value="moderate">Moderate (3-4 times/week)</SelectItem>
                      <SelectItem value="regular">Regular (5-6 times/week)</SelectItem>
                      <SelectItem value="intense">Intense (daily)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sleep">Sleep Hours (per night)</Label>
                  <Input
                    id="sleep"
                    type="number"
                    value={formData.sleepHours}
                    onChange={(e) => setFormData({ ...formData, sleepHours: parseInt(e.target.value) || 0 })}
                    min="3"
                    max="12"
                    placeholder="7"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Stress Level</Label>
                  <Select value={formData.stressLevel} onValueChange={(value) => setFormData({ ...formData, stressLevel: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Energy Level</Label>
                  <Select value={formData.energyLevel} onValueChange={(value) => setFormData({ ...formData, energyLevel: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="poor">Poor</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="excellent">Excellent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Vital Signs & Lab Results Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary border-b border-primary/20 pb-2">
                🩺 Vital Signs & Lab Results
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hba1c">HbA1c Level (%)</Label>
                  <Input
                    id="hba1c"
                    type="number"
                    step="0.1"
                    value={formData.hba1cLevel}
                    onChange={(e) => setFormData({ ...formData, hba1cLevel: parseFloat(e.target.value) || 0 })}
                    min="3"
                    max="15"
                    placeholder="5.5"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="glucose">Blood Glucose (mg/dL)</Label>
                  <Input
                    id="glucose"
                    type="number"
                    value={formData.bloodGlucoseLevel}
                    onChange={(e) => setFormData({ ...formData, bloodGlucoseLevel: parseInt(e.target.value) || 0 })}
                    min="50"
                    max="400"
                    placeholder="100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="systolic">Systolic BP (mmHg)</Label>
                  <Input
                    id="systolic"
                    type="number"
                    value={formData.systolicBP}
                    onChange={(e) => setFormData({ ...formData, systolicBP: parseInt(e.target.value) || 0 })}
                    min="80"
                    max="200"
                    placeholder="120"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="diastolic">Diastolic BP (mmHg)</Label>
                  <Input
                    id="diastolic"
                    type="number"
                    value={formData.diastolicBP}
                    onChange={(e) => setFormData({ ...formData, diastolicBP: parseInt(e.target.value) || 0 })}
                    min="40"
                    max="120"
                    placeholder="80"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cholesterol">Total Cholesterol (mg/dL)</Label>
                  <Input
                    id="cholesterol"
                    type="number"
                    value={formData.cholesterolTotal}
                    onChange={(e) => setFormData({ ...formData, cholesterolTotal: parseInt(e.target.value) || 0 })}
                    min="100"
                    max="400"
                    placeholder="180"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hdl">HDL Cholesterol (mg/dL)</Label>
                  <Input
                    id="hdl"
                    type="number"
                    value={formData.cholesterolHDL}
                    onChange={(e) => setFormData({ ...formData, cholesterolHDL: parseInt(e.target.value) || 0 })}
                    min="20"
                    max="100"
                    placeholder="50"
                  />
                </div>
              </div>
            </div>

            {/* Dietary Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary border-b border-primary/20 pb-2">
                🍎 Dietary Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Diet Type</Label>
                  <Select value={formData.dietType} onValueChange={(value) => setFormData({ ...formData, dietType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="balanced">Balanced</SelectItem>
                      <SelectItem value="vegetarian">Vegetarian</SelectItem>
                      <SelectItem value="vegan">Vegan</SelectItem>
                      <SelectItem value="keto">Ketogenic</SelectItem>
                      <SelectItem value="mediterranean">Mediterranean</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meals">Meals per Day</Label>
                  <Input
                    id="meals"
                    type="number"
                    value={formData.mealsPerDay}
                    onChange={(e) => setFormData({ ...formData, mealsPerDay: parseInt(e.target.value) || 0 })}
                    min="1"
                    max="8"
                    placeholder="3"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="water">Water Intake (glasses/day)</Label>
                  <Input
                    id="water"
                    type="number"
                    value={formData.waterIntake}
                    onChange={(e) => setFormData({ ...formData, waterIntake: parseInt(e.target.value) || 0 })}
                    min="1"
                    max="20"
                    placeholder="8"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Fast Food Frequency</Label>
                  <Select value={formData.fastFoodFrequency} onValueChange={(value) => setFormData({ ...formData, fastFoodFrequency: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="never">Never</SelectItem>
                      <SelectItem value="rarely">Rarely (monthly)</SelectItem>
                      <SelectItem value="sometimes">Sometimes (weekly)</SelectItem>
                      <SelectItem value="often">Often (few times/week)</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full text-lg py-6" disabled={loading}>
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Analyzing Your Health...</span>
                </div>
              ) : (
                ageGroup === "child" ? "🌟 Get My Health Score!" : "🎯 Get My Health Score"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Enhanced Score Results */}
      {scoreResult && (
        <div className="space-y-6">
          <Card className="health-card border-2 border-primary/20">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10">
              <CardTitle className="flex items-center space-x-2 text-xl">
                <TrendingUp className="h-6 w-6 text-primary" />
                <span>🎯 Your Health Risk Assessment</span>
              </CardTitle>
              <CardDescription className="text-base">
                Comprehensive analysis of your health indicators
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Diabetes Risk Card */}
                <div className="relative overflow-hidden rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-blue-800">🩺 Diabetes Risk</h3>
                    <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      scoreResult.risk_profile.diabetes_baseline_risk.risk_label === 'High'
                        ? 'bg-red-100 text-red-800'
                        : scoreResult.risk_profile.diabetes_baseline_risk.risk_label === 'Medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {scoreResult.risk_profile.diabetes_baseline_risk.risk_label}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-blue-700 font-medium">Risk Probability:</span>
                      <span className="text-2xl font-bold text-blue-900">
                        {(scoreResult.risk_profile.diabetes_baseline_risk.risk_probability * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${scoreResult.risk_profile.diabetes_baseline_risk.risk_probability * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Glucose Events Card */}
                <div className="relative overflow-hidden rounded-xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-green-800">📊 Glucose Events</h3>
                    <div className="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                      Monitored
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-green-700 font-medium">Event Risk:</span>
                      <span className="text-2xl font-bold text-green-900">
                        {(scoreResult.risk_profile.glucose_realtime_risk.event_risk * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-green-700 font-medium">Variability:</span>
                      <span className="text-lg font-semibold text-green-800">
                        {scoreResult.risk_profile.glucose_realtime_risk.glucose_variability.toFixed(1)} mg/dL
                      </span>
                    </div>
                    <div className="w-full bg-green-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${scoreResult.risk_profile.glucose_realtime_risk.event_risk * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Hypertension Risk Card */}
                <div className="relative overflow-hidden rounded-xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-orange-800">💓 Hypertension Risk</h3>
                    <div className="px-3 py-1 rounded-full text-sm font-semibold bg-orange-100 text-orange-800">
                      Assessed
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-orange-700 font-medium">Risk Level:</span>
                      <span className="text-2xl font-bold text-orange-900">
                        {(scoreResult.risk_profile.hypertension_risk.hypertension_risk * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-orange-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-orange-500 to-orange-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${scoreResult.risk_profile.hypertension_risk.hypertension_risk * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Heart Disease Risk Card */}
                <div className="relative overflow-hidden rounded-xl border-2 border-red-200 bg-gradient-to-br from-red-50 to-red-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-red-800">❤️ Heart Disease Risk</h3>
                    <div className="px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800">
                      Evaluated
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-red-700 font-medium">Risk Level:</span>
                      <span className="text-2xl font-bold text-red-900">
                        {(scoreResult.risk_profile.heart_disease_risk.heart_disease_risk * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-red-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-red-500 to-red-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${scoreResult.risk_profile.heart_disease_risk.heart_disease_risk * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Success Message */}
              <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl border border-green-200">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-green-800 font-semibold">✅ Assessment Complete</p>
                  <p className="text-green-700 text-sm">{scoreResult.database_status}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Health Coach Section */}
          <Card className="health-card border-2 border-gradient-to-r from-purple-300 to-blue-300 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
              <CardTitle className="flex items-center space-x-3 text-2xl">
                <div className="h-8 w-8 bg-white rounded-full flex items-center justify-center">
                  <span className="text-purple-600 text-lg">🤖</span>
                </div>
                <span>Your Personal AI Health Coach</span>
              </CardTitle>
              <CardDescription className="text-purple-100 text-lg">
                Personalized recommendations powered by advanced AI analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {scoreResult?.ai_recommendations && !scoreResult.ai_recommendations.error ? (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      🎯 Your Personalized Health Action Plan
                    </h3>
                    <p className="text-gray-600">
                      Based on your health assessment, here are my recommendations for you:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Immediate Actions */}
                    {scoreResult.ai_recommendations.immediate_actions && (
                      <div className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-6 shadow-lg">
                        <h3 className="text-lg font-bold text-red-800 mb-4 flex items-center">
                          <span className="mr-2 text-xl">🚨</span>
                          Immediate Actions (Next 24-48 hours)
                        </h3>
                        <div className="text-red-700 whitespace-pre-line text-sm leading-relaxed">
                          {scoreResult.ai_recommendations.immediate_actions}
                        </div>
                      </div>
                    )}

                    {/* Dietary Recommendations */}
                    {scoreResult.ai_recommendations.dietary_recommendations && (
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 shadow-lg">
                        <h3 className="text-lg font-bold text-green-800 mb-4 flex items-center">
                          <span className="mr-2 text-xl">🥗</span>
                          Nutrition & Diet Plan
                        </h3>
                        <div className="text-green-700 whitespace-pre-line text-sm leading-relaxed">
                          {scoreResult.ai_recommendations.dietary_recommendations}
                        </div>
                      </div>
                    )}

                    {/* Exercise Recommendations */}
                    {scoreResult.ai_recommendations.exercise_recommendations && (
                      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-6 shadow-lg">
                        <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center">
                          <span className="mr-2 text-xl">🏃‍♂️</span>
                          Exercise & Fitness Plan
                        </h3>
                        <div className="text-blue-700 whitespace-pre-line text-sm leading-relaxed">
                          {scoreResult.ai_recommendations.exercise_recommendations}
                        </div>
                      </div>
                    )}

                    {/* Lifestyle Modifications */}
                    {scoreResult.ai_recommendations.lifestyle_modifications && (
                      <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-xl p-6 shadow-lg">
                        <h3 className="text-lg font-bold text-yellow-800 mb-4 flex items-center">
                          <span className="mr-2 text-xl">🌟</span>
                          Lifestyle Improvements
                        </h3>
                        <div className="text-yellow-700 whitespace-pre-line text-sm leading-relaxed">
                          {scoreResult.ai_recommendations.lifestyle_modifications}
                        </div>
                      </div>
                    )}

                    {/* Medical Follow-up */}
                    {scoreResult.ai_recommendations.medical_followup && (
                      <div className="bg-gradient-to-br from-purple-50 to-violet-50 border-2 border-purple-200 rounded-xl p-6 lg:col-span-2 shadow-lg">
                        <h3 className="text-lg font-bold text-purple-800 mb-4 flex items-center">
                          <span className="mr-2 text-xl">👩‍⚕️</span>
                          Medical Follow-up & Monitoring
                        </h3>
                        <div className="text-purple-700 whitespace-pre-line text-sm leading-relaxed">
                          {scoreResult.ai_recommendations.medical_followup}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="mb-6">
                    <div className="h-16 w-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-white text-2xl">🤖</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      AI Health Coach Ready
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Complete your health assessment above to receive personalized recommendations from your AI health coach.
                    </p>
                    <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg p-4 text-left max-w-md mx-auto">
                      <h4 className="font-semibold text-purple-800 mb-2">What you'll get:</h4>
                      <ul className="text-sm text-purple-700 space-y-1">
                        <li>• Immediate action steps</li>
                        <li>• Personalized nutrition plan</li>
                        <li>• Custom exercise recommendations</li>
                        <li>• Lifestyle improvement tips</li>
                        <li>• Medical follow-up guidance</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Coach Footer */}
              {scoreResult?.ai_recommendations && !scoreResult.ai_recommendations.error && (
                <div className="mt-6 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-xl p-4 border border-indigo-200">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        AI
                      </div>
                    </div>
                    <div>
                      <p className="text-indigo-800 font-semibold text-sm">
                        🎯 Personalized recommendations powered by Cohere AI
                      </p>
                      <p className="text-indigo-600 text-xs">
                        Generated at: {new Date(scoreResult.ai_recommendations.generated_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ScoreCalculator;
