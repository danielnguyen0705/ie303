# Hệ thống học tập trực tuyến UIFIVE

UIFIVE là một nền tảng học tập trực tuyến thông minh được thiết kế với kiến trúc Microservices, tích hợp Trí tuệ Nhân tạo (Generative AI) và Machine Learning để dự đoán năng lực học tập, tối ưu hóa quá trình học tập của học viên.

---

## 1. Các chức năng của hệ thống

- **Xác thực & Bảo mật (Authentication)**: Hỗ trợ đăng nhập truyền thống (JWT) và Google OAuth2.
- **Quản lý Học tập**: Hệ thống Unit, Section, Lesson và Question đa dạng.
- **Gamification**: Tích hợp hệ thống điểm kinh nghiệm (EXP), Coin, chuỗi ngày học (Streak), Leaderboard và Cửa hàng vật phẩm (Shop Items).
- **AI Tích hợp (Generative AI)**: Sử dụng các mô hình ngôn ngữ lớn (Gemini, Llama qua NVIDIA API, OpenAI, Anthropic) để hỗ trợ học viên.
- **Machine Learning Insights**: Phân tích dữ liệu học tập và dự đoán kỹ năng mạnh, yếu, cùng xu hướng học tập của học viên.
- **Thanh toán Trực tuyến**: Tích hợp cổng thanh toán VNPAY và VietQR cho các gói VIP/Premium.
- **Cloud Storage**: Quản lý hình ảnh và đa phương tiện bằng Cloudinary.
- **Thông báo & Lịch trình (Cron Jobs)**: Nhắc nhở chuỗi ngày học và gói VIP.
- **API Gateway**: Một cửa vào duy nhất cho frontend, route về từng service.

---

## 2. Kiến trúc hệ thống
Tài liệu sơ đồ microservice chi tiết đã được tách sang [MICROSERVICES.md](./MICROSERVICES.md).

Tóm tắt ngắn:

- `Frontend/` là client React/Vite.
- `GatewayService/` là API Gateway Spring Cloud cho hệ thống.
- `IdentityService/` là service riêng cho auth, đăng ký, đăng nhập, OAuth2.
- `PaymentService/` là service riêng cho payment/checkout/webhook.
- `GamificationService/` là service riêng cho shop items và leaderboards.
- `ContentService/` là service riêng cho grade/unit/section/lesson core, question bank và các loại review/test.
- `ProgressService/` là service riêng cho học tiến độ theo lesson/unit/section.
- `ProgressService/` cũng giữ phần `learning-analysis`, `user-question-histories` và `activity-calendar` cho kết quả ML của học viên.
- `AIService/` là service riêng cho chấm writing/speaking bằng LLM.
- `AIService/` cũng xử lý `personalized-questions`.
- `MLService/` là FastAPI service riêng cho dự đoán học tập.
- `NotificationService/` là Spring Boot service riêng cho scheduler và email notification.

---

## 3. Tech Stack

### Frontend

- **Framework**: React 18, TypeScript, Vite
- **Styling**: TailwindCSS, Emotion
- **UI Components**: Radix UI, Material UI, Lucide React (Icons)
- **State/Form**: React Hook Form
- **Animation/Charts**: Framer Motion, Recharts

### Backend

- **Framework**: Java 21, Spring Boot 3.4.0
- **Gateway/Service Call**: Spring Cloud Gateway, OpenFeign
- **Database/Cache**: PostgreSQL, Spring Data Redis
- **Security**: Spring Security, JWT, OAuth2 Client
- **Mapping & Utilities**: MapStruct, Lombok
- **Integrations**: JavaMailSender, Cloudinary, VNPAY

### Machine Learning

- **Framework**: Python 3, FastAPI, Uvicorn
- **Data & Model**: Pandas, Scikit-learn (RandomForestClassifier), Joblib
- **Dataset**: Dữ liệu học viên nội bộ (`student_skill_trend_dataset_2000.csv`)

---

## 4. Cấu trúc thư mục dự án

