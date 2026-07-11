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
