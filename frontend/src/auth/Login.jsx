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
    <section className="pageContainer">
      <div className="card-body">
        <div className="flex justify-content-between w-full h-full p-6">
          <div className="imageSec w-1/2 d-flex justify-end items-center">
            <img
              src="/images/png/chatbot.png"
              alt=""
              className="w-full h-full"
            />
          </div>
          <form action="submit" onSubmit={handleSubmit(onSubmit)}>
            <div className="formContainer w-1/2 p-5">
              <div className="form-card bg-[#0C0C1E] w-[500px] h-full p-[1px] rounded-xl">
                <div className="bg-black rounded-xl p-10 h-full">
                  <h2 className="text-center">
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
                        onClick={handleShowPassword}
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
                  {/* <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name=""
                      id=""
                      className="w-4 h-4 border border-white rounded bg-transparent 
         checked:bg-transparent checked:border-white 
         accent-[#9D4EDB] cursor-pointer"
                    />
                    <p>
                      I agree to{" "}
                      <span className="text-[#9D4EDB]">Terms & Conditions</span>{" "}
                      and <span className="text-[#9D4EDB]">Privacy Policy</span>
                    </p>
                  </div> */}
                  <button
                    type="submit"
                    className="btn-primary cursor-pointer mt-6 mb-6 bg-gradient-to-b from-[#562B96] to-[#2E105B] w-full"
                  >
                    Login
                  </button>
                  <p className="text-center">
                    Already have an account ?{" "}
                    <span className="text-[#9D4EDB]">Sign in</span>
                  </p>
                  <div className="flex items-center gap-3 my-4">
                    <span className="border border-gray-600 w-full"></span>
                    <span className=" text-nowrap text-gray-400">
                      or continue with
                    </span>
                    <span className="border border-gray-600 w-full"></span>
                  </div>
                  <button
                    type="submit"
                    className="p-3 flex items-center justify-center gap-2 cursor-pointer rounded-xl mt-4 bg-[#19002F] w-full"
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
      {/* <div className="login-card">
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
      </div> */}
    </section>
  );
};

export default Login;
