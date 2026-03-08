# คู่มือการทดสอบระบบ MediQueue

เอกสารนี้อธิบายวิธีเตรียมระบบและขั้นตอนทดสอบการใช้งานจริงของ MediQueue หลังพัฒนาเสร็จ

---

## Quick test (ทดสอบแบบเร็ว 2 นาที)

1. รัน `cd backend && npm run seed && npm run dev` (เทอร์มินัลที่ 1)
2. รัน `cd frontend && npm run dev` (เทอร์มินัลที่ 2)
3. เปิดเบราว์เซอร์ไปที่ URL ของ frontend (เช่น http://localhost:5173)
4. ล็อกอิน **admin@mediqueue.com** / **password123**
5. ตรวจว่าเข้า Admin ได้ → ไปที่ **Check-ins** → แท็บ **Not Checked-In** ควรมีรายการ (หลัง seed วันนี้มี 15 รายการ, แสดง 10 ต่อหน้า)
6. ไปที่ **Completed** → ควรเห็นการ์ดและตาราง completed
7. ไปที่ **Queue** → กด **Call** หรือ **Edit Status** กับหนึ่งรายการ แล้วตรวจว่าสถานะเปลี่ยน

ถ้าขั้นตอนด้านบนผ่าน แสดงว่า Backend + Frontend + Auth + ข้อมูล seed และหน้าหลัก Admin ทำงานได้จริง จากนั้นทดสอบละเอียดตามหัวข้อ 4 ด้านล่าง

---

## 1. สิ่งที่ต้องเตรียมก่อนทดสอบ

### 1.1 Backend
- **Node.js** (v18 ขึ้นไป)
- **MongoDB** – ใช้ Atlas หรือ MongoDB local
- ไฟล์ **`backend/.env`** ต้องมีอย่างน้อย:
  ```env
  MONGODB_URI=mongodb+srv://... หรือ mongodb://localhost:27017/mediqueue
  PORT=3001
  JWT_SECRET=your-secret-key
  ```

### 1.2 Frontend
- **Node.js** (v18 ขึ้นไป)
- ไฟล์ **`frontend/.env.local`** (ถ้าต้องการเปลี่ยน URL ของ API):
  ```env
  VITE_API_URL=http://localhost:3001
  ```
  ถ้าไม่ตั้งค่า Frontend จะใช้ `http://localhost:3001` เป็นค่าเริ่มต้น

---

## 2. การติดตั้งและรันระบบ

### 2.1 ติดตั้งและรัน Backend
```bash
cd backend
npm install
npm run seed          # สร้างข้อมูลตัวอย่าง (ผู้ใช้, หมอ, การจอง, check-in) – รันครั้งแรกหรือเมื่อต้องการ reset ข้อมูล
npm run dev           # หรือ npm start – รันเซิร์ฟเวอร์ที่พอร์ต 3001
```
- หลัง seed สำเร็จ จะมี log แสดงวันที่วันนี้ และจำนวน Not Checked-In
- ตรวจว่าไม่มี error จาก MongoDB

### 2.2 ติดตั้งและรัน Frontend
```bash
cd frontend
npm install
npm run dev
```
- เปิดเบราว์เซอร์ที่ URL ที่ Vite แสดง (เช่น `http://localhost:5173`)

---

## 3. บัญชีทดสอบ (จาก seed)

| บทบาท   | อีเมล                  | รหัสผ่าน    |
|----------|------------------------|-------------|
| Admin    | admin@mediqueue.com    | password123 |
| หมอ      | doctor@mediqueue.com   | password123 |
| ผู้ป่วย  | somchai.p@email.com    | password123 |

(ผู้ป่วยอื่นใน seed ใช้รหัสผ่านเดียวกัน: password123)

---

## 4. ขั้นตอนการทดสอบตามบทบาท

### 4.1 ทดสอบ Login และเส้นทางหลัก
1. เปิด `/` หรือ `/signin`
2. ล็อกอินด้วย **admin@mediqueue.com** / **password123**
3. ตรวจว่าไปที่ **Admin** (`/admin` หรือ `/admin/dashboard`)
4. ออกจากระบบ (Logout) แล้วล็อกอินด้วย **doctor@mediqueue.com** / **password123**
5. ตรวจว่าไปที่ **Doctor** (`/doctor`)
6. Logout แล้วล็อกอินด้วย **somchai.p@email.com** / **password123**
7. ตรวจว่าไปที่ **Patient Dashboard** หรือ flow จองคิว (ขึ้นกับ logic ในแอป)

---

### 4.2 ทดสอบฝั่ง Admin

ล็อกอินเป็น **admin@mediqueue.com**

- **Dashboard**
  - เลือกวันที่ (วันนี้ควรมีข้อมูลจาก seed)
  - ตรวจว่าเห็นการ์ดสรุปและรายการคิวแยก Morning / Afternoon
  - เปลี่ยน Department / Doctor filter แล้วดูว่าข้อมูลเปลี่ยนตาม

- **Queue (Queue Management)**
  - ตรวจว่ามีรายการคิวตามวันที่และ filter
  - กด **Call** / **Skip** / **Complete** / **Cancel** กับหนึ่งรายการ แล้วดูว่าสถานะอัปเดต (และถ้ามี realtime ก็เห็นการเปลี่ยนแปลง)
  - กด **Edit Status** แล้วเปลี่ยนสถานะ (เช่น เป็น completed) แล้วบันทึก – ตรวจว่าสถานะในตารางเปลี่ยน

- **Waiting List**
  - ตรวจว่ารายการที่สถานะ waiting/confirmed แสดงถูกต้อง
  - (ถ้ามี) ตรวจว่า “Time left” หรือการ auto-cancel ทำงานตามที่ออกแบบ

- **Bookings**
  - ตรวจว่ามีรายการจอง ฟิลเตอร์ Date/Status/Department/Doctor ทำงาน
  - กด **View** (ไอคอนตา) ไปหน้ารายละเอียดการจอง
  - กด **Edit** แล้วเปลี่ยนสถานะ แล้ว Save – ตรวจว่าข้อมูลอัปเดต
  - กด **Delete** (ยกเลิกการจอง) กับหนึ่งรายการ – ตรวจว่ารายการหายหรือสถานะเปลี่ยน

- **Check-ins**
  - แท็บ **Checked-In**: ตรวจว่ามีรายการที่ check-in แล้ว และแสดง method (QR/Manual), เวลา
  - แท็บ **Not Checked-In**: ตรวจว่ามีรายการ (จาก seed วันนี้มี 15 รายการ), แสดง 10 รายการต่อหน้า และมี pagination (หน้า 2 มี 5 รายการ)
  - กด **Check In** กับหนึ่งรายการ – ตรวจว่ารายการย้ายไปแท็บ Checked-In และจำนวนอัปเดต
  - ตรวจการ์ดสถิติ: Check-In Rate, QR Check-Ins, Pending Check-ins

- **Completed**
  - ตรวจว่ามีการ์ด Total Completed, Morning Session, Afternoon Session
  - ใช้ Search และ filter All Sessions / All Departments
  - ตรวจตาราง Completed Appointments และปุ่ม **View Details** (ไอคอนตา)

- **Settings**
  - เปิดหน้า Settings ตรวจว่าโหลดได้ไม่มี error

---

### 4.3 ทดสอบฝั่ง Doctor

ล็อกอินเป็น **doctor@mediqueue.com**

- เปิด **Doctor Dashboard** (`/doctor`)
- ตรวจว่าเห็นชื่อหมอ วันที่ และการ์ด (Doctor Name, Patients in Queue, Next Patient)
- เลือกวันที่ (วันนี้) – ตรวจว่ามีรายการคิวแยก Morning / Afternoon ตามที่ออกแบบ
- (ถ้ามีปุ่ม Call Next / Complete ฯลฯ) ทดสอบกดแล้วดูว่าสถานะหรือรายการอัปเดต

---

### 4.4 ทดสอบฝั่งผู้ป่วย (จองคิว)

ล็อกอินเป็น **somchai.p@email.com** (หรือผู้ป่วยอื่นจาก seed)

- **จองคิว** (`/app` หรือ flow select-date → select-doctor → booking → slip)
  - เลือกวันที่ → เลือกแผนก → เลือกหมอ → กดจอง
  - ตรวจว่าสร้างการจองได้และได้ใบ slip (queue number, วันที่, เวลาโดยประมาณ)

- **Patient Dashboard** (`/dashboard`)
  - ตรวจว่าเห็นการจองที่สร้างและสถานะ (เช่น waiting, confirmed)

- **Check-in** (`/check-in`)
  - ถ้ามี flow ใส่ queue number หรือ scan QR – ทดสอบใส่รหัสการจองที่ได้จาก slip แล้วกด check-in
  - ตรวจว่าสถานะเปลี่ยนเป็น checked-in (และฝั่ง Admin แท็บ Check-ins เห็นรายการนี้)

---

### 4.5 ทดสอบ Notifications (ถ้ามีใช้)

- ล็อกอินเป็นผู้ป่วยหรือ admin ตามที่ระบบออกแบบ
- เปิด **Notifications** (`/notifications`)
- ตรวจว่ารายการแจ้งเตือนโหลดได้ และปุ่ม Mark as read / ลบ ทำงาน (ถ้ามี)

---

## 5. สรุปจุดที่ต้องผ่านในแต่ละส่วน

| ส่วน            | สิ่งที่ตรวจแล้วถือว่าทำงานได้จริง |
|-----------------|-----------------------------------|
| Auth            | ล็อกอิน Admin/Doctor/Patient ได้, Token ใช้เรียก API ได้, Logout ได้ |
| Admin Dashboard | โหลดคิวตามวันที่และ filter ได้, ตัวเลขสรุปตรงกับข้อมูล |
| Queue Management| Call / Skip / Complete / Cancel / Edit Status ทำงานและอัปเดตใน DB |
| Waiting List    | แสดงรายการและสถานะตรงกับข้อมูล (และ logic เวลา ถ้ามี) |
| Bookings        | ดู/แก้/ลบการจองได้ และสถานะอัปเดต |
| Check-ins       | แท็บ Checked-In / Not Checked-In แสดงถูก, Manual Check In ได้, สถิติและ pagination ถูก |
| Completed       | การ์ดและตารางแสดงรายการ completed ถูก, View Details ไปหน้ารายละเอียดได้ |
| Doctor          | โหลดคิวตามหมอและวันที่ได้, การ์ดและรายการแสดงถูก |
| Patient booking | จองคิวได้ ได้ slip, แดชบอร์ดแสดงการจอง |
| Check-in (ผู้ป่วย)| Check-in ด้วยรหัส/QR ได้ และสถานะอัปเดตทั้งฝั่งผู้ป่วยและ Admin |

---

## 6. ปัญหาที่พบบ่อย

- **Server returned HTML instead of JSON**  
  - ตรวจว่า Backend รันที่พอร์ต 3001 และ `VITE_API_URL` ชี้ไปที่ `http://localhost:3001`
- **MongoDB connection error**  
  - ตรวจ `MONGODB_URI` ใน `backend/.env` และว่าเครือข่ายถึง MongoDB (เช่น Atlas เปิด IP ใน whitelist)
- **ไม่มีข้อมูลในหน้า Admin / Check-ins / Completed**  
  - รัน `npm run seed` ในโฟลเดอร์ `backend` อีกครั้ง และเลือก “วันนี้” ใน filter วันที่
- **Login ไม่ผ่าน**  
  - ตรวจว่า seed รันแล้วและใช้ email/password ตามตารางในหัวข้อ 3

---

## 7. สรุป

ถ้าทดสอบตามขั้นตอนด้านบนครบและผ่านทุกจุดในหัวข้อ 5 ถือว่า **ทุกระบบทำงานได้จริง** ตามขอบเขตที่พัฒนไว้  
แนะนำให้รัน seed ใหม่ก่อนทดสอบทุกครั้งถ้าต้องการข้อมูลวันนี้ให้ตรงกับที่ออกแบบ (เช่น Not Checked-In 15 รายการ, Completed ฯลฯ)
