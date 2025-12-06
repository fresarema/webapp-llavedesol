import { createContext, useState, useContext } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

const API_URL = 'http://127.0.0.1:8000/api';

export const AuthProvider = ({ children }) => {
    const [authTokens, setAuthTokens] = useState(() => 
        localStorage.getItem('authTokens')
            ? JSON.parse(localStorage.getItem('authTokens'))
            : null
    );
    
    const [user, setUser] = useState(() => 
        localStorage.getItem('authTokens')
            ? jwtDecode(JSON.parse(localStorage.getItem('authTokens')).access)
            : null
    );

    const navigate = useNavigate();

    // Función de Login - VERSIÓN MEJORADA (MANTIENE TODO LO QUE FUNCIONA)
    const loginUser = async (username, password) => {
        try {
            const response = await axios.post(`${API_URL}/token/`, {
                username: username,
                password: password,
            });

            if (response.status === 200) {
                const data = response.data;
                setAuthTokens(data);
                
                const decodedUser = jwtDecode(data.access);
                setUser(decodedUser);
                
                localStorage.setItem('authTokens', JSON.stringify(data));

                // ✅ MANTENIENDO LA LÓGICA ORIGINAL DE REDIRECCIÓN
                if (decodedUser.is_admin) {
                    navigate('/admin');
                } else if (decodedUser.is_tesorero) {
                    navigate('/tesorero');
                } else if (decodedUser.is_socio) {
                    navigate('/socio');
                } else {
                    navigate('/');
                }
            }
        } catch (error) {
            console.error("Error en el login:", error);
            
            // ✅ MEJOR FEEDBACK (SOLO AGREGANDO ESTO)
            if (error.response) {
                if (error.response.status === 401) {
                    const errorMsg = error.response.data?.detail || "";
                    
                    // Detectar si es usuario inactivo
                    if (errorMsg.toLowerCase().includes('inactivo') || 
                        errorMsg.toLowerCase().includes('active') ||
                        errorMsg.toLowerCase().includes('no active')) {
                        alert("⚠️ Usuario inactivo. Contacta al administrador para activar tu cuenta.");
                    } else {
                        alert("Usuario o contraseña incorrectos");
                    }
                } else if (error.response.status === 400) {
                    alert("Datos inválidos. Verifica usuario y contraseña.");
                } else {
                    alert(`Error del servidor (${error.response.status})`);
                }
            } else if (error.request) {
                alert("No hay respuesta del servidor. Verifica tu conexión.");
            } else {
                alert("Error de conexión. Intenta nuevamente.");
            }
        }
    };

    // Función de Logout - SIN CAMBIOS
    const logoutUser = () => {
        navigate('/');
        setAuthTokens(null);
        setUser(null);
        localStorage.removeItem('authTokens');
    };

    // Función para obtener tipo de usuario - SIN CAMBIOS
    const getUserType = () => {
        if (!user) return null;
        if (user.is_admin) return 'admin';
        if (user.is_tesorero) return 'tesorero';
        if (user.is_socio) return 'socio';
        return null;
    };

    const contextData = {
        user: user,
        userType: getUserType(),
        authTokens: authTokens,
        loginUser: loginUser,
        logoutUser: logoutUser,
        getUserType: getUserType,
    };

    return (
        <AuthContext.Provider value={contextData}>
            {children}
        </AuthContext.Provider>
    );
};