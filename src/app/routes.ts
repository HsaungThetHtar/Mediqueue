import { createBrowserRouter } from "react-router";
import { SignIn } from "./components/SignIn";
import { SignUp } from "./components/SignUp";
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
  },
]);