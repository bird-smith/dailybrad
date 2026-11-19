// One plain sentence when something couldn't load or save. Calm ink, no red.
export default function ErrorLine({ message, className = '' }: { message: string; className?: string }) {
  if (!message) return null
  return (
    <p role="alert" className={`text-ink ${className}`}>
      {message}
    </p>
  )
}
