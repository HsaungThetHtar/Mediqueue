require("dotenv").config();
const mongoose = require("mongoose");
const Department = require("./models/Department");
const Doctor = require("./models/Doctor");
const User = require("./models/User");
const Booking = require("./models/Booking");
const Notification = require("./models/Notification");
const CheckIn = require("./models/CheckIn");
const bcrypt = require("bcryptjs");

const HOSPITAL = "Central City Hospital";

// แผนกที่ต้องมีในระบบ (ลำดับการแสดงใน dropdown) — seed ด้านล่างมีหมอครบทุกแผนก
const DEPARTMENTS = [
  "Internal Medicine",
  "Pediatrics",
  "Obstetrics and Gynecology",
  "General Surgery",
  "Orthopedics",
  "Ear, Nose and Throat (ENT)",
  "Dermatology",
];

// หมอ 10 คน — แต่ละคนมีบัญชี users (doctor1@ … doctor10@) ผูกผ่าน doctors.userId
const doctors = [
  { name: "Dr. Somchai Jaidee", department: "Internal Medicine", imageUrl: "https://randomuser.me/api/portraits/men/32.jpg" },
  { name: "Dr. Wanida Sriwong", department: "Internal Medicine", imageUrl: "https://randomuser.me/api/portraits/women/44.jpg" },
  { name: "Dr. Preecha Nakorn", department: "Internal Medicine", imageUrl: "https://randomuser.me/api/portraits/men/55.jpg" },
  { name: "Dr. Nattaya Pimchan", department: "Pediatrics", imageUrl: "https://randomuser.me/api/portraits/women/68.jpg" },
  { name: "Dr. Wichai Rattana", department: "Orthopedics", imageUrl: "https://randomuser.me/api/portraits/men/71.jpg" },
  { name: "Dr. Supansa Charoensuk", department: "Orthopedics", imageUrl: "https://randomuser.me/api/portraits/women/23.jpg" },
  { name: "Dr. Thawat Boonsong", department: "Obstetrics and Gynecology", imageUrl: "https://randomuser.me/api/portraits/men/88.jpg" },
  { name: "Dr. Kannika Thongdee", department: "Pediatrics", imageUrl: "https://randomuser.me/api/portraits/women/12.jpg" },
  { name: "Dr. Anan Sukasem", department: "General Surgery", imageUrl: "https://randomuser.me/api/portraits/men/41.jpg" },
  { name: "Dr. Benjawan Mani", department: "Ear, Nose and Throat (ENT)", imageUrl: "https://randomuser.me/api/portraits/women/33.jpg" },
];

// แอดมิน + บัญชีล็อกอินของหมอทุกคน (แต่ละหมอมีอีเมลของตัวเอง)
const staffUsers = [
  { fullName: "Admin MediQueue", email: "admin@mediqueue.com", password: "password123", role: "admin" },
  ...doctors.map((d, i) => ({
    fullName: d.name,
    email: `doctor${i + 1}@mediqueue.com`,
    password: "password123",
    role: "doctor",
  })),
];

