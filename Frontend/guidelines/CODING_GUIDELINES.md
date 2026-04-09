# UIFIVE - Bộ Quy Tắc & Hướng Dẫn Code Frontend

> **Phiên bản**: 1.0 — Cập nhật: 09/04/2026
> **Áp dụng cho**: Tất cả thành viên phát triển Frontend dự án UIFIVE

---

## 1. Tổng Quan Dự Án

| Mục | Chi tiết |
|---|---|
| **Tên dự án** | UIFIVE — Nền tảng học Tiếng Anh trực tuyến |
| **Framework** | React 18.3 + TypeScript |
| **Build tool** | Vite 6.3 |
| **Routing** | React Router 7 (Data Mode, `createBrowserRouter`) |
| **Styling** | Tailwind CSS 4 + `tw-animate-css` |
| **UI Components** | Radix UI + shadcn/ui + `class-variance-authority` |
| **Icons** | Lucide React |
| **Charts** | Recharts |
| **Fonts** | Lexend (body), Nunito (heading), Roboto Mono (code/IPA) |
| **Path alias** | `@/` → `src/` |

---

## 2. Cấu Trúc Thư Mục

```
src/
├── api/                      # Tầng API — giao tiếp backend
│   ├── admin/                # API modules dành cho Admin
│   │   ├── index.ts          # Barrel export admin modules
│   │   ├── types.ts          # Types riêng cho admin
│   │   ├── dashboard.ts      # CRUD dashboard
│   │   ├── users.ts          # CRUD users
│   │   ├── content.ts        # CRUD content
│   │   ├── questions.ts      # CRUD questions
│   │   ├── reports.ts        # CRUD reports
│   │   ├── vip.ts            # CRUD VIP
│   │   ├── notifications.ts  # CRUD notifications
│   │   ├── settings.ts       # CRUD settings
│   │   └── activityLogs.ts   # CRUD activity logs
│   ├── utils/
│   │   ├── http.ts           # `request()` — fetch wrapper gọi backend thật
│   │   └── async.ts          # `sleep()`, `isSuccess()` — dùng cho mock
│   ├── client.ts             # `simulateApiCall()`, helpers cho mock API
│   ├── types.ts              # Core types: ApiResponse<T>, ApiError, Request DTOs
│   ├── index.ts              # Barrel export toàn bộ API
│   ├── auth.ts               # Auth API (REAL — dùng http.ts)
│   ├── units.ts              # Units API
│   ├── lessons.ts            # Lessons API
│   ├── exercises.ts          # Exercises API
│   ├── tests.ts              # Tests API
│   ├── quests.ts             # Quests API
│   ├── leaderboard.ts        # Leaderboard API
│   ├── shop.ts               # Shop API
│   ├── users.ts              # User API
│   └── notifications.ts      # Notifications API
├── app/                      # Tầng Application — UI chính
│   ├── components/
│   │   ├── ui/               # shadcn/ui primitives (KHÔNG SỬA)
│   │   ├── figma/            # Components từ Figma export
│   │   ├── Navbar.tsx        # Global navigation
│   │   ├── Footer.tsx        # Footer đầy đủ
│   │   ├── FooterSimple.tsx  # Footer đơn giản
│   │   ├── AdminLayout.tsx   # Layout cho trang Admin
│   │   ├── RequireAuth.tsx   # Route guard
│   │   └── ProgressBar.tsx   # Progress bar component
│   ├── pages/
│   │   ├── admin/            # Trang Admin
│   │   ├── exercises/        # Trang bài tập
│   │   ├── Dashboard.tsx     # Trang chủ (User)
│   │   ├── UnitView.tsx      # Chi tiết Unit
│   │   ├── UnitSelection.tsx # Danh sách Unit
│   │   ├── Leaderboard.tsx   # Bảng xếp hạng
│   │   ├── Quests.tsx        # Nhiệm vụ
│   │   ├── Profile.tsx       # Trang cá nhân
│   │   ├── Shop.tsx          # Cửa hàng
│   │   └── ...
│   ├── App.tsx               # Root app với AuthProvider + RouterProvider
│   ├── Root.tsx              # Root layout (Navbar + Outlet + Footer)
│   └── routes.tsx            # Toàn bộ route config
├── components/               # Shared components (dùng chung user + admin)
│   └── AuthModal.tsx         # Modal đăng nhập/đăng ký
├── config/
│   └── env.ts                # Environment variables
├── context/
│   └── AuthContext.tsx        # Authentication context
├── data/
│   ├── mockData.ts           # Mock data cho User side
│   └── mockDataAdmin.ts      # Mock data cho Admin side
├── styles/
│   ├── index.css             # Entry CSS (import fonts → tailwind → theme)
│   ├── fonts.css             # Google Fonts import
│   ├── tailwind.css          # Tailwind base + tw-animate-css
│   └── theme.css             # CSS custom properties + @theme inline tokens
├── utils/
│   ├── NotificationPopup.tsx # Reusable notification dialog
│   └── useNotificationPopup.ts  # Hook quản lý notification state
├── main.tsx                  # Entry point
└── vite-env.d.ts             # Vite types
```

