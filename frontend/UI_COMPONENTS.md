# MediQueue UI Components Documentation

## Overview
This document outlines all UI screens that have been implemented for the MediQueue system.

## Screens Implemented

### 1. **SignIn Screen** (`SignIn.tsx`)
**Purpose:** User authentication entry point
**Features:**
- Email/Phone input field
- Password input with show/hide toggle
- "Remember me" option
- Demo login button
- Link to signup page
- Beautiful gradient background

**Routes:** `/signin` and `/` (default)

---

### 2. **SignUp Screen** (`SignUp.tsx`)
**Purpose:** User account creation
**Features:**
- Full Name input
- Email input
- Phone input
- Date of Birth picker
- Identification Number input
- Password input with strength indicator
- Confirm Password input
- Back to Sign In link
- Form validation indicators

**Routes:** `/signup`

---

### 3. **Patient Dashboard** (`PatientDashboard.tsx`)
**Purpose:** Main patient interface showing booking history and status
**Features:**
- Quick stats (Upcoming, Completed, Total bookings)
- Upcoming bookings display
- Past bookings archive
- Status badges (Upcoming, Checked-in, In Progress, Completed, Cancelled)
- Booking details modal
- Create new booking button
- Real-time waiting time estimation
- Responsive grid layout

**Routes:** `/dashboard`

---

### 4. **Queue Booking** (`QueueBooking.tsx`)
**Purpose:** Book a queue slot with a doctor
**Features:**
- Doctor information display
- Date selection
- Time slot selection (Morning: 08:00-12:00, Afternoon: 13:00-17:00)
- Queue status visualization (Available, Nearly Full, Full)
- Estimated wait time calculation
- Queue availability display (X/15 slots)
- Confirmation and booking submission
- Integration with Supabase database
- Back navigation to doctor selection

**Routes:** Accessed via MainApp flow

---

### 5. **Booking Slip** (`BookingSlip.tsx`)
**Purpose:** Display booking confirmation and track queue status
**Features:**
- Success banner with confirmation message
- QR code generation for check-in
- Booking details display
- Live queue status updates
- Current queue position tracking
- Waiting time calculation
- Cancel booking option with confirmation modal
- Download/Print receipt capability
- Live demo: Queue updates every 10 seconds

**Routes:** Accessed via MainApp flow after booking confirmation

---

### 6. **Check-In Screen** (`CheckInScreen.tsx`)
**Purpose:** Patient check-in at hospital
**Features:**
- QR code scanner simulation
- Manual code entry option
- Booking verification display
- Check-in success confirmation
- Queue number display
- Doctor and department information
- Appointment details review
- Real-time status updates

**Routes:** `/check-in`

---

### 7. **Admin Dashboard** (`AdminDashboard.tsx`)
**Purpose:** Hospital staff manage and monitor all queues
**Features:**
- Real-time queue statistics
  - Total in queue
  - Waiting count
  - In progress count
  - Completed count
- Department filter
- Status filter (Waiting, In Progress, Completed, Skipped)
- Queue action modal
  - Call next patient
  - Mark as complete
  - Skip queue
- Search functionality
- Responsive grid layout for queue display
- Logout functionality

**Routes:** `/admin`

---

### 8. **Doctor Interface** (`DoctorInterface.tsx`)
**Purpose:** Doctor manage patient consultations
**Features:**
- Current patient display card
- Waiting queue list with position numbers
- Patient information display
  - Queue number
  - Name
  - Age/Gender
  - Symptoms
  - Check-in time
- Medical notes input
- Consultation actions
  - Call next patient
  - Start consultation
  - Complete consultation
  - Add/Save medical notes
- Completed consultations list
- Statistics (completed count)
- Logout functionality

**Routes:** `/doctor`

---

### 9. **Notification Screen** (`NotificationScreen.tsx`)
**Purpose:** Display all system notifications to users
**Features:**
- Notification list with types:
  - Booking confirmations
  - Status updates
  - Reminders
  - Urgent notices
- Filter by: All, Unread
- Mark as read functionality
- Mark all as read option
- Delete individual notifications
- Clear all notifications
- Notification badges
- Unread count indicator
- Notification statistics
- Color-coded notification types
- Timestamps on each notification

**Routes:** `/notifications`

---

## Navigation Flow

