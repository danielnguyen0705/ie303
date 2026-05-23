# Deployment & CI/CD Setup

Dự án được triển khai toàn bộ trên nền tảng **Render** và sử dụng **GitHub Actions** cho CI/CD.

## Tổng quan kiến trúc triển khai

- **GitHub Actions**: Chạy tự động kiểm tra lỗi (CI) khi có push hoặc pull request.
- **Render PostgreSQL**: Dịch vụ cơ sở dữ liệu.
- **Render Web Service (Spring Cloud Gateway)**: entrypoint cho frontend.
- **Render Web Service (Java/Spring Boot)**: Identity Service API.
- **Render Web Service (Java/Spring Boot)**: Payment Service API.
- **Render Web Service (Java/Spring Boot)**: Gamification Service API.
- **Render Web Service (Java/Spring Boot)**: Content Service API.
- **Render Web Service (Java/Spring Boot)**: Progress Service API.
- **Render Web Service (Java/Spring Boot)**: AI Service API.
- **Render Web Service (Java/Spring Boot)**: Notification Service API.
- **Render Web Service (Python/FastAPI)**: Machine Learning Service.
- **Render Static Site (React/Vite)**: Frontend Web.
- **Domain**: `https://uifive.io.vn/`

---

## 1) GitHub Actions CI

Workflow được định nghĩa tại: `.github/workflows/ci.yml`

Hệ thống tự động chạy trên các nhánh `main` và `dev` để đảm bảo code ổn định trước khi deploy:
- Chạy unit test cho các service Java chính (`mvn test` từng service).
- Build thử nghiệm cho Frontend (`npm run build`).
- Cài đặt và chạy script huấn luyện mô hình ML (`python train.py`), kiểm tra sự tồn tại của các file `.pkl`.

---

## 2) Khởi tạo Database (Render PostgreSQL)

1. Tạo một PostgreSQL instance trên dashboard của Render.
2. Lấy thông tin cấu hình: **Internal Database URL** (khuyến nghị cho Backend dùng chung trên Render) hoặc **External Database URL**.
3. Các thông tin cần thiết để truyền vào biến môi trường Backend: `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`.

---

## 3) Triển khai IdentityService (Render Web Service)

Kết nối thư mục `IdentityService/` với Render:

- **Environment**: Java
- **Root directory**: `IdentityService`
- **Branch**: `main`
- Bật `Auto-Deploy`

**Biến môi trường cần thiết**:
- `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`
- `JWT_SECRET`, `JWT_EXPIRATION`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `FRONTEND_BASE_URL=https://uifive.io.vn`
- `BACKEND_PUBLIC_BASE_URL=<your-render-gateway-url>`
- `CORS_ALLOWED_ORIGINS=https://uifive.io.vn`
- `NOTIFICATION_SERVICE_BASE_URL=<your-notification-service-url>`
- `PORT=8084`

Identity service sẽ xử lý `/api/auth/**`, `/oauth2/**` và `/login/oauth2/**` qua gateway.

---

## 4) Triển khai GamificationService (Render Web Service)

Kết nối thư mục `GamificationService/` với Render:

- **Environment**: Java
- **Root directory**: `GamificationService`
- **Branch**: `main`
- Bật `Auto-Deploy`

**Biến môi trường cần thiết**:
- `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`
- `JWT_SECRET`, `JWT_EXPIRATION`
- `CLOUD_NAME`, `API_KEY`, `API_SECRET`
- `NOTIFICATION_SERVICE_BASE_URL=<your-notification-service-url>`
- `CORS_ALLOWED_ORIGINS=https://uifive.io.vn`
- `PORT=8085`

Gateway sẽ route `/api/shop-items/**` và `/api/leaderboards/**` về gamification service.

---

## 5) Triển khai ContentService (Render Web Service)

Kết nối thư mục `ContentService/` với Render:

- **Environment**: Java
- **Root directory**: `ContentService`
- **Branch**: `main`
- Bật `Auto-Deploy`

**Biến môi trường cần thiết**:
- `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`
- `JWT_SECRET`, `JWT_EXPIRATION`
- `FRONTEND_BASE_URL=https://uifive.io.vn`
- `BACKEND_PUBLIC_BASE_URL=<your-render-gateway-url>`
- `CORS_ALLOWED_ORIGINS=https://uifive.io.vn`
- `PORT=8086`

Gateway sẽ route `/api/grades/**`, `/api/units/**`, `/api/sections/**`, `/api/lessons/**`, `/api/questions/**`, `/api/question-groups/**`, `/api/question-options/**`, `/api/unit-reviews/**`, `/api/group-reviews/**` và `/api/semester-tests/**` về content service.

---

## 6) Triển khai ProgressService (Render Web Service)

Kết nối thư mục `ProgressService/` với Render:

