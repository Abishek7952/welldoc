import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface RiskCardProps {
  title: string;
  risk: {
    level: "low" | "medium" | "high";
    percentage: number;
    trend: "improving" | "stable" | "worsening";
  };
  ageGroup: "child" | "adult" | "senior";
}

const RiskCard = ({ title, risk, ageGroup }: RiskCardProps) => {
  const getRiskColor = () => {
    switch (risk.level) {
      case "low": return "success";
      case "medium": return "warning";
      case "high": return "danger";
    }
  };

  const getTrendIcon = () => {
    switch (risk.trend) {
      case "improving": return <TrendingDown className="h-4 w-4 text-success" />;
      case "worsening": return <TrendingUp className="h-4 w-4 text-danger" />;
      case "stable": return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getRiskText = () => {
    if (ageGroup === "child") {
      switch (risk.level) {
        case "low": return "All good! 🌟";
        case "medium": return "Let's be careful 🟡";
        case "high": return "Needs attention 🔴";
      }
    } else if (ageGroup === "senior") {
      switch (risk.level) {
        case "low": return "Low Risk";
        case "medium": return "Moderate Risk";
        case "high": return "High Risk - Contact Doctor";
      }
    } else {
      return `${risk.level.charAt(0).toUpperCase() + risk.level.slice(1)} Risk`;
    }
  };

  const cardClass = `health-card ${
    risk.level === "high" ? "risk-card-high" : 
    risk.level === "medium" ? "risk-card-medium" : 
    "risk-card-low"
  }`;

  return (
    <Card className={cardClass}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className={ageGroup === "senior" ? "text-lg" : "text-base"}>
              {title}
            </CardTitle>
            <CardDescription className="mt-1">
              Current risk assessment
            </CardDescription>
          </div>
          <Badge variant={getRiskColor() as any} className="font-semibold">
            {getRiskText()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-foreground">
              {risk.percentage}%
            </span>
            <div className="flex items-center space-x-1">
              {getTrendIcon()}
              <span className="text-sm text-muted-foreground capitalize">
                {risk.trend}
              </span>
            </div>
          </div>
          
          <div className="space-y-2">
            <Progress 
              value={risk.percentage} 
              className={`h-3 ${ageGroup === "senior" ? "h-4" : ""}`}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>

          {ageGroup === "child" && (
            <div className="mt-3 p-2 bg-primary/10 rounded-lg">
              <p className="text-sm font-medium">
                {risk.level === "low" 
                  ? "Keep up the great work! 🌟" 
                  : "Let's work together to improve this! 💪"}
              </p>
            </div>
          )}

          {ageGroup === "adult" && risk.level === "high" && (
            <div className="mt-3 p-3 bg-danger/10 border border-danger/20 rounded-lg">
              <p className="text-sm font-semibold text-danger">
                ⚠️ Recommendation: Contact your healthcare provider
              </p>
            </div>
          )}

          {ageGroup === "senior" && (
            <div className="mt-3 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm">
                {risk.level === "high" 
                  ? "Please contact your doctor to discuss this risk level."
                  : "Continue following your care plan."}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RiskCard;