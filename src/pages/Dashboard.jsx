import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Download, Settings, Volume2, RefreshCw, Pause, Mic, Trash2, CheckSquare, Square, Headphones, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabase';
import './Dashboard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [script, setScript] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [voiceId, setVoiceId] = useState('vi-female');
  const [rate, setRate] = useState(0);
  const [pitch, setPitch] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [history, setHistory] = useState([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const audioRef = useRef(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const fetchHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('generations')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) {
          console.error('Chưa có bảng generations hoặc lỗi:', error.message);
        } else if (data) {
          setHistory(data.map(item => ({
            id: item.id,
            text: item.text,
            fullText: item.full_text,
            url: item.audio_url,
            voice: item.voice_name,
            voiceId: item.voice_id,
            time: new Date(item.created_at).toLocaleTimeString('vi-VN')
          })));
        }
      } catch (err) {
        console.error('Lỗi lấy lịch sử:', err);
      }
    };

    fetchHistory();
  }, [user, navigate]);

  if (!user) return null;

  const handleGenerate = async () => {
    if (!script.trim()) return;
    setIsGenerating(true);
    setAudioUrl(null);
    setIsPlaying(false);

    try {
      const rateStr = rate >= 0 ? `+${rate}%` : `${rate}%`;
      const pitchStr = pitch >= 0 ? `+${pitch}Hz` : `${pitch}Hz`;
      const response = await fetch(`${API_URL}/api/generate-audio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: script,
          voice_id: voiceId,
          rate: rateStr,
          pitch: pitchStr
        })
      });

      const data = await response.json();
      if (data.status === 'success') {
        const fullUrl = `${API_URL}${data.audio_url}`;
        setAudioUrl(fullUrl);

        const newHistoryItem = {
          user_id: user.id,
          text: script.substring(0, 50),
          full_text: script,
          audio_url: fullUrl,
          voice_name: data.voice_used,
          voice_id: voiceId
        };

        try {
          const { data: insertedData, error: insertError } = await supabase
            .from('generations')
            .insert([newHistoryItem])
            .select()
            .single();

          if (insertError) {
            console.error('Lỗi khi lưu Database, lưu tạm vào trình duyệt:', insertError);
            setHistory(prev => [{
              id: Date.now(),
              text: newHistoryItem.text,
              fullText: newHistoryItem.full_text,
              url: fullUrl,
              voice: newHistoryItem.voice_name,
              voiceId: voiceId,
              time: new Date().toLocaleTimeString('vi-VN')
            }, ...prev].slice(0, 20));
          } else if (insertedData) {
            setHistory(prev => [{
              id: insertedData.id,
              text: insertedData.text,
              fullText: insertedData.full_text,
              url: insertedData.audio_url,
              voice: insertedData.voice_name,
              voiceId: insertedData.voice_id,
              time: new Date(insertedData.created_at).toLocaleTimeString('vi-VN')
            }, ...prev].slice(0, 20));
          }
        } catch (dbErr) {
          console.error('Lỗi kết nối DB:', dbErr);
        }
      } else {
        alert(data.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Không thể kết nối tới AI Server. Hãy đảm bảo backend đang chạy.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePreviewVoice = async () => {
    setIsPreviewing(true);
    
    // Mẹo "Unlock" âm thanh cho trình duyệt: tạo Audio và play ngay lúc click
    const audio = new Audio();
    audio.play().catch(() => {});
    audio.pause();

    try {
      const rateStr = rate >= 0 ? `+${rate}%` : `${rate}%`;
      const pitchStr = pitch >= 0 ? `+${pitch}Hz` : `${pitch}Hz`;
      const response = await fetch(`${API_URL}/api/generate-audio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: "Xin chào, đây là giọng đọc thử.",
          voice_id: voiceId,
          rate: rateStr,
          pitch: pitchStr
        })
      });

      const data = await response.json();
      if (data.status === 'success') {
        audio.src = `${API_URL}${data.audio_url}`;
        audio.play().catch(e => {
          console.error("Lỗi phát âm thanh:", e);
          toast.error("Không thể phát âm thanh, có thể do trình duyệt chặn.");
        });
      } else {
        toast.error('Lỗi khi nghe thử: ' + (data.message || 'Có lỗi xảy ra'));
      }
    } catch (error) {
      console.error('Preview error:', error);
      toast.error('Không thể kết nối tới server để nghe thử.');
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleReset = () => {
    setScript('');
    setVoiceId('vi-female');
    setRate(0);
    setPitch(0);
    setAudioUrl(null);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleDownload = (url) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `glowvoice_${Date.now()}.mp3`;
    a.click();
  };

  const handleDeleteSingle = async (id, e) => {
    e.stopPropagation();
    
    const deletePromise = new Promise(async (resolve, reject) => {
      const { error } = await supabase.from('generations').delete().eq('id', id);
      if (error) reject(error);
      else resolve();
    });

    toast.promise(deletePromise, {
      loading: 'Đang xóa...',
      success: 'Đã xóa bản ghi',
      error: (err) => `Lỗi: ${err.message}`
    });

    try {
      await deletePromise;
      setHistory(prev => prev.filter(item => item.id !== id));
      if (audioUrl && history.find(h => h.id === id)?.url === audioUrl) {
        setIsPlaying(false);
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;

    const deletePromise = new Promise(async (resolve, reject) => {
      const { error } = await supabase.from('generations').delete().in('id', selectedIds);
      if (error) reject(error);
      else resolve();
    });

    toast.promise(deletePromise, {
      loading: `Đang xóa ${selectedIds.length} bản ghi...`,
      success: 'Đã xóa thành công',
      error: (err) => `Lỗi: ${err.message}`
    });

    try {
      await deletePromise;
      setHistory(prev => prev.filter(item => !selectedIds.includes(item.id)));
      setIsSelectMode(false);
      setSelectedIds([]);
    } catch (err) {
      console.error('Bulk delete failed:', err);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === history.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(history.map(item => item.id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="dashboard-page container animate-fade-in">
      <div className="dashboard-header">
        <h2>Studio</h2>
        <p>Nhập văn bản và tạo giọng đọc AI tiếng Việt tự nhiên.</p>
      </div>

      <div className="dashboard-grid">
        <div className="studio-main glass-panel">
          <div className="studio-toolbar">
            <div className="voice-selector">
              <div className="voice-selector-group">
                <select
                  className="input-field select-voice"
                  value={voiceId}
                  onChange={(e) => setVoiceId(e.target.value)}
                >
                  <optgroup label="Zalo AI (Premium)">
                    <option value="vi-zalo-1">💎 Nữ Miền Nam (Zalo)</option>
                    <option value="vi-zalo-2">💎 Nữ Miền Bắc (Zalo)</option>
                    <option value="vi-zalo-3">💎 Nam Miền Nam (Zalo)</option>
                    <option value="vi-zalo-4">💎 Nam Miền Bắc (Zalo)</option>
                  </optgroup>
                  <optgroup label="Tiêu chuẩn (Free)">
                    <option value="vi-female">🎤 Hoài My (Nữ)</option>
                    <option value="vi-male">🎤 Nam Minh (Nam)</option>
                    <option value="vi-google">🤖 Chị Google (Meme)</option>
                  </optgroup>
                </select>
                <button 
                  className="btn btn-outline small-btn preview-btn"
                  onClick={handlePreviewVoice}
                  disabled={isPreviewing}
                  title="Nghe thử giọng đọc"
                >
                  {isPreviewing ? <RefreshCw size={16} className="spin" /> : <Headphones size={16} />} Nghe thử
                </button>
              </div>
            </div>
            <button
              className="btn btn-outline small-btn"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings size={16} /> Tùy chỉnh
            </button>
          </div>

          {showSettings && (
            <div className="settings-panel glass-panel">
              <label className="setting-label">
                <span>Tốc độ đọc: {rate > 0 ? `+${rate}%` : `${rate}%`}</span>
                <input
                  type="range"
                  min="-50"
                  max="100"
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                  className="range-slider"
                  disabled={voiceId === 'vi-google'}
                />
              </label>
              <label className="setting-label" style={{ marginTop: '1rem' }}>
                <span>Độ cao giọng (Méo giọng): {pitch > 0 ? `+${pitch}Hz` : `${pitch}Hz`}</span>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={pitch}
                  onChange={(e) => setPitch(Number(e.target.value))}
                  className="range-slider"
                  disabled={voiceId === 'vi-google' || voiceId.startsWith('vi-zalo-')}
                />
              </label>
              {(voiceId === 'vi-google' || voiceId.startsWith('vi-zalo-')) && (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  * {voiceId.startsWith('vi-zalo-') ? 'Giọng Zalo AI chỉ hỗ trợ chỉnh tốc độ, không hỗ trợ đổi độ cao (méo giọng).' : 'Giọng Chị Google không hỗ trợ đổi tốc độ và độ cao.'}
                </p>
              )}
            </div>
          )}

          <textarea
            className="input-field script-input"
            placeholder="Nhập văn bản bạn muốn chuyển thành giọng nói tại đây..."
            value={script}
            onChange={(e) => setScript(e.target.value.slice(0, 5000))}
          ></textarea>

          {audioUrl && (
            <div className="audio-player glass-panel">
              <audio
                key={audioUrl}
                ref={audioRef}
                src={audioUrl}
                autoPlay={isPlaying}
                onEnded={() => setIsPlaying(false)}
                onLoadedData={() => {
                  // Tự động play khi tải xong audio mới nếu isPlaying=true
                }}
              />
              <button className="play-btn" onClick={togglePlay}>
                {isPlaying ? (
                  <Pause size={20} color="#ffffff" fill="#ffffff" />
                ) : (
                  <Play size={20} color="#ffffff" fill="#ffffff" style={{ marginLeft: '2px' }} />
                )}
              </button>
              <div className="audio-info">
                <span className="audio-label">🔊 Audio đã sẵn sàng</span>
                <span className="audio-voice">{voiceId === 'vi-female' ? 'Hoài My' : voiceId === 'vi-male' ? 'Nam Minh' : voiceId.startsWith('vi-zalo-') ? 'Zalo AI' : 'Chị Google'}</span>
              </div>
              <button
                className="btn btn-outline small-btn download-btn"
                onClick={() => handleDownload(audioUrl)}
              >
                <Download size={16} /> Tải về
              </button>
            </div>
          )}

          <div className="studio-footer">
            <span className="char-count">{script.length} / 5000 ký tự</span>
            <div className="footer-actions" style={{ display: 'flex', gap: '1rem' }}>
              <button
                className="btn btn-outline"
                onClick={handleReset}
                disabled={!script && rate === 0 && pitch === 0 && voiceId === 'vi-female' && !audioUrl}
              >
                <RotateCcw size={18} /> Đặt lại
              </button>
              <button
                className="btn btn-primary"
                onClick={handleGenerate}
                disabled={isGenerating || !script.trim()}
              >
                {isGenerating ? <><RefreshCw size={18} className="spin" /> Đang tạo...</> : <><Volume2 size={18} /> Tạo Giọng Đọc</>}
              </button>
            </div>
          </div>
        </div>

        <div className="studio-sidebar glass-panel">
          <div className="history-header">
            <h3>📋 Lịch sử</h3>
            {history.length > 0 && (
              <button 
                className="btn btn-outline small-btn"
                onClick={() => {
                  setIsSelectMode(!isSelectMode);
                  setSelectedIds([]);
                }}
              >
                {isSelectMode ? 'Hủy' : 'Chọn'}
              </button>
            )}
          </div>

          {isSelectMode && (
            <div className="history-select-actions">
              <button className="btn btn-outline small-btn" onClick={toggleSelectAll}>
                {selectedIds.length === history.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              </button>
              <button 
                className="btn btn-primary small-btn" 
                onClick={handleDeleteSelected}
                disabled={selectedIds.length === 0}
                style={{ background: 'var(--error-color, #ef4444)', borderColor: 'var(--error-color, #ef4444)' }}
              >
                Xóa ({selectedIds.length})
              </button>
            </div>
          )}

          <div className="history-list">
            {history.length === 0 && (
              <p className="empty-history">Chưa có bản ghi nào. Hãy thử tạo giọng đọc đầu tiên!</p>
            )}
            {history.map(item => {
              const isSelected = selectedIds.includes(item.id);
              return (
              <div
                key={item.id}
                className={`history-item ${isSelectMode && isSelected ? 'selected' : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  if (isSelectMode) {
                    toggleSelect(item.id);
                    return;
                  }
                  setScript(item.fullText);
                  if (item.voiceId) setVoiceId(item.voiceId);
                  setAudioUrl(item.url);
                  setIsPlaying(false);
                }}
              >
                {isSelectMode && (
                  <div className="history-checkbox">
                    {isSelected ? <CheckSquare size={18} color="var(--accent-color)" /> : <Square size={18} color="var(--text-secondary)" />}
                  </div>
                )}
                <div className="history-info" style={{ opacity: isSelectMode && !isSelected ? 0.7 : 1 }}>
                  <h4>{item.time} • {item.voice}</h4>
                  <p>"{item.text}..."</p>
                </div>
                <div className="history-actions">
                  {!isSelectMode && (
                    <>
                      <button className="icon-btn" onClick={(e) => {
                        e.stopPropagation();
                        if (audioUrl === item.url && isPlaying) {
                          audioRef.current?.pause();
                          setIsPlaying(false);
                        } else {
                          setScript(item.fullText);
                          if (item.voiceId) setVoiceId(item.voiceId);
                          setAudioUrl(item.url);
                          setIsPlaying(true);
                          // Nếu đang phát cùng 1 URL nhưng bị pause, thì phát lại
                          if (audioUrl === item.url) {
                            audioRef.current?.play();
                          }
                        }
                      }}>
                        {audioUrl === item.url && isPlaying ? <Pause size={16} /> : <Play size={16} />}
                      </button>
                      <button className="icon-btn" onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(item.url);
                      }}>
                        <Download size={16} />
                      </button>
                      <button className="icon-btn" onClick={(e) => handleDeleteSingle(item.id, e)}>
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )})}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
