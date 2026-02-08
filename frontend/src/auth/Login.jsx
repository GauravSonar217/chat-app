import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Form } from "react-bootstrap";
import CustomFormInput from "../component/CustomFormInput";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { encryptAndStoreLocal, requestHandler } from "../helper";
import { userLogin } from "../controller";
import { PulseLoader } from "react-spinners";

const Login = () => {
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
        const { data } = res;
        encryptAndStoreLocal("token", { token: data.accessToken });
        const userData = {
          userId: data.user._id,
          username: data.user.username,
          email: data.user.email,
          role: data.user.role,
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
            <div className="passwordToggleCont">
              <CustomFormInput
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
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
              <div className="d-flex justify-content-end w-100">
                <Link to="/forget-password">Forget password?</Link>
              </div>
              <div className="toggle-password" onClick={handleShowPassword}>
                {showPassword ? (
                  <img src="/images/svg/eye-off-line.svg" alt="" width={20} />
                ) : (
                  <img src="/images/svg/eye-line.svg" alt="" width={20} />
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-100 btn-primary"
            disabled={loading}
          >
            {loading ? <PulseLoader size={10} color="#fff" /> : "Login"}
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
