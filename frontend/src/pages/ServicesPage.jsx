import React from 'react'
import { Link } from 'react-router-dom'

const CATEGORY_CARDS = [
  {
    title: 'Address Verification',
    description: 'Aadhaar card, passport, rental agreement',
    items: ['Aadhaar card', 'Passport', 'Rental agreement'],
  },
  {
    title: 'Employment Verification',
    description: 'Last 3 months payslips, appointment letter, relieving letter (per employment)',
    items: ['Payslips (3 months)', 'Appointment letter', 'Relieving letter'],
  },
  {
    title: 'Education Verification',
    description: 'Degrees, certificates, 10th marks sheet',
    items: ['Degree/Engineering/etc.', 'Education certificates', '10th marks sheet'],
  },
  {
    title: 'References',
    description: 'X colleagues, friends (as requested)',
    items: ['Provide reference details'],
  },
  {
    title: 'CV Validation',
    description: 'Upload detailed CV for validation',
    items: ['Detailed CV'],
  },
  {
    title: 'ID Verification',
    description: 'Govt ID, voter ID, Aadhaar, passport, 10th marks card',
    items: ['Govt ID', 'Voter ID', 'Aadhaar', 'Passport', '10th marks card'],
  },
  {
    title: 'Court Verification',
    description: 'PAN Card and 10th marks sheet',
    items: ['PAN Card', '10th marks sheet'],
  },
  {
    title: 'Drug Test',
    description: 'Sample as requested by diagnostic centre',
    items: ['Diagnostic centre request/report'],
  },
]

const ServiceCard = ({ title, description, items }) => (
  <div className="bg-white border rounded-lg p-6 shadow-sm h-full flex flex-col">
    <div className="flex-1">
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-3">{description}</p>
      {items?.length ? (
        <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
          {items.map((i) => <li key={i}>{i}</li>)}
        </ul>
      ) : null}
    </div>
    <div className="pt-4">
      <Link to="/dashboard" className="inline-block px-4 py-2 bg-cyan-700 text-white rounded-md hover:bg-cyan-800">Apply now</Link>
    </div>
  </div>
)

const ServicesPage = () => (
  <div className="container mx-auto px-4 py-12">
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-3xl font-bold">Verification Services</h1>
      <Link to="/dashboard" className="px-4 py-2 bg-cyan-700 text-white rounded-md hover:bg-cyan-800">Go to Dashboard</Link>
    </div>
    <p className="text-gray-600 mb-8">Choose a service to view requirements and start your request.</p>
    <div className="grid gap-6 md:grid-cols-3">
      {CATEGORY_CARDS.map((s) => <ServiceCard key={s.title} {...s} />)}
    </div>
  </div>
)

export default ServicesPage


