# 🎙️ GlowVoice — Tài liệu Dự Án

> File này dùng để giúp AI hoặc thành viên mới hiểu nhanh dự án GlowVoice là gì, kiến trúc ra sao và đã đi đến đâu.

---

## 1. Tổng Quan

**GlowVoice** là một ứng dụng web **Text-to-Speech (TTS) tiếng Việt** dùng AI, cho phép người dùng nhập văn bản và chuyển đổi thành file âm thanh MP3 chất lượng cao.

- **Mục tiêu**: Tạo ra công cụ TTS tiếng Việt miễn phí, dễ dùng, hỗ trợ nhiều giọng đọc AI khác nhau.
- **Người dùng mục tiêu**: Người làm content, học sinh/sinh viên, podcaster, và bất kỳ ai cần giọng đọc tiếng Việt tự nhiên.
- **Ngôn ngữ chính**: Tiếng Việt (giao diện + nội dung).

---

## 2. Kiến Trúc Hệ Thống

```
GlowVoice/
├── Frontend (React + Vite)  →  Deploy lên Vercel
│   └── https://glowvoice.vercel.app
│
├── Backend (FastAPI + Python)  →  Deploy lên Render
│   └── https://glowvoice-backend.onrender.com
│
└── Database & Auth  →  Supabase
    ├── Bảng: generations  (lịch sử tạo audio)
    └── Bảng: projects     (thư mục/nhóm file của user)
```

### Luồng dữ liệu chính:
```
User nhập text → Frontend → POST /api/generate-audio (Backend)
                                        ↓
                          Edge-TTS / gTTS / Zalo AI
                                        ↓
                          Lưu file .mp3 → Supabase DB (metadata)
                                        ↓
                          Trả về audio_url → Frontend phát/tải
```

---

## 3. Tech Stack Chi Tiết

### Frontend
| Thành phần     | Công nghệ / Thư viện          | Phiên bản |
|----------------|-------------------------------|-----------|
| Framework      | React                         | 19.x      |
| Build tool     | Vite                          | 8.x       |
| Routing        | react-router-dom              | 7.x       |
| Auth + DB      | @supabase/supabase-js         | 2.x       |
| Icons          | lucide-react                  | 1.x       |
| Notifications  | react-hot-toast               | 2.x       |
| Styling        | Vanilla CSS (CSS Variables)   | -         |
| Linting        | Oxlint                        | 1.x       |

### Backend
| Thành phần     | Công nghệ / Thư viện          |
|----------------|-------------------------------|
| Framework      | FastAPI                       |
| Server         | Uvicorn                       |
| TTS Engine 1   | edge-tts (Microsoft Neural)   |
| TTS Engine 2   | gTTS (Google TTS)             |
| TTS Engine 3   | Zalo AI TTS API               |
| HTTP Client    | httpx (async)                 |
| Validation     | Pydantic                      |
| Python version | 3.11.9                        |

### Hạ Tầng / Deployment
| Dịch vụ   | Mục đích                            |
|-----------|-------------------------------------|
| Vercel    | Host frontend (static)              |
| Render    | Host backend (Python web service)   |
| Supabase  | Database (PostgreSQL) + Auth (OAuth)|

---

## 4. Cấu Trúc Thư Mục

```
e:\GlowVoice\
├── backend/
│   ├── main.py              # API FastAPI chính
│   ├── requirements.txt     # Thư viện Python
│   └── audio_output/        # Thư mục lưu file MP3 tạm thời (cache)
│
├── src/
│   ├── App.jsx              # Root component + routing
│   ├── main.jsx             # Entry point React
│   ├── index.css            # CSS global, design tokens
│   ├── assets/              # Static assets
│   │
│   ├── components/
│   │   ├── Navbar.jsx       # Thanh điều hướng
│   │   └── Navbar.css
│   │
│   ├── contexts/
│   │   └── AuthContext.jsx  # Context quản lý trạng thái đăng nhập
│   │
│   ├── pages/
│   │   ├── LandingPage.jsx  # Trang chủ (giới thiệu)
│   │   ├── LandingPage.css
│   │   ├── AuthPage.jsx     # Trang đăng nhập (Google OAuth)
│   │   ├── AuthPage.css
│   │   ├── Dashboard.jsx    # Trang chính (studio TTS) ~850 dòng
│   │   └── Dashboard.css
│   │
│   └── utils/
│       └── supabase.js      # Khởi tạo Supabase client
│
├── public/                  # Static public files
├── dist/                    # Build output (Vite)
├── .env                     # Biến môi trường local (không commit)
├── .gitignore
├── vite.config.js           # Cấu hình Vite
├── render.yaml              # Cấu hình deploy Render (backend)
├── vercel.json              # Cấu hình deploy Vercel (frontend)
└── package.json
```

