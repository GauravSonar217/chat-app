import React, { useState } from "react";
import { Form } from "react-bootstrap";
import CustomFormInput from "../component/CustomFormInput";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { encryptAndStoreLocal, requestHandler } from "../helper";
import { userRegister } from "../controller";
import { PulseLoader } from "react-spinners";

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfPassword, setShowConfPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors: formErrors },
  } = useForm({ mode: "onChange" });

  const onSubmit = async (data) => {
    const { userName, fullName, email, phoneNumber, password } = data;

    const registrationData = {
      username: userName,
      fullName,
      email,
      phoneNumber,
      password,
    };

    await requestHandler(
      async () => await userRegister(registrationData),
      setLoading,
      (res) => {
        toast.success(res.message);
        reset();
        encryptAndStoreLocal("email", { email: email });
        const userData = {
          userId: res.data._id,
          username: res.data.username,
          email: res.data.email,
          role: res.data.role,
        };
        encryptAndStoreLocal("userData", { userData: userData });
        navigate("/verify-email");
      },
      (err) => {},
    );
  };

  return (
    <section className="register-page">
      <div className="register-card">
        <h2 className="text-center mb-4">Register</h2>
        <Form onSubmit={handleSubmit(onSubmit)} className="w-100">
          <div className="mb-4">
            <div class="row justify-content-center align-items-start">
              <div class="col-6">
                <CustomFormInput
                  type="text"
                  label="User Name"
                  name="userName"
                  placeholder="Enter user name"
                  {...register("userName", {
                    required: "User name is required",
                    min: 3,
                  })}
                  error={formErrors.userName?.message}
                />
              </div>
              <div class="col-6">
                <CustomFormInput
                  type="text"
                  label="Full Name"
                  name="fullName"
                  placeholder="Enter full name"
                  {...register("fullName", {
                    required: "Full name is required",
                  })}
                  error={formErrors.fullName?.message}
                />
              </div>
              <div class="col-6">
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
                  error={formErrors.email?.message}
                />
              </div>
              <div class="col-6">
                <CustomFormInput
                  type="text"
                  label="Phone Number"
                  name="phoneNumber"
                  placeholder="Enter phone number"
                  {...register("phoneNumber", {
                    required: "Phone number is required",
                    pattern: {
                      value: /^[0-9]{7,15}$/,
                      message: "Enter a valid phone number (7-15 digits)",
                    },
                  })}
                  error={formErrors.phoneNumber?.message}
                />
              </div>
              <div class="col-6">
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
                    error={formErrors.password?.message}
                  />
                  <div
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <img
                        src="/images/svg/eye-off-line.svg"
                        alt=""
                        width={20}
                      />
                    ) : (
                      <img src="/images/svg/eye-line.svg" alt="" width={20} />
                    )}
                  </div>
                </div>
              </div>
              <div class="col-6">
                <div className="passwordToggleCont">
                  <CustomFormInput
                    type={showConfPassword ? "text" : "password"}
                    label="Confirm Password"
                    placeholder="Confirm Password"
                    name="confirmPassword"
                    {...register("confirmPassword", {
                      required: "Please confirm your password",
                      // validate: (value) =>
                      //   value !== password ? "Passwords do not match" : "",
                    })}
                    // error={formErrors.confirmPassword?.message}
                  />
                  <div
                    className="toggle-password"
                    onClick={() => setShowConfPassword(!showConfPassword)}
                  >
                    {showConfPassword ? (
                      <img
                        src="/images/svg/eye-off-line.svg"
                        alt=""
                        width={20}
                      />
                    ) : (
                      <img src="/images/svg/eye-line.svg" alt="" width={20} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-100 btn-primary"
            disabled={loading}
          >
            {loading ? <PulseLoader size={10} color="#fff" /> : "Sign up"}
          </button>
          <div className="mt-3 text-center">
            <p>
              Already have an account? <Link to="/">Login</Link>
            </p>
          </div>
        </Form>
      </div>
    </section>
  );
};

export default Register;
