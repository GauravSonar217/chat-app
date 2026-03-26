import React from "react";
import Login from "../auth/Login.jsx";
import Register from "../auth/Register.jsx";
import Dashboard from "../pages/Dashboard.jsx";
import NotFound from "../pages/NotFound.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";
import PublicRoute from "./PublicRoute.jsx";
import ForgetPassword from "../auth/ForgetPassword.jsx";
import NewPassword from "../auth/NewPassword.jsx";
import VerifyEmail from "../auth/VerifyEmail.jsx";
import VerifyOtp from "../auth/VerifyOtp.jsx";
import MyProfile from "../pages/MyProfile.jsx";

const routeWrapper = (comp, isProtected = true) => {
  if (isProtected) {
    return <ProtectedRoute>{comp}</ProtectedRoute>;
  }
  return <PublicRoute>{comp}</PublicRoute>;
};

const routes = [
  {
    path: "/",
    element: routeWrapper(<Login />, false),
  },
  {
    path: "/register",
    element: routeWrapper(<Register />, false),
  },
  {
    path: "/verify-email",
    element: routeWrapper(<VerifyEmail />, false),
  },
  {
    path: "/forget-password",
    element: routeWrapper(<ForgetPassword />, false),
  },
  {
    path: "/verify-otp",
    element: routeWrapper(<VerifyOtp />, false),
  },
  {
    path: "/reset-password",
    element: routeWrapper(<NewPassword />, false),
  },
  {
    path: "/dashboard",
    element: routeWrapper(<Dashboard />, true),
  },
  {
    path: "/my-profile",
    element: routeWrapper(<MyProfile />, true),
  },
  
  {
    path: "*",
    element: <NotFound />,
  },
];

export default routes;
