import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './store'
import App from './App'
import './styles/main.scss'

// Capture the JWT that the backend appends as ?token= after the OAuth redirect.
// This runs synchronously before React renders so the token is in localStorage
// before ProtectedRoute dispatches checkAuth().
const _params = new URLSearchParams(window.location.search)
const _token = _params.get('token')
if (_token) {
  localStorage.setItem('token', _token)
  window.history.replaceState({}, '', window.location.pathname)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
)
