import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "../auth/Login.jsx";
import Register from "../auth/Register.jsx";
import Dashboard from "../pages/Dashboard.jsx";
import UserManagement from "../pages/UserManagement.jsx";
import PodManagement from "../pages/PodManagement.jsx";
import NotFound from "../pages/NotFound.jsx";
import AdminLayout from "../layout/AdminLayout.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";
import PublicRoute from "./PublicRoute.jsx";
import VerifyOtp from "../auth/VerifyOtp.jsx";
import ForgetPassword from "../auth/ForgetPassword.jsx";
import NewPassword from "../auth/NewPassword.jsx";

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
    path: "/verify-otp",
    element: routeWrapper(<VerifyOtp />, false),
  },
  {
    path: "/forget-password",
    element: routeWrapper(<ForgetPassword />, false),
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
    path: "/users",
    element: routeWrapper(<UserManagement />, true),
  },
  {
    path: "/pods",
    element: routeWrapper(<PodManagement />, true),
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export default routes;
