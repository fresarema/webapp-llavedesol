import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api';

export const cambiarPassword = async (data, token) => {
    try {
        const response = await axios.post(
            `${API_URL}/cambiar-password/`,
            data,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error cambiando contraseña:', error);
        throw error;
    }
};