import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate, useLocation } from "react-router-dom";
import { decryptAndGetLocal, requestHandler } from "../helper";
// import { verifyEmail } from "../controller"; // API function

const VerifyOtp = () => {
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [loading, setLoading] = useState(false);

  const inputsRef = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();
  const email = decryptAndGetLocal("email")?.email;

  useEffect(() => {
    if (!email) {
      navigate("/register");
    }
  }, [email, navigate]);

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
      () => {
        toast.success("Email verified successfully");
        navigate("/login");
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
        className="p-5 rounded shadow-md border border-3 d-flex flex-column align-items-center"
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
              style={{fontSize: "30px", width: "60px", height: "60px"}}
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full btn border bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Verifying..." : "Verify OTP"}
        </button>
      </form>
    </section>
  );
};

export default VerifyOtp;