### Quy tắc đặt tên thư mục:
- **Thư mục**: `camelCase` — `mockData/`, `activityLogs/`
- **File component**: `PascalCase.tsx` — `Dashboard.tsx`, `AuthModal.tsx`
- **File logic/API/utils**: `camelCase.ts` — `client.ts`, `auth.ts`, `mockData.ts`
- **File CSS**: `camelCase.css` — `theme.css`, `fonts.css`

---

## 3. Quy Tắc Component

### 3.1 Khai báo Component

```tsx
// ✅ ĐÚNG: Dùng named function export
export function Dashboard() { ... }

// ✅ ĐÚNG: Default export cho component đặc biệt (modals, lazy load)
export default function AuthModal({ isOpen, onClose }: AuthModalProps) { ... }

// ❌ SAI: Arrow function cho page component
export const Dashboard = () => { ... }
```

### 3.2 Phân loại Component

| Loại | Vị trí | Ví dụ |
|---|---|---|
| **Page** | `src/app/pages/` | `Dashboard.tsx`, `Leaderboard.tsx` |
| **Layout** | `src/app/components/` | `AdminLayout.tsx`, `Navbar.tsx` |
| **UI Primitive** | `src/app/components/ui/` | `button.tsx`, `card.tsx` (shadcn) |
| **Shared** | `src/components/` | `AuthModal.tsx` |
| **Utility** | `src/utils/` | `NotificationPopup.tsx` |

### 3.3 Props Interface

```tsx
// ✅ ĐÚNG: Type riêng, đặt phía trên component
type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

// ✅ ĐÚNG: Interface cho component có nhiều props
interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
  label?: string;
  color?: "primary" | "success" | "secondary";
}

// ❌ SAI: Inline props
export function Modal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) { ... }
```

### 3.4 Pattern cho Page Component

Mọi page component **PHẢI** tuân theo pattern sau:

```tsx
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
// ... other imports

export function SomePage() {
  // 1. State declarations
  const [data, setData] = useState<SomeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 2. Data loading effect
  useEffect(() => {
    loadData();
  }, []);

  // 3. Load function (async, với try/catch/finally)
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await someApi();

      if (response.success) {
        setData(response.data);
      } else {
        setError('Failed to load data');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // 4. Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-[#155ca5] animate-spin mx-auto" />
          <p className="text-gray-600 font-medium">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  // 5. Error state (có nút retry)
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-600 font-bold">{error}</p>
        <button
          onClick={loadData}
          className="mt-4 px-6 py-2 bg-red-600 text-white rounded-md font-bold hover:bg-red-700 transition-colors"
        >
          Thử lại
        </button>
      </div>
    );
  }

  // 6. Main render
  return ( ... );
}
```

### 3.5 Parallel Data Loading

