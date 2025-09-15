import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Phone, Calendar, Activity, TrendingUp, TrendingDown } from "lucide-react";

interface Patient {
  id: number;
  name: string;
  age: number;
  riskLevel: "low" | "medium" | "high";
  conditions: string[];
  lastVisit: string;
  diabetesRisk: number;
  hypertensionRisk: number;
  engagement: number;
  alerts: number;
}

interface PatientListProps {
  patients: Patient[];
  onSelectPatient: (patient: Patient) => void;
  selectedPatient: Patient | null;
}

const ClinicianPatientList = ({ patients, onSelectPatient, selectedPatient }: PatientListProps) => {
  const getRiskBadgeVariant = (level: string) => {
    switch (level) {
      case "high": return "destructive";
      case "medium": return "secondary";
      case "low": return "outline";
      default: return "outline";
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "high": return "text-danger";
      case "medium": return "text-warning";
      case "low": return "text-success";
      default: return "text-muted-foreground";
    }
  };

  return (
    <div className="space-y-3">
      {patients.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No patients found matching your criteria.</p>
        </div>
      ) : (
        patients.map((patient) => (
          <Card 
            key={patient.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
              selectedPatient?.id === patient.id 
                ? 'ring-2 ring-primary border-primary' 
                : 'hover:border-primary/50'
            }`}
            onClick={() => onSelectPatient(patient)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-semibold text-foreground">{patient.name}</h4>
                    <Badge variant={getRiskBadgeVariant(patient.riskLevel)}>
                      {patient.riskLevel} risk
                    </Badge>
                    {patient.alerts > 0 && (
                      <div className="flex items-center space-x-1 text-danger">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-xs font-medium">{patient.alerts}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Age: {patient.age}</p>
                      <p className="text-muted-foreground">Last visit: {patient.lastVisit}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">
                        Conditions: {patient.conditions.join(", ")}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Activity className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Engagement: {patient.engagement}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Risk Indicators */}
                  <div className="flex space-x-4 mt-3 text-xs">
                    <div className="flex items-center space-x-1">
                      <span className="text-muted-foreground">T2D Risk:</span>
                      <span className={`font-medium ${getRiskColor(
                        patient.diabetesRisk > 70 ? "high" : 
                        patient.diabetesRisk > 40 ? "medium" : "low"
                      )}`}>
                        {patient.diabetesRisk}%
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-muted-foreground">HTN Risk:</span>
                      <span className={`font-medium ${getRiskColor(
                        patient.hypertensionRisk > 70 ? "high" : 
                        patient.hypertensionRisk > 40 ? "medium" : "low"
                      )}`}>
                        {patient.hypertensionRisk}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-col space-y-2 ml-4">
                  <Button size="sm" variant="outline" className="w-20">
                    <Phone className="h-3 w-3 mr-1" />
                    Call
                  </Button>
                  <Button size="sm" variant="outline" className="w-20">
                    <Calendar className="h-3 w-3 mr-1" />
                    Book
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};

export default ClinicianPatientList;