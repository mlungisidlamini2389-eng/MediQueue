import { Logo } from "./Navbar";
import { Heart } from "lucide-react";
export default function Footer() {
  return (
    <footer className="container footer">
      <div>
        <Logo />
        <p>Smarter queues. Healthier communities.</p>
      </div>
      <div className="footer-links">
        <a href="#/how-it-works">How it works</a>
        <a href="#/privacy">Privacy</a>
        <a href="#/healthcare">For healthcare teams</a>
      </div>
      <span className="made-with">
        Made for people. Built with care. <Heart size={14} />
      </span>
    </footer>
  );
}
