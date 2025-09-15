// src/components/ProtectedRoute.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authUtils, apiService } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredUserType?: string;
}

const ProtectedRoute = ({ children, requiredUserType }: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = authUtils.getToken();
        
        if (!token) {
          navigate("/login");
          return;
        }

        // Verify token by making a request to get current user
        const user = await apiService.getCurrentUser();
        
        // Check if user type matches requirement
        if (requiredUserType && user.userType !== requiredUserType) {
          toast({
            title: "Access Denied",
            description: "You don't have permission to access this page.",
            variant: "destructive"
          });
          navigate("/login");
          return;
        }

        // Update local storage with fresh user data
        authUtils.setUserType(user.userType);
        localStorage.setItem("isAuthenticated", "true");
        setIsAuthenticated(true);
      } catch (error) {
        // Token is invalid or expired
        authUtils.removeToken();
        toast({
          title: "Session Expired",
          description: "Please log in again.",
          variant: "destructive"
        });
        navigate("/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [navigate, toast, requiredUserType]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return <>{children}</>;
};

export default ProtectedRoute;