### Patient Flow
```
SignIn → PatientDashboard → Create New Booking
         ↓
    MainApp (SelectDateDepartment → SelectDoctor → QueueBooking → BookingSlip)
         ↓
    CheckInScreen → Notification Updates
```

### Admin/Staff Flow
```
SignIn → AdminDashboard → Manage Queues
```

### Doctor Flow
```
SignIn → DoctorInterface → Manage Consultations
```

---

## Component State Management

All screens use React hooks (useState, useEffect) for state management:
- `selectedBooking`: Track selected booking details
- `currentScreen`: Navigate between booking screens
- `isLoading`: Show loading states
- `filterStatus`: Filter queues by status
- `notifications`: Manage notification list

---

## Styling

All components use:
- **Tailwind CSS** for responsive design
- **Lucide React** icons for visual consistency
- **Radix UI** components for accessible UI elements
- Custom color scheme:
  - Primary Blue: `#1E88E5`
  - Success Green: `#2E7D32` / `#4CAF50`
  - Warning Orange: `#FBC02D`
  - Error Red: `#D32F2F`

---

## Features Highlights

### ✅ Completed Features
- [x] Authentication screens (Sign In, Sign Up)
- [x] Patient dashboard with booking history
- [x] Queue booking with time slot selection
- [x] Booking slip with live queue tracking
- [x] Check-in screen with QR/manual entry
- [x] Admin dashboard with queue management
- [x] Doctor interface for patient management
- [x] Comprehensive notification system
- [x] Responsive design (mobile, tablet, desktop)
- [x] Modal dialogs for actions
- [x] Status filtering and search
- [x] Real-time updates simulation

### 📋 Future Improvements
- [ ] WebSocket integration for real-time updates
- [ ] Push notifications (browser + mobile)
- [ ] Payment integration for booking fees
- [ ] Prescription management
- [ ] Patient medical records
- [ ] Department-specific workflows
- [ ] SMS/Email notifications
- [ ] Advanced analytics and reporting
- [ ] Multi-language support
- [ ] Accessibility (WCAG) compliance

---

## Testing the Screens

### Quick Navigation
Access any screen directly via URL:
- Sign In: `/signin`
- Sign Up: `/signup`
- Patient Dashboard: `/dashboard`
- Booking Flow: `/app`
- Check-In: `/check-in`
- Admin: `/admin`
- Doctor: `/doctor`
- Notifications: `/notifications`

### Demo Data
All screens come with mock data pre-loaded for testing:
- Patient Dashboard: 2 sample bookings
- Admin Dashboard: 5 sample queues
- Doctor Interface: 4 sample patients
- Notifications: 6 sample notifications

---

## Icon Usage (Lucide React)

- 🚪 Sign In/Up: Eye, EyeOff, ArrowLeft
- 📊 Dashboard: Calendar, Clock, CheckCircle, Users, AlertCircle
- 🏥 Queue: QrCode, MapPin, Building2, Stethoscope
- 👨‍⚕️ Doctor: Phone, FileText, User
- 🔔 Notifications: Bell, Check, MessageSquare
- ⚙️ Actions: MoreVertical, SkipForward, LogOut

---

## File Structure
```
src/app/components/
├── SignIn.tsx              ← Authentication
├── SignUp.tsx              ← Registration
├── MainApp.tsx             ← Booking flow container
├── PatientDashboard.tsx    ← Patient home
├── SelectDateDepartment.tsx ← Step 1: Date & Department
├── SelectedDoctor.tsx      ← Step 2: Doctor selection
├── QueueBooking.tsx        ← Step 3: Time slot & booking
├── BookingSlip.tsx         ← Step 4: Confirmation
├── CheckInScreen.tsx       ← Check-in process
├── AdminDashboard.tsx      ← Staff/Admin panel
├── DoctorInterface.tsx     ← Doctor's console
├── NotificationScreen.tsx  ← Notifications hub
└── ui/                     ← Radix UI components
```

---

## API Integration Points (to be implemented)

### Screens requiring backend integration:
1. **SignIn/SignUp**: User authentication & profile creation
2. **QueueBooking**: Save booking to database
3. **CheckInScreen**: Verify booking & update status
4. **AdminDashboard**: Real-time queue data
5. **DoctorInterface**: Patient data & completion status
6. **NotificationScreen**: Fetch user notifications
7. **PatientDashboard**: Fetch user's bookings

---

Last Updated: March 6, 2024
