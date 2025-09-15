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
  UserPlus,
  RefreshCw,
  LogOut
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ShapExplanation from "@/components/health/ShapExplanation";
import DigitalTwin from "@/components/health/DigitalTwin";
import VoiceAssistant from "@/components/health/VoiceAssistant";
import HealthChart from "@/components/health/HealthChart";
import ScoreCalculator from "@/components/health/ScoreCalculator";
import { authUtils, apiService } from "@/lib/api";

// Default/fallback health data
const defaultHealthData = {
  user: { name: "User", age: 34, points: 0, streak: 0, level: "Getting Started" },
  risks: {
    diabetes: { level: "medium" as const, percentage: 65, trend: "stable" as const },
    hypertension: { level: "low" as const, percentage: 25, trend: "improving" as const }
  },
  shapDrivers: [
    { name: "BMI", impact: -0.3, positive: false, description: "Current BMI: 28.5 (Overweight)" },
    { name: "Blood Glucose", impact: -0.25, positive: false, description: "Fasting glucose: 140 mg/dL (Elevated)" },
    { name: "Physical Activity", impact: 0.15, positive: true, description: "Regular exercise routine" },
    { name: "Age Factor", impact: -0.1, positive: false, description: "Age-related risk increase" },
    { name: "Family History", impact: -0.2, positive: false, description: "Diabetes in family history" }
  ],
  microGoals: [
    { name: "Daily Steps", current: 0, target: 10000, unit: "steps" },
    { name: "Sleep", current: 0, target: 8, unit: "hours" },
    { name: "Water Intake", current: 0, target: 8, unit: "glasses" }
  ],
  badges: [
    { name: "First Assessment", icon: "🎯", earned: false, progress: 0 },
    { name: "Health Explorer", icon: "🔍", earned: false, progress: 0 },
    { name: "Wellness Warrior", icon: "⚡", earned: false, progress: 0 }
  ],
  alerts: []
};

const PatientDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [ageGroup, setAgeGroup] = useState<"child" | "adult" | "senior">("adult");
  const [healthData, setHealthData] = useState(defaultHealthData);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasRealData, setHasRealData] = useState(false);

  const fetchHealthData = async (showRefreshToast = false) => {
    try {
      if (showRefreshToast) setRefreshing(true);

      const data = await apiService.getUserHealthSummary();

      if (data.has_data) {
        setHealthData({
          user: data.user,
          risks: data.risks,
          shapDrivers: [
            {
              name: "BMI",
              impact: data.latest_assessment.bmi > 25 ? -0.3 : 0.2,
              positive: data.latest_assessment.bmi <= 25,
              description: `Current BMI: ${data.latest_assessment.bmi?.toFixed(1) || 'N/A'} ${data.latest_assessment.bmi > 25 ? '(Overweight)' : '(Normal)'}`
            },
            {
              name: "Blood Glucose",
              impact: data.latest_assessment.blood_glucose > 126 ? -0.25 : 0.15,
              positive: data.latest_assessment.blood_glucose <= 126,
              description: `Fasting glucose: ${data.latest_assessment.blood_glucose} mg/dL ${data.latest_assessment.blood_glucose > 126 ? '(Elevated)' : '(Normal)'}`
            },
            {
              name: "HbA1c Level",
              impact: data.latest_assessment.hba1c > 6.5 ? -0.2 : 0.1,
              positive: data.latest_assessment.hba1c <= 6.5,
              description: `HbA1c: ${data.latest_assessment.hba1c}% ${data.latest_assessment.hba1c > 6.5 ? '(High)' : '(Normal)'}`
            },
            {
              name: "Age Factor",
              impact: data.user.age > 45 ? -0.1 : 0.05,
              positive: data.user.age <= 45,
              description: `Age: ${data.user.age} years ${data.user.age > 45 ? '(Increased risk)' : '(Lower risk)'}`
            },
            {
              name: "Physical Activity",
              impact: data.latest_assessment.exercise_frequency === 'daily' ? 0.15 : data.latest_assessment.exercise_frequency === 'weekly' ? 0.05 : -0.1,
              positive: data.latest_assessment.exercise_frequency !== 'rarely',
              description: `Exercise: ${data.latest_assessment.exercise_frequency || 'Not specified'}`
            }
          ],
          microGoals: [
            { name: "Daily Steps", current: 8500, target: 10000, unit: "steps" },
            { name: "Sleep", current: data.latest_assessment.sleep_hours || 7, target: 8, unit: "hours" },
            { name: "Exercise", current: data.latest_assessment.exercise_frequency === 'daily' ? 7 : data.latest_assessment.exercise_frequency === 'weekly' ? 3 : 1, target: 5, unit: "days/week" }
          ],
          badges: [
            { name: "Health Assessment", icon: "🎯", earned: true, date: data.latest_assessment.date },
            { name: "Data Tracker", icon: "📊", earned: true, date: data.latest_assessment.date },
            { name: "Wellness Warrior", icon: "⚡", earned: data.risks.diabetes.level === "low" && data.risks.hypertension.level === "low", progress: 100 }
          ],
          alerts: data.risks.diabetes.level === "high" || data.risks.hypertension.level === "high" ? [
            {
              type: "high",
              message: "High health risk detected",
              action: "Please consult your healthcare provider",
              time: "Recent assessment"
            }
          ] : []
        });
        setHasRealData(true);

        if (showRefreshToast) {
          toast({
            title: "Data refreshed",
            description: "Your health data has been updated.",
          });
        }
      } else {
        setHealthData(defaultHealthData);
        setHasRealData(false);

        if (data.error) {
          toast({
            title: "Error loading health data",
            description: data.error,
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('Error fetching health data:', error);
      setHealthData(defaultHealthData);
      setHasRealData(false);

      toast({
        title: "Failed to load health data",
        description: "Please try refreshing the page or complete a health assessment.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      if (showRefreshToast) setRefreshing(false);
    }
  };

  const handleLogout = () => {
    authUtils.logout();
    toast({
      title: "Logged out successfully",
      description: "You have been logged out of your account.",
    });
    navigate('/login');
  };

  const handleRefresh = () => {
    fetchHealthData(true);
  };

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

    // Fetch initial health data
    fetchHealthData();
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
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button variant="ghost" onClick={() => navigate("/profile")}>
              Profile
            </Button>
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
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

        {/* No Data Banner */}
        {!hasRealData && !loading && (
          <div className="mb-6">
            <Card className="border-primary bg-primary/5">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="mb-4">
                    <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Target className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-primary mb-2">
                      Complete Your First Health Assessment
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Get personalized health insights and AI-powered recommendations by completing your comprehensive health assessment.
                    </p>
                    <Button
                      onClick={() => {
                        const calculatorElement = document.getElementById('score-calculator');
                        if (calculatorElement) {
                          calculatorElement.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Activity className="h-4 w-4 mr-2" />
                      Start Health Assessment
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                  <p className="text-muted-foreground">Loading your health data...</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

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
            {/* SHAP Explanation */}
            <ShapExplanation
              drivers={healthData.shapDrivers}
              ageGroup={ageGroup}
            />

            {/* Digital Twin Simulator */}
            <DigitalTwin ageGroup={ageGroup} />

            {/* Score Calculator */}
            <div id="score-calculator">
              <ScoreCalculator ageGroup={ageGroup} onScoreUpdate={fetchHealthData} />
            </div>

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