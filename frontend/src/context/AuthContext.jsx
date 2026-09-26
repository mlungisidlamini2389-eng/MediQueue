import { createContext, useContext, useState } from "react";
import { signInWithGoogle } from "../services/api";
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [demo, setDemo] = useState(false);
  async function googleSignIn(credential) {
    setUser(await signInWithGoogle(credential));
    setDemo(false);
  }
  function startDemo() {
    setDemo(true);
    setUser(null);
    window.location.hash = "/dashboard";
  }
  function leaveSession() {
    setUser(null);
    setDemo(false);
    window.location.hash = "/";
  }
  return (
    <AuthContext.Provider
      value={{ user, demo, googleSignIn, startDemo, leaveSession }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
