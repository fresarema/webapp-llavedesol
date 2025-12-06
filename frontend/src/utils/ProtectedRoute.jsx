import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, role }) => {
    const { user } = useAuth();

    // 1. Si no hay usuario, redirige a login
    if (!user) {
        return <Navigate to="/login" />;
    }

    // 2. Comprueba el rol de admin
    if (role === 'admin' && !user.is_admin) {
        // Redirige según el rol real del usuario
        if (user.is_tesorero) return <Navigate to="/tesorero" />;
        if (user.is_socio) return <Navigate to="/socio" />;
        return <Navigate to="/" />;
    }

    // 3. Comprueba el rol de tesorero
    if (role === 'tesorero' && !user.is_tesorero) {
        // Redirige según el rol real del usuario
        if (user.is_admin) return <Navigate to="/admin" />;
        if (user.is_socio) return <Navigate to="/socio" />;
        return <Navigate to="/" />;
    }

    // 4. NUEVO: Comprueba el rol de socio
    if (role === 'socio' && !user.is_socio) {
        // Redirige según el rol real del usuario
        if (user.is_admin) return <Navigate to="/admin" />;
        if (user.is_tesorero) return <Navigate to="/tesorero" />;
        return <Navigate to="/" />;
    }

    // 5. Si todo está bien, muestra la página solicitada
    return children;
};

export default ProtectedRoute;