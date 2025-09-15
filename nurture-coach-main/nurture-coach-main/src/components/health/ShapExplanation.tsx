import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Brain, Info, TrendingUp, TrendingDown } from "lucide-react";

interface ShapDriver {
  name: string;
  impact: number;
  positive: boolean;
  description: string;
}

interface ShapExplanationProps {
  drivers: ShapDriver[];
  ageGroup: "child" | "adult" | "senior";
}

const ShapExplanation = ({ drivers, ageGroup }: ShapExplanationProps) => {
  const [showDetails, setShowDetails] = useState(false);

  const getExplanationText = () => {
    if (ageGroup === "child") {
      return "Here's what affects your health score the most! 🧠✨";
    } else if (ageGroup === "senior") {
      return "Key factors influencing your health assessment";
    } else {
      return "AI-powered analysis of your primary health risk factors";
    }
  };

  const getDriverExplanation = (driver: ShapDriver) => {
    if (ageGroup === "child") {
      return driver.positive 
        ? `${driver.name} is helping you stay healthy! Keep it up! 🌟`
        : `${driver.name} needs some attention. Let's work on it together! 💪`;
    }
    return driver.description;
  };

  const getTrustScore = () => {
    // Mock trust score calculation (confidence * fairness)
    return 87; // This would be computed from actual model metrics
  };

  return (
    <Card className="health-card">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className={`flex items-center space-x-2 ${ageGroup === "senior" ? "text-lg" : ""}`}>
              <Brain className="h-5 w-5 text-primary" />
              <span>
                {ageGroup === "child" ? "Health Factors" : "Risk Analysis (SHAP)"}
              </span>
            </CardTitle>
            <CardDescription>
              {getExplanationText()}
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-primary border-primary">
            Trust Score: {getTrustScore()}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {drivers.map((driver, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className={`font-medium ${ageGroup === "senior" ? "text-base" : "text-sm"}`}>
                    {driver.name}
                  </span>
                  {driver.positive ? (
                    <TrendingUp className="h-4 w-4 text-success" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-danger" />
                  )}
                </div>
                <span className={`text-sm font-semibold ${
                  driver.positive ? "text-success" : "text-danger"
                }`}>
                  {driver.positive ? "+" : ""}{(driver.impact * 100).toFixed(1)}%
                </span>
              </div>
              
              {/* SHAP Bar Visualization */}
              <div className="relative">
                <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                  <div 
                    className={`shap-bar h-full ${driver.positive ? "" : "negative"}`}
                    style={{ 
                      width: `${Math.abs(driver.impact) * 100}%`,
                      marginLeft: driver.positive ? "0%" : `${100 - Math.abs(driver.impact) * 100}%`
                    }}
                  />
                </div>
              </div>

              {/* Driver Explanation */}
              <p className={`text-muted-foreground ${
                ageGroup === "senior" ? "text-sm" : "text-xs"
              }`}>
                {getDriverExplanation(driver)}
              </p>
            </div>
          ))}

          {/* More Details Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full mt-4">
                <Info className="h-4 w-4 mr-2" />
                {ageGroup === "child" ? "Learn More!" : "Technical Details"}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <Brain className="h-6 w-6 text-primary" />
                  <span>Understanding SHAP Analysis</span>
                </DialogTitle>
                <DialogDescription>
                  How AI explains your health risk factors
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-2">What is SHAP?</h4>
                  <p className="text-sm text-muted-foreground">
                    SHAP (SHapley Additive exPlanations) is an advanced AI technique that explains 
                    how each factor contributes to your health risk prediction. It provides transparent, 
                    interpretable insights into the AI's decision-making process.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Your Risk Factors</h4>
                  <div className="space-y-3">
                    {drivers.map((driver, index) => (
                      <div key={index} className="p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{driver.name}</span>
                          <Badge variant={driver.positive ? "default" : "destructive"}>
                            Impact: {(driver.impact * 100).toFixed(1)}%
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {driver.description}
                        </p>
                        
                        {/* Clinical Details for Healthcare Providers */}
                        <div className="mt-2 p-2 bg-background rounded text-xs">
                          <strong>Clinical Context:</strong> This factor contributes{" "}
                          <span className={driver.positive ? "text-success" : "text-danger"}>
                            {Math.abs(driver.impact * 100).toFixed(1)}% {driver.positive ? "reduction" : "increase"}
                          </span>{" "}
                          to the baseline risk assessment.
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-primary/10 rounded-lg">
                  <h4 className="font-semibold mb-2 text-primary">Trust & Reliability</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Model Confidence:</span>
                      <p className="text-muted-foreground">94%</p>
                    </div>
                    <div>
                      <span className="font-medium">Fairness Score:</span>
                      <p className="text-muted-foreground">92%</p>
                    </div>
                    <div>
                      <span className="font-medium">Data Quality:</span>
                      <p className="text-muted-foreground">High</p>
                    </div>
                    <div>
                      <span className="font-medium">Last Updated:</span>
                      <p className="text-muted-foreground">2 hours ago</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                  <h4 className="font-semibold text-warning mb-2">⚠️ Important Note</h4>
                  <p className="text-sm text-foreground">
                    This AI analysis is for informational purposes only and should not replace 
                    professional medical advice. Always consult with your healthcare provider 
                    for medical decisions.
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShapExplanation;