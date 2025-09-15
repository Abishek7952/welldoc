import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface HealthChartProps {
  ageGroup: "child" | "adult" | "senior";
}

// Sample health trend data
const healthTrendData = [
  { date: 'Jan 1', glucose: 95, bloodPressure: 125, heartRate: 72, steps: 8500, weight: 165 },
  { date: 'Jan 3', glucose: 98, bloodPressure: 128, heartRate: 75, steps: 9200, weight: 164.5 },
  { date: 'Jan 5', glucose: 102, bloodPressure: 130, heartRate: 78, steps: 7800, weight: 164.8 },
  { date: 'Jan 7', glucose: 96, bloodPressure: 126, heartRate: 73, steps: 10500, weight: 164.2 },
  { date: 'Jan 9', glucose: 94, bloodPressure: 124, heartRate: 71, steps: 11200, weight: 163.9 },
  { date: 'Jan 11', glucose: 99, bloodPressure: 127, heartRate: 74, steps: 9800, weight: 163.5 },
  { date: 'Jan 13', glucose: 97, bloodPressure: 125, heartRate: 72, steps: 10800, weight: 163.1 },
  { date: 'Jan 15', glucose: 93, bloodPressure: 122, heartRate: 70, steps: 12000, weight: 162.8 }
];

const weeklyGoalsData = [
  { week: 'Week 1', steps: 85, sleep: 78, water: 92, exercise: 60 },
  { week: 'Week 2', steps: 92, sleep: 85, water: 88, exercise: 75 },
  { week: 'Week 3', steps: 78, sleep: 82, water: 95, exercise: 80 },
  { week: 'Week 4', steps: 96, sleep: 90, water: 85, exercise: 85 }
];

const HealthChart = ({ ageGroup }: HealthChartProps) => {
  const getChartTitle = () => {
    if (ageGroup === "child") return "My Health Journey! 📈";
    if (ageGroup === "senior") return "Health Trends";
    return "Health Metrics Trends";
  };

  const getGoalsTitle = () => {
    if (ageGroup === "child") return "Mission Progress! 🎯";
    if (ageGroup === "senior") return "Goal Achievement";
    return "Weekly Goal Completion";
  };

  // Custom tooltip for age-appropriate content
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center space-x-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span>{entry.dataKey}:</span>
              <span className="font-medium">
                {entry.value}
                {entry.dataKey === 'steps' ? ' steps' : 
                 entry.dataKey === 'glucose' ? ' mg/dL' :
                 entry.dataKey === 'bloodPressure' ? ' mmHg' :
                 entry.dataKey === 'heartRate' ? ' bpm' :
                 entry.dataKey === 'weight' ? ' lbs' : '%'}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const getColors = () => {
    if (ageGroup === "child") {
      return {
        primary: "#8b5cf6", // Purple
        secondary: "#10b981", // Green
        tertiary: "#f59e0b", // Yellow
        quaternary: "#ef4444" // Red
      };
    }
    return {
      primary: "hsl(var(--primary))",
      secondary: "hsl(var(--secondary))",
      tertiary: "hsl(var(--warning))",
      quaternary: "hsl(var(--danger))"
    };
  };

  const colors = getColors();

  return (
    <div className="space-y-8">
      {/* Health Trends Chart */}
      <div>
        <h4 className={`font-semibold mb-4 ${ageGroup === "senior" ? "text-base" : "text-sm"}`}>
          {getChartTitle()}
        </h4>
        <div className={`h-64 ${ageGroup === "senior" ? "h-80" : ""}`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={healthTrendData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: ageGroup === "senior" ? 14 : 12 }}
              />
              <YAxis tick={{ fontSize: ageGroup === "senior" ? 14 : 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: ageGroup === "senior" ? "14px" : "12px" }} />
              
              {ageGroup === "child" ? (
                <>
                  <Line 
                    type="monotone" 
                    dataKey="steps" 
                    stroke={colors.primary} 
                    strokeWidth={3}
                    dot={{ fill: colors.primary, strokeWidth: 2, r: 4 }}
                    name="Steps"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="heartRate" 
                    stroke={colors.secondary} 
                    strokeWidth={3}
                    dot={{ fill: colors.secondary, strokeWidth: 2, r: 4 }}
                    name="Heart Rate ❤️"
                  />
                </>
              ) : (
                <>
                  <Line 
                    type="monotone" 
                    dataKey="glucose" 
                    stroke={colors.primary} 
                    strokeWidth={2}
                    dot={{ fill: colors.primary, strokeWidth: 2, r: 3 }}
                    name="Glucose (mg/dL)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="bloodPressure" 
                    stroke={colors.secondary} 
                    strokeWidth={2}
                    dot={{ fill: colors.secondary, strokeWidth: 2, r: 3 }}
                    name="Blood Pressure (mmHg)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="heartRate" 
                    stroke={colors.tertiary} 
                    strokeWidth={2}
                    dot={{ fill: colors.tertiary, strokeWidth: 2, r: 3 }}
                    name="Heart Rate (bpm)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="steps" 
                    stroke={colors.quaternary} 
                    strokeWidth={2}
                    dot={{ fill: colors.quaternary, strokeWidth: 2, r: 3 }}
                    name="Daily Steps"
                  />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Goals Progress Chart */}
      <div>
        <h4 className={`font-semibold mb-4 ${ageGroup === "senior" ? "text-base" : "text-sm"}`}>
          {getGoalsTitle()}
        </h4>
        <div className={`h-64 ${ageGroup === "senior" ? "h-80" : ""}`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyGoalsData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                dataKey="week" 
                tick={{ fontSize: ageGroup === "senior" ? 14 : 12 }}
              />
              <YAxis 
                domain={[0, 100]}
                tick={{ fontSize: ageGroup === "senior" ? 14 : 12 }}
                label={{ 
                  value: 'Completion %', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { fontSize: ageGroup === "senior" ? "14px" : "12px" }
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: ageGroup === "senior" ? "14px" : "12px" }} />
              
              <Bar 
                dataKey="steps" 
                fill={colors.primary}
                radius={[2, 2, 0, 0]}
                name={ageGroup === "child" ? "Steps 👣" : "Steps"}
              />
              <Bar 
                dataKey="sleep" 
                fill={colors.secondary}
                radius={[2, 2, 0, 0]}
                name={ageGroup === "child" ? "Sleep 😴" : "Sleep"}
              />
              <Bar 
                dataKey="water" 
                fill={colors.tertiary}
                radius={[2, 2, 0, 0]}
                name={ageGroup === "child" ? "Water 💧" : "Water"}
              />
              <Bar 
                dataKey="exercise" 
                fill={colors.quaternary}
                radius={[2, 2, 0, 0]}
                name={ageGroup === "child" ? "Exercise 💪" : "Exercise"}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Age-specific insights */}
      <div className="mt-6 p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
          <span className="font-medium text-primary">
            {ageGroup === "child" ? "🌟 Great job!" : "📊 Insights"}
          </span>
        </div>
        <p className={`text-muted-foreground ${ageGroup === "senior" ? "text-sm" : "text-xs"}`}>
          {ageGroup === "child" 
            ? "Your health numbers are looking awesome! Keep up the great work with your daily missions!"
            : ageGroup === "senior"
            ? "Your health trends show good progress. Keep following your care plan and stay consistent with your goals."
            : "Your glucose levels have improved by 8% this month, and your step count is trending upward. The correlation between increased activity and better glucose control is clearly visible in your data."
          }
        </p>
      </div>
    </div>
  );
};

export default HealthChart;