```tsx
// ✅ ĐÚNG: Gọi nhiều API song song
const [unitsRes, userRes, statsRes] = await Promise.all([
  getAllUnits(),
  getCurrentUser(),
  getUserStats(),
]);

// ❌ SAI: Gọi tuần tự
const unitsRes = await getAllUnits();
const userRes = await getCurrentUser();
```

---

## 4. Quy Tắc API Layer

### 4.1 Hai Chế Độ API

| Chế độ | File sử dụng | Khi nào dùng |
|---|---|---|
| **Mock** | `client.ts` → `simulateApiCall()` | Chưa có backend endpoint |
| **Real** | `utils/http.ts` → `request()` | Đã có backend endpoint |

### 4.2 Chuyển từ Mock → Real

```tsx
// TRƯỚC (Mock):
import { simulateApiCall, createErrorResponse } from './client';
import { units } from '@/data/mockData';

export async function getAllUnits(): Promise<ApiResponse<Unit[]>> {
  return simulateApiCall(units);
}

// SAU (Real):
import { request } from './utils/http';

export async function getAllUnits(): Promise<ApiResponse<Unit[]>> {
  return request<Unit[]>('/units', { method: 'GET' });
}
```

### 4.3 API Function Pattern

```tsx
// 1. JSDoc comment mô tả function
/**
 * Get single unit by ID
 */
export async function getUnit(unitId: number): Promise<ApiResponse<Unit>> {
  // 2. Validation trước khi gọi API
  if (!unitId) {
    return createErrorResponse('Unit ID is required', 'VALIDATION_ERROR');
  }

  // 3. Gọi API
  const unit = getUnitById(unitId);

  // 4. Kiểm tra kết quả
  if (!unit) {
    return createErrorResponse('Unit not found', 'NOT_FOUND');
  }

  return simulateApiCall(unit);
}
```

### 4.4 Return Type

**MỌI API function PHẢI trả về `Promise<ApiResponse<T>>`** với cấu trúc:

```tsx
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: ApiError;
}
```

### 4.5 Error Codes chuẩn

| Code | Ý nghĩa | Ví dụ |
|---|---|---|
| `VALIDATION_ERROR` | Dữ liệu đầu vào không hợp lệ | Thiếu username |
| `AUTH_ERROR` | Lỗi xác thực | Sai mật khẩu |
| `NOT_FOUND` | Không tìm thấy resource | Unit không tồn tại |
| `FORBIDDEN` | Không có quyền | Unit bị khóa |
| `API_ERROR` | Lỗi từ server | Response status ≠ 200 |
| `NETWORK_ERROR` | Lỗi mạng | fetch() thất bại |
| `UNKNOWN_ERROR` | Lỗi không xác định | Catch-all |

### 4.6 Barrel Export

```tsx
// src/api/index.ts — LUÔN cập nhật khi thêm module mới
export * from "./types";
export * from "./client";

// Namespace export cho từng module
export * as authApi from "./auth";
export * as unitApi from "./units";
export * as adminApi from "./admin";

// Re-export convenience functions
export { login, register, logout } from "./auth";
export { getAllUnits, getUnit } from "./units";
```

---

## 5. Quy Tắc TypeScript

### 5.1 Type Definitions

```tsx
// ✅ ĐÚNG: Export interface/type trong file tương ứng
// File: src/data/mockData.ts
export interface User {
  id: string;
  name: string;
  email: string;
  vipStatus: "free" | "premium" | "elite";
}

// ✅ ĐÚNG: Union type cho trạng thái
type UnitStatus = "completed" | "in-progress" | "upcoming" | "locked";

// ✅ ĐÚNG: Dùng `type` cho object type đơn giản, `interface` cho models
type AuthMode = "login" | "register";
```

### 5.2 Nơi đặt Types

