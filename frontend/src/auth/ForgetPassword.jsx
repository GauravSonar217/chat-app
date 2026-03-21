import React, { useState } from "react";
import { useForm } from "react-hook-form";
import CustomFormInput from "../component/CustomFormInput";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { encryptAndStoreLocal, requestHandler } from "../helper";
import { sendOTP } from "../controller";
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
        encryptAndStoreLocal("email", { email: data.email.trim() });
        reset();
        navigate("/verify-otp");
      },
      (err) => {},
    );
  };

  return (
    <section className="pageContainer">
      <div className="card-body">
        <div className="p-10 bg-[#0C0C1E] bg-gradient-to-b from-[#2E105B] to-[#9D4EDB] w-[550px] p-[1.5px] rounded-xl">
          <div className="bg-black rounded-xl p-10 flex flex-col justify-center items-center">
            <img src="/images/png/forget-password.png" alt="" className="mb-5"/>
            <div className="formContainer w-full flex flex-col justify-center items-center">
              <h2 className="text-center mb-6">Forget Password</h2>
              <form action="submit" onSubmit={handleSubmit(onSubmit)} className="w-full">
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
                  className="btn-primary cursor-pointer my-4 bg-gradient-to-b from-[#562B96] to-[#2E105B] w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <PulseLoader size={10} color="#fff" />
                  ) : (
                    "Send OTP"
                  )}
                </button>
                <div className="mt-2 text-center">
                  <Link to={`${loading ? "" : "/"}`} className="text-[#9D4EDB] text-lg">
                    Back to login
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ForgetPassword;
