import { HashRouter, Navigate, Route, Routes } from 'react-router'
import AuthGate from './auth/AuthGate'
import BackupScreen from './coffee/BackupScreen'
import BeanScreen from './coffee/BeanScreen'
import BeansScreen from './coffee/BeansScreen'
import BrewChooseScreen from './coffee/BrewChooseScreen'
import BrewScreen from './coffee/BrewScreen'
import CoffeeHome from './coffee/CoffeeHome'
import HistoryScreen from './coffee/HistoryScreen'
import MethodsScreen from './coffee/MethodsScreen'
import RecipeScreen from './coffee/RecipeScreen'
import RecipesScreen from './coffee/RecipesScreen'

// Where the bare site address goes. Change this one line when there is more than coffee.
const HOME = '/coffee'

export default function App() {
  return (
    <AuthGate>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Navigate to={HOME} replace />} />
          <Route path="/coffee" element={<CoffeeHome />} />
          <Route path="/coffee/brew" element={<BrewChooseScreen />} />
          <Route path="/coffee/brew/:recipeId/:beanId/:fromBrewId?" element={<BrewScreen />} />
          <Route path="/coffee/beans" element={<BeansScreen />} />
          <Route path="/coffee/beans/:id" element={<BeanScreen />} />
          <Route path="/coffee/methods" element={<MethodsScreen />} />
          <Route path="/coffee/recipes" element={<RecipesScreen />} />
          <Route path="/coffee/recipes/:id" element={<RecipeScreen />} />
          <Route path="/coffee/history/:brewId?" element={<HistoryScreen />} />
          <Route path="/coffee/backup" element={<BackupScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthGate>
  )
}
