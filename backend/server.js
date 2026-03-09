require("dotenv").config();

// Validate required environment variables before anything else
if (!process.env.JWT_SECRET) {
  console.error("FATAL: JWT_SECRET environment variable is not set. Exiting.");
  process.exit(1);
}
if (!process.env.MONGODB_URI) {
  console.error("FATAL: MONGODB_URI environment variable is not set. Exiting.");
  process.exit(1);
}
if (!process.env.FRONTEND_URL) {
  console.warn("Warning: FRONTEND_URL not set — defaulting to http://localhost:5173 (not suitable for production)");
}

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const adminRoutes = require("./routes/admin.routes");
const authRoutes = require("./routes/auth.routes");
const doctorRoutes = require("./routes/doctor.routes");
const departmentRoutes = require("./routes/department.routes");
const bookingRoutes = require("./routes/booking.routes");
const checkinRoutes = require("./routes/checkin.routes");
const notificationRoutes = require("./routes/notification.routes");
const userRoutes = require("./routes/user.routes");

const app = express();
const server = http.createServer(app);
// BUG-12 FIX: Use FRONTEND_URL env var instead of wildcard "*" — set FRONTEND_URL in .env for production
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// Make io accessible to controllers
app.set("io", io);

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
}));
app.use(express.json());

app.use("/admin", adminRoutes);
app.use("/auth", authRoutes);
app.use("/doctors", doctorRoutes);
app.use("/departments", departmentRoutes);
app.use("/bookings", bookingRoutes);
app.use("/checkin", checkinRoutes);
app.use("/notifications", notificationRoutes);
app.use("/users", userRoutes);

app.get("/", (req, res) => {
  res.send("MediQueue Backend Running");
});

io.on("connection", (socket) => {
  // Join user-specific and role-specific rooms so we can target emits
  const token = socket.handshake.auth?.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.join(`user:${decoded.userId}`);
      socket.join(`role:${decoded.role}`);
    } catch (_) {
      // invalid/expired token — socket still connects but stays in no room
    }
  }
  socket.on("disconnect", () => {});
});

const PORT = process.env.PORT || 3001;

const { startAutoSkipJob } = require("./jobs/autoSkipQueue");

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    server.listen(PORT, () => {
      console.log("Server running on port", PORT);
      startAutoSkipJob(io);
      console.log("Auto-skip queue job started (every 1 min, skips in-progress > 10 min)");
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });