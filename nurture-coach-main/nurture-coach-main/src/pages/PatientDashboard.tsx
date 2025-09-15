import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import {
  Heart,
  Activity,
  Target,
  Trophy,
  Mic,
  AlertTriangle,
  TrendingUp,
  Brain,
  Zap,
  Star,
  Award,
  Phone,
  UserPlus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import RiskCard from "@/components/health/RiskCard";
import ShapExplanation from "@/components/health/ShapExplanation";
import DigitalTwin from "@/components/health/DigitalTwin";
import VoiceAssistant from "@/components/health/VoiceAssistant";
import HealthChart from "@/components/health/HealthChart";
import ScoreCalculator from "@/components/health/ScoreCalculator";
import { authUtils } from "@/lib/api";

// Sample health data
const healthData = {
  user: { name: "Alex", age: 34, points: 1250, streak: 7, level: "Health Enthusiast" },
  risks: {
    diabetes: { level: "medium" as const, percentage: 65, trend: "improving" as const },
    hypertension: { level: "low" as const, percentage: 25, trend: "stable" as const }
  },
  shapDrivers: [
    { name: "Physical Activity", impact: 0.3, positive: true, description: "Regular exercise significantly reduces your risk" },
    { name: "BMI", impact: -0.4, positive: false, description: "Higher BMI increases diabetes risk" },
    { name: "Family History", impact: -0.2, positive: false, description: "Genetic predisposition affects your baseline risk" }
  ],
  microGoals: [
    { name: "Daily Steps", current: 8500, target: 10000, unit: "steps" },
    { name: "Sleep", current: 7.2, target: 8, unit: "hours" },
    { name: "Water Intake", current: 6, target: 8, unit: "glasses" }
  ],
  badges: [
    { name: "7-Day Streak", icon: "🔥", earned: true, date: "2024-01-15" },
    { name: "Exercise Champion", icon: "💪", earned: true, date: "2024-01-10" },
    { name: "Hydration Master", icon: "💧", earned: false, progress: 75 }
  ],
  alerts: [
    { 
      type: "high", 
      message: "Blood pressure reading above normal range", 
      action: "Contact your doctor",
      time: "2 hours ago"
    }
  ]
};

const PatientDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [ageGroup, setAgeGroup] = useState<"child" | "adult" | "senior">("adult");

  useEffect(() => {
    // Determine age group for adaptive UI
    const profile = localStorage.getItem("userProfile");
    if (profile) {
      const { age } = JSON.parse(profile);
      const ageNum = parseInt(age);
      if (ageNum <= 16) setAgeGroup("child");
      else if (ageNum >= 65) setAgeGroup("senior");
      else setAgeGroup("adult");
    }
  }, []);

  const getGreeting = () => {
    const name = healthData.user.name;
    switch (ageGroup) {
      case "child":
        return `Hey ${name}! 🌟 Ready for another awesome healthy day?`;
      case "senior":
        return `Good day, ${name}. Here's your health summary.`;
      default:
        return `Welcome back, ${name}. Here's your health overview.`;
    }
  };

  const getModeStyles = () => {
    switch (ageGroup) {
      case "child":
        return "child-mode bg-gradient-to-br from-purple-50 to-green-50";
      case "senior":
        return "senior-mode";
      default:
        return "adult-mode";
    }
  };

  return (
    <div className={`min-h-screen ${getModeStyles()}`}>
      {/* Header */}
      <nav className="border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Heart className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">AI Health Coach</span>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="text-gold border-gold">
              <Trophy className="h-4 w-4 mr-1" />
              {healthData.user.points} pts
            </Badge>
            <Button variant="ghost" onClick={() => navigate("/profile")}>
              Profile
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                authUtils.removeToken();
                navigate("/");
              }}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-8">
          <h1 className={`${ageGroup === 'senior' ? 'text-3xl' : 'text-4xl'} font-bold mb-2`}>
            {getGreeting()}
          </h1>
          <div className="flex justify-center items-center space-x-4">
            <Badge className="badge-gold">
              Level: {healthData.user.level}
            </Badge>
            <div className="flex items-center space-x-1 text-warning">
              <Zap className="h-5 w-5" />
              <span className="font-semibold">{healthData.user.streak} day streak!</span>
            </div>
          </div>
        </div>

        {/* Emergency Alerts */}
        {healthData.alerts.length > 0 && (
          <div className="mb-6">
            {healthData.alerts.map((alert, index) => (
              <Card key={index} className="border-danger bg-danger/10">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="h-6 w-6 text-danger" />
                      <div>
                        <p className="font-semibold text-danger">{alert.message}</p>
                        <p className="text-sm text-muted-foreground">{alert.time}</p>
                      </div>
                    </div>
                    <div className="space-x-2">
                      <Button variant="outline" size="sm">
                        <Phone className="h-4 w-4 mr-2" />
                        {alert.action}
                      </Button>
                      <Button variant="secondary" size="sm">
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Risk Assessment */}
          <div className="lg:col-span-2 space-y-6">
            {/* Risk Cards */}
            <div className="grid md:grid-cols-2 gap-4">
              <RiskCard 
                title="Type 2 Diabetes Risk"
                risk={healthData.risks.diabetes}
                ageGroup={ageGroup}
              />
              <RiskCard 
                title="Hypertension Risk"
                risk={healthData.risks.hypertension}
                ageGroup={ageGroup}
              />
            </div>

            {/* SHAP Explanation */}
            <ShapExplanation 
              drivers={healthData.shapDrivers}
              ageGroup={ageGroup}
            />

            {/* Digital Twin Simulator */}
            <DigitalTwin ageGroup={ageGroup} />

            {/* Score Calculator */}
            <ScoreCalculator ageGroup={ageGroup} />

            {/* Health Charts */}
            <Card className="health-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Health Trends</span>
                </CardTitle>
                <CardDescription>
                  Your health metrics over the past 30 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <HealthChart ageGroup={ageGroup} />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Goals & Gamification */}
          <div className="space-y-6">
            {/* Micro Goals */}
            <Card className="health-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>{ageGroup === 'child' ? 'Daily Missions' : 'Daily Goals'}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {healthData.microGoals.map((goal, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{goal.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {goal.current}/{goal.target} {goal.unit}
                      </span>
                    </div>
                    <Progress 
                      value={(goal.current / goal.target) * 100} 
                      className="h-2"
                    />
                  </div>
                ))}
                <Button className="w-full mt-4">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Log Activity
                </Button>
              </CardContent>
            </Card>

            {/* Badges & Achievements */}
            <Card className="health-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="h-5 w-5" />
                  <span>{ageGroup === 'child' ? 'Awesome Badges!' : 'Achievements'}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {healthData.badges.map((badge, index) => (
                    <div 
                      key={index} 
                      className={`p-3 rounded-lg text-center ${
                        badge.earned 
                          ? 'bg-primary/10 border border-primary/20' 
                          : 'bg-muted/50 border border-muted'
                      }`}
                    >
                      <div className="text-2xl mb-1">{badge.icon}</div>
                      <div className="text-xs font-medium">{badge.name}</div>
                      {!badge.earned && badge.progress && (
                        <div className="mt-2">
                          <Progress value={badge.progress} className="h-1" />
                          <span className="text-xs text-muted-foreground">
                            {badge.progress}%
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* AI Recommendations */}
            <Card className="health-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="h-5 w-5" />
                  <span>AI Recommendations</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-success/10 rounded-lg">
                  <p className="text-sm font-medium text-success">💧 Hydration Boost</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Drink 2 more glasses of water today to reach your goal!
                  </p>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                  <p className="text-sm font-medium text-primary">🚶 Walk & Talk</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Take a 15-minute walk after dinner to boost your step count.
                  </p>
                </div>
                <div className="p-3 bg-warning/10 rounded-lg">
                  <p className="text-sm font-medium text-warning">😴 Sleep Schedule</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Aim for bedtime by 10 PM tonight for better sleep quality.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Voice Assistant */}
      <VoiceAssistant ageGroup={ageGroup} />
    </div>
  );
};

export default PatientDashboard;