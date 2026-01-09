import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, vi, expect } from 'vitest'

vi.mock('../api/payments', () => ({ uploadPaymentProof: vi.fn() }))
import UploadProofForm from './UploadProofForm'
import { uploadPaymentProof } from '../api/payments'

describe('UploadProofForm extra', () => {
  it('shows error when submitting without file', () => {
    const onUploaded = vi.fn()
    render(<UploadProofForm payment={{ id: 1 } as any} onUploaded={onUploaded} />)

    const btn = screen.getByTestId('upload-button')
    fireEvent.click(btn)

    expect(screen.getByText(/Please choose a file to upload/i)).toBeTruthy()
    expect(uploadPaymentProof).not.toHaveBeenCalled()
  })

  it('file input accept attribute includes image and pdf', () => {
    render(<UploadProofForm payment={{ id: 1 } as any} onUploaded={() => {}} />)
    const input = screen.getByTestId('file-input') as HTMLInputElement
    expect(input.accept).toContain('image/*')
    expect(input.accept).toContain('application/pdf')
  })
})
