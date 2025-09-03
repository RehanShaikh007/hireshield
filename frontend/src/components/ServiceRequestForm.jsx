import React, { useMemo, useState } from 'react'
import { storage, db, auth } from '../firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { signInAnonymously } from 'firebase/auth'

const SERVICES = {
  address: {
    label: 'Address Verification',
    description: 'Upload proof of address documents.',
    documents: [
      { key: 'aadhaar', label: 'Aadhaar Card', multiple: false },
      { key: 'passport', label: 'Passport', multiple: false },
      { key: 'rentalAgreement', label: 'Rental Agreement', multiple: false },
    ],
  },
  employment: {
    label: 'Employment Verification',
    description: 'Provide past employment proofs. You can add multiple employments.',
    repeatableGroup: {
      key: 'employments',
      label: 'Employment',
      fields: [
        { key: 'payslips', label: 'Last 3 Months Payslips', multiple: true },
        { key: 'appointmentLetter', label: 'Appointment Letter', multiple: false },
        { key: 'relievingLetter', label: 'Relieving Letter', multiple: false },
      ],
    },
  },
  education: {
    label: 'Education Verification',
    description: 'Upload education certificates and marksheets.',
    documents: [
      { key: 'certificates', label: 'Education Certificates (Degree/Diploma/etc.)', multiple: true },
      { key: 'tenthMarks', label: '10th Marks Sheet', multiple: false },
    ],
  },
  references: {
    label: 'References Verification',
    description: 'Provide references details and any supporting documents.',
    extraFields: [
      { key: 'numReferences', type: 'number', label: 'Number of references (colleagues/friends)', min: 1, max: 10 },
    ],
  },
  cv: {
    label: 'CV Validation',
    description: 'Upload detailed CV for validation.',
    documents: [
      { key: 'cvDocument', label: 'Detailed CV', multiple: false },
    ],
  },
  id: {
    label: 'ID Verification',
    description: 'Upload government issued ID documents.',
    documents: [
      { key: 'govtId', label: 'Govt ID (driver license/etc.)', multiple: false },
      { key: 'voterId', label: 'Voter ID', multiple: false },
      { key: 'aadhaar', label: 'Aadhaar Card', multiple: false },
      { key: 'passport', label: 'Passport', multiple: false },
      { key: 'tenthMarks', label: '10th Marks Card', multiple: false },
    ],
  },
  court: {
    label: 'Court Verification',
    description: 'Upload PAN card and 10th marks sheet.',
    documents: [
      { key: 'pan', label: 'PAN Card', multiple: false },
      { key: 'tenthMarks', label: '10th Marks Sheet', multiple: false },
    ],
  },
  drug: {
    label: 'Drug Test',
    description: 'Upload diagnostic centre sample request or report as applicable.',
    documents: [
      { key: 'sample', label: 'Diagnostic Centre Request/Report', multiple: false },
    ],
  },
}

const FileInput = ({ id, label, multiple, onChange }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor={id}>{label}</label>
    <input
      id={id}
      type="file"
      multiple={!!multiple}
      onChange={(e) => onChange(multiple ? Array.from(e.target.files || []) : e.target.files?.[0] || null)}
      className="block w-full text-sm text-gray-700 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100"
    />
  </div>
)

