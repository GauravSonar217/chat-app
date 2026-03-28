import React, { useState } from "react";
import CustomFormInput from "../component/CustomFormInput";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { encryptAndStoreLocal, requestHandler } from "../helper";
import { loginAndRegisterWithGoogle, userRegister } from "../controller";
import { PulseLoader } from "react-spinners";
import { useGoogleLogin } from "@react-oauth/google";

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfPassword, setShowConfPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({ mode: "onChange" });
  const password = watch("password");

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

  const googleSignup = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      const token = tokenResponse.access_token;

      await requestHandler(
        async () => await loginAndRegisterWithGoogle({ token }),
        setLoading,
        (res) => {
          toast.success(res.message);
          const { data } = res;

          encryptAndStoreLocal("token", { token: data.accessToken });
          encryptAndStoreLocal("userData", { userData: data.user });
          navigate("/dashboard");
        },
      );
    },
    onError: () => toast.error("Google Signup Failed"),
  });

  return (
    <section className="pageContainer">
      <div className="card-body">
        <div className="flex justify-content-between w-full h-full">
          <div className="formContainer w-full lg:w-1/2 h-full flex justify-end items-center">
            <form
              action="submit"
              className="w-full flex items-center justify-center lg:justify-end"
              onSubmit={handleSubmit(onSubmit)}
            >
              <div className="bg-[#0C0C1E] bg-gradient-to-b from-[#2E105B] to-[#9D4EDB] w-full  lg:w-[550px] p-[1.5px] rounded-xl">
                <div className="bg-black rounded-xl py-10 px-5 md:p-15 lg:p-10">
                  <h2 className="text-center mb-6">
                    Sign up{" "}
                    <span className="bg-gradient-to-b from-[#2E105B] to-[#9D4EDB] bg-clip-text text-transparent">
                      Chatify
                    </span>
                  </h2>
                  <div className="fieldCont flex flex-col w-full">
                    <CustomFormInput
                      type="text"
                      label="User Name"
                      name="userName"
                      placeholder="Enter user name"
                      {...register("userName", {
                        required: "User name is required",
                        min: 3,
                      })}
                      error={errors.userName?.message}
                    />
                    <CustomFormInput
                      type="text"
                      label="Full Name"
                      name="fullName"
                      placeholder="Enter full name"
                      {...register("fullName", {
                        required: "Full name is required",
                      })}
                      error={errors.fullName?.message}
                    />
                    <div className="flex items-start gap-3">
                      <CustomFormInput
                        type="email"
                        label="Email"
                        name="email"
                        className=""
                        placeholder="Enter email"
                        parentClass="w-full"
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
                        type="text"
                        label="Phone Number"
                        name="phoneNumber"
                        placeholder="Enter phone number"
                        parentClass="w-full"
                        {...register("phoneNumber", {
                          required: "Phone number is required",
                          pattern: {
                            value: /^[0-9]{7,15}$/,
                            message: "Enter a valid phone number (7-15 digits)",
                          },
                        })}
                        error={errors.phoneNumber?.message}
                      />
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="relative w-full">
                        <CustomFormInput
                          type={showPassword ? "text" : "password"}
                          label="Password"
                          name="password"
                          placeholder="Enter password"
                          parentClass="w-full"
                          {...register("password", {
                            required: "Password is required",
                            minLength: {
                              value: 8,
                              message:
                                "Password must be at least 8 characters long",
                            },
                          })}
                          error={errors.password?.message}
                        />
                        <div
                          className="absolute top-[1rem] cursor-pointer right-[1rem]"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <img
                              src="/images/svg/eye-off-line.svg"
                              alt=""
                              width={20}
                            />
                          ) : (
                            <img
                              src="/images/svg/eye-line.svg"
                              alt=""
                              width={20}
                            />
                          )}
                        </div>
                      </div>
                      <div className="relative w-full">
                        <CustomFormInput
                          type={showConfPassword ? "text" : "password"}
                          label="Confirm Password"
                          name="confirmPassword"
                          placeholder="Confirm Password"
                          parentClass="w-full"
                          {...register("confirmPassword", {
                            required: "Please confirm your password",
                            validate: (value) =>
                              value === password || "Passwords do not match",
                          })}
                          error={errors.confirmPassword?.message}
                        />
                        <div
                          className="absolute top-[1rem] cursor-pointer right-[1rem]"
                          onClick={() => setShowConfPassword(!showConfPassword)}
                        >
                          {showConfPassword ? (
                            <img
                              src="/images/svg/eye-off-line.svg"
                              alt=""
                              width={20}
                            />
                          ) : (
                            <img
                              src="/images/svg/eye-line.svg"
                              alt=""
                              width={20}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="btn-primary cursor-pointer my-4 bg-gradient-to-b from-[#562B96] to-[#2E105B] w-full"
                    disabled={loading}
                  >
                    {loading ? (
                      <PulseLoader size={10} color="#fff" />
                    ) : (
                      "Sign up"
                    )}
                  </button>
                  <p className="text-center">
                    Already have an account ?{" "}
                    <Link to="/" className="text-[#9D4EDB]">
                      Sign in
                    </Link>
                  </p>
                  <div className="flex items-center gap-3 my-3">
                    <span className="border border-gray-600 w-full"></span>
                    <span className=" text-nowrap text-gray-400">
                      or continue with
                    </span>
                    <span className="border border-gray-600 w-full"></span>
                  </div>
                  <button
                    type="button"
                    className="p-3 flex items-center justify-center gap-2 cursor-pointer rounded-xl mt-3 bg-[#19002F] w-full"
                    onClick={() => googleSignup()}
                    disabled={loading}
                  >
                    <img
                      src="/images/png/googleicon.png"
                      alt=""
                      width={25}
                      height={25}
                    />{" "}
                    Google
                  </button>
                </div>
              </div>
            </form>
          </div>
          <div className="imageSec w-1/2 border hidden lg:flex justify-center items-center p-6">
            <img src="/images/png/chatbot.png" alt="" className="h-full" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Register;
