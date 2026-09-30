import { createContext, useContext, useEffect, useState } from "react";
import {
  registerUser as registerUserRequest,
  getCurrentUser,
  signInWithGoogle,
  signInWithPassword as signInWithPasswordRequest,
  signOut,
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
  async function registerUser({ name, email, password }) {
    setUser(await registerUserRequest(name, email, password));
    setDemo(false);
  }
  async function googleSignIn(credential) {
    setUser(await signInWithGoogle(credential));
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
        registerUser,
        googleSignIn,
        startDemo,
        leaveSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