| Loại type | Vị trí |
|---|---|
| **API Request/Response** | `src/api/types.ts` hoặc `src/api/admin/types.ts` |
| **Data Models** | `src/data/mockData.ts` hoặc `src/data/mockDataAdmin.ts` |
| **Component Props** | Cùng file component, phía trên function |
| **Context** | Cùng file context |

### 5.3 Generics

```tsx
// ✅ ĐÚNG: Dùng generics cho API response wrapper
export async function simulateApiCall<T>(
  payload: T,
  delayMs: number = DEFAULT_SIMULATED_DELAY_MS,
): Promise<ApiResponse<T>> { ... }

// ✅ ĐÚNG: Generics cho request helper
export async function request<T>(
  url: string,
  options: RequestInit,
): Promise<ApiResponse<T>> { ... }
```

### 5.4 Avoid `any`

```tsx
// ❌ SAI
const [recentUsers, setRecentUsers] = useState<any[]>([]);

// ✅ ĐÚNG
const [recentUsers, setRecentUsers] = useState<AdminUser[]>([]);

// ⚠️ Tạm chấp nhận: Khi response shape chưa xác định rõ từ backend
export async function login(credentials: LoginRequest): Promise<ApiResponse<any>> { ... }
```

---

## 6. Quy Tắc Styling (Tailwind CSS 4)

### 6.1 Color Palette

Sử dụng **MÀU CỐ ĐỊNH** trong toàn dự án, **KHÔNG tự ý thêm màu mới**:

| Token | Hex | Sử dụng |
|---|---|---|
| **Primary Blue** | `#155ca5` | Header, nút chính, tiêu đề, text nhấn |
| **Dark Blue** | `#005095` | Gradient, hover state |
| **Navy** | `#1e2e51` | Nền tối, text đậm |
| **Admin Sidebar** | `#1a1a2e` | Sidebar admin |
| **Success Green** | `#27ae60` | Đúng, hoàn thành, tích cực |
| **Error Red** | `#b31b25` / `#b02d21` / `#d4183d` | Sai, xóa, cảnh báo |
| **Streak Orange** | `#f39c12` | Streak, trending |
| **Gold Coin** | `#f1c40f` / `#fed023` | Coins, XP, badge |
| **Background** | `#f5f8fc` / `#f7f9fc` | Nền trang chính |
| **VIP Gold** | Gradient `yellow-400` → `yellow-600` | Badge VIP |

### 6.2 CSS Variable Theme

Sử dụng **CSS Variables** đã định nghĩa trong `theme.css`:

```tsx
// ✅ ĐÚNG: Dùng Tailwind theme tokens
className="bg-background text-foreground"
className="bg-card text-card-foreground"
className="bg-primary text-primary-foreground"
className="bg-destructive text-destructive-foreground"
className="text-muted-foreground"

// ✅ ĐÚNG: Dùng màu trực tiếp cho brand-specific
className="text-[#155ca5]"
className="bg-[#27ae60]"
```

### 6.3 Typography

```tsx
// Body text → Lexend (mặc định từ theme.css)
// Heading → Nunito (mặc định từ theme.css, thẻ h1-h6)
// Code / IPA → font-mono (Roboto Mono)

// ✅ ĐÚNG
<h1 className="text-5xl font-black">...</h1>        // Nunito tự động
<p className="text-sm font-medium">...</p>           // Lexend tự động
<span className="font-mono text-sm">IPA: /həˈloʊ/</span>  // Roboto Mono
```

### 6.4 Responsive Design

```tsx
// Mobile-first, dùng breakpoints chuẩn Tailwind
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"

// Hidden trên mobile, hiện trên desktop
className="hidden md:flex"

// Mobile bottom nav: fixed bottom dưới md
className="md:hidden fixed bottom-0 left-0 right-0"
```

### 6.5 Layout Patterns

```tsx
// Page container
<main className="max-w-7xl mx-auto px-6 py-10 space-y-12">

// Section container
<section className="space-y-8">

// Grid thống kê
<section className="grid grid-cols-2 md:grid-cols-4 gap-4">

// Admin layout: sidebar 270px + nội dung
<div className="ml-[270px] flex-1 flex flex-col">
```

