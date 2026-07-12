import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Download, Settings, Volume2, RefreshCw, Pause, Mic, Trash2, CheckSquare, Square, Headphones, RotateCcw, Folder, FolderPlus, FolderOpen, MoreVertical, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabase';
import './Dashboard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5173';

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
  const [zaloCharsUsed, setZaloCharsUsed] = useState(0);
  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [projectToDelete, setProjectToDelete] = useState(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const fetchProjects = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (!error && data) {
          setProjects(data);
        }
      } catch (err) {
        console.error('Lỗi lấy projects:', err);
      }
    };

    const fetchHistory = async () => {
      try {
        let query = supabase
          .from('generations')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (activeProjectId) {
          query = query.eq('project_id', activeProjectId);
        } else {
          query = query.is('project_id', null);
        }

        const { data, error } = await query;

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

        // Fetch Zalo AI used characters today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const { data: zaloData } = await supabase
          .from('generations')
          .select('full_text')
          .eq('user_id', user.id)
          .like('voice_id', 'vi-zalo-%')
          .gte('created_at', today.toISOString());

        if (zaloData) {
          const total = zaloData.reduce((acc, item) => acc + (item.full_text?.length || 0), 0);
          setZaloCharsUsed(total);
        }
      } catch (err) {
        console.error('Lỗi lấy lịch sử:', err);
      }
    };

    fetchProjects();
    fetchHistory();
  }, [user, navigate, activeProjectId]);

  useEffect(() => {
    const max = voiceId.startsWith('vi-zalo-') ? 2000 : 5000;
    if (script.length > max) {
      setScript(prev => prev.slice(0, max));
      toast.error(`Đã tự động cắt bớt văn bản vì giọng này chỉ hỗ trợ tối đa ${max} ký tự.`);
    }
  }, [voiceId]);

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
          voice_id: voiceId,
          project_id: activeProjectId || null
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

            // Cập nhật số lượng ký tự Zalo AI nếu dùng giọng Zalo
            if (voiceId.startsWith('vi-zalo-') && !data.cached) {
              setZaloCharsUsed(prev => prev + script.length);
            }
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
    audio.play().catch(() => { });
    audio.pause();

    try {
      const rateStr = rate >= 0 ? `+${rate}%` : `${rate}%`;
      const pitchStr = pitch >= 0 ? `+${pitch}Hz` : `${pitch}Hz`;
      const response = await fetch(`${API_URL}/api/generate-audio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: "Xin chào",
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

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([{ user_id: user.id, name: newProjectName }])
        .select()
        .single();

      if (error) throw error;

      setProjects([data, ...projects]);
      setNewProjectName('');
      setIsCreatingProject(false);
      toast.success('Đã tạo dự án mới');
    } catch (err) {
      console.error('Create project error:', err);
      toast.error('Lỗi khi tạo dự án');
    }
  };

  const confirmDeleteProject = async (project, e) => {
    e.stopPropagation();

    try {
      const { count, error } = await supabase
        .from('generations')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', project.id);

      if (error) throw error;

      setProjectToDelete({ ...project, fileCount: count || 0 });
    } catch (err) {
      console.error('Lỗi khi đếm file trong dự án:', err);
      toast.error('Có lỗi xảy ra khi kiểm tra dự án');
    }
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;

    const deletePromise = new Promise(async (resolve, reject) => {
      try {
        if (projectToDelete.fileCount > 0) {
          const { error: filesError } = await supabase
            .from('generations')
            .delete()
            .eq('project_id', projectToDelete.id);
          if (filesError) throw filesError;
        }

        const { error: projectError } = await supabase
          .from('projects')
          .delete()
          .eq('id', projectToDelete.id);

        if (projectError) throw projectError;
        resolve();
      } catch (err) {
        reject(err);
      }
    });

    toast.promise(deletePromise, {
      loading: 'Đang xóa dự án...',
      success: 'Đã xóa dự án thành công',
      error: (err) => `Lỗi: ${err.message}`
    });

    try {
      await deletePromise;
    } catch (err) { } // handled by toast

    try {
      await deletePromise;
      setProjects(prev => prev.filter(p => p.id !== projectToDelete.id));
      if (activeProjectId === projectToDelete.id) {
        setActiveProjectId(null);
      }
      setProjectToDelete(null);
    } catch (err) {
      console.error('Delete project failed:', err);
    }
  };

  const handleDragStart = (e, generationId) => {
    e.dataTransfer.setData('generationId', generationId);
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleDrop = async (e, projectId) => {
    e.preventDefault();
    const generationId = e.dataTransfer.getData('generationId');
    if (!generationId) return;

    console.log('--- handleDrop Debug ---');
    console.log('generationId:', generationId, typeof generationId);
    console.log('projectId:', projectId, typeof projectId);

    try {
      const { data, error } = await supabase
        .from('generations')
        .update({ project_id: projectId })
        .eq('id', generationId)
        .select();

      console.log('Update result data:', data);
      console.log('Update result error:', error);

      if (error) throw error;
      if (!data || data.length === 0) {
        console.warn('Update failed: No row matched or RLS blocked it.');
      }

      if (error) throw error;

      toast.success('Đã chuyển file vào dự án');
      // Remove from current view if we are filtering by project and moved to another
      if (activeProjectId !== projectId) {
        setHistory(prev => prev.filter(item => item.id !== generationId));
      }
    } catch (err) {
      console.error('Move file error:', err);
      toast.error('Lỗi khi di chuyển file');
    }
  };

  const handleMoveSelected = async (targetProjectId) => {
    if (selectedIds.length === 0) return;

    const projectId = targetProjectId === 'ROOT' ? null : targetProjectId;

    const movePromise = new Promise(async (resolve, reject) => {
      const { error } = await supabase
        .from('generations')
        .update({ project_id: projectId })
        .in('id', selectedIds);

      if (error) reject(error);
      else resolve();
    });

    toast.promise(movePromise, {
      loading: 'Đang di chuyển...',
      success: `Đã chuyển ${selectedIds.length} file vào dự án`,
      error: (err) => `Lỗi: ${err.message}`
    });

    try {
      await movePromise;
      if (activeProjectId !== projectId) {
        setHistory(prev => prev.filter(item => !selectedIds.includes(item.id)));
      }
      setIsSelectMode(false);
      setSelectedIds([]);
    } catch (err) {
      console.error('Bulk move failed:', err);
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
        <h2>Xin chào, {user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'bạn'} 👋</h2>
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
            onChange={(e) => setScript(e.target.value.slice(0, voiceId.startsWith('vi-zalo-') ? 2000 : 5000))}
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
            <span className="char-count">
              {script.length} / {voiceId.startsWith('vi-zalo-') ? 2000 : 5000} ký tự
              {zaloCharsUsed > 0 && <span style={{ marginLeft: '15px', color: 'var(--primary-color)' }}>• Đã dùng Zalo AI: {zaloCharsUsed} ký tự hôm nay</span>}
            </span>
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
          <div className="projects-section">
            <div className="projects-header">
              <h3><FolderOpen size={20} /> Dự án của bạn</h3>
              <button
                className="btn btn-outline small-btn"
                onClick={() => setIsCreatingProject(!isCreatingProject)}
                title="Tạo dự án mới"
              >
                <FolderPlus size={16} />
              </button>
            </div>

            {isCreatingProject && (
              <form onSubmit={handleCreateProject} className="create-project-form">
                <input
                  type="text"
                  className="input-field"
                  placeholder="Tên dự án..."
                  value={newProjectName}
                  onChange={e => setNewProjectName(e.target.value)}
                  autoFocus
                />
                <button type="submit" className="btn btn-primary small-btn" disabled={!newProjectName.trim()}>Lưu</button>
              </form>
            )}

            <div className="projects-list">
              <div
                className={`project-item ${activeProjectId === null ? 'active' : ''}`}
                onClick={() => setActiveProjectId(null)}
                onDragOver={handleDragOver}
                onDrop={e => handleDrop(e, null)}
              >
                <div className="project-icon"><Folder size={18} /></div>
                <span>Tất cả file</span>
              </div>

              {projects.map(project => (
                <div
                  key={project.id}
                  className={`project-item ${activeProjectId === project.id ? 'active' : ''}`}
                  onClick={() => setActiveProjectId(project.id)}
                  onDragOver={handleDragOver}
                  onDrop={e => handleDrop(e, project.id)}
                >
                  <div className="project-icon"><Folder size={18} /></div>
                  <span style={{ flex: 1 }}>{project.name}</span>
                  <button
                    className="icon-btn delete-project-btn"
                    onClick={(e) => confirmDeleteProject(project, e)}
                    title="Xóa dự án"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="history-header" style={{ marginTop: '2rem' }}>
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
            <div className="history-select-actions" style={{ flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-outline small-btn" onClick={toggleSelectAll} style={{ flex: 1 }}>
                  {selectedIds.length === history.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                </button>
                <button
                  className="btn btn-primary small-btn"
                  onClick={handleDeleteSelected}
                  disabled={selectedIds.length === 0}
                  style={{ background: 'var(--error-color, #ef4444)', borderColor: 'var(--error-color, #ef4444)', flex: 1 }}
                >
                  Xóa ({selectedIds.length})
                </button>
              </div>
              <select
                className="input-field select-voice"
                style={{ width: '100%', padding: '0.5rem', fontSize: '0.875rem' }}
                value=""
                onChange={(e) => handleMoveSelected(e.target.value)}
                disabled={selectedIds.length === 0}
              >
                <option value="" disabled>Chuyển {selectedIds.length} mục vào dự án...</option>
                <option value="ROOT">📂 Bỏ ra ngoài (Tất cả file)</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>📁 {p.name}</option>
                ))}
              </select>
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
                  className={`history-item draggable-item ${isSelectMode && isSelected ? 'selected' : ''}`}
                  style={{ cursor: isSelectMode ? 'pointer' : 'grab' }}
                  draggable={!isSelectMode}
                  onDragStart={e => handleDragStart(e, item.id)}
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
              )
            })}
          </div>
        </div>
      </div>
      {projectToDelete && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '400px', margin: '0 auto' }}>
            <h3 style={{ marginTop: 0 }}>Xóa dự án?</h3>
            <p>Bạn có chắc chắn muốn xóa dự án <strong>{projectToDelete.name}</strong> không?</p>
            {projectToDelete.fileCount > 0 && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.75rem', borderRadius: '6px', marginTop: '1rem', color: '#fca5a5' }}>
                ⚠️ Cảnh báo: Dự án này đang chứa <strong>{projectToDelete.fileCount} file âm thanh</strong>. Xóa dự án sẽ xóa tất cả các file bên trong!
              </div>
            )}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setProjectToDelete(null)}>Hủy bỏ</button>
              <button className="btn btn-primary" onClick={handleDeleteProject} style={{ background: 'var(--error-color, #ef4444)', borderColor: 'var(--error-color, #ef4444)' }}>
                Vâng, Xóa dự án
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
