import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { decryptAndGetLocal, requestHandler } from "../helper";
import { sendOTP, verifyEmail } from "../controller";
import { PulseLoader } from "react-spinners";

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
      navigate("/register");
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
      () => verifyEmail({ email, otp: otpValue }),
      setLoading,
      (res) => {
        toast.success(res.message);
        localStorage.removeItem("email");
        setOtp(Array(6).fill(""));
        navigate("/");
      },
      () => {},
    );
  };

  const ResendOTP = async (e) => {
    e.preventDefault();

    await requestHandler(
      () => sendOTP({ email }),
      setLoading,
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
    <section
      style={{ height: "100vh" }}
      className="h-screen d-flex align-items-center justify-content-center bg-transparent"
    >
      <form
        onSubmit={handleSubmit}
        className="p-5 rounded shadow-md border border-1 d-flex flex-column align-items-center"
      >
        <h2 className="text-xl font-semibold text-center mb-2">
          Verify Your Email
        </h2>
        <p className="text-center text-gray-500 mb-6">
          Enter the 6 digit OTP sent to <br />
          <b>{email}</b>
        </p>

        <div
          className="d-flex justify-content-between my-4 gap-3"
          onPaste={handlePaste}
        >
          {otp.map((digit, index) => (
            <input
              key={index}
              type="text"
              value={digit}
              ref={(el) => (inputsRef.current[index] = el)}
              onChange={(e) => handleChange(e.target.value, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className="text-center p-3 border rounded"
              style={{ fontSize: "30px", width: "60px", height: "60px" }}
            />
          ))}
        </div>
        {!isExpired ? (
          <h5 className="text-sm text-gray-500 mt-2">
            OTP will be expired in{" "}
            <b className="text-primary">{formatTime(timeLeft)}</b>
          </h5>
        ) : (
          <button
            type="button"
            disabled={submitting}
            onClick={ResendOTP}
            className="mt-3 text-primary hover:underline "
          >
            {submitting ? "Resending..." : "Resend OTP"}
          </button>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full btn btn-primary bg-blue-600 text-white mt-4 py-2 px-5 rounded hover:bg-blue-700"
        >
          {loading ? <PulseLoader size={10} color="#fff" /> : "Verify OTP"}
        </button>
      </form>
    </section>
  );
};

export default VerifyOtp;
