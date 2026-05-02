# UIFIVE - Routes Summary

## 📍 Quick Reference Guide

Danh sách đầy đủ tất cả các routes trong ứng dụng UIFIVE.

---

## 🎓 USER ROUTES

### Main Pages

| Route | Component | Mô tả |
|-------|-----------|-------|
| `/` | Dashboard | Trang chủ - Overview học tập |
| `/units` | **UnitSelection** ⭐ **MỚI** | Chọn Unit - Curriculum overview |
| `/unit/:unitId` | UnitView | Chi tiết Unit - Lessons list |
| `/leaderboard` | Leaderboard | Bảng xếp hạng |
| `/quests` | Quests | Daily & Weekly quests |
| `/profile` | Profile | Thông tin cá nhân |
| `/shop` | Shop | Cửa hàng items |

### Exercise Pages

| Route | Component | Mô tả |
|-------|-----------|-------|
| `/exercise/pronunciation` | PronunciationExercise | Luyện phát âm |
| `/exercise/reading` | ReadingExercise | Đọc hiểu |
| `/exercise/quiz` | QuizExercise | Trắc nghiệm |
| `/exercise/listening` | **ListeningExercise** ⭐ **MỚI** | Luyện nghe + Word sorting |

### Test & Review Pages

| Route | Component | Mô tả |
|-------|-----------|-------|
| `/test/results` | **TestResults** ⭐ **MỚI** | Kết quả test |
| `/test/review` | **TestReview** ⭐ **MỚI** | Xem lại câu hỏi |
| `/test/revision` | **RevisionTest** ⭐ **MỚI** | Bài kiểm tra ôn tập |

---

## 👨‍💼 ADMIN ROUTES

### Admin Panel

| Route | Component | Mô tả |
|-------|-----------|-------|
| `/admin` | AdminDashboard | Admin Dashboard - KPIs |
| `/admin/users` | UserManagement | Quản lý người dùng |
| `/admin/content` | ContentManagement | Quản lý nội dung |
| `/admin/questions` | QuestionBank | Ngân hàng câu hỏi |
| `/admin/reports` | Reports | Báo cáo & Analytics |
| `/admin/vip` | VIPManagement | Quản lý VIP |
| `/admin/notifications` | Notifications | Thông báo hệ thống |
| `/admin/settings` | Settings | Cài đặt |

---

## 🗺️ Navigation Flow

### User Learning Journey
```
Dashboard
  ↓
Unit Selection (Browse all units)
  ↓
Unit View (Select specific unit)
  ↓
Exercise (Complete lesson)
  ↓
Test Results (View score)
  ↓
Test Review (Learn from mistakes)
```

### Admin Management Flow
```
Admin Dashboard
  ↓
User Management (Manage students)
  ↓
Content Management (Create content)
  ↓
Question Bank (Add questions)
  ↓
Reports (View analytics)
```

---

## 🎯 Route Examples

### User Routes
```
http://localhost:5173/                    → Dashboard
http://localhost:5173/units               → Unit Selection ⭐
http://localhost:5173/unit/1              → Unit 1 Detail
http://localhost:5173/exercise/listening  → Listening Exercise ⭐
http://localhost:5173/test/results        → Test Results ⭐
http://localhost:5173/test/review         → Test Review ⭐
http://localhost:5173/test/revision       → Revision Test ⭐
http://localhost:5173/leaderboard         → Leaderboard
http://localhost:5173/quests              → Quests
http://localhost:5173/profile             → Profile
http://localhost:5173/shop                → Shop
```

### Admin Routes
```
http://localhost:5173/admin               → Admin Dashboard
http://localhost:5173/admin/users         → User Management
http://localhost:5173/admin/content       → Content Management
http://localhost:5173/admin/questions     → Question Bank
http://localhost:5173/admin/reports       → Reports
http://localhost:5173/admin/vip           → VIP Management
http://localhost:5173/admin/notifications → Notifications
http://localhost:5173/admin/settings      → Settings
```

---

## 📊 Total Routes Count

- **User Routes**: 14 trang
  - Main: 7
  - Exercises: 4
  - Tests: 3
- **Admin Routes**: 8 trang
- **Total**: 22 trang

---

## ⭐ New Pages (Latest Update)

1. **Unit Selection** (`/units`)
   - Curriculum overview
   - Học kỳ 1 & 2
   - Progress tracking
   - Lock/unlock system

2. **Listening Exercise** (`/exercise/listening`)
   - Audio player
   - Word sorting
   - Pro tips

3. **Test Results** (`/test/results`)
   - Score circle
   - Skill breakdown
   - Radar chart

4. **Test Review** (`/test/review`)
   - Question grid (50 câu)
   - Answer comparison
   - Detailed explanation

5. **Revision Test** (`/test/revision`)
   - Split-screen
   - Timer countdown
   - Question navigation

---

## 🔒 Access Control

### Public Routes (No Auth)
- All `/` routes (user pages)

### Protected Routes (Admin Only)
- All `/admin` routes

---

## 📱 Responsive Routes

Tất cả routes đều responsive:
- ✅ Desktop (1920px+)
- ✅ Laptop (1366px+)
- ✅ Tablet (768px+)
- ✅ Mobile (<768px)

---

## 🧭 Navigation Components

### User Navigation
- TopNav: Logo, Links, Stats (Coins, Streak)
- SideNav (Desktop): Learn, Quests, Leaderboard, Shop
- BottomNav (Mobile): Icons navigation

### Admin Navigation
- AdminLayout: Sidebar với admin menu
- TopBar: Admin actions

---

## 🎨 Layout Structures

### Root Layout (User)
```tsx
<Root>
  <TopNav />
  <SideNav />
  <Outlet /> // Page content
  <BottomNav /> // Mobile only
</Root>
```

### Admin Layout
```tsx
<AdminLayout>
  <AdminSidebar />
  <main>
    <AdminTopBar />
    <Outlet /> // Admin page content
  </main>
</AdminLayout>
```

---

## 🔗 Related Documentation

- **USER_GUIDE.md** - Detailed user pages documentation
- **ADMIN_GUIDE.md** - Admin panel documentation
- **README.md** - Project setup

---

**Last Updated:** April 7, 2026  
**Version:** 1.0.0
