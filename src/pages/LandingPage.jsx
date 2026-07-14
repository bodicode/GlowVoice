import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Sparkles, Zap, Shield } from 'lucide-react';
import './LandingPage.css';

const LandingPage = () => {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero container">
        <div className="hero-content">
          <h1 className="reveal">Trao cho câu chữ của bạn <br /> <span className="highlight">Một Giọng Đọc Hoàn Hảo</span></h1>
          <p className="hero-subtitle reveal reveal-delay-1">
            Tạo ra những đoạn âm thanh chất lượng cao, tự nhiên và truyền cảm từ kịch bản của bạn bằng công nghệ AI tiên tiến. Nhanh chóng, miễn phí và dễ dàng!
          </p>
          <div className="hero-cta reveal reveal-delay-2">
            <Link to="/auth" className="btn btn-primary">
              Bắt Đầu Ngay <Play size={18} />
            </Link>
          </div>
        </div>
        <div className="hero-visual glass-panel reveal reveal-delay-1">
          <div className="audio-wave-demo">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <div key={i} className="wave-bar" style={{ animationDelay: `${i * 0.1}s` }}></div>
            ))}
          </div>
          <div className="visual-text">"Xin chào, chào mừng đến với GlowVoice!"</div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features container">
        <h2 className="reveal">Tại Sao Bạn Nên Chọn GlowVoice?</h2>
        <div className="features-grid">
          <div className="feature-card glass-panel reveal reveal-delay-1">
            <div className="feature-icon"><Zap size={24} /></div>
            <h3>Tốc Độ Siêu Tốc</h3>
            <p>Khởi tạo hàng phút âm thanh chỉ trong vài giây với công cụ xử lý siêu tốc của chúng tôi.</p>
          </div>
          <div className="feature-card glass-panel reveal reveal-delay-2">
            <div className="feature-icon"><Sparkles size={24} /></div>
            <h3>Nhiều Giọng Đọc AI</h3>
            <p>Trải nghiệm các giọng đọc AI Tiếng Việt và Tiếng Anh đa dạng với độ tự nhiên cao.</p>
          </div>
          <div className="feature-card glass-panel reveal reveal-delay-3">
            <div className="feature-icon"><Shield size={24} /></div>
            <h3>Hoàn Toàn Miễn Phí</h3>
            <p>Chia tay với các hóa đơn API đắt đỏ. Bạn có thể tạo giọng nói tùy ý và hoàn toàn miễn phí.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;

