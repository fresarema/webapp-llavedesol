const API_URL = "http://127.0.0.1:8000/api/libros-cuentas";

function getAuthToken() {
    const tokens = localStorage.getItem('authTokens');
    if (tokens) {
        return JSON.parse(tokens).access;
    }
    return null;
}

export async function getLibrosCuentas() {
    const token = getAuthToken();
    const headers = {
        "Content-Type": "application/json"
    };
    
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(API_URL + "/", { headers });
    
    if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
}

export async function createLibroCuenta(libroData) {
    const token = getAuthToken();
    if (!token) {
        throw new Error('No hay token de autenticación');
    }
    
    const formData = new FormData();
    formData.append('titulo', libroData.titulo);
    formData.append('descripcion', libroData.descripcion);
    formData.append('tipo', libroData.tipo);
    formData.append('fecha_periodo', libroData.fecha_periodo);
    formData.append('archivo', libroData.archivo);

    const response = await fetch(API_URL + "/", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`
        },
        body: formData
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error ${response.status}: ${JSON.stringify(errorData)}`);
    }

    return await response.json();
}

export async function updateLibroCuenta(id, libroData) {
    const token = getAuthToken();
    if (!token) {
        throw new Error('No hay token de autenticación');
    }
    
    const formData = new FormData();
    formData.append('titulo', libroData.titulo);
    formData.append('descripcion', libroData.descripcion);
    formData.append('tipo', libroData.tipo);
    formData.append('fecha_periodo', libroData.fecha_periodo);
    if (libroData.archivo) {
        formData.append('archivo', libroData.archivo);
    }

    const response = await fetch(`${API_URL}/${id}/`, {
        method: "PUT",
        headers: {
            "Authorization": `Bearer ${token}`
        },
        body: formData
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error ${response.status}: ${JSON.stringify(errorData)}`);
    }

    return await response.json();
}

export async function deleteLibroCuenta(id) {
    const token = getAuthToken();
    if (!token) {
        throw new Error('No hay token de autenticación');
    }

    const response = await fetch(`${API_URL}/${id}/`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return true;
}