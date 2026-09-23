import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.jsx'

// Instalowana na iPhonie aplikacja bywa "wznawiana" z pamięci zamiast ładowana
// od nowa, więc stara wersja potrafi utknąć w karcie mimo wdrożenia nowej.
// Wymuszamy przeładowanie, gdy tylko nowy service worker przejmie kontrolę,
// i sprawdzamy dostępność aktualizacji co minutę, gdy karta jest otwarta.
registerSW({
  immediate: true,
  onRegisteredSW(_url, registration) {
    if (registration) {
      setInterval(() => registration.update(), 60_000)
    }
  },
})

if ('serviceWorker' in navigator) {
  let reloaded = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloaded) return
    reloaded = true
    window.location.reload()
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
