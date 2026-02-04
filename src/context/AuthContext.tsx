import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { authApi } from "../lib/api/auth";
import type { User } from "../lib/api/auth";
import { useNavigate } from "react-router-dom";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuthUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  const checkAuthUser = async () => {
    if (
      window.location.pathname === "/sign-in" ||
      window.location.pathname.includes("/sign-in")
    ) {
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const currentUser = await authApi.getCurrentUser();
      setUser(currentUser);
      setIsAuthenticated(true);
    } catch (err: any) {
      // Silently handle authentication errors (user not logged in)
      // This is expected when cookies are not present
      setUser(null);
      setIsAuthenticated(false);
      // Only log if it's not a network/CORS error (which is expected when not authenticated)
      if (
        err?.code !== "ERR_NETWORK" &&
        err?.message !== "Network Error" &&
        err?.message !== "Not authenticated"
      ) {
        console.error("Auth check error:", err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password });
      setUser(response.user);
      setIsAuthenticated(true);

      // Redirect based on role
      const role = response.user.role?.toLowerCase();
      if (role === "investor") {
        navigate("/investor-dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      console.log(error);
      // Throw error so SigninForm can catch it
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
      setUser(null);
      setIsAuthenticated(false);
      window.location.href = "/sign-in";
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  useEffect(() => {
    checkAuthUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        login,
        logout,
        checkAuthUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