const ServiceRequestForm = () => {
  const { user } = useAuth()
  const [serviceKey, setServiceKey] = useState('address')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formState, setFormState] = useState({})

  const current = useMemo(() => SERVICES[serviceKey], [serviceKey])

  const handleDocumentChange = (docKey, value) => {
    setFormState((prev) => ({ ...prev, [docKey]: value }))
  }

  const addEmployment = () => {
    setFormState((prev) => ({ ...prev, employments: [ ...(prev.employments || []), {} ] }))
  }

  const updateEmployment = (index, fieldKey, value) => {
    setFormState((prev) => {
      const list = [...(prev.employments || [])]
      list[index] = { ...(list[index] || {}), [fieldKey]: value }
      return { ...prev, employments: list }
    })
  }

  const removeEmployment = (index) => {
    setFormState((prev) => {
      const list = [...(prev.employments || [])]
      list.splice(index, 1)
      return { ...prev, employments: list }
    })
  }

  const resolveUserId = () => user?._id || user?.id || user?.email || 'anonymous'

  const uploadFileOrFiles = async (basePath, key, fileOrFiles) => {
    if (!fileOrFiles) return null
    if (Array.isArray(fileOrFiles)) {
      const urls = []
      for (const file of fileOrFiles) {
        const fileRef = ref(storage, `${basePath}/${key}/${Date.now()}-${file.name}`)
        await uploadBytes(fileRef, file)
        urls.push(await getDownloadURL(fileRef))
      }
      return urls
    } else {
      const file = fileOrFiles
      const fileRef = ref(storage, `${basePath}/${key}/${Date.now()}-${file.name}`)
      await uploadBytes(fileRef, file)
      return await getDownloadURL(fileRef)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) {
      toast.error('Please log in to submit a request.')
      return
    }
    setSubmitting(true)
    try {
      // Ensure Firebase Auth session exists for Storage Rules
      if (!auth.currentUser) {
        try {
          await signInAnonymously(auth)
        } catch (authErr) {
          console.error('Anonymous sign-in failed:', authErr)
        }
      }

      const uid = resolveUserId()
      const basePath = `users/${uid}/${serviceKey}/${Date.now()}`
      const payload = { serviceKey, notes: notes || '', userId: uid, status: 'submitted', createdAt: serverTimestamp() }

      if (current.documents) {
        for (const doc of current.documents) {
          payload[doc.key] = await uploadFileOrFiles(basePath, doc.key, formState[doc.key])
        }
      }

      if (current.repeatableGroup?.key === 'employments') {
        const items = []
        for (const [index, emp] of (formState.employments || []).entries()) {
          const empBase = `${basePath}/employment_${index + 1}`
          const record = {}
          for (const f of current.repeatableGroup.fields) {
            record[f.key] = await uploadFileOrFiles(empBase, f.key, emp?.[f.key])
          }
          items.push(record)
        }
        payload.employments = items
      }

      if (current.extraFields) {
        for (const f of current.extraFields) {
          payload[f.key] = formState[f.key] ?? null
        }
      }

      await addDoc(collection(db, 'serviceRequests'), payload)
      toast.success('Request submitted successfully!')
      setFormState({})
      setNotes('')
    } catch (err) {
      console.error(err)
      toast.error('Failed to submit request.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Apply for Verification</h3>
      <p className="text-sm text-gray-600 mb-4">Select a service and upload required documents.</p>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
          <select
            value={serviceKey}
            onChange={(e) => { setServiceKey(e.target.value); setFormState({}) }}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
          >
            {Object.entries(SERVICES).map(([key, svc]) => (
              <option key={key} value={key}>{svc.label}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">{current.description}</p>
        </div>

        {/* Static documents */}
        {current.documents && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {current.documents.map((doc) => (
              <FileInput
                key={doc.key}
                id={`${serviceKey}-${doc.key}`}
                label={doc.label}
                multiple={doc.multiple}
                onChange={(val) => handleDocumentChange(doc.key, val)}
              />
            ))}
          </div>
        )}

        {/* Repeatable employment section */}
        {current.repeatableGroup?.key === 'employments' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Employment Items</h4>
              <button type="button" onClick={addEmployment} className="px-3 py-1.5 bg-cyan-600 text-white rounded-md hover:bg-cyan-700">Add Employment</button>
            </div>
            {(formState.employments || []).map((emp, idx) => (
              <div key={idx} className="border rounded-md p-3 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {current.repeatableGroup.fields.map((f) => (
                    <FileInput
                      key={f.key}
                      id={`emp-${idx}-${f.key}`}
                      label={f.label}
                      multiple={f.multiple}
                      onChange={(val) => updateEmployment(idx, f.key, val)}
                    />
                  ))}
                </div>
                <div className="flex justify-end">
                  <button type="button" onClick={() => removeEmployment(idx)} className="px-3 py-1.5 bg-red-100 text-red-700 rounded-md hover:bg-red-200">Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Extra fields */}
        {current.extraFields && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {current.extraFields.map((f) => (
              <div key={f.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                <input
                  type={f.type || 'text'}
                  min={f.min}
                  max={f.max}
                  value={formState[f.key] ?? ''}
                  onChange={(e) => setFormState((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            ))}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            placeholder="Any additional information for the verifier"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-cyan-700 text-white rounded-md hover:bg-cyan-800 disabled:opacity-60"
          >
            {submitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ServiceRequestForm


