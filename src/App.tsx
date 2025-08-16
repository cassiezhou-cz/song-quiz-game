import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className="container">
        <header className="header">
          <h1>🎵 Song Play for Playtests</h1>
          <p>Built with professional development workflows</p>
        </header>
        
        <main className="main">
          <section className="hero">
            <h2>🚀 Your Music Testing Platform is Ready!</h2>
            <p>This project includes:</p>
            <ul className="features">
              <li>✅ Production-ready CI/CD workflows</li>
              <li>✅ CRITICAL_CORE development principles</li>
              <li>✅ GitHub Issues workflow automation</li>
              <li>✅ Cost-optimized GitHub Actions</li>
              <li>✅ Security scanning and monitoring</li>
              <li>✅ React + TypeScript + Vite</li>
            </ul>
          </section>
          
          <section className="demo">
            <h3>🛠️ Demo Counter</h3>
            <div className="counter-card">
              <button onClick={() => setCount((count) => count + 1)}>
                count is {count}
              </button>
              <p>
                Edit <code>src/App.tsx</code> and save to test HMR
              </p>
            </div>
          </section>
          
          <section className="next-steps">
            <h3>🎯 Next Steps for Your Music App</h3>
            <ol>
              <li>Add audio player components</li>
              <li>Implement playlist management</li>
              <li>Create user feedback forms</li>
              <li>Add analytics for playtesting</li>
              <li>Follow CRITICAL_CORE principles in <code>rules/CRITICAL_CORE.mdc</code></li>
              <li>Use GitHub Issues for all development work</li>
            </ol>
          </section>
        </main>
        
        <footer className="footer">
          <p>Generated with <a href="https://github.com/seanacres/mindly-starter-template" target="_blank">Mindly Starter Template</a></p>
        </footer>
      </div>
    </>
  )
}

export default App
