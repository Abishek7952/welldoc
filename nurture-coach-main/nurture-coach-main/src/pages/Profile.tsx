import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { Heart, Edit, Save, User, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { authUtils } from "@/lib/api";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    age: "",
    gender: "",
    email: "",
    phone: "",
    conditions: "",
    medications: "",
    allergies: "",
    language: "en",
    emergencyContact: "",
    emergencyPhone: ""
  });

  useEffect(() => {
    // Load existing profile or show empty for new users
    const savedProfile = localStorage.getItem("userProfile");
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
    } else {
      setIsEditing(true); // Auto-edit mode for new users
    }
  }, []);

  const autoFillSampleData = () => {
    setProfile({
      firstName: "Alex",
      lastName: "Johnson",
      age: "34",
      gender: "Non-binary",
      email: "alex.johnson@email.com",
      phone: "+1 (555) 123-4567",
      conditions: "Type 2 Diabetes, Hypertension",
      medications: "Metformin 500mg twice daily, Lisinopril 10mg once daily",
      allergies: "Penicillin, Shellfish",
      language: "en",
      emergencyContact: "Jamie Johnson (Spouse)",
      emergencyPhone: "+1 (555) 987-6543"
    });
    setIsEditing(true);
    toast({
      title: "Sample data loaded",
      description: "Profile filled with demo data. Click save to continue.",
    });
  };

  const handleSave = () => {
    if (!profile.firstName || !profile.lastName || !profile.age) {
      toast({
        title: "Required fields missing",
        description: "Please fill in name and age before saving.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    setTimeout(() => {
      localStorage.setItem("userProfile", JSON.stringify(profile));
      setIsEditing(false);
      setLoading(false);

      toast({
        title: "Profile saved successfully!",
        description: "Routing to your personalized dashboard...",
      });

      // Age-based routing
      const age = parseInt(profile.age);
      const userType = localStorage.getItem("userType") || "patient";
      
      setTimeout(() => {
        if (userType === "clinician") {
          navigate("/clinician-dashboard");
        } else {
          navigate("/patient-dashboard");
        }
      }, 1500);
    }, 1000);
  };

  const getAgeGroup = () => {
    const age = parseInt(profile.age);
    if (age <= 16) return "child";
    if (age >= 65) return "senior";
    return "adult";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Heart className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">AI Health Coach</span>
          </div>
          <Button
            variant="ghost"
            onClick={() => {
              authUtils.logout();
              navigate("/login");
            }}
          >
            Sign Out
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Your Health Profile</h1>
          <p className="text-xl text-muted-foreground">
            Complete your profile to get personalized health insights
          </p>
        </div>

        {profile.age && (
          <div className="mb-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
            <div className="flex items-center space-x-2">
              <Info className="h-5 w-5 text-primary" />
              <span className="font-medium">Interface Mode: </span>
              <span className="capitalize text-primary font-bold">
                {getAgeGroup()} ({profile.age} years old)
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Your dashboard will adapt based on your age for the best experience.
            </p>
          </div>
        )}

        <Card className="health-card">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-6 w-6" />
                  <span>Personal Information</span>
                </CardTitle>
                <CardDescription>
                  {isEditing ? "Edit your personal and health information" : "Your health profile information"}
                </CardDescription>
              </div>
              <div className="space-x-2">
                {!isEditing && (
                  <>
                    <Button variant="outline" onClick={autoFillSampleData}>
                      Auto-fill Demo
                    </Button>
                    <Button onClick={() => setIsEditing(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </>
                )}
                {isEditing && (
                  <>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={loading}>
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? "Saving..." : "Save"}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={profile.firstName}
                  onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Enter your first name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={profile.lastName}
                  onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Enter your last name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Age *</Label>
                <Input
                  id="age"
                  type="number"
                  min="1"
                  max="120"
                  value={profile.age}
                  onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Enter your age"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <select 
                  id="gender"
                  className="w-full px-3 py-2 border border-input rounded-md bg-background disabled:opacity-50"
                  value={profile.gender}
                  onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                  disabled={!isEditing}
                >
                  <option value="">Select gender</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="non-binary">Non-binary</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Enter your email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Enter your phone number"
                />
              </div>
            </div>

            {/* Health Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Health Information</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="conditions">Medical Conditions</Label>
                  <Textarea
                    id="conditions"
                    value={profile.conditions}
                    onChange={(e) => setProfile({ ...profile, conditions: e.target.value })}
                    disabled={!isEditing}
                    placeholder="List any diagnosed medical conditions..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="medications">Current Medications</Label>
                  <Textarea
                    id="medications"
                    value={profile.medications}
                    onChange={(e) => setProfile({ ...profile, medications: e.target.value })}
                    disabled={!isEditing}
                    placeholder="List current medications with dosages..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="allergies">Allergies</Label>
                  <Textarea
                    id="allergies"
                    value={profile.allergies}
                    onChange={(e) => setProfile({ ...profile, allergies: e.target.value })}
                    disabled={!isEditing}
                    placeholder="List any known allergies..."
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Emergency Contact</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergencyContact">Contact Name</Label>
                  <Input
                    id="emergencyContact"
                    value={profile.emergencyContact}
                    onChange={(e) => setProfile({ ...profile, emergencyContact: e.target.value })}
                    disabled={!isEditing}
                    placeholder="Emergency contact name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyPhone">Contact Phone</Label>
                  <Input
                    id="emergencyPhone"
                    type="tel"
                    value={profile.emergencyPhone}
                    onChange={(e) => setProfile({ ...profile, emergencyPhone: e.target.value })}
                    disabled={!isEditing}
                    placeholder="Emergency contact phone"
                  />
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Preferences</h3>
              <div className="space-y-2">
                <Label htmlFor="language">Preferred Language</Label>
                <select 
                  id="language"
                  className="w-full px-3 py-2 border border-input rounded-md bg-background disabled:opacity-50"
                  value={profile.language}
                  onChange={(e) => setProfile({ ...profile, language: e.target.value })}
                  disabled={!isEditing}
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;