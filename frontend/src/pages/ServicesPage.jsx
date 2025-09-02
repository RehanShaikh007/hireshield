import React from "react";
import { useLanguage } from "../context/LanguageContext";

const ServiceCard = ({ title, description }) => (
  <div className="bg-white border rounded-lg p-6 shadow-sm">
    <h3 className="font-semibold mb-2">{title}</h3>
    <p className="text-sm text-gray-600">{description}</p>
  </div>
);

const ServicesPage = () => {
  const { t } = useLanguage();
  const services = [
    {
      title: t("aadhaarVerification"),
      description: t("aadhaarVerificationDesc"),
    },
    { title: t("panVerification"), description: t("panVerificationDesc") },
    {
      title: t("passportVerification"),
      description: t("passportVerificationDesc"),
    },
    { title: t("employmentChecks"), description: t("employmentChecksDesc") },
    {
      title: t("addressVerification"),
      description: t("addressVerificationDesc"),
    },
    {
      title: t("criminalRecordsCheck"),
      description: t("criminalRecordsCheckDesc"),
    },
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-4">{t("servicesTitle")}</h1>
      <p className="text-gray-600 mb-8">{t("servicesSubtitle")}</p>
      <div className="grid gap-6 md:grid-cols-3">
        {services.map((s) => (
          <ServiceCard key={s.title} {...s} />
        ))}
      </div>
    </div>
  );
};

export default ServicesPage;
