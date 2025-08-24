# Grocademy - Platform E-Learning

Selamat datang di Grocademy, sebuah platform pembelajaran digital yang dirancang agar edukatif dan menyenangkan, cocok untuk semua Nimon di laboratorium Gro.

**Screenshot Aplikasi:**

*Halaman Browse Course*
![Browse Course Page](./assets/BrowseCourses.png)

*Halaman My Course*
![My Course Page](./assets/MyCourse.png)

*Halaman Modul*
![Module Page](./assets/CourseModules.png)
![Module Page](./assets/CompleteCourseModules.png)

*Course Detail*
![Module Page](./assets/CourseDetail.png)
![Module Page](./assets/CourseDetail2.png)

*Halaman Bookmark*
![Module Page](./assets/Bookmarks.png)

---

## Identitas Diri
* **Nama**: Ferdin Arsenarendra Purtadi
* **NIM**: 13523117

---

## Cara Menjalankan Aplikasi

Aplikasi ini telah di-"Dockerize" untuk kemudahan setup. Pastikan Anda memiliki **Docker** dan **Docker Compose** terinstall di sistem Anda.

1.  **Clone Repository**
    ```bash
    git clone [https://github.com/Ferdin-Arsenic/Grocademy-13523117.git](https://github.com/Ferdin-Arsenic/Grocademy-13523117.git)
    cd Grocademy-13523117
    ```

2.  **Buat File Environment Backend**
    Buat file `.env` di dalam folder `backend/`.
    ```bash
    cd backend
    echo "DATABASE_URL=\"postgresql://user:password@db:5432/grocademydb?schema=public\"" > .env
    echo "JWT_SECRET=\"SECRET_KEY_YANG_SANGAT_RAHASIA\"" >> .env
    cd ..
    ```

3.  **Jalankan dengan Docker Compose**
    Dari direktori utama proyek, jalankan perintah berikut. Perintah ini akan membangun *image*, menjalankan migrasi & *seeding* database, dan menyalakan semua layanan secara otomatis.
    ```bash
    docker compose up --build
    ```

4.  **Akses Aplikasi**
    * **Frontend Pengguna**: Buka browser dan akses `http://localhost:8080`.
    * **Backend API**: Server berjalan di `http://localhost:3000/api`.

---

## Technology Stack

### Backend
* **Framework**: NestJS 11
* **Bahasa**: TypeScript 5.7
* **Database**: PostgreSQL 13
* **ORM**: Prisma 6.13
* **Otentikasi**: JWT (JSON Web Tokens)
* **File Upload**: Multer
* **PDF Generation**: PDFKit

### Frontend
* **Bahasa**: Vanilla HTML, CSS, JavaScript (ES6+)
* **Server Development**: live-server
* **Styling**: CSS Variables & Flexbox/Grid

### Environment
* **Containerization**: Docker & Docker Compose

---

## Design Pattern yang Digunakan

Proyek ini mengimplementasikan beberapa design pattern untuk memastikan kode yang bersih, terstruktur, dan mudah dikelola:

1.  **Singleton Pattern**: `PrismaService` diimplementasikan sebagai *singleton* oleh NestJS. Ini memastikan bahwa hanya ada satu koneksi ke database di seluruh aplikasi, yang meningkatkan efisiensi dan mencegah kebocoran koneksi.
2.  **Repository Pattern (via Prisma)**: Prisma Client bertindak sebagai lapisan abstraksi (Repository) antara logika bisnis (*service*) dan database. Ini memisahkan cara data diakses dari logika aplikasi, sehingga jika suatu saat database diganti, perubahan pada *service* akan minimal.
3.  **Decorator Pattern**: Digunakan secara ekstensif oleh NestJS untuk fungsionalitas seperti *routing* (`@Controller`, `@Get`, `@Post`), validasi (`@Body`), dan keamanan (`@UseGuards`, `@Roles`). Ini memungkinkan kita untuk menambahkan fungsionalitas ke kelas atau metode secara deklaratif tanpa mengubah logika intinya.

---

## Endpoint API yang Dibuat

Semua *endpoint* berada di bawah prefix global `/api`.

### Auth
* `POST /auth/register`: Mendaftarkan pengguna baru.
* `POST /auth/login`: Login pengguna dan mendapatkan JWT.
* `GET /auth/self`: Mendapatkan detail pengguna yang sedang login.

### Courses
* `GET /courses`: Menampilkan semua kursus (publik, dengan search, sort, & pagination).
* `GET /courses/:id`: Menampilkan detail satu kursus.
* `POST /courses`: Membuat kursus baru (Admin).
* `PUT /courses/:id`: Memperbarui kursus (Admin).
* `DELETE /courses/:id`: Menghapus kursus (Admin, soft delete).
* `POST /courses/:id/buy`: Membeli kursus (User).
* `GET /courses/user/my-courses`: Menampilkan semua kursus yang sudah dibeli (User).
* `GET /courses/:id/modules`: Menampilkan semua modul dari kursus yang sudah dibeli (User).

### Modules
* `POST /modules`: Membuat modul baru (Admin).
* `PATCH /modules/reorder`: Mengubah urutan modul (Admin).
* `PATCH /modules/:id/complete`: Menandai modul sebagai selesai (User).

### Users
* `GET /users`: Menampilkan semua pengguna (Admin).
* `POST /users/:id/balance`: Menambah saldo ke pengguna (Admin).

### Bookmarks
* `GET /bookmarks`: Menampilkan kursus yang di-*bookmark* (User).
* `POST /bookmarks/:courseId`: Menambah/menghapus *bookmark* (User).

### Certificate
* `GET /certificate/:courseId`: Mengunduh sertifikat dalam format PDF (User).

---

## Bonus yang Dikerjakan

1.  **B03 - Polling**: Halaman *Browse Course* akan otomatis memeriksa kursus baru setiap 5 detik dan menampilkannya tanpa perlu *refresh*.
2.  **B04 - Caching**: *Endpoint* `GET /courses` menggunakan Redis untuk *caching* guna mempercepat waktu respons pada permintaan berulang. Invalidasi *cache* terjadi secara otomatis saat ada perubahan data kursus.
3.  **B10 - Fitur Tambahan (Bookmark)**: Pengguna bisa menyimpan kursus yang mereka minati dengan fitur *bookmark*.