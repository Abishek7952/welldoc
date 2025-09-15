import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Activity, Heart, Droplets } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Patient {
  id: number;
  name: string;
  age: number;
  riskLevel: string;
  conditions: string[];
  diabetesRisk: number;
  hypertensionRisk: number;
  engagement: number;
}

interface PatientTrendsProps {
  patient: Patient;
}

// Sample detailed trend data for the selected patient
const generatePatientTrendData = (patientId: number) => {
  const baseData = [
    { date: '2024-01-01', glucose: 105, systolic: 135, diastolic: 85, weight: 185, steps: 6500, heartRate: 78 },
    { date: '2024-01-03', glucose: 102, systolic: 132, diastolic: 83, weight: 184, steps: 7200, heartRate: 76 },
    { date: '2024-01-05', glucose: 108, systolic: 138, diastolic: 87, weight: 184.5, steps: 5800, heartRate: 80 },
    { date: '2024-01-07', glucose: 99, systolic: 129, diastolic: 81, weight: 183.8, steps: 8900, heartRate: 74 },
    { date: '2024-01-09', glucose: 101, systolic: 131, diastolic: 82, weight: 183.2, steps: 9500, heartRate: 75 },
    { date: '2024-01-11', glucose: 97, systolic: 127, diastolic: 79, weight: 182.8, steps: 10200, heartRate: 72 },
    { date: '2024-01-13', glucose: 103, systolic: 133, diastolic: 84, weight: 182.5, steps: 8800, heartRate: 76 },
    { date: '2024-01-15', glucose: 95, systolic: 125, diastolic: 77, weight: 182.1, steps: 11000, heartRate: 71 }
  ];

  // Slight variations based on patient ID for demo purposes
  return baseData.map(entry => ({
    ...entry,
    glucose: entry.glucose + (patientId * 2 - 4),
    systolic: entry.systolic + (patientId - 2),
    weight: entry.weight + (patientId * 5 - 10)
  }));
};

const PatientTrends = ({ patient }: PatientTrendsProps) => {
  const trendData = generatePatientTrendData(patient.id);
  
  // Calculate trend direction for key metrics
  const getLastValues = (key: keyof typeof trendData[0]) => {
    const recent = trendData.slice(-3).map(d => d[key] as number);
    const earlier = trendData.slice(-6, -3).map(d => d[key] as number);
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;
    return { recent: recentAvg, earlier: earlierAvg, improving: recentAvg < earlierAvg };
  };

  const glucoseTrend = getLastValues('glucose');
  const systolicTrend = getLastValues('systolic');
  const weightTrend = getLastValues('weight');
  const stepsTrend = getLastValues('steps');

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{new Date(label).toLocaleDateString()}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center space-x-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span>{entry.name}:</span>
              <span className="font-medium">
                {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
                {entry.dataKey === 'glucose' ? ' mg/dL' :
                 entry.dataKey.includes('systolic') || entry.dataKey.includes('diastolic') ? ' mmHg' :
                 entry.dataKey === 'weight' ? ' lbs' :
                 entry.dataKey === 'steps' ? ' steps' :
                 entry.dataKey === 'heartRate' ? ' bpm' : ''}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="health-card">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5" />
          <span>{patient.name} - Detailed Trends</span>
        </CardTitle>
        <CardDescription>
          Clinical data trends over the past 15 days
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Key Metrics Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Glucose</p>
                  <p className="text-lg font-bold">{glucoseTrend.recent.toFixed(0)} mg/dL</p>
                </div>
                <Badge variant={glucoseTrend.improving ? "default" : "destructive"}>
                  {glucoseTrend.improving ? "↓" : "↑"}
                </Badge>
              </div>
            </div>

            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg BP Systolic</p>
                  <p className="text-lg font-bold">{systolicTrend.recent.toFixed(0)} mmHg</p>
                </div>
                <Badge variant={systolicTrend.improving ? "default" : "destructive"}>
                  {systolicTrend.improving ? "↓" : "↑"}
                </Badge>
              </div>
            </div>

            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Weight</p>
                  <p className="text-lg font-bold">{weightTrend.recent.toFixed(1)} lbs</p>
                </div>
                <Badge variant={weightTrend.improving ? "default" : "destructive"}>
                  {weightTrend.improving ? "↓" : "↑"}
                </Badge>
              </div>
            </div>

            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Steps</p>
                  <p className="text-lg font-bold">{stepsTrend.recent.toFixed(0)}</p>
                </div>
                <Badge variant={!stepsTrend.improving ? "default" : "destructive"}>
                  {!stepsTrend.improving ? "↓" : "↑"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Clinical Trends Chart */}
          <div className="h-80">
            <h4 className="font-semibold mb-4">Clinical Biomarkers</h4>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                
                <Line 
                  type="monotone" 
                  dataKey="glucose" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                  name="Glucose (mg/dL)"
                />
                <Line 
                  type="monotone" 
                  dataKey="systolic" 
                  stroke="hsl(var(--danger))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--danger))", strokeWidth: 2, r: 4 }}
                  name="Systolic BP (mmHg)"
                />
                <Line 
                  type="monotone" 
                  dataKey="weight" 
                  stroke="hsl(var(--warning))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--warning))", strokeWidth: 2, r: 4 }}
                  name="Weight (lbs)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Activity & Lifestyle Chart */}
          <div className="h-64">
            <h4 className="font-semibold mb-4">Activity & Lifestyle</h4>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                
                <Line 
                  type="monotone" 
                  dataKey="steps" 
                  stroke="hsl(var(--secondary))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--secondary))", strokeWidth: 2, r: 4 }}
                  name="Daily Steps"
                />
                <Line 
                  type="monotone" 
                  dataKey="heartRate" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                  name="Heart Rate (bpm)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Clinical Notes Section */}
          <div className="p-4 bg-muted/30 rounded-lg">
            <h4 className="font-semibold mb-2 flex items-center space-x-2">
              <Activity className="h-4 w-4" />
              <span>Clinical Summary</span>
            </h4>
            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground">
                <strong>Glucose Control:</strong> {glucoseTrend.improving ? "Improving" : "Needs attention"}. 
                Average HbA1c equivalent ~{((glucoseTrend.recent + 46.7) / 28.7).toFixed(1)}%.
              </p>
              <p className="text-muted-foreground">
                <strong>Blood Pressure:</strong> {systolicTrend.improving ? "Well controlled" : "Elevated"}. 
                Current average {systolicTrend.recent.toFixed(0)}/85 mmHg.
              </p>
              <p className="text-muted-foreground">
                <strong>Activity Level:</strong> {stepsTrend.recent > 8000 ? "Good" : "Below target"}. 
                Averaging {stepsTrend.recent.toFixed(0)} steps/day.
              </p>
              <p className="text-muted-foreground">
                <strong>Engagement:</strong> {patient.engagement}% app engagement rate. 
                {patient.engagement > 80 ? "Excellent compliance." : "May need additional support."}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PatientTrends;