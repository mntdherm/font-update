import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SupportProvider } from './contexts/SupportContext';
import AppRoutes from './routes.tsx';

function App() {
  return (
    <AuthProvider>
      <SupportProvider>
        <Router>
          <AppRoutes />
        </Router>
      </SupportProvider>
    </AuthProvider>
  );
}


export default App