### 6.6 Animation & Transition

```tsx
// ✅ ĐÚNG: Transition cho hover
className="transition-all duration-200"
className="transition-colors"
className="transition-transform"
className="hover:scale-[1.02] transition-transform"
className="hover:shadow-xl hover:scale-105 active:scale-95 transition-all"

// ✅ ĐÚNG: Animation spinner
className="animate-spin"
```

### 6.7 Pattern cho Card

```tsx
// Card cơ bản (User side)
<div className="bg-white p-6 rounded-lg shadow-sm hover:scale-[1.02] transition-transform">

// Card cơ bản (Admin side)
<div className="bg-white p-5 rounded-lg shadow-sm">

// Card với gradient overlay
<div className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300">
```

### 6.8 Công cụ `cn()`

```tsx
// Dùng cn() cho conditional classes trong shadcn components
import { cn } from "@/app/components/ui/utils";

<div className={cn(
  "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border",
  className,
)}>
```

---

## 7. Quy Tắc Routing

### 7.1 Cấu trúc Route

```tsx
// Dùng createBrowserRouter (React Router 7 Data Mode)
export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Dashboard },
      { path: "units", Component: UnitSelection },
      { path: "unit/:unitId", Component: UnitView },
      // ...
    ],
  },
  {
    Component: RequireAuth,   // Guard route
    children: [
      {
        path: "/admin",
        Component: AdminLayout,
        children: [
          { index: true, Component: AdminDashboard },
          // ...
        ],
      },
    ],
  },
]);
```

### 7.2 Naming Convention cho Route

| Pattern | Ví dụ | Component |
|---|---|---|
| `/` | Trang chủ | `Dashboard` |
| `/resource` | Danh sách | `UnitSelection` |
| `/resource/:id` | Chi tiết | `UnitView` |
| `/resource/action` | Hành động | `RevisionTest` |
| `/admin/resource` | Admin CRUD | `UserManagement` |

### 7.3 Navigation

```tsx
// ✅ ĐÚNG: Dùng <Link> từ react-router
import { Link } from "react-router";
<Link to={`/unit/${unit.id}`}>View Unit</Link>

// ✅ ĐÚNG: Programmatic navigation
import { Navigate } from "react-router";
return <Navigate to="/" replace />;

// ❌ SAI: Dùng <a> tag cho internal link
<a href="/units">Units</a>
```

---

## 8. Quy Tắc Context & State Management

### 8.1 Context Pattern

```tsx
// 1. Tạo Context với undefined default
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// 2. Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  // State + logic
  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, error, login, register, logout }),
    [user, loading, error, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// 3. Custom hook (với guard)
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
```

### 8.2 State Management

- **Local state**: `useState` cho UI state đơn giản (modal open, selected tab...)
- **Context**: **CHỈ** cho global state cần chia sẻ (auth, theme)
- **Hook `useCallback`**: Bọc các async functions trong Context
- **Hook `useMemo`**: Bọc context value để tránh re-render

---

## 9. Quy Tắc Mock Data

### 9.1 Nơi đặt Mock Data

| Loại | File |
|---|---|
| User data (units, lessons, questions...) | `src/data/mockData.ts` |
| Admin data (users, content, reports...) | `src/data/mockDataAdmin.ts` |

### 9.2 Cấu trúc file Mock Data

```tsx
// 1. Các TYPES & INTERFACES ở đầu file
export interface User { ... }
export interface Unit { ... }

// 2. Dữ liệu export ở giữa/cuối file
export const currentUser: User = { ... };
export const units: Unit[] = [ ... ];

// 3. Helper functions cuối file
export function getUnitById(id: number): Unit | undefined { ... }
```

### 9.3 Quy tắc khi thêm Mock Data mới

