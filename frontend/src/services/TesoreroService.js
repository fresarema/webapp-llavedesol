// src/services/TesoreroService.js

// Definición de las URLs base
const BASE_API_URL = "http://127.0.0.1:8000/api/";
const LIBROS_CUENTAS_URL = BASE_API_URL + "libros-cuentas"; // /api/libros-cuentas
const DONACIONES_URL = BASE_API_URL + "donaciones";         // /api/donaciones


function getAuthToken() {
    const tokens = localStorage.getItem('authTokens');
    if (tokens) {
        return JSON.parse(tokens).access;
    }
    return null;
}

// ----------------------------------------------------
// FUNCIONES PARA DONACIONES
// ----------------------------------------------------

export async function getDonaciones(page = 1, limit = 10) {
    const token = getAuthToken();
    const headers = {
        "Content-Type": "application/json"
    };
    
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const url = new URL(DONACIONES_URL + "/");
    url.searchParams.append('page', page);
    url.searchParams.append('limit', limit);

    const response = await fetch(url.toString(), { headers }); 
    if (!response.ok) {
    }

    const data = await response.json();
    return data;
}


    // Funcion para exportar donaciones a archivo .xlsx
export async function exportarDonacionesAExcel() {
    const token = getAuthToken();
    const headers = {};

    if (!token) {
        throw new Error('No hay token de autenticación');
    }

    headers["Authorization"] = `Bearer ${token}`;

    const EXPORT_URL = DONACIONES_URL + "/exportar/";
    const response = await fetch(EXPORT_URL, { headers });
    if (!response.ok) {
        let errorBody = await response.text(); 
        try {
            errorBody = JSON.parse(errorBody);
        } catch (e) {
            // No es JSON
        }
        throw new Error(`Error ${response.status}: ${JSON.stringify(errorBody || response.statusText)}`);
    }
    
    // Devolvemos la respuesta para que el frontend pueda crear y descargar el archivo
    return response;
}

// ----------------------------------------------------
// FUNCIONES PARA LIBROS DE CUENTAS
// ----------------------------------------------------

export async function getLibrosCuentas() {
    const token = getAuthToken();
    const headers = {
        "Content-Type": "application/json"
    };
    
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    // Usamos la URL absoluta correcta: http://127.0.0.1:8000/api/libros-cuentas/
    const response = await fetch(LIBROS_CUENTAS_URL + "/", { headers }); 
    
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
    // Verificar que el archivo no sea nulo antes de adjuntar
    if (libroData.archivo) {
        formData.append('archivo', libroData.archivo);
    }


    const response = await fetch(LIBROS_CUENTAS_URL + "/", { // Usar URL base corregida
        method: "POST",
        headers: {
            // No Content-Type aquí, fetch lo añade automáticamente para FormData
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

    // Usar el método PATCH para actualizaciones parciales con FormData (más robusto)
    const response = await fetch(`${LIBROS_CUENTAS_URL}/${id}/`, {
        method: "PATCH", // Cambiado de PUT a PATCH
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

    const response = await fetch(`${LIBROS_CUENTAS_URL}/${id}/`, {
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