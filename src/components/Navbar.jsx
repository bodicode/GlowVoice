import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mic2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthPage = location.pathname === '/auth';
  const avatarUrl = user ? (user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.user_metadata?.full_name || user.email || 'User')}&background=random`) : '';

  return (
    <nav className="navbar glass-panel">
      <div className="container navbar-container">
        <Link to="/" className="navbar-logo">
          <Mic2 size={28} className="logo-icon" />
          <span>GlowVoice</span>
        </Link>
        {!isAuthPage && (
          <div className="navbar-links">
            {user ? (
              <>
                <Link to="/dashboard" className="btn btn-outline">Bắt đầu ngay</Link>
                <Link to="/profile" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', transition: 'transform 0.2s' }} title="Tài khoản" onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
                  <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </Link>
              </>
            ) : (
              <>
                <Link to="/dashboard" className="btn btn-outline">Bắt đầu ngay</Link>
                <Link to="/auth" className="btn btn-primary">Đăng Nhập</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