1. **Định nghĩa interface trước** rồi mới tạo data
2. **Dùng union type** cho các trạng thái: `"active" | "inactive" | "suspended"`
3. **ID format**: `"entity-XXX"` (vd: `"user-001"`, `"lesson-1-3"`, `"report-003"`)
4. **Date format**: ISO 8601 — `"2026-04-07T14:30:00Z"`
5. **Avatar URL**: `https://api.dicebear.com/7.x/avataaars/svg?seed=<Name>`

---

## 10. Quy Tắc Import

### 10.1 Thứ tự Import

```tsx
// 1. React / React hooks
import { useState, useEffect, useCallback } from 'react';

// 2. Third-party libraries
import { Link, useLocation } from 'react-router';
import { Loader2, Flame, Coins } from 'lucide-react';

// 3. Internal modules (dùng @/ alias)
import { getAllUnits, getUserStats } from '@/api';
import { useAuth } from '@/context/AuthContext';
import type { Unit, User } from '@/data/mockData';

// 4. Local components
import { ProgressBar } from '../components/ProgressBar';
```

### 10.2 Import Path

```tsx
// ✅ ĐÚNG: Dùng @ alias cho cross-folder import
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/app/components/ui/button";

// ✅ ĐÚNG: Relative path cho same-folder import
import { ProgressBar } from "../components/ProgressBar";
import { cn } from "./utils";

// ❌ SAI: Relative path dài vượt 2 levels
import { useAuth } from "../../../context/AuthContext";
```

### 10.3 Type-only Import

```tsx
// ✅ ĐÚNG: Dùng `type` keyword cho type-only imports
import type { ApiResponse, LoginRequest } from "./types";
import type { Unit, User } from '@/data/mockData';
```

---

## 11. Quy Tắc Icon

### 11.1 Icon Library

**CHỈ dùng Lucide React**. Không mix với icon library khác.

```tsx
// ✅ ĐÚNG
import { Flame, Coins, User, Loader2, Lock } from "lucide-react";

// ❌ SAI - Không dùng MUI icons trong user pages
import { Home } from "@mui/icons-material";
```

> **Ngoại lệ**: MUI Icons chỉ được dùng kết hợp với MUI components nếu cần thiết.

### 11.2 Icon Size Convention

```tsx
// Spinner lớn (loading state)
<Loader2 className="w-12 h-12 text-[#155ca5] animate-spin" />

// Icon thống kê (stat cards)
<Coins className="w-8 h-8 text-[#f1c40f]" fill="#f1c40f" />

// Icon inline
<Flame className="w-4 h-4 text-[#f39c12]" fill="#f39c12" />

// Dùng `size` prop cho Lucide (Admin layout)
<Users size={20} />
```

---

## 12. Quy Tắc Xử Lý Error & Loading

### 12.1 Loading State

```tsx
// Spinner + text mô tả
<div className="flex items-center justify-center min-h-[60vh]">
  <div className="text-center space-y-4">
    <Loader2 className="w-12 h-12 text-[#155ca5] animate-spin mx-auto" />
    <p className="text-gray-600 font-medium">Loading dashboard...</p>
  </div>
</div>
```

### 12.2 Error State

```tsx
// Error box + nút Retry
<div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
  <p className="text-red-600 font-bold">{error}</p>
  <button
    onClick={loadData}
    className="mt-4 px-6 py-2 bg-red-600 text-white rounded-md font-bold hover:bg-red-700 transition-colors"
  >
    Thử lại
  </button>
</div>
```

### 12.3 Inline Error

```tsx
// Cho form errors
{(formError || error) && (
  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
    {formError || error}
  </div>
)}
```

---

## 13. Quy Tắc Authentication

### 13.1 Flow

```
App.tsx → AuthProvider bọc toàn app
    ├── Root.tsx: Kiểm tra isAuthenticated → PublicLanding hoặc Dashboard
    ├── RequireAuth.tsx: Route guard cho Admin (role === "ADMIN")
    └── AuthModal.tsx: Form login/register
```

### 13.2 Sử dụng Auth

