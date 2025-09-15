import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { RotateCcw, Lightbulb, Activity, Moon, Droplets, Dumbbell } from "lucide-react";

interface SimulationState {
  steps: number;
  sleep: number;
  water: number;
  exercise: number;
}

interface DigitalTwinProps {
  ageGroup: "child" | "adult" | "senior";
}

const DigitalTwin = ({ ageGroup }: DigitalTwinProps) => {
  const [simulation, setSimulation] = useState<SimulationState>({
    steps: 8500,    // current: 8500, target: 10000
    sleep: 7.2,     // current: 7.2, target: 8
    water: 6,       // current: 6, target: 8
    exercise: 2     // current: 2, target: 4 (hours per week)
  });

  const baselineRisk = 65; // Current diabetes risk from the patient data

  // Calculate new risk based on simulation
  const calculateNewRisk = (sim: SimulationState) => {
    let riskDelta = 0;
    
    // Steps impact (10k steps = -10% risk)
    const stepsImpact = ((sim.steps - 8500) / 1500) * -5;
    riskDelta += stepsImpact;
    
    // Sleep impact (8h = -8% risk)
    const sleepImpact = ((sim.sleep - 7.2) / 0.8) * -4;
    riskDelta += sleepImpact;
    
    // Water impact (8 glasses = -3% risk)
    const waterImpact = ((sim.water - 6) / 2) * -3;
    riskDelta += waterImpact;
    
    // Exercise impact (4h/week = -12% risk)
    const exerciseImpact = ((sim.exercise - 2) / 2) * -6;
    riskDelta += exerciseImpact;
    
    const newRisk = Math.max(10, Math.min(90, baselineRisk + riskDelta));
    return Math.round(newRisk);
  };

  const newRisk = calculateNewRisk(simulation);
  const riskReduction = baselineRisk - newRisk;

  const generateInsight = () => {
    const improvements = [];
    if (simulation.steps > 8500) improvements.push(`${simulation.steps - 8500} extra steps`);
    if (simulation.sleep > 7.2) improvements.push(`${(simulation.sleep - 7.2).toFixed(1)} more hours of sleep`);
    if (simulation.water > 6) improvements.push(`${simulation.water - 6} more glasses of water`);
    if (simulation.exercise > 2) improvements.push(`${simulation.exercise - 2} more hours of exercise weekly`);

    if (improvements.length === 0) {
      return "Try adjusting the sliders above to see potential health improvements!";
    }

    if (ageGroup === "child") {
      return `Wow! If you ${improvements.join(", ")}, you could be even healthier! 🌟`;
    } else if (ageGroup === "senior") {
      return `These changes could help: ${improvements.join(", ")}`;
    } else {
      return `By incorporating ${improvements.join(", ")}, you could potentially reduce your diabetes risk by ${Math.abs(riskReduction)}%.`;
    }
  };

  const resetSimulation = () => {
    setSimulation({
      steps: 8500,
      sleep: 7.2,
      water: 6,
      exercise: 2
    });
  };

  const getTitle = () => {
    if (ageGroup === "child") return "Health Explorer 🚀";
    if (ageGroup === "senior") return "Health Planner";
    return "Digital Twin - \"What If\" Simulator";
  };

  const getDescription = () => {
    if (ageGroup === "child") return "See how healthy choices can make you stronger!";
    if (ageGroup === "senior") return "Explore how lifestyle changes could affect your health";
    return "Explore how lifestyle changes could impact your future health outcomes";
  };

  return (
    <Card className="health-card">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className={`${ageGroup === "senior" ? "text-lg" : ""}`}>
              {getTitle()}
            </CardTitle>
            <CardDescription>
              {getDescription()}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={resetSimulation}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Current vs Predicted Risk */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Current Risk</p>
              <p className="text-2xl font-bold text-warning">{baselineRisk}%</p>
            </div>
            <div className="text-center p-4 bg-primary/10 rounded-lg">
              <p className="text-sm text-muted-foreground">Predicted Risk</p>
              <p className={`text-2xl font-bold ${
                newRisk < baselineRisk ? "text-success" : 
                newRisk > baselineRisk ? "text-danger" : 
                "text-warning"
              }`}>
                {newRisk}%
              </p>
              {riskReduction !== 0 && (
                <Badge variant={riskReduction > 0 ? "default" : "destructive"} className="mt-1">
                  {riskReduction > 0 ? "-" : "+"}{Math.abs(riskReduction)}%
                </Badge>
              )}
            </div>
          </div>

          {/* Simulation Controls */}
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center space-x-2">
              <Activity className="h-4 w-4" />
              <span>Adjust Your Lifestyle</span>
            </h4>

            {/* Daily Steps */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium flex items-center space-x-1">
                  <Activity className="h-4 w-4" />
                  <span>Daily Steps</span>
                </span>
                <span className="text-sm text-muted-foreground">
                  {simulation.steps.toLocaleString()} steps
                </span>
              </div>
              <Slider
                value={[simulation.steps]}
                onValueChange={(value) => setSimulation({ ...simulation, steps: value[0] })}
                min={5000}
                max={15000}
                step={500}
                className="simulator-slider"
              />
            </div>

            {/* Sleep Hours */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium flex items-center space-x-1">
                  <Moon className="h-4 w-4" />
                  <span>Sleep Hours</span>
                </span>
                <span className="text-sm text-muted-foreground">
                  {simulation.sleep} hours
                </span>
              </div>
              <Slider
                value={[simulation.sleep]}
                onValueChange={(value) => setSimulation({ ...simulation, sleep: value[0] })}
                min={5}
                max={10}
                step={0.1}
                className="simulator-slider"
              />
            </div>

            {/* Water Intake */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium flex items-center space-x-1">
                  <Droplets className="h-4 w-4" />
                  <span>Water Glasses</span>
                </span>
                <span className="text-sm text-muted-foreground">
                  {simulation.water} glasses
                </span>
              </div>
              <Slider
                value={[simulation.water]}
                onValueChange={(value) => setSimulation({ ...simulation, water: value[0] })}
                min={2}
                max={12}
                step={1}
                className="simulator-slider"
              />
            </div>

            {/* Weekly Exercise */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium flex items-center space-x-1">
                  <Dumbbell className="h-4 w-4" />
                  <span>Exercise (hours/week)</span>
                </span>
                <span className="text-sm text-muted-foreground">
                  {simulation.exercise} hours
                </span>
              </div>
              <Slider
                value={[simulation.exercise]}
                onValueChange={(value) => setSimulation({ ...simulation, exercise: value[0] })}
                min={0}
                max={8}
                step={0.5}
                className="simulator-slider"
              />
            </div>
          </div>

          {/* AI Insight */}
          <div className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg">
            <div className="flex items-start space-x-3">
              <Lightbulb className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-primary mb-1">
                  {ageGroup === "child" ? "Health Tip!" : "Predicted Benefit"}
                </p>
                <p className={`${ageGroup === "senior" ? "text-sm" : "text-xs"} text-muted-foreground`}>
                  {generateInsight()}
                </p>
                {ageGroup === "adult" && riskReduction > 0 && (
                  <p className="text-xs text-muted-foreground mt-2 italic">
                    *This is a predictive estimate based on current research. Always consult 
                    your healthcare provider before making significant lifestyle changes.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DigitalTwin;