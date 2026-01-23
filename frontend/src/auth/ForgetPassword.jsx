import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Form } from "react-bootstrap";
import CustomFormInput from "../component/CustomFormInput";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { encryptAndStoreLocal, requestHandler } from "../helper";
import { sendOTP, userLogin } from "../controller";
import { PulseLoader } from "react-spinners";

const ForgetPassword = () => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ mode: "onChange" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    const payload = { email: data.email.trim() };
    await requestHandler(
      async () => await sendOTP(payload),
      setLoading,
      (res) => {
        toast.success(res.message);
        reset();
        navigate("/verify-otp");
      },
      (err) => {},
    );
  };

  return (
    <section className="login-page">
      <div className="login-card">
        <h2 className="text-center mb-4">Forget Password</h2>
        <Form onSubmit={handleSubmit(onSubmit)} className="w-100">
          <div className="mb-5">
            <CustomFormInput
              type="email"
              label="Email"
              name="email"
              placeholder="Enter your email"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Enter a valid email address",
                },
              })}
              error={errors.email?.message}
            />
          </div>
          <button
            type="submit"
            className="w-100 btn-primary"
            disabled={loading}
          >
            {loading ? <PulseLoader size={10} color="#fff" /> : "Send OTP"}
          </button>
          <div className="mt-3 text-center">
            <p>
              Back to login ? <Link to="/">Login</Link>
            </p>
          </div>
        </Form>
      </div>
    </section>
  );
};

export default ForgetPassword;
