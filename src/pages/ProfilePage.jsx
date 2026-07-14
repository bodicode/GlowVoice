import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabase';
import { Mail, Calendar, LogOut, Activity, Folder, FileAudio, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import './ProfilePage.css';

const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalGenerations: 0,
    totalProjects: 0,
    totalChars: 0,
    zaloChars: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const fetchStats = async () => {
      try {
        // Lấy số lượng dự án
        const { count: projectsCount } = await supabase
          .from('projects')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        // Lấy dữ liệu thống kê generations
        const { data: generationsData } = await supabase
          .from('generations')
          .select('full_text, voice_id')
          .eq('user_id', user.id);

        let totalChars = 0;
        let zaloChars = 0;

        if (generationsData) {
          generationsData.forEach(item => {
            const length = item.full_text?.length || 0;
            totalChars += length;
            if (item.voice_id?.startsWith('vi-zalo-')) {
              zaloChars += length;
            }
          });
        }

        setStats({
          totalGenerations: generationsData?.length || 0,
          totalProjects: projectsCount || 0,
          totalChars,
          zaloChars
        });
      } catch (error) {
        console.error('Lỗi lấy thống kê:', error);
        toast.error('Không thể tải thống kê người dùng');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [user, navigate]);

  if (!user) return null;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const avatarUrl = user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.user_metadata?.full_name || user?.email || 'User')}&background=random`;

  return (
    <div className="profile-page container animate-fade-in">
      <div className="profile-header">
        <h2>Hồ Sơ Của Bạn</h2>
      </div>

      <div className="profile-grid">
        <div className="profile-card glass-panel">
          <div className="profile-info-header">
            <img src={avatarUrl} alt="Avatar" className="profile-avatar" />
            <div className="profile-name-group">
              <h3>{user?.user_metadata?.full_name || 'Người dùng GlowVoice'}</h3>
            </div>
          </div>

          <div className="profile-details">
            <div className="detail-item">
              <Mail className="detail-icon" size={18} />
              <div className="detail-text">
                <span className="detail-label">Email</span>
                <span className="detail-value">{user?.email}</span>
              </div>
            </div>

            <div className="detail-item">
              <Calendar className="detail-icon" size={18} />
              <div className="detail-text">
                <span className="detail-label">Ngày tham gia</span>
                <span className="detail-value">{formatDate(user?.created_at)}</span>
              </div>
            </div>
          </div>

          <button className="btn btn-outline full-width" onClick={handleSignOut} style={{ marginTop: '2rem', borderColor: 'var(--danger, #ef4444)', color: 'var(--danger, #ef4444)' }}>
            <LogOut size={18} /> Đăng Xuất
          </button>
        </div>

        <div className="stats-container">
          <h3><Activity size={20} /> Thống Kê Hoạt Động</h3>

          {isLoading ? (
            <div className="loading-stats">Đang tải thống kê...</div>
          ) : (
            <div className="stats-grid">
              <div className="stat-card glass-panel">
                <div className="stat-icon-wrapper"><FileAudio size={24} color="white" /></div>
                <div className="stat-info">
                  <span className="stat-value">{stats.totalGenerations}</span>
                  <span className="stat-label">Lần Tạo Giọng</span>
                </div>
              </div>

              <div className="stat-card glass-panel">
                <div className="stat-icon-wrapper"><Folder size={24} color="white" /></div>
                <div className="stat-info">
                  <span className="stat-value">{stats.totalProjects}</span>
                  <span className="stat-label">Dự Án</span>
                </div>
              </div>

              <div className="stat-card glass-panel">
                <div className="stat-icon-wrapper">📝</div>
                <div className="stat-info">
                  <span className="stat-value">{stats.totalChars.toLocaleString('vi-VN')}</span>
                  <span className="stat-label">Tổng Ký Tự Đã Dùng</span>
                </div>
              </div>

              <div className="stat-card glass-panel">
                <div className="stat-icon-wrapper">💎</div>
                <div className="stat-info">
                  <span className="stat-value">{stats.zaloChars.toLocaleString('vi-VN')}</span>
                  <span className="stat-label">Ký Tự Zalo AI (Premium)</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
