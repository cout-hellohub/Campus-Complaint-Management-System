import React from "react";
import { useNavigate } from "react-router-dom";
import dauLogo from "../assets/dau_logo.png";
import campusBg from "../assets/campus.jpg"; // background image

export default function Login() {
  const navigate = useNavigate();

  const handleLogin = (role) => {
    navigate("/role-login", { state: { role } });
  };

  return (
    <div
      className="relative flex items-center justify-center min-h-screen px-3 sm:px-4 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${campusBg})` }}
    >
      {/* Transparent background overlay */}
      <div className="absolute inset-0 bg-black/45"></div>

      {/* Login Card */}
      <div className="relative bg-white/90 backdrop-blur-sm shadow-2xl rounded-xl sm:rounded-2xl px-6 py-8 sm:px-8 sm:py-10 md:px-10 md:py-12 w-full max-w-[95%] xs:max-w-md flex flex-col items-center text-center">
        
        {/* Logo */}
        <img
          src={dauLogo}
          alt="Dhirubhai Ambani University"
          className="w-32 xs:w-40 sm:w-52 mb-4 sm:mb-6"
        />

        {/* Title (smaller size) */}
        <h1 className="text-xl xs:text-2xl sm:text-3xl font-bold text-blue-700 mb-2 sm:mb-3 leading-snug">
          Campus Complaint <br className="hidden sm:block" />
          Resolve
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base text-gray-700 mb-6 sm:mb-8">
          Select your role to continue
        </p>

        {/* Buttons */}
        <div className="flex flex-col gap-3 sm:gap-4 w-full">
          <button
            onClick={() => handleLogin("admin")}
            className="w-full py-2.5 sm:py-3 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm sm:text-base font-medium transition-all duration-200 touch-manipulation"
          >
            Login as Admin
          </button>

          <button
            onClick={() => handleLogin("student")}
            className="w-full py-2.5 sm:py-3 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm sm:text-base font-medium transition-all duration-200 touch-manipulation"
          >
            Login as Student
          </button>

          <button
            onClick={() => handleLogin("committee")}
            className="w-full py-2.5 sm:py-3 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm sm:text-base font-medium transition-all duration-200 touch-manipulation"
          >
            Login as Committee
          </button>
        </div>
      </div>
    </div>
  );
}
