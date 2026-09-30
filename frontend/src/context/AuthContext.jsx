import { createContext, useContext, useEffect, useState } from "react";
import {
  registerUser as registerUserRequest,
  getCurrentUser,
  signInWithPassword as signInWithPasswordRequest,
  signOut,
  signInAsAdmin as signInAsAdminRequest,
} from "../services/api";
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [demo, setDemo] = useState(false);
  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .catch(() => {});
  }, []);
  async function signInWithPassword(email, password) {
    setUser(await signInWithPasswordRequest(email, password));
    setDemo(false);
  }
  async function signInAsAdmin(password) {
    setUser(await signInAsAdminRequest(password));
    setDemo(false);
  }
  async function registerUser({ name, email, password, mobile }) {
    setUser(await registerUserRequest(name, email, password, mobile));
    setDemo(false);
  }
  function startDemo() {
    setDemo(true);
    setUser(null);
    window.location.hash = "/dashboard";
  }
  async function leaveSession() {
    if (user) await signOut().catch(() => {});
    setUser(null);
    setDemo(false);
    window.location.hash = "/";
  }
  return (
    <AuthContext.Provider
      value={{
        user,
        demo,
        signInWithPassword,
        signInAsAdmin,
        registerUser,
        startDemo,
        leaveSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
