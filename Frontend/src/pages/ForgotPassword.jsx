import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import API_BASE_URL from "../config/api.js";

import campusBg from "../assets/campus.jpg";
const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/auth/forgot-password`,
        { email },
        { headers: { "Content-Type": "application/json" } }
      );

      setSuccess(data.message);
      // Navigate to reset password page after 2 seconds
      setTimeout(() => {
        navigate("/reset-password", { state: { email } });
      }, 2000);

    } catch (err) {
      const msg = err?.response?.data?.message || "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-cover bg-center bg-no-repeat px-3 sm:px-4 overflow-hidden" style={{ backgroundImage: `url(${campusBg})` }}>
      <div className="absolute inset-0 bg-black/60"></div>
      {/* Back Button */}
      <button
        onClick={() => navigate("/login")}
        className="absolute top-4 sm:top-6 left-4 sm:left-6 flex items-center gap-1 sm:gap-2 text-white text-sm sm:text-base font-medium hover:underline touch-manipulation"
      >
        ← Back 
      </button>
      <div className="flex items-center justify-center min-h-screen bg-transparent overflow-hidden relative px-3 sm:px-4">
      

      <div className="bg-white p-6 sm:p-8 md:p-10 rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-[95%] xs:max-w-md">
        <h1 className="text-2xl sm:text-3xl font-bold text-center text-blue-700 mb-6 sm:mb-8">
          Forgot Password
        </h1>

        <p className="text-sm sm:text-base text-gray-600 text-center mb-5 sm:mb-6">
          Enter your email address and we'll send you an OTP to reset your password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm sm:text-base text-gray-700 font-semibold mb-2"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
              placeholder="Enter your registered email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-red-500 text-center text-xs sm:text-sm">{error}</p>
          )}

          {success && (
            <p className="text-green-500 text-center text-xs sm:text-sm">{success}</p>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-semibold py-2 sm:py-2.5 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition text-sm sm:text-base touch-manipulation"
            disabled={loading}
          >
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>
        </form>

        <div className="text-center mt-6">
          <button
            onClick={() => navigate("/login")}
            className="text-blue-600 hover:underline text-sm font-medium"
          >
            Remember your password? Login here
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};
export default ForgotPassword;