```txt
ie303/
├── GatewayService/   # API Gateway Spring Cloud cho frontend -> từng service
├── IdentityService/  # Service auth/login/register/OAuth2/JWT
├── GamificationService/ # Service shop items, inventory, leaderboards
├── ContentService/   # Service grade/unit/section/lesson core + question/review/test
├── ProgressService/  # Service progress/lesson completion + user question history + activity calendar
├── AIService/        # Service chấm writing/speaking + personalized questions
├── Frontend/         # Source code React + Vite (Giao diện người dùng)
│   ├── src/          # Components, Pages, Assets
│   ├── package.json  # Cấu hình dependencies Frontend
│   └── vite.config.ts# Cấu hình Vite
├── MLService/        # Source code Python (Machine Learning & FastAPI)
│   ├── app.py        # Khởi chạy server FastAPI
│   ├── train.py      # Script huấn luyện mô hình Random Forest
│   └── saved_models/ # Chứa các file mô hình (.pkl) sau khi train
├── NotificationService/ # Source code Spring Boot cho scheduler + email notification
├── PaymentService/    # Source code Spring Boot cho payment/checkout/webhook
│   ├── src/          # Controller, service, entity, repo riêng
│   └── pom.xml       # Cấu hình Maven cho payment service
└── DEPLOYMENT.md     # Hướng dẫn CI/CD và triển khai dự án
```

---

## 5. Cài đặt

### Yêu cầu hệ thống

- Node.js (v18+)
- Java 21 & Maven
- Python 3.9+
- PostgreSQL & Redis

### 5.1. Khởi chạy từng thành phần

**Frontend (Port 5173)**:

```bash
cd Frontend
npm install
npm run dev
```

**Payment Service (Port 8083)**:

```bash
cd PaymentService
mvn spring-boot:run
```

**Identity Service (Port 8084)**:

```bash
cd IdentityService
mvn spring-boot:run
```

**Gateway Service (Port 8081)**:

```bash
cd GatewayService
mvn spring-boot:run
```

**Notification Service (Port 8082)**:

```bash
cd NotificationService
mvn spring-boot:run
```

**Gamification Service (Port 8085)**:

```bash
cd GamificationService
mvn spring-boot:run
```

**Content Service (Port 8086)**:

```bash
cd ContentService
mvn spring-boot:run
```

**Progress Service (Port 8087)**:

```bash
cd ProgressService
mvn spring-boot:run
```

Progress service cũng phục vụ các endpoint `learning-analysis` cho dashboard học viên.

**AI Service (Port 8088)**:

```bash
cd AIService
mvn spring-boot:run
```

**Tích hợp Machine Learning (Port 8000)**:

```bash
cd MLService
# 1. Tạo môi trường ảo
python -m venv venv
# 2. Activate môi trường (Mac/Linux: source venv/bin/activate, Windows: .\venv\Scripts\activate)
source venv/bin/activate
# 3. Cài đặt dependencies
pip install -r requirements.txt
# 4. Huấn luyện mô hình (Tạo ra các file .pkl trong thư mục saved_models)
python train.py
# 5. Khởi động AI API Server
python app.py
```

---

## 6. Cấu hình biến môi trường

Mỗi service có bộ biến môi trường riêng, và các app Spring Boot trong repo đều có `dotenv` để nạp file `.env` nếu có.

Ít nhất bạn sẽ cần chuẩn bị:

- `Frontend/.env`
- `IdentityService/.env`
- `NotificationService/.env`
- `GamificationService/.env`
- `ContentService/.env`
- `ProgressService/.env`
- `AIService/.env`

Sau đó cập nhật lại các giá trị cấu hình phù hợp với môi trường chạy thực tế.

## 7. Chạy bằng Docker

Repo có sẵn bộ file để build/push image và chạy production qua Docker Compose:

- `scripts/publish-images.ps1` - build và push toàn bộ image lên Docker Hub hoặc registry riêng
- `docker-compose.prod.yml` - compose production dùng `image:` thay vì `build:`
- `.env.prod.example` - mẫu biến môi trường cho môi trường production

### 7.1. Publish image

1. Copy file mẫu:

```powershell
Copy-Item .env.prod.example .env.prod
```

2. Sửa `DOCKER_NAMESPACE`, `IMAGE_TAG` và toàn bộ secret trong `.env.prod`.

3. Build và push image:

```powershell
.\scripts\publish-images.ps1
```

### 7.2. Chạy production stack

```powershell
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d
```

### 7.3. Cho người khác kéo về chạy

Người khác chỉ cần:

```powershell
docker compose --env-file .env.prod -f docker-compose.prod.yml pull
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d
```

Lưu ý:

- `IdentityService` cần `GOOGLE_CLIENT_ID` và `GOOGLE_CLIENT_SECRET` không rỗng để khởi động OAuth2.
- `PostgreSQL` và `Redis` có thể dùng cloud service như Neon/Upstash.
- `RabbitMQ` trong file production hiện được dựng local bằng Docker để các service giao tiếp nội bộ.

