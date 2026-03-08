# การติดตั้ง รันโปรแกรม และเตรียมฐานข้อมูล MediQueue

เอกสารนี้อธิบายขั้นตอนการติดตั้งโปรเจกต์ลงเครื่อง การเตรียมฐานข้อมูล MongoDB และการรัน Backend กับ Frontend แบบละเอียด

---

## 1. สิ่งที่ต้องเตรียมไว้บนเครื่อง (Prerequisites)

### 1.1 โปรแกรมที่ต้องติดตั้ง

| โปรแกรม | เวอร์ชันที่แนะนำ | ใช้ทำอะไร |
|---------|-------------------|-----------|
| **Node.js** | 18.x ขึ้นไป (แนะนำ LTS) | รัน Backend และ Frontend, ติดตั้ง package |
| **npm** | มากับ Node.js | ติดตั้ง dependencies |
| **MongoDB** | 6.x ขึ้นไป | ฐานข้อมูล (ใช้ MongoDB Community หรือ Atlas ก็ได้) |
| **Git** | ตามที่ใช้อยู่ | โคลนโปรเจกต์ (ถ้าใช้) |

### 1.2 ตรวจสอบว่าติดตั้งแล้ว

เปิด Terminal (หรือ Command Prompt) แล้วรัน:

```bash
node -v    # ควรได้ v18.x.x ขึ้นไป
npm -v     # ควรได้ 9.x ขึ้นไป
mongosh --version   # ถ้าใช้ MongoDB แบบติดตั้งบนเครื่อง (หรือ mongo --version ในเวอร์ชันเก่า)
```