// ผู้ป่วย 20 คน — ใช้ใน bookings.patientId, notifications.userId, checkins.patientId
const patientUsers = [
  { fullName: "สมชาย ใจดี", email: "somchai.p@email.com", password: "password123", phone: "0812345678", dateOfBirth: "1985-03-15", gender: "male", identificationNumber: "1100700123456" },
  { fullName: "วิชัย รัตนา", email: "wichai.r@email.com", password: "password123", phone: "0823456789", dateOfBirth: "1990-07-22", gender: "male", identificationNumber: "1100700987654" },
  { fullName: "มานี มีสุข", email: "manee.m@email.com", password: "password123", phone: "0834567890", dateOfBirth: "1978-11-08", gender: "female", identificationNumber: "3100800234567" },
  { fullName: "สมหญิง วงศ์ไทย", email: "somying.w@email.com", password: "password123", phone: "0845678901", dateOfBirth: "1982-01-30", gender: "female", identificationNumber: "3100800876543" },
  { fullName: "ประเสริฐ นคร", email: "prasert.n@email.com", password: "password123", phone: "0856789012", dateOfBirth: "1975-05-12", gender: "male", identificationNumber: "1100700567890" },
  { fullName: "กาญจนา ทองดี", email: "kanjana.t@email.com", password: "password123", phone: "0867890123", dateOfBirth: "1988-09-18", gender: "female", identificationNumber: "3100800456789" },
  { fullName: "บุญเลิศ สุขใจ", email: "boonlert.s@email.com", password: "password123", phone: "0878901234", dateOfBirth: "1992-12-03", gender: "male", identificationNumber: "1100700789012" },
  { fullName: "รัตนา พิมพ์จันทร์", email: "rattana.p@email.com", password: "password123", phone: "0889012345", dateOfBirth: "1980-04-25", gender: "female", identificationNumber: "3100800345678" },
  { fullName: "อนุชา สุขเสมอ", email: "anucha.s@email.com", password: "password123", phone: "0890123456", dateOfBirth: "1987-08-14", gender: "male", identificationNumber: "1100700678901" },
  { fullName: "เพ็ญศรี แสงทอง", email: "pensri.s@email.com", password: "password123", phone: "0901234567", dateOfBirth: "1995-02-28", gender: "female", identificationNumber: "3100800890123" },
  { fullName: "วิมล เก่งงาน", email: "wimon.k@email.com", password: "password123", phone: "0912345678", dateOfBirth: "1983-06-10", gender: "female", identificationNumber: "3100800111222" },
  { fullName: "สมศักดิ์ ใจมั่น", email: "somsak.j@email.com", password: "password123", phone: "0923456789", dateOfBirth: "1979-09-20", gender: "male", identificationNumber: "1100700333444" },
  { fullName: "ดวงใจ สุขสันต์", email: "duangjai.s@email.com", password: "password123", phone: "0934567890", dateOfBirth: "1991-01-05", gender: "female", identificationNumber: "3100800555666" },
  { fullName: "ธนพล รักเรียน", email: "thanapon.r@email.com", password: "password123", phone: "0945678901", dateOfBirth: "1986-11-12", gender: "male", identificationNumber: "1100700777888" },
  { fullName: "ศิริพร ดีมาก", email: "siriporn.d@email.com", password: "password123", phone: "0956789012", dateOfBirth: "1984-04-18", gender: "female", identificationNumber: "3100800999000" },
  { fullName: "ณัฐพล เก่งกาจ", email: "nattapon.k@email.com", password: "password123", phone: "0967890123", dateOfBirth: "1993-07-25", gender: "male", identificationNumber: "1100700122334" },
  { fullName: "พัชรี นุ่มนวล", email: "patcharee.n@email.com", password: "password123", phone: "0978901234", dateOfBirth: "1989-02-14", gender: "female", identificationNumber: "3100800344556" },
  { fullName: "จักรพงษ์ สดใส", email: "jakkrapong.s@email.com", password: "password123", phone: "0989012345", dateOfBirth: "1981-08-30", gender: "male", identificationNumber: "1100700566778" },
  { fullName: "อรุณี ใจเย็น", email: "arunee.j@email.com", password: "password123", phone: "0990123456", dateOfBirth: "1994-12-08", gender: "female", identificationNumber: "3100800788990" },
  { fullName: "สุรชัย ขยัน", email: "surachai.k@email.com", password: "password123", phone: "0901234568", dateOfBirth: "1977-05-22", gender: "male", identificationNumber: "1100700900112" },
];

function toDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// คืนค่า 4 วัน: [เมื่อวาน, วันนี้, พรุ่งนี้, มะรืนนี้] ในรูปแบบ YYYY-MM-DD
function getFourDays() {
  const base = new Date();
  return [
    (() => { const d = new Date(base); d.setDate(d.getDate() - 1); return toDateStr(d); })(),
    toDateStr(base),
    (() => { const d = new Date(base); d.setDate(d.getDate() + 1); return toDateStr(d); })(),
    (() => { const d = new Date(base); d.setDate(d.getDate() + 2); return toDateStr(d); })(),
  ];
}

