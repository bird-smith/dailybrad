import { useNavigate } from 'react-router'

// Placeholder for any part of the site that isn't built yet.
export default function NotBuiltYet() {
  const navigate = useNavigate()
  return (
    <main className="screen-in mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-12">
      <p className="font-serif text-2xl">This part isn't built yet.</p>
      <button
        type="button"
        // Opened straight from an address, there is nothing to go back to: go home instead.
        onClick={() => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/'))}
        className="press mt-6 h-12 self-start text-muted underline underline-offset-4"
      >
        Back
      </button>
    </main>
  )
}
