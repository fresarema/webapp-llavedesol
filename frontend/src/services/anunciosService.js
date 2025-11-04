const API_URL = "http://127.0.0.1:8000/api/anuncios/";

// Función para obtener el token
function getAuthToken() {
    const tokens = localStorage.getItem('authTokens');
    if (tokens) {
        return JSON.parse(tokens).access;
    }
    return null;
}

export async function getAnuncios() {
    const token = getAuthToken();
    const headers = {
        "Content-Type": "application/json"
    };
    
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(API_URL, { headers });
    const data = await response.json();
    return data;
}

export async function createAnuncio(anuncio) {
    const token = getAuthToken();
    const headers = {
        "Content-Type": "application/json"
    };
    
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(API_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(anuncio)
    });
    return await response.json();
}

export async function deleteAnuncio(id) {
    const token = getAuthToken();
    if (!token) {
        throw new Error('No hay token de autenticación');
    }

    const response = await fetch(`${API_URL}${id}/`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error('Error al eliminar anuncio');
    }

    return true;
}

// NUEVA FUNCIÓN PARA EDITAR
export async function updateAnuncio(id, anuncio) {
    const token = getAuthToken();
    if (!token) {
        throw new Error('No hay token de autenticación');
    }

    const response = await fetch(`${API_URL}${id}/`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(anuncio)
    });

    if (!response.ok) {
        throw new Error('Error al actualizar anuncio');
    }

    return await response.json();
}