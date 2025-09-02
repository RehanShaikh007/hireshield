import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import toast from "react-hot-toast";

const LoginPage = () => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const { login, googleSignIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const _from = location.state?.from?.pathname || "/dashboard";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(formData.email, formData.password);

    if (result.success) {
      // Redirect based on user role
      const user = result.data.user;
      if (user.role === "super_admin") {
        navigate("/superadmin");
      } else if (user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } else {
      toast.error(result.error);
    }

    setLoading(false);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="w-full mx-auto px-4 py-12 bg-gradient-to-t from-cyan-50 to-cyan-900 min-h-screen">
      <div className="mb-8">
        <img
          src="./hire_logo.png"
          alt="hero logo"
          className="w-24 h-24 mx-auto mb-4"
        />
        <h1 className="text-3xl font-bold mb-2 text-center text-white drop-shadow-lg">
          {t("welcomeBack")}
        </h1>
        <p className="text-cyan-100 text-center">{t("signInToAccount")}</p>
      </div>

      <div className="max-w-md mx-auto bg-white/95 backdrop-blur-sm border border-white/20 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {t("signIn")}
          </h2>
          <p className="text-gray-600 font-medium">
            {t("welcomeBackContinue")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t("emailAddress")}
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 bg-white/80 backdrop-blur-sm"
              placeholder={t("enterEmail")}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t("password")}
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 bg-white/80 backdrop-blur-sm"
              placeholder={t("enterPassword")}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-700 text-white font-semibold hover:from-cyan-700 hover:to-cyan-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
          >
            {loading ? t("loading") : t("signIn")}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white/95 text-gray-500 font-medium">
              {t("orContinueWith")}
            </span>
          </div>
        </div>

        <div className="mb-6">
          <button
            onClick={async () => {
              setLoading(true);
              const result = await googleSignIn();
              if (result.success) {
                const user = result.data.user;
                if (user.role === "super_admin") {
                  navigate("/superadmin");
                } else if (user.role === "admin") {
                  navigate("/admin");
                } else {
                  navigate("/dashboard");
                }
              } else {
                toast.error(result.error);
              }
              setLoading(false);
            }}
            className="w-full px-6 py-4 rounded-xl bg-white text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-gray-200 flex items-center justify-center space-x-3 cursor-pointer transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
            disabled={loading}
          >
            <img src="./google.png" alt="Google logo" className="w-5 h-5" />
            <span>{loading ? t("loading") : t("continueWithGoogle")}</span>
          </button>
        </div>

        <div className="text-center">
          <p className="text-gray-600 font-medium">
            {t("dontHaveAccount")}{" "}
            <Link
              to="/signup"
              className="text-cyan-600 font-semibold hover:text-cyan-700 transition-colors duration-200"
            >
              {t("signUp")}
            </Link>
          </p>
        </div>
      </div>

      <div className="text-center mt-8">
        <p className="text-sm font-medium text-black">
          {t("byContinuing")}{" "}
          <Link
            to="/terms"
            className="text-blue-600 font-semibold transition-all duration-200"
          >
            {t("termsOfService")}
          </Link>{" "}
          {t("and")}{" "}
          <Link
            to="/privacy"
            className="text-blue-600 font-semibold transition-all duration-200"
          >
            {t("privacyPolicy")}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
