import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import API_BASE_URL from "../config/api.js";

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const emailFromState = location.state?.email || "";

  const [email, setEmail] = useState(emailFromState);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!email || !otp || !newPassword || !confirmPassword) {
      setError("Please fill in all fields.");
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setError(
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character."
      );
      setLoading(false);
      return;
    }

    if (otp.length !== 6) {
      setError("OTP must be 6 digits.");
      setLoading(false);
      return;
    }

    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/auth/reset-password`,
        { email, otp, newPassword },
        { headers: { "Content-Type": "application/json" } }
      );

      setSuccess(data.message);
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!email) {
      setError("Please enter your email address first.");
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `${API_BASE_URL}/auth/forgot-password`,
        { email },
        { headers: { "Content-Type": "application/json" } }
      );
      setSuccess("New OTP sent to your email.");
      setError("");
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to resend OTP.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-3 sm:p-4 relative overflow-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate("/forgot-password")}
        className="absolute top-3 sm:top-4 left-3 sm:left-4 flex items-center gap-1 text-blue-700 text-xs sm:text-sm md:text-base font-medium hover:underline z-10 touch-manipulation"
      >
        ← Back
      </button>

      <div className="bg-white p-6 sm:p-10 rounded-2xl shadow-2xl w-full max-w-md sm:max-w-lg transition-all duration-300 ease-in-out">
        <h1 className="text-2xl sm:text-3xl font-bold text-center text-blue-700 mb-4 sm:mb-6">
          Reset Password
        </h1>

        <p className="text-gray-600 text-center mb-6 text-sm sm:text-base">
          Enter the OTP sent to your email and create a new password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-gray-700 font-semibold mb-1 sm:mb-2 text-sm sm:text-base"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label
              htmlFor="otp"
              className="block text-gray-700 font-semibold mb-1 sm:mb-2 text-sm sm:text-base"
            >
              OTP (6 digits)
            </label>
            <input
              id="otp"
              type="text"
              required
              maxLength="6"
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-center text-xl sm:text-2xl tracking-widest"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            />
            <div className="text-center mt-2">
              <button
                type="button"
                onClick={handleResendOTP}
                className="text-blue-600 hover:underline active:text-blue-800 text-xs sm:text-sm font-medium touch-manipulation"
                disabled={loading}
              >
                Didn't receive OTP? Resend
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="newPassword"
              className="block text-gray-700 font-semibold mb-1 sm:mb-2 text-sm sm:text-base"
            >
              New Password
            </label>
            <input
              id="newPassword"
              type="password"
              required
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters and include uppercase, lowercase, number, and special character.</p>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-gray-700 font-semibold mb-1 sm:mb-2 text-sm sm:text-base"
            >
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            {loading ? "Resetting Password..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
