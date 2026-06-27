import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './style.css'
import Home from './pages/Home'

// The 3D car world (Three.js, ~700KB) is code-split so it only loads on /rideit.
const RideIt = lazy(() => import('./pages/RideIt'))

const rideItFallback = (
  <div
    style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#070b15',
      color: '#00f2fe',
      fontFamily: 'monospace',
      letterSpacing: '0.1em',
    }}
  >
    Loading the world…
  </div>
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/rideit"
          element={
            <Suspense fallback={rideItFallback}>
              <RideIt />
            </Suspense>
          }
        />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
