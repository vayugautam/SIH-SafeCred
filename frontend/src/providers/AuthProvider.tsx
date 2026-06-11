import React, { useEffect, useState } from 'react';
import Keycloak from 'keycloak-js';
import { useAuthStore } from '../stores';

interface AuthProviderProps {
  children: React.ReactNode;
}

const keycloakConfig = {
  url: 'http://localhost:8080/auth',
  realm: 'safecred',
  clientId: 'safecred-frontend'
};

const keycloak = new Keycloak(keycloakConfig);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);
  
  useEffect(() => {
    // Development Mode Fallback Bypass
    if (import.meta.env.VITE_AUTH_MODE === 'development') {
      console.warn("Auth Provider running in DEVELOPMENT mode. Bypassing Keycloak.");
      const devRoles = localStorage.getItem('dev_roles') || 'OFFICER,ADMIN';
      setAuth('mock_token', devRoles.split(','), { name: 'Dev User' });
      setIsInitialized(true);
      return;
    }

    // Production Keycloak Flow
    keycloak.init({ onLoad: 'login-required', checkLoginIframe: false }).then((authenticated) => {
      if (authenticated && keycloak.token) {
        // Extract realm roles safely
        const roles = keycloak.realmAccess?.roles || [];
        setAuth(keycloak.token, roles, keycloak.tokenParsed);
        
        // Setup silent refresh
        keycloak.onTokenExpired = () => {
          keycloak.updateToken(30).then((refreshed) => {
             if (refreshed && keycloak.token) {
                 setAuth(keycloak.token, keycloak.realmAccess?.roles || [], keycloak.tokenParsed);
             }
          }).catch(() => {
             keycloak.login();
          });
        };
      }
      setIsInitialized(true);
    }).catch(err => {
      console.error("Keycloak Init Failed", err);
      // In a real app we'd show a branded error boundary here
      setIsInitialized(true);
    });
  }, [setAuth]);

  if (!isInitialized) {
    return <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">Loading Secure Environment...</div>;
  }

  return <>{children}</>;
};
