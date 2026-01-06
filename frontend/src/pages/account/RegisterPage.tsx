import { Link } from 'react-router-dom'

export default function RegisterPage() {
  return (
    <div className="mx-auto grid w-full max-w-md gap-4">
      <h1>Register</h1>
      <p className="text-sm text-slate-600 dark:text-slate-300">Starter page: connect to backend registration endpoint.</p>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          alert('TODO: register flow')
        }}
        className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"
      >
        <label className="grid gap-1">
          <span className="text-sm font-medium">Email</span>
          <input name="email" type="email" required />
        </label>

        <label className="grid gap-1">
          <span className="text-sm font-medium">Password</span>
          <input name="password" type="password" required />
        </label>

        <button type="submit" className="h-10 bg-sky-600 text-white hover:bg-sky-700 dark:bg-sky-600 dark:hover:bg-sky-500">
          Create account
        </button>
      </form>

      <div className="text-sm text-slate-600 dark:text-slate-300">
        Already have an account? <Link to="/account/login">Login</Link>
      </div>
    </div>
  )
}
