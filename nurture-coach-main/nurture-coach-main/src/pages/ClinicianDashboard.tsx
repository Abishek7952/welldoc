import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { 
  Heart, 
  Search, 
  Filter, 
  AlertTriangle,
  TrendingUp,
  Users,
  FileText,
  Download,
  Phone,
  Calendar,
  Activity
} from "lucide-react";
import ClinicianPatientList from "@/components/clinician/PatientList";
import PatientTrends from "@/components/clinician/PatientTrends";
import ShapClinicalView from "@/components/clinician/ShapClinicalView";
import RedFlags from "@/components/clinician/RedFlags";

// Sample clinical data
const clinicalData = {
  patients: [
    {
      id: 1,
      name: "Alex Johnson",
      age: 34,
      riskLevel: "medium" as const,
      conditions: ["Type 2 Diabetes", "Hypertension"],
      lastVisit: "2024-01-10",
      diabetesRisk: 65,
      hypertensionRisk: 25,
      engagement: 92,
      alerts: 1
    },
    {
      id: 2,
      name: "Maria Garcia",
      age: 67,
      riskLevel: "high" as const,
      conditions: ["Hypertension", "Heart Disease"],
      lastVisit: "2024-01-08",
      diabetesRisk: 45,
      hypertensionRisk: 78,
      engagement: 76,
      alerts: 3
    },
    {
      id: 3,
      name: "James Chen",
      age: 12,
      riskLevel: "low" as const,
      conditions: ["Asthma"],
      lastVisit: "2024-01-12",
      diabetesRisk: 15,
      hypertensionRisk: 8,
      engagement: 88,
      alerts: 0
    },
    {
      id: 4,
      name: "Sarah Williams",
      age: 45,
      riskLevel: "medium" as const,
      conditions: ["Pre-diabetes"],
      lastVisit: "2024-01-09",
      diabetesRisk: 52,
      hypertensionRisk: 32,
      engagement: 84,
      alerts: 1
    }
  ],
  summary: {
    totalPatients: 124,
    highRisk: 18,
    activeAlerts: 12,
    avgEngagement: 85
  }
};

const ClinicianDashboard = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [filterRisk, setFilterRisk] = useState("all");

  const filteredPatients = clinicalData.patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterRisk === "all" || patient.riskLevel === filterRisk;
    return matchesSearch && matchesFilter;
  });

  const exportReport = () => {
    // Placeholder for PDF export
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Patient Report</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .patient-info { margin-bottom: 20px; }
              .risk-card { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 8px; }
              .high-risk { background: #fee2e2; }
              .medium-risk { background: #fef3c7; }
              .low-risk { background: #dcfce7; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>AI Health Coach - Patient Report</h1>
              <p>Generated on ${new Date().toLocaleDateString()}</p>
            </div>
            ${selectedPatient ? `
              <div class="patient-info">
                <h2>${selectedPatient.name}</h2>
                <p><strong>Age:</strong> ${selectedPatient.age}</p>
                <p><strong>Risk Level:</strong> ${selectedPatient.riskLevel}</p>
                <p><strong>Conditions:</strong> ${selectedPatient.conditions.join(', ')}</p>
              </div>
              <div class="risk-card ${selectedPatient.riskLevel}-risk">
                <h3>Risk Assessment</h3>
                <p>Diabetes Risk: ${selectedPatient.diabetesRisk}%</p>
                <p>Hypertension Risk: ${selectedPatient.hypertensionRisk}%</p>
              </div>
            ` : `
              <h2>Patient Summary</h2>
              <p>Total Patients: ${clinicalData.summary.totalPatients}</p>
              <p>High Risk Patients: ${clinicalData.summary.highRisk}</p>
              <p>Active Alerts: ${clinicalData.summary.activeAlerts}</p>
            `}
          </body>
        </html>
      `);
      printWindow.print();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Heart className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">AI Health Coach</span>
            <Badge variant="outline" className="ml-4">Clinician Portal</Badge>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule
            </Button>
            <Button variant="ghost" onClick={() => navigate("/profile")}>
              Profile
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => {
                localStorage.removeItem("isAuthenticated");
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
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Clinical Dashboard</h1>
          <p className="text-xl text-muted-foreground">
            Monitor patient health outcomes and manage care plans
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="health-card">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{clinicalData.summary.totalPatients}</p>
                  <p className="text-sm text-muted-foreground">Total Patients</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="health-card">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-8 w-8 text-danger" />
                <div>
                  <p className="text-2xl font-bold text-danger">{clinicalData.summary.highRisk}</p>
                  <p className="text-sm text-muted-foreground">High Risk</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="health-card">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Activity className="h-8 w-8 text-warning" />
                <div>
                  <p className="text-2xl font-bold text-warning">{clinicalData.summary.activeAlerts}</p>
                  <p className="text-sm text-muted-foreground">Active Alerts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="health-card">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-8 w-8 text-success" />
                <div>
                  <p className="text-2xl font-bold text-success">{clinicalData.summary.avgEngagement}%</p>
                  <p className="text-sm text-muted-foreground">Avg Engagement</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Patient Management */}
          <div className="lg:col-span-2 space-y-6">
            {/* Red Flags Alert Panel */}
            <RedFlags patients={clinicalData.patients.filter(p => p.alerts > 0)} />

            {/* Patient Search & Filter */}
            <Card className="health-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Patient Management</span>
                  </div>
                  <Button onClick={exportReport} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export Report
                  </Button>
                </CardTitle>
                <CardDescription>
                  Search, filter, and manage your patient population
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search patients..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <select 
                    className="px-3 py-2 border border-input rounded-md bg-background"
                    value={filterRisk}
                    onChange={(e) => setFilterRisk(e.target.value)}
                  >
                    <option value="all">All Risk Levels</option>
                    <option value="high">High Risk</option>
                    <option value="medium">Medium Risk</option>
                    <option value="low">Low Risk</option>
                  </select>
                </div>

                {/* Patient List */}
                <ClinicianPatientList 
                  patients={filteredPatients}
                  onSelectPatient={setSelectedPatient}
                  selectedPatient={selectedPatient}
                />
              </CardContent>
            </Card>

            {/* Patient Trends */}
            {selectedPatient && (
              <PatientTrends patient={selectedPatient} />
            )}
          </div>

          {/* Right Column - Clinical Insights */}
          <div className="space-y-6">
            {/* SHAP Clinical View */}
            {selectedPatient && (
              <ShapClinicalView patient={selectedPatient} />
            )}

            {/* Quick Actions */}
            <Card className="health-card">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <Phone className="h-4 w-4 mr-2" />
                  Call Patient
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Appointment
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Add Clinical Note
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Activity className="h-4 w-4 mr-2" />
                  Order Lab Tests
                </Button>
              </CardContent>
            </Card>

            {/* Integration Placeholders */}
            <Card className="health-card">
              <CardHeader>
                <CardTitle>External Integrations</CardTitle>
                <CardDescription>Connect with healthcare systems</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  Practo Integration
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Epic Health Records
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Cerner Integration
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Lab Results API
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicianDashboard;