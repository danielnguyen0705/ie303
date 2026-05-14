# Deployment & CI/CD Setup

Dự án được triển khai toàn bộ trên nền tảng **Render** và sử dụng **GitHub Actions** cho CI/CD.

## Tổng quan kiến trúc triển khai

- **GitHub Actions**: Chạy tự động kiểm tra lỗi (CI) khi có push hoặc pull request.
- **Render PostgreSQL**: Dịch vụ cơ sở dữ liệu.
- **Render Web Service (Java/Spring Boot)**: Backend API.
- **Render Web Service (Python/FastAPI)**: Machine Learning Service.
- **Render Static Site (React/Vite)**: Frontend Web.
- **Domain**: `https://uifive.io.vn/`

---

## 1) GitHub Actions CI

Workflow được định nghĩa tại: `.github/workflows/ci.yml`

Hệ thống tự động chạy trên các nhánh `main` và `dev` để đảm bảo code ổn định trước khi deploy:
- Chạy unit test cho Backend (`mvn test`).
- Build thử nghiệm cho Frontend (`npm run build`).
- Cài đặt và chạy script huấn luyện mô hình ML (`python train.py`), kiểm tra sự tồn tại của các file `.pkl`.

---

## 2) Khởi tạo Database (Render PostgreSQL)

1. Tạo một PostgreSQL instance trên dashboard của Render.
2. Lấy thông tin cấu hình: **Internal Database URL** (khuyến nghị cho Backend dùng chung trên Render) hoặc **External Database URL**.
3. Các thông tin cần thiết để truyền vào biến môi trường Backend: `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`.

---

## 3) Triển khai Backend (Render Web Service)

Kết nối thư mục `Backend/` với Render:

- **Environment**: Docker (Render sẽ tự động dùng `Dockerfile` có trong thư mục)
- **Root directory**: `Backend`
- **Branch**: `main`
- Bật `Auto-Deploy` (có thể kết hợp Wait for CI).

**Biến môi trường cần thiết (Environment Variables)**:
- `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` (từ bước 2)
- `JWT_SECRET`, `JWT_EXPIRATION`
- `MAIL_USERNAME`, `MAIL_PASSWORD` (SMTP)
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- Các biến API Key cho AI: `GEMINI_API_KEY`, `NVIDIA_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`
- Tích hợp Cloudinary: `CLOUD_NAME`, `API_KEY`, `API_SECRET`
- Tích hợp VNPAY: `PAYMENT_VNPAY_TMN_CODE`, `PAYMENT_VNPAY_SECRET`, `PAYMENT_VNPAY_PAY_URL`, v.v.
- Giao tiếp nội bộ:
  - `FRONTEND_BASE_URL=https://uifive.io.vn`
  - `CORS_ALLOWED_ORIGINS=https://uifive.io.vn`
  - `BACKEND_PUBLIC_BASE_URL=<your-render-backend-url>`
  - `ML_API_URL=<your-render-ml-service-url>/predict`

---

## 4) Triển khai MLService (Render Web Service)

Kết nối thư mục `MLService/` với Render:

- **Environment**: Python
- **Root directory**: `MLService`
- **Build command**: `pip install -r requirements.txt && python train.py` (cần train model trước khi chạy server)
- **Start command**: `uvicorn app:app --host 0.0.0.0 --port $PORT` (hoặc lệnh chạy phù hợp với FastAPI)
- **Branch**: `main`

*(Lưu ý: Bạn cũng có thể tạo file `Dockerfile` riêng cho MLService nếu muốn Render chạy theo dạng Docker thay vì Python native).*

---

## 5) Triển khai Frontend (Render Static Site)

Kết nối thư mục `Frontend/` với Render:

- **Environment**: Static Site
- **Root directory**: `Frontend`
- **Build command**: `npm install && npm run build`
- **Publish directory**: `dist`
- **Branch**: `main`

**Biến môi trường cần thiết**:
- `VITE_API_BASE_URL=<your-render-backend-url>/api`
- `VITE_BACKEND_BASE_URL=<your-render-backend-url>`

---

## 6) Flow hoạt động

1. Developer thực hiện push code lên nhánh `main`.
2. **GitHub Actions** tự động chạy pipeline để test Backend, build Frontend và test MLService.
3. Nếu GitHub Actions thành công (Passed) và Render được cấu hình Auto-deploy, Render sẽ tự động kéo code mới nhất về.
4. Render tiến hành build và khởi động lại các dịch vụ tương ứng.
5. Ứng dụng Frontend cập nhật UI mới và giao tiếp trơn tru với Backend và MLService qua các URL đã cấu hình.
