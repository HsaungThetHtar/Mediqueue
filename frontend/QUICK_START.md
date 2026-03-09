# 🚀 MediQueue Frontend - Quick Start Guide

## Installation & Setup

### Prerequisites
- Node.js 16+ 
- npm or yarn

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

The app will open at `http://localhost:5173` (Vite default)

---

## 🗂️ Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── components/          # All UI screens
│   │   │   ├── SignIn.tsx
│   │   │   ├── SignUp.tsx
│   │   │   ├── PatientDashboard.tsx
│   │   │   ├── CheckInScreen.tsx
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── DoctorInterface.tsx
│   │   │   ├── NotificationScreen.tsx
│   │   │   ├── QueueBooking.tsx
│   │   │   ├── BookingSlip.tsx
│   │   │   ├── SelectDateDepartment.tsx
│   │   │   ├── SelectedDoctor.tsx
│   │   │   ├── figma/
│   │   │   └── ui/              # Radix UI components
│   │   ├── MainApp.tsx          # Booking flow container
│   │   ├── App.tsx              # Main app router
│   │   └── routes.ts            # Route definitions
│   ├── main.tsx
│   └── supabaseClient.js
├── index.html
├── vite.config.ts
├── package.json
└── tailwind.config.js
```

---

## 📖 Accessing Different Screens

### Direct URLs
Navigate directly to test any screen:

| Screen | URL | Role |
|--------|-----|------|
| Sign In | `http://localhost:5173/signin` | Patient/Admin/Doctor |
| Sign Up | `http://localhost:5173/signup` | New User |
| Booking Flow | `http://localhost:5173/app` | Patient |
| Dashboard | `http://localhost:5173/dashboard` | Patient |
| Check-In | `http://localhost:5173/check-in` | Patient |
| Admin Panel | `http://localhost:5173/admin` | Hospital Staff |
| Doctor Console | `http://localhost:5173/doctor` | Doctor |
| Notifications | `http://localhost:5173/notifications` | Any User |

### Demo Flow
**Complete Patient Journey**:
1. `http://localhost:5173/signin` → (Sign In)
2. `http://localhost:5173/app` → (Select Date/Department)
3. Continue with doctor selection → time slot → booking
4. `http://localhost:5173/dashboard` → (View booking)
5. `http://localhost:5173/check-in` → (Check in)
6. `http://localhost:5173/notifications` → (View notifications)

---

## 🎯 Key Features to Test

### Patient Features
- [ ] Sign up new account
- [ ] Sign in with demo credentials
- [ ] Browse doctor availability
- [ ] Book appointment (morning/afternoon)
- [ ] View booking status
- [ ] Check-in with QR code simulation
- [ ] View notifications

### Admin Features
- [ ] Login as admin
- [ ] View queue statistics
- [ ] Filter queues by department
- [ ] Call next patient
- [ ] Mark patient as complete
- [ ] Skip queue

### Doctor Features
- [ ] Login as doctor
- [ ] View waiting patients
- [ ] Call next patient
- [ ] Add medical notes
- [ ] Complete consultation

---

## 🔧 Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Check types
npx tsc --noEmit
```

---

## 💾 Mock Data

All screens come with pre-loaded mock data:

**SignIn Demo Credentials**:
- Email: `demo@mediqueue.com`
- Password: `demo1234`

**Sample Data Included**:
- 2 sample bookings in Patient Dashboard
- 5 sample queues in Admin Dashboard
- 4 sample patients in Doctor Interface
- 6 sample notifications in Notification Screen

---

## 🎨 Customization

### Colors & Styling
Edit Tailwind CSS classes in components:
- Primary Blue: `#1E88E5` (use `text-blue-600`, `bg-blue-50`)
- Success Green: `#2E7D32` / `#4CAF50` (use `text-green-600`)
- Warning Orange: `#FBC02D` (use `text-orange-600`)
- Error Red: `#D32F2F` (use `text-red-600`)

### Add New Route
1. Create component in `src/app/components/`
2. Add route to `src/app/routes.ts`:
```typescript
{
  path: "/new-page",
  Component: YourComponent,
}
```

---

## 🔌 Supabase Integration

The app is pre-configured with Supabase. To use it:

1. Create `.env.local` file in `frontend/`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

2. Get credentials from [Supabase Console](https://app.supabase.com)

3. Create tables in Supabase:
```sql
-- Example: bookings table
CREATE TABLE bookings (
  id BIGSERIAL PRIMARY KEY,
  queue_number VARCHAR(10),
  hospital VARCHAR(100),
  department VARCHAR(50),
  doctor VARCHAR(100),
  date DATE,
  estimated_time VARCHAR(20),
  currently_serving VARCHAR(10),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🐛 Troubleshooting

### Problem: "Cannot find module 'react'"
**Solution**: Run `npm install` in frontend directory

### Problem: Port 5173 already in use
**Solution**: Change port in `vite.config.ts`:
```typescript
server: {
  port: 3000 // Change to different port
}
```

### Problem: Styles not loading
**Solution**: 
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Clear browser cache

### Problem: Hot reload not working
**Solution**: 
- Check that Vite is watching files: `npm run dev` should show "App running at..."
- Restart development server

---

## 📱 Responsive Testing

Test on different screen sizes:
- **Mobile**: 375px - 480px (iPhone)
- **Tablet**: 768px - 1024px (iPad)
- **Desktop**: 1280px+ (Full screen)

Use browser DevTools:
1. Press F12 (or Cmd+Option+I on Mac)
2. Click device toggle button (top-left)
3. Select device or custom dimensions

---

## ✅ Pre-Launch Checklist

Before deploying to production:

- [ ] All routes working
- [ ] Responsive design tested on mobile/tablet/desktop
- [ ] Sign in/sign up flow working
- [ ] Booking flow complete
- [ ] Admin dashboard functional
- [ ] Doctor interface operational
- [ ] Notifications system working
- [ ] No console errors
- [ ] Form validation in place
- [ ] Error messages displaying correctly
- [ ] Loading states working
- [ ] Modal dialogs functioning
- [ ] Build completes without errors: `npm run build`

---

## 📚 Additional Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Radix UI](https://www.radix-ui.com/docs/primitives/overview/introduction)
- [Lucide Icons](https://lucide.dev)
- [Vite Documentation](https://vitejs.dev/guide/)
- [Supabase](https://supabase.com/docs)

---

## 🎓 Learning Path

If you're new to this project:

1. **Start with**: Read [COMPLETION_SUMMARY.md](../COMPLETION_SUMMARY.md)
2. **Then read**: [UI_COMPONENTS.md](./UI_COMPONENTS.md)
3. **Explore**: Each component in `src/app/components/`
4. **Test**: Navigate through all screens at localhost
5. **Modify**: Change colors, text, layout in components
6. **Connect**: Add backend APIs

---

## 🆘 Getting Help

- Check [UI_COMPONENTS.md](./UI_COMPONENTS.md) for detailed screen documentation
- Review component comments for usage examples
- Check React/TypeScript syntax in related files
- Look at similar components for patterns

---

## 📝 Notes

- All screens use mock data - replace with real API calls
- Supabase bookings table is referenced in QueueBooking.tsx
- Admin/Doctor screens currently not connected to any authentication
- Notifications are static - implement real notification system
- Check-in QR scanner is simulated - integrate real QR library

---

## 🎉 You're Ready!

The MediQueue frontend is ready to explore and develop. Start the dev server and begin testing!

```bash
cd frontend
npm install
npm run dev
```

Happy coding! 🚀

---

**Last Updated**: March 6, 2024
