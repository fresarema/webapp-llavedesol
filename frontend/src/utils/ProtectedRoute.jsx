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
        return <Navigate to="/" />; // No es admin, a la home
    }

    // 3. Comprueba el rol de tesorero
    if (role === 'tesorero' && !user.is_tesorero) {
        return <Navigate to="/" />; // No es tesorero, a la home
    }

    // 4. Si todo está bien, muestra la página solicitada
    return children;
};

export default ProtectedRoute;