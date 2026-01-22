import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Form } from "react-bootstrap";
import CustomFormInput from "../component/CustomFormInput";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { encryptAndStoreLocal, requestHandler } from "../helper";
import { userLogin } from "../controller";
import { PulseLoader } from "react-spinners";

const NewPassword = () => {
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ mode: "onChange" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const onSubmit = async (data) => {
    await requestHandler(
      async () => await userLogin(data),
      setLoading,
      (res) => {
        toast.success(res.message);
        reset();
        encryptAndStoreLocal("token", { token: res.token });
        const userData = {
          userId: res.user._id,
          username: res.user.username,
          email: res.user.email,
          role: res.user.role,
        };
        encryptAndStoreLocal("userData", { userData: userData });
        navigate("/dashboard");
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
                label="Password"
                type="text"
                placeholder="Enter new password"
                name="password"
                className=""
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
            <div className="passwordToggleCont">
              <CustomFormInput
                label="Confirm Password"
                type="text"
                placeholder="Confirm Password"
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
            {loading ? <PulseLoader size={10} color="#fff" /> : "Create Password"}
          </button>
        </Form>
      </div>
    </section>
  );
};

export default NewPassword;