---

## 5. Các Trang & Tính Năng Đã Hoàn Thành

### 5.1 Landing Page (`/`)
- [x] Hero section với animation sóng âm thanh
- [x] Section "Tại sao chọn GlowVoice?" với 3 feature cards
- [x] CTA button dẫn đến trang đăng nhập
- [x] Thiết kế glassmorphism, dark mode

### 5.2 Auth Page (`/auth`)
- [x] Đăng nhập bằng Google OAuth (qua Supabase)
- [x] Tự động redirect sang `/dashboard` sau khi đăng nhập
- [x] Xử lý lỗi đăng nhập

### 5.3 Dashboard / Studio TTS (`/dashboard`) — Trang chính
**Khu vực nhập liệu & tạo audio:**
- [x] Textarea nhập văn bản (tối đa 5000 ký tự, hoặc 2000 cho Zalo AI)
- [x] Đếm ký tự realtime
- [x] Bộ chọn giọng đọc với 7 giọng:
  - **Zalo AI (Premium):** Nữ Miền Nam, Nữ Miền Bắc, Nam Miền Nam, Nam Miền Bắc
  - **Free:** Hoài My (Edge-TTS), Nam Minh (Edge-TTS), Chị Google (gTTS)
- [x] Nghe thử giọng đọc trước khi tạo
- [x] Panel tùy chỉnh: Tốc độ đọc (-50% đến +100%), Độ cao giọng (-50Hz đến +50Hz)
- [x] Nút "Tạo Giọng Đọc" gọi API backend
- [x] Audio player tích hợp (play/pause) sau khi tạo xong
- [x] Nút tải về file MP3
- [x] Nút "Đặt lại" về trạng thái ban đầu
- [x] Hiển thị số ký tự Zalo AI đã dùng hôm nay

**Quản lý Dự án (Sidebar):**
- [x] Tạo dự án (thư mục) mới
- [x] Xem danh sách dự án của user
- [x] Xóa dự án (kèm xác nhận + hiển thị số file bị xóa)
- [x] Chuyển file vào dự án bằng kéo thả (drag & drop)
- [x] Chuyển nhiều file cùng lúc bằng chế độ multi-select

**Lịch sử (Sidebar):**
- [x] Lưu lịch sử các lần tạo audio vào Supabase
- [x] Hiển thị tối đa 50 bản ghi gần nhất
- [x] Click vào lịch sử để nạp lại text + audio
- [x] Xóa từng bản ghi
- [x] Chọn nhiều bản ghi và xóa hàng loạt
- [x] Di chuyển bản ghi giữa các dự án

---

## 6. Backend API Endpoints

| Method | Endpoint                  | Mô tả                                     |
|--------|---------------------------|-------------------------------------------|
| GET    | `/`                       | Health check                              |
| GET    | `/api/voices`             | Lấy danh sách giọng đọc có sẵn           |
| POST   | `/api/generate-audio`     | Tổng hợp giọng nói, trả về URL file MP3  |
| GET    | `/api/audio/{filename}`   | Phục vụ file MP3 đã tạo                  |

### Request body cho `/api/generate-audio`:
```json
{
  "text": "Văn bản cần đọc",
  "voice_id": "vi-female",
  "rate": "+0%",
  "volume": "+0%",
  "pitch": "+0Hz"
}
```

### Cơ chế Cache:
Backend dùng **MD5 hash** của `(text + voice_id + rate + volume + pitch)` làm tên file. Nếu file đã tồn tại → trả về ngay, không gọi API TTS lại (tiết kiệm quota).

