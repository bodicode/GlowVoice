import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mic2, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const isAuthPage = location.pathname === '/auth';

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
                <Link to="/dashboard" className="btn btn-outline">Bảng Điều Khiển</Link>
                <button onClick={handleSignOut} className="btn btn-primary" style={{padding: '0.5rem 1rem'}}>
                  <LogOut size={16} /> Đăng Xuất
                </button>
              </>
            ) : (
              <>
                <Link to="/dashboard" className="btn btn-outline">Bảng Điều Khiển</Link>
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
