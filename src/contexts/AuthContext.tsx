import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { useLocation, useNavigate } from "react-router-dom";
import { auth } from "../services/firebase";

interface AuthContextProps {
  user: User | null;
  loading: boolean;
  isSigningOut: boolean;
  login: (email: string, password: string) => Promise<string>;
  register: (email: string, password: string) => Promise<string>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoutStatus, setLogoutStatus] = useState<
    "idle" | "pending" | "navigating"
  >("idle");
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    // The protected route must wait until the router commits the home navigation.
    if (logoutStatus === "navigating" && pathname === "/") {
      setLogoutStatus("idle");
    }
  }, [logoutStatus, pathname]);

  const login = async (email: string, password: string) => {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    return user.uid;
  };

  const register = async (email: string, password: string) => {
    const { user } = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    return user.uid;
  };

  const logout = async () => {
    if (logoutStatus !== "idle") return;

    setLogoutStatus("pending");
    try {
      await signOut(auth);
    } catch (error) {
      setLogoutStatus("idle");
      throw error;
    }

    setLogoutStatus("navigating");
    navigate("/", { replace: true });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isSigningOut: logoutStatus !== "idle",
        login,
        register,
        logout,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};
