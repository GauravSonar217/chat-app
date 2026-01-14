import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Form } from "react-bootstrap";
import CustomFormInput from "../component/CustomFormInput";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ mode: "onChange" });

  const onSubmit = async (data) => {
    // Call your login API here with data.email and data.password
    // Example: loginUser(data)
    toast.success("Login successful!");
    console.log("Login Data:", data);
  };

  return (
    <section className="login-page">
      <div className="login-card">
        <h2 className="text-center mb-4">Login</h2>
        <Form onSubmit={handleSubmit(onSubmit)} className="w-100">
          <div className="mb-5">
            <CustomFormInput
              type="email"
              label="Email"
              name="email"
              placeholder="Enter email"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Enter a valid email address",
                },
              })}
              error={errors.email?.message}
            />

            <CustomFormInput
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              name="password"
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 8,
                  message: "Password must be at least 8 characters",
                },
              })}
              error={errors.password?.message}
            />
          </div>

          <button type="submit" className="w-100 btn-primary">
            Login
          </button>
          <div className="mt-3 text-center">
            <p>
              Don't have an account? <Link to="/register">Register</Link>
            </p>
          </div>
        </Form>
      </div>
    </section>
  );
};

export default Login;
