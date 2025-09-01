import React from 'react'

const PrivacyPage = () => {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
      <div className="space-y-4 text-gray-700">
        <p>We handle your data with strict confidentiality and comply with applicable data protection laws. Sensitive identifiers such as Aadhaar, PAN, and Passport numbers are masked when displayed.</p>
        <p>Documents you upload are stored securely and access is limited based on user roles. We never sell your data.</p>
        <p>For any privacy concerns, contact us at privacy@hireshield.in.</p>
      </div>
    </div>
  )
}

export default PrivacyPage


