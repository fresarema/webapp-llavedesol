import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

// Crear instancia de axios con interceptor para el token
const api = axios.create({
    baseURL: API_URL,
});

// Interceptor para agregar el token automáticamente
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export const mensajesService = {
    getMensajes: (userType) => {
        // CAMBIO: usar emisor_tipo en lugar de user_tipo
        if (userType === 'ADMIN') {
            return api.get('/mensajes/?emisor_tipo=TESORERO');
        } else if (userType === 'TESORERO') {
            return api.get('/mensajes/?emisor_tipo=ADMIN');
        }
        return api.get('/mensajes/');
    },
    createMensaje: (mensajeData) => {
        return api.post('/mensajes/', mensajeData);
    }
};