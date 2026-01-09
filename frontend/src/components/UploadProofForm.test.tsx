import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import UploadProofForm from './UploadProofForm'
import { vi } from 'vitest'


vi.mock('../api/payments', () => ({
  uploadPaymentProof: vi.fn(),
}))

import { uploadPaymentProof, type Payment } from '../api/payments'

describe('UploadProofForm', () => {
  it('uploads file and calls onUploaded', async () => {
    const mockUpdated = {
      id: 1,
      order: 1,
      payment_method: 'cash_on_delivery',
      status: 'pending',
      amount: '0.00',
      payment_date: new Date().toISOString(),
      proof_status: 'pending',
    }
    // use vitest typed mock helper
    vi.mocked(uploadPaymentProof).mockResolvedValueOnce(mockUpdated)

    const onUploaded = vi.fn()

    render(<UploadProofForm payment={{ id: 1 } as Payment} onUploaded={onUploaded} />)

    const file = new File(['abc'], 'proof.png', { type: 'image/png' })
    const input = screen.getByTestId('file-input') as HTMLInputElement
    Object.defineProperty(input, 'files', { value: [file] })
    fireEvent.change(input)

    const btn = screen.getByTestId('upload-button')
    fireEvent.click(btn)

    await waitFor(() => expect(uploadPaymentProof).toHaveBeenCalled())
    expect(onUploaded).toHaveBeenCalledWith(mockUpdated)
  })
})
