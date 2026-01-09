import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import UploadProofForm from './UploadProofForm'
import { vi } from 'vitest'


vi.mock('../api/payments', () => ({
  uploadPaymentProof: vi.fn(),
}))

import { uploadPaymentProof } from '../api/payments'

describe('UploadProofForm', () => {
  it('uploads file and calls onUploaded', async () => {
    const mockUpdated = { id: 1, proof_status: 'pending' }
    ;(uploadPaymentProof as unknown as any).mockResolvedValueOnce(mockUpdated)

    const onUploaded = vi.fn()

    render(<UploadProofForm payment={{ id: 1 } as any} onUploaded={onUploaded} />)

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
