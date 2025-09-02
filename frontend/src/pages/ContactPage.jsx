import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import toast from "react-hot-toast";

const ContactPage = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name:
      user?.firstName && user?.lastName
        ? `${user.firstName} ${user.lastName}`
        : "",
    email: user?.email || "",
    phone: "",
    message: "",
  });
  const [companyData, setCompanyData] = useState({
    companyName: "",
    companyPhone: "",
    companyEmail: "",
    companyAddress: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCompanyChange = (e) => {
    setCompanyData({
      ...companyData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Save contact form data to localStorage for admin viewing
      const existingContacts = JSON.parse(
        localStorage.getItem("contactSubmissions") || "[]"
      );
      const newContact = {
        id: Date.now(),
        ...formData,
        companyInfo: companyData,
        submittedAt: new Date().toISOString(),
        userId: user?._id || null,
        userRole: user?.role || "guest",
      };

      const updatedContacts = [...existingContacts, newContact];
      localStorage.setItem(
        "contactSubmissions",
        JSON.stringify(updatedContacts)
      );

      // Dispatch event to update admin dashboards
      window.dispatchEvent(new Event("contactUpdated"));

      toast.success(t("contactSubmitted"));
      setFormData({ name: "", email: "", phone: "", message: "" });
      setCompanyData({
        companyName: "",
        companyPhone: "",
        companyEmail: "",
        companyAddress: "",
      });
    } catch (error) {
      toast.error("Failed to submit message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-cyan-50 to-cyan-900">
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-cyan-900 mb-4 drop-shadow-lg">
            {t("contactTitle")}
          </h1>
          <p className="text-xl text-black max-w-2xl mx-auto">
            {t("haveQuestions")}
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="bg-white/95 backdrop-blur-sm border border-white/20 rounded-2xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              {t("sendMessage")}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {t("fullName")} *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                  placeholder={`Enter your ${t("fullName").toLowerCase()}`}
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {t("emailAddress")} *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                  placeholder={`Enter your ${t("email").toLowerCase()}`}
                />
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {t("phoneNumber")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                  placeholder={`Enter your ${t("phone").toLowerCase()}`}
                />
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {t("message")} *
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows="5"
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 resize-none"
                  placeholder="Tell us how we can help you..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-700 text-white font-semibold hover:from-cyan-700 hover:to-cyan-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
              >
                {loading ? t("loading") : t("sendMessage")}
              </button>
            </form>
          </div>

          {/* Company Information Form */}
          <div className="space-y-8">
            {/* Company Info Form */}
            <div className="bg-white/95 backdrop-blur-sm border border-white/20 rounded-2xl p-8 shadow-2xl">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                {t("companyInformation")}
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                {t("pleaseProvideCompany")}
              </p>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="companyName"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    {t("companyName")}
                  </label>
                  <input
                    type="text"
                    id="companyName"
                    name="companyName"
                    value={companyData.companyName}
                    onChange={handleCompanyChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                    placeholder={t("enterCompanyName")}
                  />
                </div>

                <div>
                  <label
                    htmlFor="companyPhone"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    {t("companyPhone")}
                  </label>
                  <input
                    type="tel"
                    id="companyPhone"
                    name="companyPhone"
                    value={companyData.companyPhone}
                    onChange={handleCompanyChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                    placeholder={t("enterCompanyPhone")}
                  />
                </div>

                <div>
                  <label
                    htmlFor="companyEmail"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    {t("companyEmail")}
                  </label>
                  <input
                    type="email"
                    id="companyEmail"
                    name="companyEmail"
                    value={companyData.companyEmail}
                    onChange={handleCompanyChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                    placeholder={t("enterCompanyEmail")}
                  />
                </div>

                <div>
                  <label
                    htmlFor="companyAddress"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    {t("companyAddress")}
                  </label>
                  <textarea
                    id="companyAddress"
                    name="companyAddress"
                    rows="3"
                    value={companyData.companyAddress}
                    onChange={handleCompanyChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 resize-none"
                    placeholder={t("enterCompanyAddress")}
                  />
                </div>
              </div>
            </div>

            {/* Business Hours Info */}
            <div className="bg-white/95 backdrop-blur-sm border border-white/20 rounded-2xl p-8 shadow-2xl">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                {t("businessHours")}
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t("mondayFriday")}</span>
                  <span className="font-semibold text-gray-800">
                    9:00 AM - 6:00 PM
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t("saturday")}</span>
                  <span className="font-semibold text-gray-800">
                    10:00 AM - 4:00 PM
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t("sunday")}</span>
                  <span className="font-semibold text-gray-800">
                    {t("closed")}
                  </span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-cyan-50 rounded-lg">
                <p className="text-sm text-cyan-800">
                  <strong>{t("emergencySupport")}</strong> {t("available247")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
