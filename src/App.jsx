import { useState } from 'react'
import MultiplicationTeacher from './MultiplicationTeacher'
import AdditionTeacher from './AdditionTeacher'
import SubtractionTeacher from './SubtractionTeacher'
import DivisionTeacher from './DivisionTeacher'
import './App.css'

function App() {
  const [currentView, setCurrentView] = useState('multiplication')

  const renderContent = () => {
    switch(currentView) {
      case 'addition':
        return <AdditionTeacher />
      case 'subtraction':
        return <SubtractionTeacher />
      case 'multiplication':
        return <MultiplicationTeacher />
      case 'division':
        return <DivisionTeacher />
      default:
        return <MultiplicationTeacher />
    }
  }

  return (
    <div className="app">
      <nav className="main-nav">
        <h1 className="app-title">Vilhelms Matte-App</h1>
        <div className="nav-buttons">
          <button 
            className={`nav-btn ${currentView === 'addition' ? 'active' : ''}`}
            onClick={() => setCurrentView('addition')}
          >
            <span className="nav-icon">+</span>
            <span className="nav-label">Addition</span>
          </button>
          <button 
            className={`nav-btn ${currentView === 'subtraction' ? 'active' : ''}`}
            onClick={() => setCurrentView('subtraction')}
          >
            <span className="nav-icon">−</span>
            <span className="nav-label">Subtraktion</span>
          </button>
          <button 
            className={`nav-btn ${currentView === 'multiplication' ? 'active' : ''}`}
            onClick={() => setCurrentView('multiplication')}
          >
            <span className="nav-icon">×</span>
            <span className="nav-label">Multiplikation</span>
          </button>
          <button 
            className={`nav-btn ${currentView === 'division' ? 'active' : ''}`}
            onClick={() => setCurrentView('division')}
          >
            <span className="nav-icon">÷</span>
            <span className="nav-label">Division</span>
          </button>
        </div>
      </nav>
      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  )
}

export default App
