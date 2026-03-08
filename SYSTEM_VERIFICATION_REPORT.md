# รายงานการตรวจสอบระบบ MediQueue

**วันที่ตรวจสอบ:** 7 มี.ค. 2569  
**ขอบเขต:** Backend API, Frontend ทุกหน้า, แหล่งข้อมูล (DB vs mock), ความถูกต้องตามความต้องการ

---

## 1. สรุปผลการตรวจสอบ

| หัวข้อ | สถานะ | หมายเหตุ |
|--------|--------|----------|
| **ทุกฟังก์ชันทำงาน** | ✅ ส่วนใหญ่ | ฟังก์ชันหลักทำงานได้ มีบางจุดเป็น mock/simulation (ระบุด้านล่าง) |
| **ข้อมูลจากฐานข้อมูล** | ✅ ส่วนใหญ่ | Backend ทุก endpoint อ่าน/เขียน MongoDB จริง ไม่มี mock response |
| **ตรงตามความต้องการ** | ⚠️ เกือบครบ | ตาม DELIVERABLES/SCREEN_MAP ครบ แต่มีช่องโหว่ด้านความปลอดภัยและบางฟีเจอร์ยังไม่เชื่อม backend |

---

## 2. ฟังก์ชันที่ทำงานได้ (เชื่อม API จริง)

### ผู้ใช้ทั่วไป (Patient)
- **ลงทะเบียน / เข้าสู่ระบบ** – POST `/auth/signup`, `/auth/signin` → MongoDB (User), JWT
- **เลือกวันที่-แผนก-หมอ-สร้างจอง** – GET departments, doctors; POST `/bookings` → สร้างคิวและหมายเลขคิวจริง
- **ดูใบจอง / ยกเลิกจอง** – ข้อมูลจาก context/API; ยกเลิกผ่าน PATCH `/bookings/:id/cancel`
- **แดชบอร์ดผู้ป่วย** – `getMyBookings(patientId)` จาก API → แสดงรายการจองจริง
- **เช็คอิน** – กดยืนยันเช็คอินเรียก POST `/checkin` → สร้าง CheckIn + อัปเดตสถานะจอง + สร้าง Notification
- **การแจ้งเตือน** – GET/PATCH notifications → อ่าน/ปิดอ่านจาก DB
- **ตั้งค่าโปรไฟล์ / เปลี่ยนรหัสผ่าน** – PATCH profile, POST change-password → MongoDB

### แอดมิน (Admin)
- **แดชบอร์ด** – `getQueues({ date })` → สถิติและรายการคิวจริง, เทรนด์เทียบวันก่อนจาก API
- **จัดการคิว (เรียก/ข้าม/จบ)** – call/skip/complete + อัปเดตสถานะ → API จริง
- **รายการรอ / การจอง / รายละเอียดจอง** – ข้อมูลจาก `getQueues` / `getQueueById`; แก้ไขสถานะ, แก้หมอ/วันที่, ยกเลิกจอง → API จริง
- **Check-Ins** – รายการจาก `getCheckInsForDate`, ปุ่มเช็คอินมือ → `adminCheckIn` API
- **Completed** – ใช้ `filteredQueues` จาก AdminDashboard (ข้อมูลคิวจริง)
- **ตั้งค่า: แผนก + หมอ** – CRUD departments, doctors → API จริง

### หมอ (Doctor)
- **หน้า Doctor** – `getQueues({ doctor, date })`, `getDoctorsByUserId` → แสดงคนไข้และสถานะจาก DB
- **เรียกคนไข้ / จบการตรวจ** – `updatePatientStatus(..., 'in-progress' | 'completed')` → API จริง

---

## 3. ข้อมูลที่แสดงมาจากฐานข้อมูล

- **Backend:** ทุก resource (auth, user, booking, checkin, queue, doctor, department, notification) ใช้ Mongoose + MongoDB เท่านั้น ไม่มี endpoint ที่ส่งข้อมูล mock/fake กลับมา
- **Frontend:** หน้าหลักดึงข้อมูลจาก API ข้างต้น → แสดงข้อมูลจาก DB จริง

**ข้อยกเว้น (ไม่ใช่จาก DB หรือคำนวณฝั่ง client):**
- **BookingSlip:** ข้อความ "กำลังรับบริการหมายเลข X" และเวลาโดยประมาณ (ETA) คำนวณ/จำลองฝั่ง frontend (อัปเดตทุก 10 วินาที)
- **PatientDashboard:** ค่า `estimatedWaitTime` ถูกเซ็ตเป็น 0 ใน mapping (ยังไม่ดึงจาก API/DB)
- **CheckInScreen:** การสแกน QR และการใส่รหัสมือ (manual code) จำลองใน UI (กดยืนยันถึงเรียก API เช็คอินจริง)
- **Admin Settings – แท็บ System / Account / Notifications:** ค่าที่บันทึกยังไม่ส่งไป backend (มีแค่ `alert('…ยังไม่เชื่อม backend')`)
- **DoctorInterface:** หมายเหตุทางการแพทย์ (medical notes) เก็บแค่ใน state ฝั่ง client (ยังไม่มี API บันทึก)
- **NotificationScreen:** ปุ่มลบการแจ้งเตือน / Mark all as read (สำหรับลบ) อัปเดตแค่ local state ไม่มี API ลบ

