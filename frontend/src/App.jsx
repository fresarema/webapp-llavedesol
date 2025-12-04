import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Importamos todas nuestras páginas
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import AdminView from './pages/AdminView';
import TesoreroView from './pages/TesoreroView';
import ProtectedRoute from './utils/ProtectedRoute';
import Donaciones from './components/Donaciones/mercado-pago';

function App() {
  return (
    // 1. Envolvemos todo en AuthProvider
    <AuthProvider>
      {/* 2. Definimos las rutas */}
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/donaciones" element={<Donaciones />} />

        {/* Rutas Protegidas */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute role="admin">
              <AdminView />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/tesorero" 
          element={
            <ProtectedRoute role="tesorero">
              <TesoreroView />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </AuthProvider>
  );
}

export default App;