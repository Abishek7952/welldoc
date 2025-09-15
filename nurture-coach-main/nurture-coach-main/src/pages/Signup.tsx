import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { Heart, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiService, authUtils } from "@/lib/api";

const Signup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
    userType: "patient"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.agreeToTerms) {
      setShowConsent(true);
      return;
    }

    setLoading(true);

    try {
      // Call the backend API
      const response = await apiService.register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        userType: formData.userType
      });

      // Store the token and set authentication state
      authUtils.setToken(response.access_token);
      authUtils.setUserType(formData.userType);
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("newUser", "true");

      toast({
        title: "Account created!",
        description: "Welcome to AI Health Coach. Please complete your profile.",
      });

      navigate("/profile");
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Failed to create account",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const ConsentModal = () => (
    <Dialog open={showConsent} onOpenChange={setShowConsent}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Heart className="h-6 w-6 text-primary" />
            <span>Health Data Consent & Disclaimer</span>
          </DialogTitle>
          <DialogDescription>
            Please read and acknowledge the following important information about using AI Health Coach.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 text-sm">
          <div className="p-4 bg-danger/10 border border-danger/20 rounded-lg">
            <h4 className="font-bold text-danger mb-2">⚠️ IMPORTANT SAFETY NOTICE</h4>
            <p className="text-foreground">
              AI Health Coach is NOT a substitute for professional medical advice, diagnosis, or treatment. 
              Always seek the advice of qualified healthcare providers with any questions about medical conditions.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Data Collection & Use</h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>We collect health data to provide personalized insights and recommendations</li>
              <li>Your data is encrypted and stored securely according to HIPAA standards</li>
              <li>We may share anonymized data for research purposes with your consent</li>
              <li>You can request data deletion at any time</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">AI Limitations</h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>AI predictions are estimates based on available data and may not be accurate</li>
              <li>The system cannot diagnose medical conditions or prescribe treatments</li>
              <li>Always verify AI recommendations with healthcare professionals</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Emergency Situations</h4>
            <p className="text-muted-foreground">
              If you experience a medical emergency, call emergency services immediately (911 in the US). 
              Do not rely on this app for emergency medical situations.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 mt-6">
          <Checkbox
            id="consent"
            checked={formData.agreeToTerms}
            onCheckedChange={(checked) => 
              setFormData({ ...formData, agreeToTerms: checked as boolean })
            }
          />
          <Label htmlFor="consent" className="text-sm">
            I have read and understand the terms, and I consent to the collection and use of my health data
          </Label>
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="outline" onClick={() => setShowConsent(false)}>
            Cancel
          </Button>
          <Button 
            onClick={() => {
              setShowConsent(false);
              handleSubmit(new Event("submit") as any);
            }}
            disabled={!formData.agreeToTerms}
          >
            I Agree & Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light/20 to-secondary-light/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center items-center space-x-2 mb-4">
            <Heart className="h-10 w-10 text-primary" />
            <span className="text-3xl font-bold text-foreground">AI Health Coach</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
          <p className="text-muted-foreground">Join thousands improving their health with AI</p>
        </div>

        {/* Signup Form */}
        <Card className="health-card">
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>
              Create your account to start your personalized health journey
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="First name"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Last name"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="userType">Account Type</Label>
                <select 
                  id="userType"
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  value={formData.userType}
                  onChange={(e) => setFormData({ ...formData, userType: e.target.value })}
                >
                  <option value="patient">Patient</option>
                  <option value="clinician">Healthcare Provider</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={formData.agreeToTerms}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, agreeToTerms: checked as boolean })
                  }
                />
                <Label htmlFor="terms" className="text-sm">
                  I agree to the{" "}
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={() => setShowConsent(true)}
                  >
                    Terms of Service and Privacy Policy
                  </button>
                </Label>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating account..." : "Create Account"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() => navigate("/login")}
                >
                  Sign in
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <ConsentModal />
    </div>
  );
};

export default Signup;