function estimatedTimeForSlot(slotIndex, timeSlot) {
  const baseHour = timeSlot === "morning" ? 8 : 13;
  const totalMin = slotIndex * 15;
  const h = baseHour + Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Seed: หมอ 10 คน, ผู้ป่วย 20 คน — departments → doctors (departmentId), users (admin + doctor1..10 + patient1..20) → doctors.userId, bookings (doctor, patientId, date, status) → notifications/checkins
async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB:", mongoose.connection.db.databaseName);

    await mongoose.connection.db.dropCollection("departments").catch(() => {});
    await mongoose.connection.db.dropCollection("doctors").catch(() => {});
    await mongoose.connection.db.dropCollection("users").catch(() => {});
    await mongoose.connection.db.dropCollection("bookings").catch(() => {});
    await mongoose.connection.db.dropCollection("notifications").catch(() => {});
    await mongoose.connection.db.dropCollection("checkins").catch(() => {});
    console.log("Dropped existing collections.");

    const departmentDocs = DEPARTMENTS.map((name, i) => ({ name, displayOrder: i }));
    const insertedDepartments = await Department.insertMany(departmentDocs);
    const deptNameToId = Object.fromEntries(insertedDepartments.map((d) => [d.name, d._id]));
    console.log(`Inserted ${insertedDepartments.length} departments.`);

    // หมอเก็บ department เป็น ObjectId ของแผนก (ตรงกับ Model Doctor)
    const insertedDoctors = await Doctor.insertMany(
      doctors.map((d) => ({
        name: d.name,
        department: deptNameToId[d.department],
        workingHours: "08:00 - 17:00",
        currentQueueServing: 0,
        imageUrl: d.imageUrl || "",
        currentQueue: 0,
        maxQueue: 30,
      }))
    );
    console.log(`Inserted ${insertedDoctors.length} doctors.`);

    const insertedUsers = [];
    for (const u of staffUsers) {
      const hashed = await bcrypt.hash(u.password, 10);
      const user = await User.create({
        fullName: u.fullName,
        email: u.email,
        password: hashed,
        role: u.role,
      });
      insertedUsers.push(user);
    }
    for (const u of patientUsers) {
      const hashed = await bcrypt.hash(u.password, 10);
      const user = await User.create({
        fullName: u.fullName,
        email: u.email,
        password: hashed,
        phone: u.phone,
        dateOfBirth: u.dateOfBirth,
        gender: u.gender,
        identificationNumber: u.identificationNumber,
        role: "patient",
      });
      insertedUsers.push(user);
    }
    console.log(`Inserted ${insertedUsers.length} users.`);

    // ความสัมพันธ์ doctors ↔ users: แต่ละหมอผูกกับบัญชีล็อกอินของตัวเอง (insertedUsers[0]=admin, [1]=หมอคนที่1, ...)
    let linked = 0;
    for (let i = 0; i < insertedDoctors.length; i++) {
      const doctorUser = insertedUsers[1 + i]; // staffUsers[0]=admin, [1..]=doctor1, doctor2, ...
      if (doctorUser && doctorUser.role === "doctor") {
        await Doctor.findByIdAndUpdate(insertedDoctors[i]._id, { userId: doctorUser._id });
        linked++;
      }
    }
    console.log(`Linked ${linked} doctor accounts (doctors.userId): doctor1@mediqueue.com … doctor${insertedDoctors.length}@mediqueue.com`);

    const patients = insertedUsers.filter((u) => u.role === "patient");
    // 4 วัน: เมื่อวาน, วันนี้, พรุ่งนี้, มะรืนนี้ — ข้อมูลจริง ครบทุกขั้นตอนทุกสถานะ
    const [yesterday, today, tomorrow, dayAfter] = getFourDays();
    const targetDates = [yesterday, today, tomorrow, dayAfter];

    // สถานะทั้ง 6 แบบ (ตาม Booking model): waiting, confirmed, checked-in, in-progress, completed, canceled
    const ALL_STATUSES = ["waiting", "confirmed", "checked-in", "in-progress", "completed", "canceled"];
    const todaySlotsPerSession = 10; // วันนี้ 10 คิวต่อช่วง (เช้า/บ่าย) ต่อหมอ — เพียงพอให้ครบทุกสถานะ
    const slotsPerSessionByDay = { [yesterday]: 8, [today]: todaySlotsPerSession, [tomorrow]: 5, [dayAfter]: 4 };

    // จำนวนสล็อตของ "วันนี้" ที่จะให้เป็น Not Checked-In (waiting/confirmed) อย่างน้อยเท่านี้ต่อหมอต่อช่วง
    const notCheckedInSlotsPerSessionToday = 2;

    function getStatusForSlot(date, doctorIndex, timeSlot, slotIndex, totalSlots) {
      if (date === yesterday) {
        // เมื่อวาน: ส่วนใหญ่ completed, บางส่วน canceled
        return Math.random() < 0.9 ? "completed" : "canceled";
      }
      if (date === tomorrow || date === dayAfter) {
        // อนาคต: รอหรือยืนยันแล้ว
        return slotIndex % 2 === 0 ? "waiting" : "confirmed";
      }
      // วันนี้: สล็อตแรก notCheckedInSlotsPerSessionToday ต่อช่วง = waiting/confirmed (Not Checked-In), ที่เหลือกระจายครบ 6 สถานะ
      if (slotIndex < notCheckedInSlotsPerSessionToday) {
        return slotIndex % 2 === 0 ? "waiting" : "confirmed";
      }
      const idx = (doctorIndex * 2 * totalSlots) + (timeSlot === "afternoon" ? totalSlots : 0) + slotIndex;
      return ALL_STATUSES[idx % ALL_STATUSES.length];
    }

    const allBookings = [];
    for (const date of targetDates) {
      const slotsPerSession = slotsPerSessionByDay[date] ?? 5;
      for (let di = 0; di < insertedDoctors.length; di++) {
        const doctor = insertedDoctors[di];
        for (const [timeSlot, prefix] of [["morning", "M"], ["afternoon", "A"]]) {
          for (let slotIndex = 0; slotIndex < slotsPerSession; slotIndex++) {
            const patient = patients[Math.floor(Math.random() * patients.length)];
            const queueNumber = `${prefix}-${String(slotIndex + 1).padStart(3, "0")}`;
            const estimatedTime = estimatedTimeForSlot(slotIndex, timeSlot);
            const status = getStatusForSlot(date, di, timeSlot, slotIndex, slotsPerSession);
            allBookings.push({
              queueNumber,
              hospital: HOSPITAL,
              department: doctor.department,
              doctor: doctor._id,
              doctorName: doctor.name,
              date,
              timeSlot,
              estimatedTime,
              currentlyServing: prefix + "-000",
              patientId: patient._id,
              patientName: patient.fullName,
              status,
            });
          }
        }
      }
    }

    const insertedBookings = await Booking.insertMany(allBookings);
    console.log(`Inserted ${insertedBookings.length} bookings.`);
    console.log(`Dates: yesterday=${yesterday}, today=${today}, tomorrow=${tomorrow}, dayAfter=${dayAfter}`);
    const todayBookings = insertedBookings.filter((b) => b.date === today);
    const statusCounts = ["waiting", "confirmed", "checked-in", "in-progress", "completed", "canceled"].reduce((acc, s) => {
      acc[s] = todayBookings.filter((b) => b.status === s).length;
      return acc;
    }, {});
    console.log(`Today (${today}): ${todayBookings.length} bookings — status mix:`, statusCounts);
    targetDates.forEach((d) => {
      const n = insertedBookings.filter((b) => b.date === d).length;
      const label = d === yesterday ? "เมื่อวาน" : d === today ? "วันนี้" : d === tomorrow ? "พรุ่งนี้" : "มะรืนนี้";
      console.log(`  ${label} (${d}): ${n} รายการ`);
    });

    for (const doctor of insertedDoctors) {
      const todayCount = insertedBookings.filter(
        (b) => b.doctor.toString() === doctor._id.toString() && b.date === today && b.status !== "canceled"
      ).length;
      await Doctor.findByIdAndUpdate(doctor._id, { currentQueue: todayCount });
    }
    console.log("Updated doctor currentQueue from today's bookings.");

    const notificationsPayload = insertedBookings.slice(0, 30).map((b, idx) => ({
      userId: b.patientId,
      title: idx % 2 === 0 ? "Booking Confirmed" : "Appointment Update",
      message: `Your appointment with ${b.doctorName} on ${b.date} (${b.timeSlot}) – ${b.status}.`,
      type: "booking",
      relatedBookingId: b._id,
      isRead: idx > 15,
    }));
    await Notification.insertMany(notificationsPayload);
    console.log(`Inserted ${notificationsPayload.length} notifications.`);

    const toCheckIn = insertedBookings.filter((b) => b.status === "checked-in" || b.status === "completed");
    const checkInsPayload = toCheckIn.map((b) => ({
      bookingId: b._id,
      patientId: b.patientId,
      method: Math.random() > 0.5 ? "qr" : "manual",
      status: b.status === "completed" ? "completed" : "confirmed",
    }));
    await CheckIn.insertMany(checkInsPayload);
    console.log(`Inserted ${checkInsPayload.length} check-ins.`);

    console.log("\n--- สรุป: หมอ " + insertedDoctors.length + " คน, ผู้ป่วย " + patients.length + " คน, ข้อมูลเชื่อมโยงกัน (departments↔doctors, users↔doctors.userId, bookings↔patients/doctors) ---");
    console.log("--- Login (ระบบจริง) ---");
    staffUsers.forEach((u) => console.log(`[${u.role}] ${u.email} / ${u.password}`));
    console.log("[patient] 20 บัญชี patient1..20 (somchai.p@email.com, wichai.r@email.com, …) / password123");
    console.log("--- 4 วัน: เมื่อวาน / วันนี้ / พรุ่งนี้ / มะรืนนี้ — ครบทุกสถานะ ---");
    console.log("Seed completed successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Seed error:", err);
    process.exit(1);
  }
}

seed();
