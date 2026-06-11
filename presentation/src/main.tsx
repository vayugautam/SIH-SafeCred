import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import Keycloak from 'keycloak-js'
import App from './App.tsx'
import './index.css'

// 1. Initialize React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

// 2. Initialize Keycloak
const keycloak = new Keycloak({
  url: 'http://localhost:8080',
  realm: 'safecred',
  clientId: 'safecred-frontend'
})

// Store auth state for use outside React tree (e.g. Axios interceptors)
export const kcInstance = keycloak;

// Temporary bypass of Keycloak until the Realm is configured
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster position="top-right" />
    </QueryClientProvider>
  </React.StrictMode>,
)
