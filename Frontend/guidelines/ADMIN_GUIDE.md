# UIFIVE Admin Panel - Hướng dẫn sử dụng

## Tổng quan

Admin Panel của UIFIVE là hệ thống quản trị toàn diện cho nền tảng học tiếng Anh, cho phép quản lý học sinh, nội dung, câu hỏi, và các tính năng VIP.

## Truy cập Admin Panel

Truy cập admin panel tại: `http://localhost:5173/admin`

## Các trang chính

### 1. Dashboard (`/admin`)
Trang tổng quan với các KPI và thống kê chính:
- **KPI Cards**: Tổng học sinh, VIP %, Tổng câu hỏi, Streak đang hoạt động
- **Biểu đồ hoạt động**: Số học sinh hoạt động theo ngày trong tuần
- **Bài học hoàn thành**: Thống kê % hoàn thành theo môn học
- **Phân bố khối lớp**: Biểu đồ tròn phân bố học sinh
- **Top 10 bài học**: Bảng xếp hạng bài học phổ biến
- **Hoạt động gần đây**: Feed các hoạt động mới nhất
- **Cảnh báo hệ thống**: Thông báo lỗi cần xử lý

### 2. User Management (`/admin/users`)
Quản lý danh sách học sinh:
- **Bộ lọc nhanh**: Lọc theo lớp, loại tài khoản, trạng thái
- **Bảng học sinh**: Hiển thị thông tin chi tiết
- **Hành động**: Xem chi tiết, khóa/mở khóa, reset mật khẩu
- **Thống kê**: Tổng học sinh, VIP, yêu cầu hỗ trợ

### 3. Content Management (`/admin/content`)
Quản lý cây nội dung và bài học:
- **Content Tree** (Sidebar trái): Cấu trúc phân cấp Courses → Units → Parts
- **Lesson Management**: Bảng quản lý bài học với các thông tin:
  - STT (có thể kéo thả để sắp xếp)
  - Lesson Name
  - Format (Video, Quiz, Reading, Exam)
  - Questions
  - Coins
  - Status (Active/Hidden)
  - Actions (Edit, Clone, Preview, Hide/Show)

### 4. Question Bank (`/admin/questions`)
Ngân hàng câu hỏi:
- **Bộ lọc đa chiều**:
  - Học phần (Unit)
  - Phần & Dạng bài (Reading, Listening, Writing, Speaking)
  - Kỹ năng mục tiêu
  - Độ khó & Tỉ lệ
- **Bảng câu hỏi**: Hiển thị preview, phân loại, độ khó, % đúng, báo lỗi
- **Thống kê**: Tổng số câu hỏi
- **Actions**: Import hàng loạt, Duyệt câu hỏi, Thêm câu hỏi mới

### 5. Reports (`/admin/reports`)
Báo cáo và thống kê:
- **Metrics**: Active Users, Completion Time, Revenue, Churn Rate
- **Learning Activity Trends**: Biểu đồ xu hướng hoạt động học tập
- **VIP Revenue Performance**: Thống kê doanh thu VIP
- **Export**: CSV và PDF

### 6. VIP Management (`/admin/vip`)
Quản lý VIP:
- **Thống kê VIP**: Active VIPs, Monthly Revenue, Expiring Soon
- **VIP Application List**: Bảng danh sách học sinh VIP với trạng thái
- **Package Config**: Cấu hình các gói VIP (Standard Pro, Elite Mastery, Lifetime)
- **Recent Activity**: Log các giao dịch gần đây

### 7. Notifications (`/admin/notifications`)
Quản lý thông báo:
- **Manual Notification Composer**:
  - Chọn Target Audience
  - Chọn Delivery Channels (In-App, Email)
  - Soạn Subject và Content
- **Automated Event Triggers**:
  - New User Welcome
  - Streak Reminder
  - VIP Expiry Notice
- **Mobile Preview**: Xem trước thông báo trên mobile
- **Statistics**: Open Rate, CTR

### 8. Settings (`/admin/settings`)
Cài đặt hệ thống:
- **Gamification Tokens & Logic**:
  - Coin Values by Difficulty
  - Behavioral Multipliers
- **Learning Path Architect**: Sắp xếp thứ tự Units
- **Admin Access Control**: Quản lý quyền admin
- **Immutable Audit Log**: Lịch sử thay đổi của admin

## Màu sắc Admin Panel

Admin Panel sử dụng color scheme riêng:
- **Primary Red**: `#610000`, `#8b0000`, `#b02d21`
- **Dark Background**: `#1a1a2e`
- **Surface**: `#f7f9fc`, `#f2f4f7`
- **Blue Accent**: `#155ca5`, `#00178d`

## Tính năng chung

### Navigation
- **Sidebar**: Menu navigation cố định bên trái
- **Top Bar**: Search, Profile, Quick Actions
- **Footer**: Version info, Support links

### UI Components
- **Cards**: Hiển thị KPI và metrics
- **Tables**: High-density tables với hover states
- **Filters**: Multi-level filtering system
- **Charts**: Bar charts, Line charts, Pie charts
- **Forms**: Input fields, Selects, Textareas

## Responsive Design

Admin Panel được tối ưu cho desktop. Mobile responsive có thể được cải thiện trong tương lai.

## Phát triển tiếp

Các tính năng có thể mở rộng:
1. Authentication & Authorization
2. Real-time updates với WebSocket
3. Advanced filtering và search
4. Bulk operations
5. Export/Import data
6. Rich text editor cho notifications
7. Analytics dashboard mở rộng
8. Role-based access control (RBAC)

## Technology Stack

- **React** với TypeScript
- **React Router** cho routing
- **Tailwind CSS** cho styling
- **Lucide React** cho icons
