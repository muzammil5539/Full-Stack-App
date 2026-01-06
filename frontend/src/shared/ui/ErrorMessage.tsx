export default function ErrorMessage({ message }: { message: string }) {
  return (
    <p style={{ margin: 0, color: 'crimson' }} role="alert">
      {message}
    </p>
  )
}
