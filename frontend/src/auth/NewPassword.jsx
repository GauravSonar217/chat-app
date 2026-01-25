import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Form } from "react-bootstrap";
import CustomFormInput from "../component/CustomFormInput";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { requestHandler } from "../helper";
import { resetPassword } from "../controller";
import { PulseLoader } from "react-spinners";
import { decryptAndGetLocal } from "../helper";

const NewPassword = () => {
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ mode: "onChange" });
  const email = decryptAndGetLocal("email")?.email;

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    const payload = {
      email,
      newPassword: data.password,
      confirmPassword: data.confirmPassword,
    };
    await requestHandler(
      async () => await resetPassword(payload),
      setLoading,
      (res) => {
        toast.success(res.message);
        reset();
        localStorage.clear();
        navigate("/");
      },
      (err) => {},
    );
  };

  return (
    <section className="login-page">
      <div className="login-card">
        <h2 className="text-center mb-4">Reset Password</h2>
        <Form onSubmit={handleSubmit(onSubmit)} className="w-100">
          <div className="mb-5">
            <div className="passwordToggleCont">
              <CustomFormInput
                type={showPassword ? "text" : "password"}
                label="Password"
                name="password"
                placeholder="Enter password"
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 8,
                    message: "Password must be at least 8 characters long",
                  },
                })}
                error={errors.password?.message}
              />
              <div
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <img src="/images/svg/eye-off-line.svg" alt="" width={20} />
                ) : (
                  <img src="/images/svg/eye-line.svg" alt="" width={20} />
                )}
              </div>
            </div>
            <div className="passwordToggleCont">
              <CustomFormInput
                label="Re-Enter Password"
                type="text"
                placeholder="Re-Enter password"
                name="confirmPassword"
                className=""
                {...register("confirmPassword", {
                  required: "Please confirm your password",
                  minLength: {
                    value: 8,
                    message: "Password must be at least 8 characters",
                  },
                })}
                error={errors.confirmPassword?.message}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-100 btn-primary"
            disabled={loading}
          >
            {loading ? (
              <PulseLoader size={10} color="#fff" />
            ) : (
              "Create Password"
            )}
          </button>
        </Form>
      </div>
    </section>
  );
};

export default NewPassword;
