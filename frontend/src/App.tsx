import AppRouter from './app/AppRouter'
import { AuthProvider } from './contexts/AuthContext'

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <AppRouter />
      </div>
    </AuthProvider>
  )
}