## 8. API Gateway & API Documentation

- `GatewayService/` là entrypoint public cho frontend.
- `IdentityService/` xử lý auth, đăng ký, đăng nhập, OAuth2 và JWT.
- `PaymentService/` xử lý payment/checkout/webhook.
- `GamificationService/` xử lý shop items, inventory và leaderboards.
- `ContentService/` xử lý grade/unit/section/lesson core, question bank, unit review, group review và semester test.
- `ProgressService/` xử lý hoàn thành bài, progress theo unit/section/lesson.
- `ProgressService/` cũng lưu và trả về learning analysis của học viên.
- `ProgressService/` xử lý lịch sử làm câu hỏi (`user-question-histories`).
- `ProgressService/` xử lý luôn `activity-calendar` của học viên.
- `AIService/` xử lý chấm bài Writing/Speaking bằng LLM.
- `AIService/` xử lý chấm bài Writing/Speaking và personalized questions bằng LLM.
Hệ thống hiện không còn backend monolith; gateway route trực tiếp về các service ở trên.

## 9. API Documentation

Hệ thống cung cấp một loạt các RESTful endpoint. Bạn có thể truy cập Swagger UI qua từng service tương ứng. Một số endpoint chính:

- `POST /api/auth/*` - Đăng ký, đăng nhập, xác thực OAuth2.
- `GET /api/users/*` - Quản lý thông tin và profile người dùng.
- `GET/POST /api/ai/*` - Giao tiếp với LLMs (Gemini, Llama) để tạo nội dung học.
- `GET/POST /api/units/*`, `/api/lessons/*` - Truy xuất bài học, lý thuyết.
- `GET/POST /api/payments/*` - Tạo giao dịch VNPAY, webhook thanh toán.
- `GET /api/leaderboards/*` - Lấy bảng xếp hạng theo EXP/Coin.

---

## 10. Mô tả về Machine Learning

Module ML được viết bằng Python/FastAPI, chịu trách nhiệm nhận dữ liệu học viên (điểm, chuỗi ngày học, tần suất, độ chính xác các kỹ năng) và trả về phân tích.

- **Mô hình**: `RandomForestClassifier` (300 estimators, max depth 12).
- **Features chính**: `score`, `streak`, `accuracy_7d`, `accuracy_30d` (chia theo listening, speaking, reading, writing, vocabulary, grammar), v.v.
- **Targets (Dự đoán)**:
  - `strong_skill`: Kỹ năng người học tốt nhất.
  - `weak_skill`: Kỹ năng người học cần cải thiện.
  - `trend_label`: Xu hướng học tập (Đang tiến bộ, đi lùi, v.v.).
- **Endpoint**: `POST /predict` (Nhận JSON và trả về 3 dự đoán).

---

## 11. Deployment

Dự án được triển khai hoàn chỉnh trên **Render** và sử dụng domain riêng:

- **Hosting Platform**: Render.
- **Gateway**: Render Web Service cho Spring Cloud Gateway.
- **Frontend**: Render Static Site.
- **Backend**: Render Web Service cho Java Spring Boot.
- **ML Service**: Render Web Service .
- **Database**: PostgreSQL trên Neon.
- **Domain**: [https://uifive.io.vn/](https://uifive.io.vn/)

---

## 12. Các thành viên của nhóm

Phát triển bởi:

| STT | Họ và tên        | Vai trò            | GitHub                                        |
| --- | ---------------- | ------------------ | --------------------------------------------- |
| 1   | Nguyễn Quốc Đạt  | Nhóm trưởng, AI/ML Engineer  | [GitHub](https://github.com/danielnguyen0705) |
| 2   | Nguyễn Cao Cường | AI/ML Engineer     | [GitHub](https://github.com/nguyencuong335)   |
| 3   | Huỳnh Tuấn Phi   | Backend Developer  | [GitHub](https://github.com/bincasau)         |
| 4   | Nguyễn Lý Anh Vũ | Frontend Developer | [GitHub](https://github.com/NguyenVu3105)     |
| 5   | Võ Thành Nhân    | Frontend Developer | [GitHub](https://github.com/NhanVT24)         |


---

## 13. Giấy phép sử dụng

Dự án được phân phối dưới giấy phép **MIT License**. Bạn có quyền tự do sử dụng, chỉnh sửa và phân phối mã nguồn này cho mục đích học tập và thương mại.
