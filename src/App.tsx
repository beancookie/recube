import { useState } from 'react'
import { Home } from './pages/Home'
import { Solve } from './pages/Solve'

type Page = 'home' | 'solve'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home')

  return (
    <>
      {currentPage === 'home' && (
        <Home onStartSolve={() => setCurrentPage('solve')} />
      )}
      {currentPage === 'solve' && (
        <Solve onBack={() => setCurrentPage('home')} />
      )}
    </>
  )
}

export default App
