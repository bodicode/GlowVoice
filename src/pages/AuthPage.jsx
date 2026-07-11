import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Mail, Lock, LogIn, UserPlus } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';
import './AuthPage.css';

const AuthPage = () => {
  const { user } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (user) {
    return <Navigate to="/dashboard" />;
  }

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Vui lòng kiểm tra email để bấm link xác nhận tài khoản nhé!');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      if (error) throw error;
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="auth-page container flex-center animate-fade-in">
      <div className="auth-card glass-panel">
        <h2>{isLogin ? 'Chào Mừng Trở Lại' : 'Tạo Tài Khoản'}</h2>
        <p className="auth-subtitle">
          {isLogin ? 'Đăng nhập để trải nghiệm công cụ sinh giọng nói AI' : 'Tham gia GlowVoice để bắt đầu tạo ra những giọng đọc tuyệt vời'}
        </p>
        
        {error && <div className="auth-error" style={{color: 'var(--danger)', marginBottom: '1rem', fontSize: '0.9rem'}}>{error}</div>}

        <form className="auth-form" onSubmit={handleAuth}>
          <div className="input-group">
            <Mail className="input-icon" size={18} />
            <input 
              type="email" 
              placeholder="Địa chỉ Email" 
              className="input-field with-icon" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          <div className="input-group">
            <Lock className="input-icon" size={18} />
            <input 
              type="password" 
              placeholder="Mật khẩu" 
              className="input-field with-icon" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          <button type="submit" className="btn btn-primary full-width" disabled={loading}>
            {loading ? 'Đang xử lý...' : (isLogin ? <><LogIn size={18} /> Đăng Nhập</> : <><UserPlus size={18} /> Đăng Ký</>)}
          </button>
        </form>

        <div className="auth-divider">
          <span>Hoặc</span>
        </div>

        <button 
          className="btn btn-google full-width" 
          onClick={handleGoogleLogin} 
          disabled={loading}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Đăng nhập bằng Google
        </button>

        <div className="auth-switch">
          <p>
            {isLogin ? "Bạn chưa có tài khoản? " : "Đã có tài khoản rồi? "}
            <span className="auth-link" onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? 'Đăng ký ngay' : 'Đăng nhập ngay'}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
