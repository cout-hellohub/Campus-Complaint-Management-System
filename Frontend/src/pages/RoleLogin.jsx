import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import API_BASE_URL from "../config/api.js";

// Background image import
import campusBg from "../assets/campus.jpg";
const RoleLogin = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const role = location.state?.role || "User";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setError("");
    setIsLoading(true);

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      setIsLoading(false);
      return;
    }

    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/auth/login`,
        { email, password, intendedRole: (role || "").toLowerCase() },
        { headers: { "Content-Type": "application/json" } }
      );

      localStorage.setItem("ccms_token", data.token);
      localStorage.setItem("ccms_user", JSON.stringify({
        _id: data._id, name: data.name, email: data.email,
        role: data.role, committeeType: data.committeeType
      }));

      const userRole = (data?.role || "").toLowerCase();
      if (userRole === "admin") navigate("/admin-dashboard");
      else if (userRole === "student") navigate("/student-dashboard");
      else if (userRole === "committee") navigate("/committee-dashboard");
      else navigate("/");
    } catch (err) {
      const msg = err?.response?.data?.message || "Login failed. Please try again.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="relative flex items-center justify-center min-h-screen bg-cover bg-center bg-no-repeat px-3 sm:px-4 overflow-hidden"
      style={{ backgroundImage: `url(${campusBg})` }}
    >
      {/* transparent background overlay */}
      <div className="absolute inset-0 bg-black/60"></div>

      {/* Back Button */}
      <button
        onClick={() => navigate("/login")}
        className="absolute top-4 sm:top-6 left-4 sm:left-6 flex items-center gap-2 text-white text-sm sm:text-base font-medium hover:underline z-10 touch-manipulation"
      >
        ← Back
      </button>

      <div className="relative bg-white/90 backdrop-blur-sm p-6 sm:p-8 md:p-10 rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-[95%] xs:max-w-md z-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-center text-blue-700 mb-6 sm:mb-8">
          {role.charAt(0).toUpperCase() + role.slice(1)} Login
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div>
            <label className="block text-gray-700 text-sm sm:text-base font-semibold mb-2">
              Email Address
            </label>
            <input
              type="email"
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                required
              />
              {password && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  )}
                </button>
              )}
            </div>
          </div>

          {error && <p className="text-red-500 text-center text-xs sm:text-sm">{error}</p>}

          <button
            type="submit"
            className={`w-full bg-blue-600 text-white font-semibold py-2 sm:py-2.5 rounded-lg transition flex items-center justify-center gap-2 text-sm sm:text-base touch-manipulation ${
              isLoading ? "opacity-70 cursor-not-allowed" : "hover:bg-blue-700 active:bg-blue-800"
            }`}
            disabled={isLoading}
          >
            {isLoading && (
              <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10"
                  stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
            )}
            {isLoading ? "Logging in…" : "Login"}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="text-blue-600 hover:underline text-xs sm:text-sm font-medium touch-manipulation"
            >
              Forgot password?
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoleLogin;
