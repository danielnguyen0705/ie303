# IE303 - UIFIVE

UIFIVE là một nền tảng học tiếng Anh trực tuyến dành cho học sinh THPT, tập trung vào lộ trình học theo khối lớp, unit, section và lesson. Project hiện được tổ chức theo kiểu monorepo với frontend React, backend Spring Boot và một thư mục `MLService` đang ở mức thử nghiệm.

## Tổng quan kiến trúc

- `Frontend`: giao diện người dùng và admin, xây dựng bằng React + TypeScript + Vite.
- `Backend`: REST API, xác thực JWT/OAuth2, truy cập PostgreSQL, email, Cloudinary và Gemini.
- `MLService`: hiện tại chỉ mới có file thử nghiệm `hello.py`.

## Tính năng chính

- Luồng học theo cấu trúc `Grade -> Unit -> Section -> Lesson`.
- Dashboard hiển thị thông tin học tập, XP, coins, streak và accuracy.
- Các màn bài tập: quiz, reading, listening, pronunciation.
- Khu vực test/review: kết quả bài test, xem lại câu hỏi, bài kiểm tra ôn tập.
- Bảng xếp hạng, quests, profile và shop vật phẩm.
- Trang admin được bảo vệ bởi auth để quản lý user, nội dung, question bank, reports, VIP, shop, notifications và settings.
- Backend hỗ trợ đăng nhập/đăng ký, xác minh email, leaderboard, tiến độ học tập, ngân hàng câu hỏi, shop item và chấm bài writing bằng AI.

## Công nghệ sử dụng

### Frontend

- React 18
- TypeScript
- Vite 6
- React Router 7
- Tailwind CSS 4
- MUI, Radix UI, Lucide React

### Backend

- Java 21
- Spring Boot 3.4
- Spring Web
- Spring Security + JWT + OAuth2 Google
- Spring Data JPA
- PostgreSQL
- MapStruct + Lombok
- Spring Mail
- Cloudinary
- Google Gemini

## Cấu trúc thư mục

```text
ie303/
|-- Frontend/
|   |-- src/
|   |   |-- app/
|   |   |-- api/
|   |   |-- components/
|   |   |-- config/
|   |   `-- context/
|   `-- package.json
|-- Backend/
|   |-- src/main/java/com/ie303/uifive/
|   |-- src/main/resources/application.properties
|   `-- pom.xml
|-- MLService/
|   `-- hello.py
`-- README.md
```

## Các route frontend nổi bật

### User

- `/`: dashboard
- `/grades/:gradeId/units`: danh sách unit theo khối lớp
- `/units/:unitId/sections`: danh sách section của unit
- `/sections/:sectionId/lessons`: danh sách lesson của section
- `/lessons/:lessonId`: chạy bài học
- `/leaderboard`, `/quests`, `/profile`, `/shop`
- `/test/results`, `/test/review`, `/test/revision`
- `/exercise/pronunciation`, `/exercise/reading`, `/exercise/quiz`, `/exercise/listening`

### Admin

- `/admin`
- `/admin/users`
- `/admin/content`
- `/admin/questions`
- `/admin/reports`
- `/admin/vip`
- `/admin/shop`
- `/admin/notifications`
- `/admin/settings`

## API backend chính

Một số nhóm API đang có trong project:

- `/api/auth`: login, register, verify email, logout
- `/api/users`: thông tin user và profile hiện tại
- `/api/grades`, `/api/units`, `/api/sections`, `/api/lessons`
- `/api/progress`: tiến độ học theo grade/unit/section
- `/api/questions`, `/api/question-groups`, `/api/question-options`
- `/api/semester-tests`, `/api/group-reviews`, `/api/unit-reviews`
- `/api/leaderboards`
- `/api/shop-items`
- `/api/user-question-histories`
- `/api/ai/essay/submit`

## Yêu cầu môi trường

Cần cài đặt trước:

- Node.js 18+
- npm
- Java 21
- Maven Wrapper (đã có sẵn trong `Backend`)
- PostgreSQL

## Biến môi trường

### Frontend

Frontend đọc biến sau:

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

Nếu không cung cấp, frontend mặc định gọi đến `http://localhost:8080/api`.

### Backend

Backend đọc biến môi trường từ file `.env` thông qua `dotenv-java` hoặc từ environment của hệ thống.

```env
DB_URL=jdbc:postgresql://localhost:5432/uifive
DB_USERNAME=postgres
DB_PASSWORD=your_password

JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=86400000

MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

GEMINI_API_KEY=your_gemini_api_key

CLOUD_NAME=your_cloudinary_cloud_name
API_KEY=your_cloudinary_api_key
API_SECRET=your_cloudinary_api_secret
```

## Cách chạy project

### 1. Chạy backend

Từ thư mục `Backend`:

```bash
./mvnw spring-boot:run
```

Trên Windows có thể dùng:

```bash
mvnw.cmd spring-boot:run
```

Backend mặc định chạy ở `http://localhost:8080`.

### 2. Chạy frontend

Từ thư mục `Frontend`:

```bash
npm install
npm run dev
```

Frontend mặc định chạy ở `http://localhost:5173`.

### 3. Đăng nhập và CORS

- Backend đang cho phép CORS cho `http://localhost:5173`.
- Cơ chế auth hiện tại sử dụng cookie `token` dạng `HttpOnly`.
- Tất cả route ngoài `/api/auth/**` và OAuth2 đều yêu cầu xác thực.

## Build và test

### Frontend

```bash
npm run build
```

### Backend

```bash
./mvnw test
./mvnw package
```

Trên Windows:

```bash
mvnw.cmd test
mvnw.cmd package
```

## Ghi chú hiện trạng

- Thư mục `Frontend/src/api` đang có cả phần gọi API thật và một số utility mô phỏng API.
- `MLService` chưa được tích hợp thành một service riêng.
- `spring.jpa.hibernate.ddl-auto=update` đang bật trong backend, phù hợp môi trường phát triển hơn là production.

## Hướng phát triển tiếp theo

- Hoàn thiện tài liệu API và file mẫu `.env.example` cho từng service.
- Đồng bộ các luồng frontend còn đang dùng mock/simulate với backend thật.
- Tách riêng `MLService` thành service độc lập nếu cần xử lý AI/ML chuyên sâu.
- Bổ sung Docker/Docker Compose để khởi động toàn bộ stack nhanh hơn.