- **Environment**: Java
- **Root directory**: `ProgressService`
- **Branch**: `main`
- Bật `Auto-Deploy`

**Biến môi trường cần thiết**:
- `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`
- `JWT_SECRET`, `JWT_EXPIRATION`
- `CORS_ALLOWED_ORIGINS=https://uifive.io.vn`
- `PORT=8087`

Gateway sẽ route `/api/progress/**` về progress service.
Gateway cũng route các endpoint `GET /api/ai/learning-analysis/me` và `GET /api/ai/learning-analysis/me/history` về progress service.
Gateway cũng route `/api/user-question-histories/**` về progress service.
Gateway cũng route `/api/users/me/activity-calendar` về progress service.

---

## 7) Triển khai AIService (Render Web Service)

Kết nối thư mục `AIService/` với Render:

- **Environment**: Java
- **Root directory**: `AIService`
- **Branch**: `main`
- Bật `Auto-Deploy`

**Biến môi trường cần thiết**:
- `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`
- `JWT_SECRET`, `JWT_EXPIRATION`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `NVIDIA_API_KEY`
- `CORS_ALLOWED_ORIGINS=https://uifive.io.vn`
- `PORT=8088`

Gateway sẽ route `/api/ai/essay/**` và `/api/ai/speaking/**` về AI service.
Gateway cũng route `/api/ai/personalized-questions` về AI service.

---

## 8) Triển khai NotificationService (Render Web Service)

Kết nối thư mục `NotificationService/` với Render:

- **Environment**: Java
- **Root directory**: `NotificationService`
- **Branch**: `main`
- Bật `Auto-Deploy`

**Biến môi trường cần thiết**:
- `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
- `NOTIFICATION_TIME_ZONE=Asia/Ho_Chi_Minh`
- `NOTIFICATION_VIP_REMINDER_CRON`
- `NOTIFICATION_VIP_REMINDER_DAYS_BEFORE`
- `NOTIFICATION_STREAK_REMINDER_CRON`
- `NOTIFICATION_STREAK_RESET_CRON`
- `PORT=8082`

---

## 9) Triển khai GatewayService (Render Web Service)

Kết nối thư mục `GatewayService/` với Render:

- **Environment**: Java
- **Root directory**: `GatewayService`
- **Branch**: `main`
- Bật `Auto-Deploy`

**Biến môi trường cần thiết**:
- `IDENTITY_SERVICE_BASE_URL=<your-render-identity-service-url>`
- `PAYMENT_SERVICE_BASE_URL=<your-render-payment-service-url>`
- `PROGRESS_SERVICE_BASE_URL=<your-render-progress-service-url>`
- `CONTENT_SERVICE_BASE_URL=<your-render-content-service-url>`
- `GAMIFICATION_SERVICE_BASE_URL=<your-render-gamification-service-url>`
- `AI_SERVICE_BASE_URL=<your-render-ai-service-url>`
- `FRONTEND_BASE_URL=https://uifive.io.vn`

Gateway sẽ route các nhóm endpoint tương ứng về đúng service riêng, không còn backend monolith trung gian.

---

## 10) Triển khai MLService (Render Web Service)

Kết nối thư mục `MLService/` với Render:

- **Environment**: Python
- **Root directory**: `MLService`
- **Build command**: `pip install -r requirements.txt && python train.py` (cần train model trước khi chạy server)
- **Start command**: `uvicorn app:app --host 0.0.0.0 --port $PORT` (hoặc lệnh chạy phù hợp với FastAPI)
- **Branch**: `main`

*(Lưu ý: Bạn cũng có thể tạo file `Dockerfile` riêng cho MLService nếu muốn Render chạy theo dạng Docker thay vì Python native).*

---

## 11) Triển khai Frontend (Render Static Site)

Kết nối thư mục `Frontend/` với Render:

- **Environment**: Static Site
- **Root directory**: `Frontend`
- **Build command**: `npm install && npm run build`
- **Publish directory**: `dist`
- **Branch**: `main`

**Biến môi trường cần thiết**:
- `VITE_API_BASE_URL=<your-render-gateway-url>/api`
- `VITE_BACKEND_BASE_URL=<your-render-gateway-url>`

---

## 12) Flow hoạt động

1. Developer thực hiện push code lên nhánh `main`.
2. **GitHub Actions** tự động chạy pipeline để test các service backend, Gateway, build Frontend và test MLService.
3. Nếu GitHub Actions thành công (Passed) và Render được cấu hình Auto-deploy, Render sẽ tự động kéo code mới nhất về.
4. Render tiến hành build và khởi động lại các dịch vụ tương ứng.
5. Ứng dụng Frontend cập nhật UI mới và giao tiếp trơn tru với Gateway, các service Java và MLService qua các URL đã cấu hình.
