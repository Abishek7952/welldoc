import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, TrendingUp, TrendingDown, Info, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Patient {
  id: number;
  name: string;
  age: number;
  diabetesRisk: number;
  hypertensionRisk: number;
  conditions: string[];
}

interface ShapClinicalViewProps {
  patient: Patient;
}

// Mock SHAP data for clinical view - would come from ML model in production
const generateShapData = (patient: Patient) => {
  return {
    diabetesDrivers: [
      { 
        name: "BMI", 
        impact: -0.15, 
        value: 28.5, 
        reference: "Normal: 18.5-24.9",
        description: "Current BMI of 28.5 contributes significantly to diabetes risk"
      },
      { 
        name: "Physical Activity", 
        impact: 0.12, 
        value: 150, 
        reference: "Target: 150+ min/week",
        description: "Meeting activity guidelines provides protective benefit"
      },
      { 
        name: "HbA1c", 
        impact: -0.18, 
        value: 6.2, 
        reference: "Normal: <5.7%",
        description: "Elevated HbA1c indicates impaired glucose metabolism"
      },
      { 
        name: "Family History", 
        impact: -0.08, 
        value: 1, 
        reference: "Risk factor present",
        description: "First-degree relative with Type 2 diabetes"
      },
      { 
        name: "Age", 
        impact: -0.05, 
        value: patient.age, 
        reference: "Risk increases with age",
        description: `Age ${patient.age} contributes to baseline risk`
      }
    ],
    hypertensionDrivers: [
      { 
        name: "Systolic BP", 
        impact: -0.22, 
        value: 135, 
        reference: "Normal: <120 mmHg",
        description: "Elevated systolic pressure (135 mmHg) indicates hypertension"
      },
      { 
        name: "Sodium Intake", 
        impact: -0.10, 
        value: 3200, 
        reference: "Target: <2300 mg/day",
        description: "High sodium intake contributes to blood pressure elevation"
      },
      { 
        name: "Exercise Frequency", 
        impact: 0.08, 
        value: 4, 
        reference: "Target: 4+ days/week",
        description: "Regular exercise helps manage blood pressure"
      },
      { 
        name: "Stress Level", 
        impact: -0.06, 
        value: 7, 
        reference: "Scale: 1-10",
        description: "High stress levels can elevate blood pressure"
      }
    ],
    modelMetrics: {
      confidence: 0.92,
      fairness: 0.89,
      lastUpdated: "2024-01-15T10:30:00Z",
      sampleSize: 50000
    }
  };
};

const ShapClinicalView = ({ patient }: ShapClinicalViewProps) => {
  const shapData = generateShapData(patient);

  const renderDrivers = (drivers: any[], title: string, riskValue: number) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">{title}</h4>
        <Badge variant={riskValue > 70 ? "destructive" : riskValue > 40 ? "secondary" : "outline"}>
          {riskValue}% Risk
        </Badge>
      </div>
      
      {drivers.map((driver, index) => (
        <div key={index} className="p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="font-medium">{driver.name}</span>
              {driver.impact > 0 ? (
                <TrendingUp className="h-4 w-4 text-success" />
              ) : (
                <TrendingDown className="h-4 w-4 text-danger" />
              )}
            </div>
            <Badge variant={driver.impact > 0 ? "default" : "destructive"}>
              {driver.impact > 0 ? "+" : ""}{(driver.impact * 100).toFixed(1)}%
            </Badge>
          </div>
          
          {/* SHAP Bar Visualization */}
          <div className="relative mb-2">
            <div className="w-full bg-muted h-3 rounded-full overflow-hidden">
              <div 
                className={`shap-bar h-full ${driver.impact > 0 ? "" : "negative"}`}
                style={{ 
                  width: `${Math.abs(driver.impact) * 300}%`,
                  maxWidth: "100%",
                  marginLeft: driver.impact > 0 ? "0%" : `${Math.max(0, 100 - Math.abs(driver.impact) * 300)}%`
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div>
              <span className="font-medium">Current Value:</span> {driver.value}
            </div>
            <div>
              <span className="font-medium">Reference:</span> {driver.reference}
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground mt-2">{driver.description}</p>
        </div>
      ))}
    </div>
  );

  return (
    <Card className="health-card">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-primary" />
              <span>SHAP Clinical Analysis</span>
            </CardTitle>
            <CardDescription>
              ML model explanations for {patient.name}
            </CardDescription>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Info className="h-4 w-4 mr-2" />
                Model Info
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Model Information & Metrics</DialogTitle>
                <DialogDescription>
                  Technical details about the AI model and its performance
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold text-primary">Model Confidence</h4>
                    <p className="text-2xl font-bold">{(shapData.modelMetrics.confidence * 100).toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground">Prediction accuracy on validation set</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold text-primary">Fairness Score</h4>
                    <p className="text-2xl font-bold">{(shapData.modelMetrics.fairness * 100).toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground">Bias detection across demographics</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">Training Data</h4>
                  <p className="text-sm text-muted-foreground">
                    Model trained on {shapData.modelMetrics.sampleSize.toLocaleString()} patient records 
                    from diverse healthcare systems. Last updated: {" "}
                    {new Date(shapData.modelMetrics.lastUpdated).toLocaleDateString()}
                  </p>
                </div>

                <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-warning">Clinical Decision Support</h4>
                      <p className="text-sm text-foreground mt-1">
                        This AI model provides decision support and risk stratification. 
                        It should supplement, not replace, clinical judgment. Always consider 
                        patient-specific factors and current clinical guidelines.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">SHAP Methodology</h4>
                  <p className="text-sm text-muted-foreground">
                    Shapley values provide game-theoretic explanations for each feature's 
                    contribution to the prediction. Positive values increase risk, negative 
                    values are protective. The sum of all SHAP values equals the difference 
                    between the prediction and the expected model output.
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Diabetes Risk Analysis */}
        {renderDrivers(shapData.diabetesDrivers, "Type 2 Diabetes Risk Factors", patient.diabetesRisk)}
        
        <hr className="border-border" />
        
        {/* Hypertension Risk Analysis */}
        {renderDrivers(shapData.hypertensionDrivers, "Hypertension Risk Factors", patient.hypertensionRisk)}

        {/* Clinical Recommendations */}
        <div className="p-4 bg-primary/10 rounded-lg">
          <h4 className="font-semibold text-primary mb-2">AI-Generated Clinical Recommendations</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-start space-x-2">
              <span className="font-medium text-danger">High Priority:</span>
              <span>Address elevated HbA1c through medication adjustment or lifestyle intervention.</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="font-medium text-warning">Medium Priority:</span>
              <span>Implement structured weight management program targeting 5-10% reduction.</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="font-medium text-success">Reinforce:</span>
              <span>Continue current physical activity regimen - patient meeting guidelines.</span>
            </div>
          </div>
        </div>

        {/* Model Trust Score */}
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <div>
            <span className="font-medium">Overall Trust Score</span>
            <p className="text-xs text-muted-foreground">
              Composite of model confidence and fairness metrics
            </p>
          </div>
          <Badge variant="outline" className="text-primary border-primary">
            {Math.round((shapData.modelMetrics.confidence + shapData.modelMetrics.fairness) * 50)}%
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShapClinicalView;