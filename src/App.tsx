import { HashRouter, Navigate, Route, Routes } from 'react-router'
import AuthGate from './auth/AuthGate'
import CoffeeHome from './coffee/CoffeeHome'
import NotBuiltYet from './components/NotBuiltYet'

// Where the bare site address goes. Change this one line when there is more than coffee.
const HOME = '/coffee'

export default function App() {
  return (
    <AuthGate>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Navigate to={HOME} replace />} />
          <Route path="/coffee" element={<CoffeeHome />} />
          <Route path="/coffee/brew" element={<NotBuiltYet />} />
          <Route path="/coffee/beans" element={<NotBuiltYet />} />
          <Route path="/coffee/recipes" element={<NotBuiltYet />} />
          <Route path="/coffee/history" element={<NotBuiltYet />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthGate>
  )
}
