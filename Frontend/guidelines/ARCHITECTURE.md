# UIFIVE - Hệ Thống Học Tiếng Anh

## Tổng quan
Dự án UIFIVE là nền tảng học tiếng Anh trực tuyến được xây dựng bằng **React + TypeScript + Vite**, bám sát bộ sách Global Success của Bộ Giáo dục và Đào tạo, dành cho học sinh phổ thông lớp 10-12.

## Công nghệ sử dụng
- **React 18.3** - UI Framework
- **TypeScript** - Type safety
- **Vite 6.3** - Build tool
- **React Router 7** - Routing
- **Tailwind CSS 4** - Styling
- **Lucide React** - Icons

## Cấu trúc dự án

```
src/
├── app/
│   ├── components/
│   │   ├── Navbar.tsx          # Navigation bar toàn cục
│   │   └── ProgressBar.tsx     # Component thanh tiến trình
│   ├── pages/
│   │   ├── Dashboard.tsx       # Trang chủ với danh sách Unit
│   │   ├── UnitView.tsx        # Chi tiết Unit với các bài học
│   │   ├── Leaderboard.tsx     # Bảng xếp hạng
│   │   ├── Quests.tsx          # Nhiệm vụ hàng ngày/tuần
│   │   ├── Profile.tsx         # Trang cá nhân với thống kê
│   │   ├── Shop.tsx            # Cửa hàng vật phẩm
│   │   └── exercises/
│   │       ├── PronunciationExercise.tsx  # Bài tập phát âm
│   │       ├── ReadingExercise.tsx        # Bài đọc hiểu
│   │       └── QuizExercise.tsx           # Bài trắc nghiệm
│   ├── App.tsx                 # Main app với RouterProvider
│   ├── Root.tsx                # Root layout với Navbar
│   └── routes.tsx              # Route configuration
├── styles/
│   ├── fonts.css               # Google Fonts imports
│   └── theme.css               # Theme variables
└── imports/                    # Các file HTML và spec gốc
```

## Các trang chính

### 1. Dashboard (`/`)
- Hiển thị thông tin học sinh: tên, khóa học, tiến trình
- Thống kê gamification: Coins, XP, Streak, Accuracy
- Danh sách Unit với trạng thái: Unlocked/Locked
- Mẹo học tập và preview bảng xếp hạng

### 2. Unit View (`/unit/:unitId`)
- Header với tiến trình Unit
- Phase Navigator (I-IX) với icon trạng thái
- Lesson Cards: Current lesson nổi bật, completed và locked
- Pronunciation tips

### 3. Exercise Screens
- **Pronunciation** (`/exercise/pronunciation`): Giao diện ghi âm với avatar và IPA
- **Reading** (`/exercise/reading`): Layout 2 cột: bài đọc + câu hỏi
- **Quiz** (`/exercise/quiz`): Trắc nghiệm với feedback tức thì

### 4. Leaderboard (`/leaderboard`)
- Division info với countdown timer
- Podium cho top 3 người chơi
- Bảng xếp hạng chi tiết với XP và Streak
- Highlight người dùng hiện tại

### 5. Quests (`/quests`)
- Hero section với Quest Master
- Daily Quests: 3 nhiệm vụ với progress bar
- Weekly Challenges: Streak 7 ngày, Perfect Score
- Sidebar: Hall of Fame và Shop Boosters

### 6. Profile (`/profile`)
- Header với avatar VIP và thống kê
- Skill Radar Chart (6 kỹ năng)
- Study Streak Calendar
- Achievement Badges
- Account Management buttons

### 7. Shop (`/shop`)
- Hero section
- Category navigation
- Item grid: Boosters, Characters, VIP perks
- Special Offers/Bundles

## Hệ thống màu sắc

Theo đặc tả UIFIVE:

- **Primary Blue**: `#155ca5` - Header, nút chính, tiêu đề
- **Secondary Blue**: `#2e86de` - Nút phụ, icon
- **Success Green**: `#27ae60` - Đáp án đúng, hoàn thành
- **Error Red**: `#b31b25` / `#e74c3c` - Đáp án sai, cảnh báo
- **Streak Orange**: `#f39c12` - Icon streak
- **Gold Coin**: `#f1c40f` / `#fed023` - Coin, XP
- **Background**: `#f5f8fc` - Nền trang
- **VIP Purple**: `#8e44ad` - Badge VIP

## Typography

- **Font chính (Body)**: Lexend - Dễ đọc, hiện đại
- **Font tiêu đề (Headline)**: Nunito - Thân thiện, tròn
- **Font code/IPA**: Roboto Mono

## Tính năng Gamification

1. **Coin (💰)**: Điểm tích lũy từ bài học (15-40 coin/bài)
2. **XP (⚡)**: Điểm kinh nghiệm để lên level
3. **Streak (🔥)**: Chuỗi ngày học liên tiếp
4. **Accuracy (📊)**: Tỷ lệ đúng trung bình

## Routing

Sử dụng React Router Data Mode:

```typescript
/ → Dashboard
/unit/:unitId → UnitView
/exercise/pronunciation → PronunciationExercise
/exercise/reading → ReadingExercise
/exercise/quiz → QuizExercise
/leaderboard → Leaderboard
/quests → Quests
/profile → Profile
/shop → Shop
```

## Component Patterns

### ProgressBar
```tsx
<ProgressBar 
  value={65} 
  max={100}
  label="Overall Progress"
  color="primary"
  showLabel={true}
/>
```

### Navbar
- Tự động highlight active route
- Responsive: desktop navigation bar + mobile bottom navigation
- Hiển thị Streak, Coins, và Avatar VIP

## State Management

Hiện tại sử dụng local state với React hooks. Để mở rộng có thể thêm:
- Zustand hoặc Context API cho global state
- React Query cho data fetching
- LocalStorage cho persistence

## Responsive Design

- Mobile-first approach
- Breakpoints: `sm:`, `md:`, `lg:`, `xl:`
- Mobile bottom navigation bar
- Các grid tự động điều chỉnh số cột

## Các bước tiếp theo để hoàn thiện

1. **Backend Integration**: 
   - API endpoints cho user data, progress, leaderboard
   - Authentication & Authorization
   - Database cho user profiles, exercises

2. **AI/ML Features**:
   - Speech recognition cho pronunciation
   - AI grading cho writing
   - Personalized learning paths

3. **Additional Exercise Types**:
   - Fill in the blank
   - Matching columns
   - Word sorting
   - Audio listening exercises

4. **VIP Features**:
   - Detailed explanations
   - Advanced AI tools
   - Premium lessons

5. **Real-time Features**:
   - Live leaderboard updates
   - Multiplayer challenges
   - Chat support

## Ghi chú kỹ thuật

- Tất cả components được viết bằng TypeScript với proper typing
- Sử dụng Tailwind classes thay vì CSS modules
- Icons từ Lucide React (tree-shakeable)
- Font được load từ Google Fonts CDN
- Responsive và accessible design
