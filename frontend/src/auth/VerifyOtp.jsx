import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { decryptAndGetLocal, requestHandler } from "../helper";
import { sendOTP, verifyEmail, verifyOtp } from "../controller";
import { PulseLoader } from "react-spinners";
import CustomFormInput from "../component/CustomFormInput";

const VerifyOtp = () => {
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isExpired, setIsExpired] = useState(false);

  const inputsRef = useRef([]);
  const navigate = useNavigate();
  const email = decryptAndGetLocal("email")?.email;

  useEffect(() => {
    inputsRef.current[0]?.focus();
    if (!email) {
      navigate("/");
    }
  }, [email, navigate]);

  useEffect(() => {
    if (timeLeft === 0) {
      setIsExpired(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const handleChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputsRef.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = pastedData.split("");
    setOtp(newOtp);

    newOtp.forEach((_, i) => {
      inputsRef.current[i]?.focus();
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      return toast.error("Please enter 6 digit OTP");
    }

    await requestHandler(
      () => verifyOtp({ email, otp: otpValue }),
      setLoading,
      (res) => {
        toast.success(res.message);
        setOtp(Array(6).fill(""));
        navigate("/reset-password");
      },
      () => {},
    );
  };

  const ResendOTP = async (e) => {
    e.preventDefault();

    await requestHandler(
      () => sendOTP({ email }),
      setSubmitting,
      (res) => {
        toast.success(res.message);
        setOtp(Array(6).fill(""));
        setTimeLeft(60);
        setIsExpired(false);
      },
      () => {},
    );
  };

  return (
    <section className="pageContainer">
      <div className="card-body">
        <div className="p-10 bg-[#0C0C1E] bg-gradient-to-b from-[#2E105B] to-[#9D4EDB] w-[550px] p-[1.5px] rounded-xl">
          <div className="bg-black rounded-xl p-10 flex flex-col justify-center items-center">
            <img src="/images/png/verify-otp.png" alt="" className="mb-4" />
            <div className="formContainer w-full flex flex-col justify-center items-center">
              <form action="submit" onSubmit={handleSubmit} className="w-full">
                <h2 className="text-center mb-5">Verify OTP</h2>
                <p className="text-center text-gray-400 mb-6">
                  Enter the 6 digit OTP sent to <br />
                  <span className="text-white font-bold">{email}</span>
                </p>
                <div
                  className="flex justify-center items-center my-4 gap-2"
                  onPaste={handlePaste}
                >
                  {otp.map((digit, index) => (
                    <CustomFormInput
                      type="tel"
                      maxLength="1"
                      pattern="[0-9]{1}"
                      inputMode="numeric"
                      key={index}
                      value={digit}
                      ref={(el) => (inputsRef.current[index] = el)}
                      onChange={(e) => handleChange(e.target.value, index)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      className="text-center md:h-18 font-bold text-xl"
                    />
                  ))}
                </div>
                <div className="flex justify-end items-center">
                  {!isExpired ? (
                    <h5 className="text-sm text-gray-400 mt-2">
                      OTP will be expired in{" "}
                      <b className="text-primary ml-2 text-white font-bold">
                        {formatTime(timeLeft)}
                      </b>
                    </h5>
                  ) : (
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={ResendOTP}
                      className="mt-2 text-white font-semibold cursor-pointer"
                    >
                      {submitting ? "Resending..." : "Resend OTP"}
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary cursor-pointer my-4 bg-gradient-to-b from-[#562B96] to-[#2E105B] w-full"
                >
                  {loading ? (
                    <PulseLoader size={10} color="#fff" />
                  ) : (
                    "Verify OTP"
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

export default VerifyOtp;
