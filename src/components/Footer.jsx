import { Link } from 'react-router-dom';
import { Mic2 } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container footer-container">
        <Link to="/" className="footer-logo">
          <Mic2 size={20} className="logo-icon" />
          <span>GlowVoice</span>
        </Link>

        <p className="footer-copy">
          &copy; {new Date().getFullYear()} GlowVoice
        </p>
      </div>
    </footer>
  );
};

export default Footer;
