import React from 'react'
import { useLanguage } from '../context/LanguageContext'

const AboutPage = () => {
  const { t } = useLanguage();
  return (
    <div className="relative">
      {/* Background blur effects matching Team page */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-cyan-300/30 blur-3xl"/>
        <div className="absolute top-1/2 -right-20 h-64 w-64 rounded-full bg-teal-200/30 blur-3xl"/>
        <div className="absolute bottom-0 left-1/3 h-48 w-48 rounded-full bg-cyan-200/20 blur-3xl"/>
      </div>
      
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2">{t('aboutTitle')}</h1>
        <p className="text-gray-600 mb-8 max-w-4xl">
          Hiresheild is a fast-growing startup revolutionizing the background verification landscape with smart, scalable, and secure solutions. Founded in 2025 and headquartered in Bengaluru, Hiresheild was born out of a vision to simplify trust-building in hiring and onboarding processes for modern businesses. By combining automation, AI-driven analytics, and a mobile-first approach, Hiresheild delivers rapid, reliable, and compliant verification services tailored for startups, SMEs, and enterprise clients.
        </p>

        {/* Hero section with gradient background */}
        <div className="mb-8 rounded-2xl p-6 md:p-8 bg-gradient-to-r from-cyan-700 to-teal-600 text-white shadow">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="max-w-3xl">
              <h2 className="text-xl md:text-2xl font-semibold mb-1">Building trust through innovation</h2>
              <p className="text-white/90">
                We're on a mission to transform how organizations verify and trust their people, making the process faster, more secure, and completely transparent.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                <a href="/contact" className="inline-flex items-center justify-center rounded-md bg-white px-4 py-2 text-cyan-800 font-medium hover:bg-cyan-50 transition-colors">
                  Get Started
                </a>
                <a href="/services" className="inline-flex items-center justify-center rounded-md border border-white/40 px-4 py-2 text-white font-medium hover:bg-white/10 transition-colors">
                  Our Services
                </a>
              </div>
              <div className="flex justify-center md:justify-end">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse"></span>
                  Trusted by 100+ companies
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Mission, Vision, Values cards with enhanced styling */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <div className="group relative rounded-xl p-[1px] bg-gradient-to-b from-cyan-200 to-teal-200">
            <div className="h-full w-full rounded-xl bg-white p-6 shadow-sm transition-transform duration-200 group-hover:-translate-y-0.5">
              <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-cyan-600 to-teal-500 text-white flex items-center justify-center text-lg font-semibold shadow mb-4">
                🎯
              </div>
              <h3 className="font-semibold text-gray-900 text-center mb-3">Mission</h3>
              <p className="text-sm text-gray-600 text-center">
                To make background verification seamless, transparent, and accessible for every organization—regardless of size or industry.
              </p>
            </div>
          </div>
          
          <div className="group relative rounded-xl p-[1px] bg-gradient-to-b from-cyan-200 to-teal-200">
            <div className="h-full w-full rounded-xl bg-white p-6 shadow-sm transition-transform duration-200 group-hover:-translate-y-0.5">
              <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-cyan-600 to-teal-500 text-white flex items-center justify-center text-lg font-semibold shadow mb-4">
                🔮
              </div>
              <h3 className="font-semibold text-gray-900 text-center mb-3">Vision</h3>
              <p className="text-sm text-gray-600 text-center">
                To become the most agile and trusted background verification partner for the digital-first economy.
              </p>
            </div>
          </div>
          
          <div className="group relative rounded-xl p-[1px] bg-gradient-to-b from-cyan-200 to-teal-200">
            <div className="h-full w-full rounded-xl bg-white p-6 shadow-sm transition-transform duration-200 group-hover:-translate-y-0.5">
              <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-cyan-600 to-teal-500 text-white flex items-center justify-center text-lg font-semibold shadow mb-4">
                ⭐
              </div>
              <h3 className="font-semibold text-gray-900 text-center mb-3">Values</h3>
              <p className="text-sm text-gray-600 text-center">
                Privacy, security, transparency, and customer success drive everything we do.
              </p>
            </div>
          </div>
        </div>

        {/* Additional company info section */}
        <div className="rounded-2xl p-6 md:p-8 bg-gradient-to-br from-cyan-50 to-teal-50 border border-cyan-100">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Why Choose Hiresheild?</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-cyan-600 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                🚀
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Fast & Efficient</h4>
                <p className="text-sm text-gray-600">AI-powered verification that's 10x faster than traditional methods</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                🔒
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Secure & Compliant</h4>
                <p className="text-sm text-gray-600">Enterprise-grade security with full regulatory compliance</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-cyan-600 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                📱
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Mobile-First</h4>
                <p className="text-sm text-gray-600">Built for the modern workforce with seamless mobile experience</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                🎯
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Scalable Solution</h4>
                <p className="text-sm text-gray-600">Grows with your business from startup to enterprise</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AboutPage