```tsx
// Truy cập auth state
const { user, isAuthenticated, loading, error, login, logout } = useAuth();

// Kiểm tra quyền
if (user?.role === "ADMIN") { ... }

// Hiển thị conditional UI
{isAuthenticated ? <LogoutButton /> : <LoginButton />}
```

---

## 14. Quy Tắc Notification

### 14.1 Sử dụng NotificationPopup

```tsx
import { NotificationPopup } from "@/utils/NotificationPopup";
import { useNotificationPopup } from "@/utils/useNotificationPopup";

function SomePage() {
  const notification = useNotificationPopup();

  // Hiển thị thông báo
  notification.success({ message: "Lưu thành công!", title: "Thành công" });
  notification.error({ message: "Có lỗi xảy ra!", title: "Lỗi" });
  notification.warning({ message: "Cảnh báo!", title: "Cảnh báo" });
  notification.info({ message: "Thông tin.", title: "Thông tin" });

  return (
    <>
      {/* ... page content ... */}
      <NotificationPopup {...notification.notification} onClose={notification.close} />
    </>
  );
}
```

---

## 15. Quy Tắc UI Component (shadcn/ui)

### 15.1 Nguyên tắc

- Thư mục `src/app/components/ui/` chứa shadcn/ui primitives
- **KHÔNG SỬA trực tiếp** file trong thư mục `ui/` trừ khi thật sự cần thiết
- Customize bằng cách truyền `className` prop
- Dùng `cn()` utility để merge Tailwind classes

### 15.2 Sử dụng

```tsx
import { Button } from "@/app/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { Dialog, DialogContent, DialogHeader } from "@/app/components/ui/dialog";

// Variants
<Button variant="default">Primary</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>
<Button variant="ghost">Text only</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
```

---

## 16. Quy Tắc Git & Naming

### 16.1 Branch Naming

```
feature/ten-tinh-nang      # Tính năng mới
fix/ten-bug                 # Sửa lỗi
refactor/mo-ta              # Refactor code
```

### 16.2 Commit Message

```
feat: thêm trang Leaderboard
fix: sửa lỗi hiển thị navbar trên mobile
refactor: tách component ProgressBar
style: cập nhật theme colors
docs: cập nhật CODING_GUIDELINES
```

---

## 17. Checklist Khi Thêm Tính Năng Mới

- [ ] **Interface/Type** đã định nghĩa trong file `types.ts` tương ứng
- [ ] **Mock Data** (nếu cần) đã thêm vào `mockData.ts` hoặc `mockDataAdmin.ts`
- [ ] **API Module** đã tạo trong `src/api/` với đúng pattern
- [ ] **Barrel Export** (`index.ts`) đã cập nhật
- [ ] **Route** đã thêm vào `routes.tsx`
- [ ] **Loading state** và **Error state** đã xử lý
- [ ] **Responsive** test trên mobile + desktop
- [ ] **Sử dụng đúng color palette** (không tự tạo màu mới)
- [ ] **Sử dụng đúng font** (Lexend body, Nunito heading)
- [ ] **Import path** dùng `@/` alias

---

## 18. Don'ts — Những Điều KHÔNG Được Làm

| ❌ Không | ✅ Thay thế |
|---|---|
| Hardcode API URL | Dùng `ENV.API_BASE_URL` từ `config/env.ts` |
| Dùng `any` type không cần thiết | Định nghĩa type cụ thể |
| Inline style (style={{}}) | Dùng Tailwind classes |
| Console.log trong production | Chỉ `console.error` trong catch block |
| Thêm dependency không cần thiết | Thảo luận trước với team |
| Sửa file trong `ui/` | Customize bằng `className` prop |
| Sử dụng CSS modules | Dùng Tailwind CSS |
| Tạo global CSS mới | Sử dụng `theme.css` hoặc Tailwind |
| Mix icon libraries | Chỉ dùng Lucide React |
| Tạo context cho mọi state | Dùng local state trước |
