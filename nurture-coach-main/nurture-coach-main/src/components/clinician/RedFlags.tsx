import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Phone, Clock, TrendingUp, User } from "lucide-react";

interface Patient {
  id: number;
  name: string;
  age: number;
  riskLevel: string;
  conditions: string[];
  lastVisit: string;
  diabetesRisk: number;
  hypertensionRisk: number;
  engagement: number;
  alerts: number;
}

interface RedFlagsProps {
  patients: Patient[];
}

// Generate specific alert types for each patient
const generateAlerts = (patient: Patient) => {
  const alerts = [];
  
  if (patient.diabetesRisk > 70) {
    alerts.push({
      type: "critical",
      message: "Diabetes risk exceeded 70%",
      time: "2 hours ago",
      action: "Review medication adherence"
    });
  }
  
  if (patient.hypertensionRisk > 75) {
    alerts.push({
      type: "critical",
      message: "Blood pressure spike detected",
      time: "4 hours ago",
      action: "Schedule immediate follow-up"
    });
  }
  
  if (patient.engagement < 50) {
    alerts.push({
      type: "warning",
      message: "Low app engagement (< 50%)",
      time: "1 day ago",
      action: "Patient outreach needed"
    });
  }
  
  if (patient.riskLevel === "high" && new Date(patient.lastVisit) < new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)) {
    alerts.push({
      type: "warning",
      message: "Overdue for follow-up visit",
      time: "3 days ago",
      action: "Schedule appointment"
    });
  }
  
  return alerts.slice(0, patient.alerts); // Limit to the number of alerts specified
};

const RedFlags = ({ patients }: RedFlagsProps) => {
  // Get all patients with alerts and their specific alert details
  const patientsWithAlerts = patients
    .map(patient => ({
      ...patient,
      alertDetails: generateAlerts(patient)
    }))
    .filter(patient => patient.alertDetails.length > 0)
    .sort((a, b) => {
      // Sort by criticality first, then by number of alerts
      const aCritical = a.alertDetails.filter(alert => alert.type === "critical").length;
      const bCritical = b.alertDetails.filter(alert => alert.type === "critical").length;
      if (aCritical !== bCritical) return bCritical - aCritical;
      return b.alertDetails.length - a.alertDetails.length;
    });

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "critical": return <AlertTriangle className="h-4 w-4 text-danger" />;
      case "warning": return <TrendingUp className="h-4 w-4 text-warning" />;
      default: return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getAlertBadge = (type: string) => {
    switch (type) {
      case "critical": return "destructive";
      case "warning": return "secondary";
      default: return "outline";
    }
  };

  if (patientsWithAlerts.length === 0) {
    return (
      <Card className="health-card border-success/20 bg-success/5">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-success">
            <AlertTriangle className="h-5 w-5" />
            <span>Patient Alerts</span>
          </CardTitle>
          <CardDescription>
            No critical alerts at this time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <p>✅ All patients are within normal parameters</p>
            <p className="text-sm mt-2">No immediate action required</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="health-card border-danger/20 bg-danger/5">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-danger">
            <AlertTriangle className="h-5 w-5" />
            <span>🚨 Red Flags Alert</span>
          </div>
          <Badge variant="destructive">
            {patientsWithAlerts.length} patient{patientsWithAlerts.length !== 1 ? 's' : ''} need attention
          </Badge>
        </CardTitle>
        <CardDescription>
          Patients requiring immediate clinical attention
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {patientsWithAlerts.map((patient) => (
            <div key={patient.id} className="border border-border rounded-lg p-4 bg-background">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <h4 className="font-semibold">{patient.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Age {patient.age} • {patient.conditions.join(", ")}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={getAlertBadge(patient.riskLevel)} className="mb-1">
                    {patient.riskLevel} risk
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    {patient.alertDetails.length} alert{patient.alertDetails.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Alert Details */}
              <div className="space-y-2 mb-4">
                {patient.alertDetails.map((alert, alertIndex) => (
                  <div 
                    key={alertIndex} 
                    className={`flex items-center justify-between p-2 rounded ${
                      alert.type === "critical" 
                        ? "bg-danger/10 border border-danger/20" 
                        : "bg-warning/10 border border-warning/20"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {getAlertIcon(alert.type)}
                      <span className="text-sm font-medium">{alert.message}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{alert.time}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Risk Metrics */}
              <div className="grid grid-cols-3 gap-3 mb-4 text-sm">
                <div className="text-center p-2 bg-muted/30 rounded">
                  <p className="font-medium text-danger">{patient.diabetesRisk}%</p>
                  <p className="text-xs text-muted-foreground">T2D Risk</p>
                </div>
                <div className="text-center p-2 bg-muted/30 rounded">
                  <p className="font-medium text-warning">{patient.hypertensionRisk}%</p>
                  <p className="text-xs text-muted-foreground">HTN Risk</p>
                </div>
                <div className="text-center p-2 bg-muted/30 rounded">
                  <p className="font-medium">{patient.engagement}%</p>
                  <p className="text-xs text-muted-foreground">Engagement</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                {patient.alertDetails.map((alert, alertIndex) => (
                  <Button 
                    key={alertIndex}
                    size="sm" 
                    variant={alert.type === "critical" ? "default" : "outline"}
                    className="text-xs"
                  >
                    {alert.action}
                  </Button>
                ))}
                <Button size="sm" variant="outline" className="text-xs">
                  <Phone className="h-3 w-3 mr-1" />
                  Call Patient
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Action Bar */}
        <div className="mt-6 p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Action Required</p>
              <p className="text-sm text-muted-foreground">
                {patientsWithAlerts.filter(p => p.alertDetails.some(a => a.type === "critical")).length} critical, {" "}
                {patientsWithAlerts.filter(p => p.alertDetails.some(a => a.type === "warning")).length} warning alerts
              </p>
            </div>
            <div className="space-x-2">
              <Button variant="outline" size="sm">
                Mark All Reviewed
              </Button>
              <Button size="sm">
                Bulk Actions
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RedFlags;