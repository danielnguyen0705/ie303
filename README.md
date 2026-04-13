# IE303 - UIFIVE

UIFIVE la mot nen tang hoc tieng Anh truc tuyen danh cho hoc sinh THPT, tap trung vao lo trinh hoc theo khoi lop, unit, section va lesson. Project hien duoc to chuc theo kieu monorepo voi frontend React, backend Spring Boot va mot thu muc `MLService` dang o muc thu nghiem.

## Tong quan kien truc

- `Frontend`: giao dien nguoi dung va admin, xay dung bang React + TypeScript + Vite.
- `Backend`: REST API, xac thuc JWT/OAuth2, truy cap PostgreSQL, email, Cloudinary va Gemini.
- `MLService`: hien tai chi moi co file thu nghiem `hello.py`.

## Tinh nang chinh

- Luong hoc theo cau truc `Grade -> Unit -> Section -> Lesson`.
- Dashboard hien thong tin hoc tap, XP, coins, streak va accuracy.
- Cac man bai tap: quiz, reading, listening, pronunciation.
- Khu vuc test/review: ket qua bai test, xem lai cau hoi, bai kiem tra on tap.
- Bang xep hang, quests, profile va shop vat pham.
- Trang admin duoc bao ve boi auth de quan ly user, noi dung, question bank, reports, VIP, shop, notifications va settings.
- Backend ho tro dang nhap/dang ky, xac minh email, leaderboard, tien do hoc tap, ngan hang cau hoi, shop item va cham bai writing bang AI.

## Cong nghe su dung

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

## Cau truc thu muc

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

## Cac route frontend noi bat

### User

- `/`: dashboard
- `/grades/:gradeId/units`: danh sach unit theo khoi lop
- `/units/:unitId/sections`: danh sach section cua unit
- `/sections/:sectionId/lessons`: danh sach lesson cua section
- `/lessons/:lessonId`: chay bai hoc
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

## API backend chinh

Mot so nhom API dang co trong project:

- `/api/auth`: login, register, verify email, logout
- `/api/users`: thong tin user va profile hien tai
- `/api/grades`, `/api/units`, `/api/sections`, `/api/lessons`
- `/api/progress`: tien do hoc theo grade/unit/section
- `/api/questions`, `/api/question-groups`, `/api/question-options`
- `/api/semester-tests`, `/api/group-reviews`, `/api/unit-reviews`
- `/api/leaderboards`
- `/api/shop-items`
- `/api/user-question-histories`
- `/api/ai/essay/submit`

## Yeu cau moi truong

Can cai dat truoc:

- Node.js 18+
- npm
- Java 21
- Maven Wrapper (da co san trong `Backend`)
- PostgreSQL

## Bien moi truong

### Frontend

Frontend doc bien sau:

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

Neu khong cung cap, frontend mac dinh goi den `http://localhost:8080/api`.

### Backend

Backend doc bien moi truong tu file `.env` thong qua `dotenv-java` hoac tu environment cua he thong.

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

## Cach chay project

### 1. Chay backend

Tu thu muc `Backend`:

```bash
./mvnw spring-boot:run
```

Tren Windows co the dung:

```bash
mvnw.cmd spring-boot:run
```

Backend mac dinh chay o `http://localhost:8080`.

### 2. Chay frontend

Tu thu muc `Frontend`:

```bash
npm install
npm run dev
```

Frontend mac dinh chay o `http://localhost:5173`.

### 3. Dang nhap va CORS

- Backend dang cho phep CORS cho `http://localhost:5173`.
- Co che auth hien tai su dung cookie `token` dang `HttpOnly`.
- Tat ca route ngoai `/api/auth/**` va OAuth2 deu yeu cau xac thuc.

## Build va test

### Frontend

```bash
npm run build
```

### Backend

```bash
./mvnw test
./mvnw package
```

Tren Windows:

```bash
mvnw.cmd test
mvnw.cmd package
```

## Ghi chu hien trang

- Thu muc `Frontend/src/api` dang co ca phan goi API that va mot so utility mo phong API.
- `MLService` chua duoc tich hop thanh mot service rieng.
- `spring.jpa.hibernate.ddl-auto=update` dang bat trong backend, phu hop moi truong phat trien hon la production.

## Huong phat trien tiep theo

- Hoan thien tai lieu API va file mau `.env.example` cho tung service.
- Dong bo cac luong frontend con dang dung mock/simulate voi backend that.
- Tach rieng `MLService` thanh service doc lap neu can xu ly AI/ML chuyen sau.
- Bo sung Docker/Docker Compose de khoi dong toan bo stack nhanh hon.
