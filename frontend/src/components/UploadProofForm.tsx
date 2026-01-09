import React, { useState } from 'react'
import { uploadPaymentProof } from '../api/payments'
import type { Payment } from '../api/payments'

export default function UploadProofForm({ payment, onUploaded }: { payment: Payment; onUploaded: (p: Payment) => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [note, setNote] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    if (!file) {
      setError('Please choose a file to upload')
      return
    }
    try {
      setUploading(true)
      setError(null)
      const updated = await uploadPaymentProof(payment.id, file, note || undefined)
      onUploaded(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 grid gap-2">
      <div className="flex items-center gap-2">
        <input
          data-testid="file-input"
          type="file"
          accept="image/*,application/pdf"
          onChange={(ev) => setFile(ev.target.files ? ev.target.files[0] : null)}
          disabled={uploading}
        />
        <button
          data-testid="upload-button"
          type="button"
          onClick={handleSubmit}
          disabled={uploading}
          className="inline-flex h-8 items-center rounded-md bg-sky-600 px-3 text-sm font-medium text-white"
        >
          {uploading ? 'Uploading…' : 'Upload proof'}
        </button>
      </div>
      <input
        className="text-sm rounded-md border px-2 py-1"
        placeholder="Optional note"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        disabled={uploading}
      />
      {error ? <div className="text-xs text-rose-700">{error}</div> : null}
    </form>
  )
}
