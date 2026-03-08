import { createBrowserRouter } from "react-router";
import { SignIn } from "./components/SignIn";
import { SignUp } from "./components/SignUp";
import { PatientDashboard } from "./components/PatientDashboard";
import { CheckInScreen } from "./components/CheckInScreen";
import { AdminDashboard } from "./components/AdminDashboard";
import { DoctorInterface } from "./components/DoctorInterface";
import { NotificationScreen } from "./components/NotificationScreen";
import { SettingsScreen } from "./components/SettingsScreen";
import MainApp from "./MainApp";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: SignIn,
  },
  {
    path: "/signin",
    Component: SignIn,
  },
  {
    path: "/signup",
    Component: SignUp,
  },
  {
    path: "/app",
    Component: MainApp,
    children: [
      { index: true, lazy: () => import("./components/SelectDateDepartment").then(m => ({ Component: m.SelectDateDepartment })) },
      { path: "select-date", lazy: () => import("./components/SelectDateDepartment").then(m => ({ Component: m.SelectDateDepartment })) },
      { path: "select-doctor", lazy: () => import("./components/SelectedDoctor").then(m => ({ Component: m.SelectedDoctor })) },
      { path: "booking", lazy: () => import("./components/QueueBooking").then(m => ({ Component: m.QueueBooking })) },
      { path: "slip", lazy: () => import("./components/BookingSlip").then(m => ({ Component: m.BookingSlip })) },
    ]
  },
  {
    path: "/dashboard",
    Component: PatientDashboard,
  },
  {
    path: "/check-in",
    Component: CheckInScreen,
  },
  {
    path: "/admin",
    Component: AdminDashboard,
    children: [
      { index: true, path: "", lazy: () => import("./components/admin/sections/Dashboard").then(m => ({ Component: m.Dashboard })) },
      { path: "dashboard", lazy: () => import("./components/admin/sections/Dashboard").then(m => ({ Component: m.Dashboard })) },
      { path: "queue", lazy: () => import("./components/admin/sections/QueueManagement").then(m => ({ Component: m.QueueManagement })) },
      { path: "waiting", lazy: () => import("./components/admin/sections/WaitingList").then(m => ({ Component: m.WaitingList })) },
      { path: "bookings", lazy: () => import("./components/admin/sections/Bookings").then(m => ({ Component: m.Bookings })) },
      { path: "checkins", lazy: () => import("./components/admin/sections/CheckIns").then(m => ({ Component: m.CheckIns })) },
      { path: "completed", lazy: () => import("./components/admin/sections/Completed").then(m => ({ Component: m.Completed })) },
      { path: "bookings/:id", lazy: () => import("./components/admin/sections/BookingDetails").then(m => ({ Component: m.BookingDetails })) },
      { path: "profile", lazy: () => import("./components/admin/sections/Profile").then(m => ({ Component: m.Profile })) },
      { path: "settings", lazy: () => import("./components/admin/sections/Settings").then(m => ({ Component: m.Settings })) },
    ]
  },
  {
    path: "/doctor",
    Component: DoctorInterface,
  },
  {
    path: "/notifications",
    Component: NotificationScreen,
  },
  {
    path: "/settings",
    Component: SettingsScreen,
  },
]);