**ค่าคงที่ใน UI (ไม่ใช่ข้อมูลจาก DB):**  
เช่น ชื่อโรงพยาบาล "Central City Hospital", ขีดจำกัด 15/30 ต่อรอบ/วัน, "15 นาทีต่อคน" ใช้เป็นข้อความหรือ logic ในฝั่ง client

---

## 4. ฟังก์ชันที่ยังไม่ครบหรือเป็นแบบจำลอง (อัปเดตหลังปรับปรุง)

| ฟีเจอร์ | สถานะหลังแก้ | หมายเหตุ |
|--------|--------|--------|
| Admin Settings: System / Account / Notifications | ✅ เชื่อม backend แล้ว | SiteConfig model, GET/PATCH /admin/settings/config; Account/Notifications ใช้ PATCH /users/profile |
| Doctor – บันทึกหมายเหตุ (notes) | ✅ บันทึก DB แล้ว | Booking.doctorNotes, PATCH /doctors/:id/booking-notes |
| Notification – ลบรายการ / ลบทั้งหมด | ✅ ใช้ API จริง | DELETE /notifications/:id, DELETE /notifications |
| Check-In: รหัสมือ (manual code) | ✅ ตรวจจาก API | GET /checkin/validate?code=... ตรวจรหัส/หมายเลขคิว แล้วแสดงข้อมูลจอง |
| BookingSlip: กำลังรับบริการ / ETA | ✅ จาก API | GET /bookings/:id/queue-status; โหลดทุก 20 วินาที |
| PatientDashboard: estimatedWaitTime | ✅ จาก API | getBookings คืน queueStatus.estimatedWaitMinutes |
| Check-In: สแกน QR จริง | ยังจำลอง | ใช้ปุ่ม Simulate หรือใส่รหัสมือแทน |

---

## 5. ความปลอดภัย (Security) – ควรแก้

จากการตรวจ backend:

- **Booking:** ทุก route (สร้าง/ดู/แก้/ยกเลิก) **ไม่ต้อง login** → ใครก็สร้างหรือยกเลิกจองได้
- **Doctor / Department:** CRUD เปิดให้ทุกคน (ไม่มี auth)
- **Admin queue:** ใช้แค่ middleware `auth` ไม่ตรวจ role → ถ้า patient login แล้วเรียก API admin/queues ได้
- **Notification:** POST สร้างการแจ้งเตือนส่ง `userId` ใน body ได้ → อาจสร้าง notification ให้ user อื่นได้

**แนะนำ:**  
- ใส่ auth ใน booking (อย่างน้อยสร้างจองต้อง login หรือตรวจสิทธิ์)  
- จำกัด admin/queues และ doctor/department ให้เฉพาะ role admin (และ doctor ตามความเหมาะสม)  
- ตรวจว่า notification สร้างให้แค่ `req.user.userId` หรือตามสิทธิ์

---

## 6. สรุปความถูกต้องตามความต้องการ

- **ตาม DELIVERABLES / เอกสารโปรเจกต์:** หน้าจอและฟีเจอร์หลักครบ (Patient, Admin, Doctor, Check-in, Notifications, Settings คร่าวๆ)
- **ข้อมูลที่แสดง:** ส่วนใหญ่เป็นข้อมูลจากฐานข้อมูลจริง ยกเว้นรายการในข้อ 3 และ 4
- **ฟังก์ชันหลัก:** ลงทะเบียน, จองคิว, เช็คอิน, จัดการคิวแอดมิน, หน้าหมอ, การแจ้งเตือน ทำงานได้และใช้ API จริง
- **จุดที่ยังไม่ครบ:** Settings (System/Account/Notifications), หมายเหตุหมอ, ลบการแจ้งเตือน, ETA/กำลังรับบริการจริง, และความปลอดภัยของ API

หากต้องการให้ระบบ “ถูกต้องตามความต้องการ” เต็มรูปแบบ แนะนำให้:  
1) เชื่อม Admin Settings (และถ้ามี) Account/Notifications กับ backend  
2) เพิ่ม API หมายเหตุหมอ และ API ลบการแจ้งเตือน (ถ้าต้องการ)  
3) ปรับสิทธิ์และ auth ตามข้อ 5
