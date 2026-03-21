import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import CustomFormInput from "../component/CustomFormInput";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { requestHandler } from "../helper";
import { resetPassword } from "../controller";
import { PulseLoader } from "react-spinners";
import { decryptAndGetLocal } from "../helper";

const NewPassword = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [showConfPassword, setShowConfPassword] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({ mode: "onChange" });

  const password = watch("password");
  const email = decryptAndGetLocal("email")?.email;

  useEffect(() => {
    if (!email) {
      navigate("/");
    }
  }, [email, navigate]);

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
    <section className="pageContainer">
      <div className="card-body">
        <div className="p-10 bg-[#0C0C1E] bg-gradient-to-b from-[#2E105B] to-[#9D4EDB] w-[550px] p-[1.5px] rounded-xl">
          <div className="bg-black rounded-xl p-10 flex flex-col justify-center items-center">
            <img src="/images/png/reset-pass.png" alt="" className="mb-5" />
            <div className="formContainer w-full flex flex-col justify-center items-center">
              <h2 className="text-center mb-6">Reset Password</h2>
              <form
                action="submit"
                onSubmit={handleSubmit(onSubmit)}
                className="w-full"
              >
                <div className="mb-5">
                  <div className="passwordToggleCont">
                    <div className="relative">
                      <CustomFormInput
                        type={showPassword ? "text" : "password"}
                        label="Password"
                        name="password"
                        placeholder="Enter password"
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
                  </div>
                  <div className="relative">
                    <CustomFormInput
                      type={showConfPassword ? "text" : "password"}
                      label="Confirm Password"
                      placeholder="Confirm Password"
                      name="confirmPassword"
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
                        <img src="/images/svg/eye-line.svg" alt="" width={20} />
                      )}
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
                    "Create Password"
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewPassword;
