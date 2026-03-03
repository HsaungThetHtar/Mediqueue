import { createBrowserRouter } from "react-router";

import { SignIn } from "./components/SignIn";
import { SignUp } from "./components/SignUp";
import { DoctorSignUp } from "./components/DoctorSignUp";
import { DoctorSignIn } from "./components/DoctorSignIn";
import { DoctorDashboard } from "./components/DoctorDashboard";
import MainApp from "./MainApp";
import Welcome from "./components/Welcome";
import ChooseRole from "./components/ChooseRole";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Welcome />,
  },
  {
    path: "/signin",
    element: <SignIn />,
  },
  {
    path: "/signup",
    element: <SignUp />,
  },
  {
    path: "/doctor/signup",
    element: <DoctorSignUp />,
  },
  {
    path: "/doctor/signin",
    element: <DoctorSignIn />,
  },
  {
    path: "/doctor/dashboard",
    element: <DoctorDashboard />,
  },
  {
    path: "/app",
    element: <MainApp />,
  },
]);