ถ้าไม่มี Node.js: ดาวน์โหลดจาก [nodejs.org](https://nodejs.org/) (เลือก LTS)  
ถ้าไม่มี MongoDB: ติดตั้งจาก [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community) หรือใช้ [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (ฐานข้อมูลบนคลาวด์)

---

## 2. โคลนหรือคัดลอกโปรเจกต์

### 2.1 ถ้าใช้ Git

```bash
git clone <URL ของ repository MediQueue>
cd Mediqueue
```

### 2.2 ถ้ามีโฟลเดอร์โปรเจกต์อยู่แล้ว

เปิด Terminal แล้วไปที่โฟลเดอร์โปรเจกต์:

```bash
cd /path/to/Mediqueue
```

---

## 3. การเตรียมฐานข้อมูล (MongoDB)

### 3.1 กรณีใช้ MongoDB ติดตั้งบนเครื่อง (Local)

1. **เปิด MongoDB Service**
   - **Windows:** ใช้ Services หรือรัน `mongod` จาก Command Prompt
   - **macOS (Homebrew):** `brew services start mongodb-community`
   - **Linux:** `sudo systemctl start mongod` (หรือตามคู่มือ distro)

2. **เช็คว่า MongoDB รันอยู่**
   ```bash
   mongosh
   # หรือ: mongo
   ```
   ถ้าเข้า shell ได้ แสดงว่า MongoDB พร้อมใช้

3. **Connection String ที่ใช้**
   - ค่าเริ่มต้น (ไม่มี user/pass): `mongodb://localhost:27017`
   - ฐานข้อมูลจะถูกสร้างเมื่อแอปเชื่อมต่อครั้งแรก (เช่น `mediqueue` หรือตามที่ตั้งใน `.env`)

### 3.2 กรณีใช้ MongoDB Atlas (Cloud)

1. สร้างบัญชีและ Cluster ที่ [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. สร้าง Database User (username + password)
3. เปิดเครือข่าย: Network Access → Add IP Address (หรือ 0.0.0.0/0 สำหรับทดสอบ)
4. คัดลอก Connection String (รูปแบบ `mongodb+srv://<user>:<password>@clusterxxx.mongodb.net/...`)
5. ใช้ Connection String นี้เป็นค่า `MONGODB_URI` ในไฟล์ `.env` ของ Backend (ดูหัวข้อ 4)

### 3.3 สร้างข้อมูลเริ่มต้น (Seed)

หลัง Backend รันได้และเชื่อมต่อ MongoDB แล้ว ให้รันคำสั่ง seed เพื่อสร้าง:

- แผนก (Departments)
- หมอ (Doctors) และลิงก์ User หมอ
- ผู้ใช้: แอดมิน, หมอ, ผู้ป่วย (Patients)
- การจองตัวอย่าง 4 วัน (เมื่อวาน, วันนี้, พรุ่งนี้, มะรืนนี้)
- การแจ้งเตือนและ Check-In ตัวอย่าง

**วิธีรัน Seed:**

```bash
cd backend
npm run seed
```

หรือ:

```bash
cd backend
node seed.js
```

ควรเห็นข้อความใน Terminal แจ้งว่าสร้าง collections และข้อมูลแล้ว

**บัญชีทดสอบหลัง Seed (รหัสผ่านตามใน seed):**

| บทบาท | อีเมล | รหัสผ่าน |
|--------|--------|----------|
| แอดมิน | admin@mediqueue.com | password123 |
| หมอ | doctor@mediqueue.com | password123 |
| ผู้ป่วย | somchai.p@email.com (และอื่นๆ ตาม seed) | password123 |

---

## 4. การตั้งค่า Environment (ตัวแปรสภาพแวดล้อม)

### 4.1 Backend

1. ในโฟลเดอร์ `backend/` สร้างไฟล์ชื่อ `.env` (ถ้ายังไม่มี)

2. ใส่เนื้อหาตามนี้ (แก้ค่าให้ตรงกับเครื่อง/ฐานข้อมูลของคุณ):

```env
# พอร์ตที่ Backend จะรัน (ไม่บังคับ ค่าเริ่มต้น 3001)
PORT=3001

# Connection string ของ MongoDB
# Local:
MONGODB_URI=mongodb://localhost:27017/mediqueue

# หรือ MongoDB Atlas (แทน <password> และ <dbname> ด้วยค่าจริง):
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/<dbname>?retryWrites=true&w=majority

# รหัสลับสำหรับสร้าง JWT (ควรเปลี่ยนใน production)
JWT_SECRET=your-super-secret-key-change-in-production
```

3. บันทึกไฟล์ — Backend จะอ่านค่าเหล่านี้ผ่าน `dotenv`

### 4.2 Frontend

1. ในโฟลเดอร์ `frontend/` สร้างไฟล์ `.env` หรือ `.env.local` (ถ้ายังไม่มี)

2. ใส่ URL ของ Backend เพื่อให้ Frontend เรียก API ได้:

```env
# URL ของ Backend (ต้องตรงกับที่ Backend รัน)
VITE_API_URL=http://localhost:3001
```

- ถ้า Backend รันบนเครื่องเดียวกันใช้ `http://localhost:3001`
- ถ้ารันบนเครื่องอื่นหรือ deploy แยก ใช้ URL จริง เช่น `https://api.yourdomain.com`

3. บันทึกไฟล์ — Vite จะอ่านเฉพาะตัวแปรที่ขึ้นต้นด้วย `VITE_`

---

## 5. การติดตั้ง Dependencies

รันในโฟลเดอร์โปรเจกต์ (ทั้ง Backend และ Frontend):

### 5.1 Backend

```bash
cd backend
npm install
```

### 5.2 Frontend

```bash
cd frontend
npm install
```

ถ้ามี error เกี่ยวกับ peer dependencies (เช่น React) อาจต้องรัน `npm install` อีกครั้งหรือใช้ `npm install --legacy-peer-deps` ตามที่โปรเจกต์กำหนด

---

## 6. การรันโปรแกรม

ต้องรัน **สองส่วน**: Backend (API + Socket.io) และ Frontend (เว็บ)

### 6.1 รัน Backend

1. เปิด Terminal หนึ่งตัว
2. ไปที่โฟลเดอร์ backend และรัน:

```bash
cd backend
npm run dev
```

หรือ:

```bash
cd backend
node server.js
```

3. ควรเห็นข้อความประมาณ:
   - `Connected to MongoDB`
   - `Server running on port 3001`

4. ทดสอบว่า API ทำงาน: เปิดเบราว์เซอร์ไปที่ `http://localhost:3001` ควรเห็นข้อความแบบ "MediQueue Backend Running"

### 6.2 รัน Frontend

1. เปิด Terminal อีกหนึ่งตัว (ให้ Backend รันค้างไว้)
2. ไปที่โฟลเดอร์ frontend และรัน:

```bash
cd frontend
npm run dev
```

3. Vite จะแสดง URL สำหรับเปิดเว็บ เช่น `http://localhost:5173`

4. เปิดเบราว์เซอร์ไปที่ URL นั้น (เช่น `http://localhost:5173`) จะเห็นหน้า Sign In ของ MediQueue

### 6.3 ลำดับการรันที่แนะนำ

1. เปิด MongoDB (local หรือใช้ Atlas)
2. รัน Backend ก่อน (`cd backend && npm run dev`)
3. รัน Frontend (`cd frontend && npm run dev`)
4. เปิดเว็บที่ URL ของ Frontend แล้วทดสอบล็อกอินด้วยบัญชีจาก seed

---

## 7. การรัน Seed (สร้างข้อมูลเริ่มต้น) — อีกครั้ง

- Seed ควรรัน **หลัง** Backend สามารถเชื่อมต่อ MongoDB ได้แล้ว
- รันจากโฟลเดอร์ `backend/`:

```bash
cd backend
npm run seed
```

- โค้ด seed ปัจจุบันอาจล้างหรืออัปเดต collections บางส่วน (ดูใน `seed.js`) — ถ้าไม่ต้องการข้อมูลเดิมหาย ควรสำรองข้อมูลหรือใช้ฐานข้อมูลแยกสำหรับพัฒนา

---

## 8. การ Build Frontend สำหรับ Production (ถ้าต้องการ)

เมื่อจะ deploy frontend เป็น static files:

```bash
cd frontend
npm run build
```

ผลลัพธ์จะอยู่ที่ `frontend/dist/` — นำโฟลเดอร์นี้ไปวางบนเว็บเซิร์ฟเวอร์หรือ CDN และตั้งค่าให้ชี้ API ไปที่ Backend จริงผ่าน `VITE_API_URL` ตอน build

---

## 9. สรุป Checklist

- [ ] ติดตั้ง Node.js และ npm
- [ ] ติดตั้งและเปิด MongoDB (local หรือใช้ Atlas)
- [ ] โคลน/คัดลอกโปรเจกต์และเข้าโฟลเดอร์
- [ ] สร้าง `backend/.env` (PORT, MONGODB_URI, JWT_SECRET)
- [ ] สร้าง `frontend/.env` หรือ `frontend/.env.local` (VITE_API_URL)
- [ ] รัน `npm install` ใน `backend/` และ `frontend/`
- [ ] รัน Backend: `cd backend && npm run dev`
- [ ] รัน Seed: `cd backend && npm run seed`
- [ ] รัน Frontend: `cd frontend && npm run dev`
- [ ] เปิดเบราว์เซอร์ที่ URL ของ Frontend และทดสอบล็อกอิน (admin@mediqueue.com / password123 เป็นต้น)

---

## 10. แก้ปัญหาเบื้องต้น

| อาการ | แนวทางแก้ |
|--------|------------|
| Backend ขึ้น MongoDB connection error | ตรวจว่า MongoDB รันอยู่ และ MONGODB_URI ใน `.env` ถูกต้อง (รวมถึง user/pass ถ้าใช้ Atlas) |
| Frontend เรียก API ไม่ได้ / 404 | ตรวจว่า Backend รันอยู่ที่พอร์ตที่ตั้งไว้ และ VITE_API_URL ชี้ไปที่ URL นั้น |
| หน้าเว็บขาวหรือ error ตอนโหลด | เปิด DevTools (F12) ดู Console และ Network; ตรวจ CORS และว่า API URL ถูกต้อง |
| ล็อกอินไม่ได้ | ตรวจว่า seed รันแล้ว และใช้อีเมล/รหัสตามตารางบัญชีทดสอบ |
| JWT / 401 Unauthorized | ตรวจ JWT_SECRET ใน backend/.env ว่าเหมือนกันทุกครั้งที่รัน (ไม่เปลี่ยนกลางคันโดยไม่ restart server) |

ถ้ามี error อื่น ให้ดูข้อความใน Terminal ของ Backend และ Frontend เป็นหลัก แล้วเทียบกับขั้นตอนในเอกสารนี้และใน `01_PROJECT_OVERVIEW.md`, `02_USER_GUIDE_BY_ROLE.md`
