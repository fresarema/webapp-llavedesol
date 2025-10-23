import { createContext, useState, useContext } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AuthContext = createContext();

// Hook personalizado para usar el contexto fácilmente
export const useAuth = () => {
    return useContext(AuthContext);
};

// URL de tu API de Django
const API_URL = 'http://127.0.0.1:8000/api';

export const AuthProvider = ({ children }) => {
    // Intentamos leer el token de localStorage al iniciar
    const [authTokens, setAuthTokens] = useState(() => 
        localStorage.getItem('authTokens')
            ? JSON.parse(localStorage.getItem('authTokens'))
            : null
    );
    
    // El usuario se decodifica del token
    const [user, setUser] = useState(() => 
        localStorage.getItem('authTokens')
            ? jwtDecode(JSON.parse(localStorage.getItem('authTokens')).access)
            : null
    );

    const navigate = useNavigate();

    // Función de Login
    const loginUser = async (username, password) => {
        try {
            // 1. Llama a la API de Django (Paso 6 del backend)
            const response = await axios.post(`${API_URL}/token/`, {
                username: username,
                password: password,
            });

            if (response.status === 200) {
                const data = response.data;
                setAuthTokens(data);
                
                // 2. Decodifica el token para obtener los roles (Paso 4 del backend)
                const decodedUser = jwtDecode(data.access);
                setUser(decodedUser);
                
                // 3. Guarda en localStorage para persistir la sesión
                localStorage.setItem('authTokens', JSON.stringify(data));

                // 4. Redirige según el rol
                if (decodedUser.is_admin) {
                    navigate('/admin');
                } else if (decodedUser.is_tesorero) {
                    navigate('/tesorero');
                } else {
                    navigate('/'); // Si no tiene rol, a la home
                }
            }
        } catch (error) {
            console.error("Error en el login:", error);
            alert("Usuario o contraseña incorrectos");
        }
    };

    // Función de Logout
    const logoutUser = () => {
        navigate('/');
        setAuthTokens(null);
        setUser(null);
        localStorage.removeItem('authTokens');
        
    };

    // Los datos que compartiremos con toda la app
    const contextData = {
        user: user,
        authTokens: authTokens,
        loginUser: loginUser,
        logoutUser: logoutUser,
    };

    return (
        <AuthContext.Provider value={contextData}>
            {children}
        </AuthContext.Provider>
    );
};
