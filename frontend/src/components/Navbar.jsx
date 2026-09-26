import { useState } from "react";
import { Plus, Menu, X, ArrowUpRight } from "lucide-react";
import Button from "./Button";
import { useAuth } from "../context/AuthContext";
export function Logo() {
  return (
    <a className="logo" href="#/" aria-label="MediQueue home">
      <span className="logo-mark">
        <Plus size={27} strokeWidth={4} />
      </span>
      <span>
        Medi<span className="text-blue">Queue</span>
      </span>
    </a>
  );
}
export default function Navbar({ path }) {
  const [open, setOpen] = useState(false);
  const { user, demo, leaveSession } = useAuth();
  return (
    <header className="site-header">
      <div className="container nav">
        <Logo />
        <button
          className="menu-toggle"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
        <nav
          aria-label="Main navigation"
          className={open ? "nav-links open" : "nav-links"}
          onClick={() => setOpen(false)}
        >
          <a className={path === "/" ? "active" : ""} href="#/">
            Home
          </a>
          <a href="#/how-it-works">How it works</a>
          <a href="#/features">Why MediQueue</a>
          <a href="#/healthcare">
            For healthcare teams <ArrowUpRight size={13} />
          </a>
        </nav>
        <div className="nav-actions">
          {user || demo ? (
            <>
              <a href="#/dashboard">My dashboard</a>
              <Button variant="outline" onClick={leaveSession}>
                {demo ? "Exit demo" : "Leave session"}
              </Button>
            </>
          ) : (
            <>
              <a className="sign-in" href="#/login">
                Sign in
              </a>
              <Button href="#/login">
                Get started <ArrowUpRight size={16} />
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
