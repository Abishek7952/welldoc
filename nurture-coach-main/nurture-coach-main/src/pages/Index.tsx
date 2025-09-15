import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Activity, Shield, Users, Zap, Heart, Brain } from "lucide-react";
import heroImage from "@/assets/hero-healthcare.jpg";
import { useEffect, useState } from "react";
import { authUtils, apiService } from "@/lib/api";

const Index = () => {
  const [isRouterReady, setIsRouterReady] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication status and redirect if logged in
    const checkAuthAndRedirect = async () => {
      try {
        const token = authUtils.getToken();
        if (token) {
          // Verify token is still valid
          const user = await apiService.getCurrentUser();
          // Redirect based on user type
          if (user.userType === "clinician") {
            navigate("/clinician-dashboard");
          } else {
            navigate("/patient-dashboard");
          }
          return;
        }
      } catch (error) {
        // Token is invalid, remove it
        authUtils.removeToken();
      } finally {
        setIsCheckingAuth(false);
      }
    };

    // Ensure router is ready after initial render
    const timer = setTimeout(() => {
      setIsRouterReady(true);
      checkAuthAndRedirect();
    }, 0);

    return () => clearTimeout(timer);
  }, [navigate]);

  const handleNavigation = (path: string) => {
    if (isRouterReady) {
      navigate(path);
    } else {
      // Fallback for SSR or initial render issues
      window.location.href = path;
    }
  };

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Heart className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">AI Health Coach</span>
          </div>
          <div className="space-x-4">
            {authUtils.isAuthenticated() ? (
              <Button onClick={() => {
                const userType = authUtils.getUserType();
                if (userType === "clinician") {
                  handleNavigation("/clinician-dashboard");
                } else {
                  handleNavigation("/patient-dashboard");
                }
              }}>
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => handleNavigation("/login")}>
                  Sign In
                </Button>
                <Button onClick={() => handleNavigation("/signup")}>
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto mb-16">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Your Personal AI Health Coach
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Intelligent health monitoring with personalized insights, risk prediction, and adaptive interfaces 
              for patients and clinicians. Experience healthcare that adapts to your age and needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8 py-4" onClick={() => handleNavigation("/signup")}>
                Start Your Health Journey
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-4" onClick={() => handleNavigation("/login")}>
                Healthcare Provider Login
              </Button>
            </div>
          </div>
          
          <div className="relative max-w-5xl mx-auto">
            <img 
              src={heroImage} 
              alt="AI Health Coach Platform - Modern healthcare technology interface"
              className="rounded-2xl shadow-2xl w-full h-auto"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent rounded-2xl"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Intelligent Healthcare for Everyone</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Age-adaptive interfaces and AI-powered insights that grow with your health needs
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="health-card">
              <CardHeader>
                <Brain className="h-12 w-12 text-primary mb-4" />
                <CardTitle>AI Risk Prediction</CardTitle>
                <CardDescription>
                  Advanced SHAP-based explanations help you understand your health risks with clear, actionable insights.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="health-card">
              <CardHeader>
                <Users className="h-12 w-12 text-secondary mb-4" />
                <CardTitle>Age-Adaptive Interface</CardTitle>
                <CardDescription>
                  Playful for kids, analytical for adults, and simple for seniors. Our interface adapts to your age and needs.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="health-card">
              <CardHeader>
                <Activity className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Digital Twin Simulation</CardTitle>
                <CardDescription>
                  Explore "what if" scenarios to see how lifestyle changes could impact your future health outcomes.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="health-card">
              <CardHeader>
                <Zap className="h-12 w-12 text-warning mb-4" />
                <CardTitle>Gamified Health Goals</CardTitle>
                <CardDescription>
                  Earn points, unlock badges, and compete with family members to make healthy living engaging and fun.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="health-card">
              <CardHeader>
                <Shield className="h-12 w-12 text-success mb-4" />
                <CardTitle>Safety First</CardTitle>
                <CardDescription>
                  Built-in safety protocols with immediate escalation to healthcare providers when needed.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="health-card">
              <CardHeader>
                <Heart className="h-12 w-12 text-danger mb-4" />
                <CardTitle>Voice Assistant</CardTitle>
                <CardDescription>
                  Speak naturally to get health insights, log symptoms, and receive personalized recommendations.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Health?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of patients and healthcare providers who trust AI Health Coach for personalized care.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8 py-4" onClick={() => handleNavigation("/signup")}>
                Get Started Free
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-4">
                Schedule Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4">
        <div className="container mx-auto text-center text-muted-foreground">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Heart className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold">AI Health Coach</span>
          </div>
          <p>&copy; 2024 AI Health Coach. Built for better health outcomes.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;