---

## 7. Database Schema (Supabase)

### Bảng `generations`
| Cột         | Kiểu      | Mô tả                              |
|-------------|-----------|------------------------------------|
| id          | uuid      | Primary key                        |
| user_id     | uuid      | FK → auth.users                    |
| text        | text      | 50 ký tự đầu (dùng để preview)     |
| full_text   | text      | Toàn bộ văn bản gốc                |
| audio_url   | text      | URL file MP3                       |
| voice_name  | text      | Tên giọng đọc (hiển thị)           |
| voice_id    | text      | ID giọng (vi-female, vi-zalo-1...) |
| project_id  | uuid      | FK → projects (nullable)           |
| created_at  | timestamp | Thời gian tạo                      |

### Bảng `projects`
| Cột         | Kiểu      | Mô tả               |
|-------------|-----------|---------------------|
| id          | uuid      | Primary key         |
| user_id     | uuid      | FK → auth.users     |
| name        | text      | Tên dự án           |
| created_at  | timestamp | Thời gian tạo       |

---

## 8. Biến Môi Trường

### Frontend (`.env` ở root)
```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_API_URL=https://glowvoice-backend.onrender.com
```

### Backend (`.env` ở root, đọc bởi `backend/main.py`)
```env
FRONTEND_URL=https://glowvoice.vercel.app
ZALO_AI_KEY=your_zalo_api_key_here
```

---

## 9. Cách Chạy Local

### Frontend
```bash
npm install
npm run dev
# Chạy tại http://localhost:5173
```

### Backend
```bash
cd backend
pip install -r requirements.txt
python main.py
# Hoặc: uvicorn main:app --reload --port 8000
# API tại http://localhost:8000
```

> Khi chạy local, đặt `VITE_API_URL=http://localhost:8000` trong `.env`

---

## 10. Trạng Thái Dự Án

### Đã hoàn thành
- Toàn bộ luồng TTS cơ bản (nhập → tạo → nghe → tải)
- Đăng nhập Google OAuth
- Lưu lịch sử vào Supabase
- Hệ thống quản lý dự án (folder)
- Drag & drop + multi-select
- Cache audio phía backend (MD5 hash)
- Deploy lên Vercel + Render

### Chưa làm / Có thể cải thiện
- [ ] Đổi tên dự án (icon `Edit2` đã import nhưng chưa dùng)
- [x] Trang profile / cài đặt tài khoản
- [x] Phân trang cho lịch sử (đã hỗ trợ load more 50 bản ghi/lần)
- [ ] Waveform visualizer cho audio player
- [ ] Rate limiting / quota management theo user
- [x] Dọn dẹp file audio cũ trên server (hiện đã chuyển qua lưu trữ vĩnh viễn trên Supabase Storage)
- [ ] Unit tests cho backend API
- [ ] Email/password login (hiện chỉ có Google OAuth)
- [ ] Export nhiều file dưới dạng ZIP

### Lỗi đã biết / Cần chú ý
- `handleDeleteProject` ở Dashboard.jsx (~dòng 318-328) gọi `deletePromise.then` hai lần — bug nhỏ cần fix
- Icon `Edit2` và `MoreVertical` đã import trong Dashboard nhưng chưa được sử dụng
- CORS backend hiện đặt `allow_origins=["*"]` — cần giới hạn lại khi production thực sự

---

## 11. Conventions & Quy Tắc Code

- **Styling**: CSS per-page (`.css` cùng tên với `.jsx`), biến CSS global ở `index.css`
- **State Management**: React `useState` / `useEffect` thuần, không dùng Redux/Zustand
- **API Calls**: `fetch()` thuần trong component, chưa có abstraction layer riêng
- **Auth**: Quản lý qua `AuthContext` + Supabase session listener
- **Notifications**: Dùng `react-hot-toast` cho tất cả thông báo
- **Icons**: Toàn bộ dùng `lucide-react`
- **Không dùng TypeScript**: Dự án dùng `.jsx` thuần

---

*Tài liệu được tạo ngày 14/07/2026. Cập nhật file này mỗi khi có thay đổi lớn trong dự án.*
