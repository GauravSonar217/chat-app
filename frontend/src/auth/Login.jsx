import React, { useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { useForm } from "react-hook-form";
import CustomFormInput from "../component/CustomFormInput";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { encryptAndStoreLocal, requestHandler } from "../helper";
import { loginAndRegisterWithGoogle, userLogin } from "../controller";
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
        encryptAndStoreLocal("userData", userData);
        navigate("/dashboard");
      },
      (err) => {},
    );
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      const token = tokenResponse.access_token;

      await requestHandler(
        async () => await loginAndRegisterWithGoogle({ token }),
        setLoading,
        (res) => {
          toast.success(res.message);
          encryptAndStoreLocal("token", { token: res.data.accessToken });
          encryptAndStoreLocal("userData", res.data.user);
          navigate("/dashboard");
        },
      );
    },
    onError: () => toast.error("Google Login Failed"),
  });

  return (
    <section className="pageContainer">
      <div className="card-body">
        <div className="flex justify-content-between w-full h-full p-6">
          <div className="imageSec w-1/2 flex justify-center items-center">
            <img src="/images/png/chatbot.png" alt="" className="h-full" />
          </div>
          <form action="submit" onSubmit={handleSubmit(onSubmit)}>
            <div className="formContainer w-1/2 p-5">
              <div className="bg-[#0C0C1E] bg-gradient-to-b from-[#2E105B] to-[#9D4EDB] w-[500px] h-full p-[1.5px] rounded-xl">
                <div className="bg-black rounded-xl p-10 h-full">
                  <h2 className="text-center mb-6">
                    Welcome to{" "}
                    <span className="bg-gradient-to-b from-[#2E105B] to-[#9D4EDB] bg-clip-text text-transparent">
                      Chatify
                    </span>
                  </h2>
                  <div className="fieldCont flex flex-col w-full">
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
                    <div className="relative">
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
                    <div
                      className={`flex justify-end items-center text-base ${errors.password?.message ? "mt-[-20px]" : ""} font-semibold mb-3 w-100`}
                    >
                      <Link to="/forget-password">Forget password ?</Link>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="btn-primary cursor-pointer mt-6 mb-6 bg-gradient-to-b from-[#562B96] to-[#2E105B] w-full"
                    disabled={loading}
                  >
                    {loading ? <PulseLoader size={10} color="#fff" /> : "Login"}
                  </button>
                  <p className="text-center">
                    Dont have an account ?{" "}
                    <Link to="/register" className="text-[#9D4EDB]">
                      Sign up
                    </Link>
                  </p>
                  <div className="flex items-center gap-3 my-4">
                    <span className="border border-gray-600 w-full"></span>
                    <span className=" text-nowrap text-gray-400">
                      or continue with
                    </span>
                    <span className="border border-gray-600 w-full"></span>
                  </div>
                  <button
                    type="button"
                    className="p-3 flex items-center justify-center gap-2 cursor-pointer rounded-xl mt-4 bg-[#19002F] w-full"
                    onClick={() => googleLogin()}
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
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Login;
