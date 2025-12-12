import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

const dedupeById = (arr) => {
  const seen = new Set();
  const out = [];
  for (const item of arr) {
    if (!item) continue;
    const id = item.id ?? `${item.asunto ?? ''}-${item.creado_en ?? ''}`;
    if (!seen.has(id)) {
      seen.add(id);
      out.push(item);
    }
  }
  return out;
};

export const mensajesService = {
  // Trae mensajes donde userType es emisor (enviados) o destinatario (recibidos),
  // los combina y devuelve { data: [...] } para mantener compatibilidad.
  getMensajes: async (userType) => {
    try {
      // pedimos mensajes enviados por userType y mensajes dirigidos a userType
      const [resEnviados, resRecibidos] = await Promise.all([
        api.get(`/mensajes/?emisor_tipo=${userType}`),
        api.get(`/mensajes/?destinatario_tipo=${userType}`)
      ]);

      const enviados = Array.isArray(resEnviados.data) ? resEnviados.data : (resEnviados.data.results || []);
      const recibidos = Array.isArray(resRecibidos.data) ? resRecibidos.data : (resRecibidos.data.results || []);

      // combinar y deduplicar
      const combinado = dedupeById([...enviados, ...recibidos]);

      // Opcional: ordenar por fecha ascendente (o desc si prefieres)
      combinado.sort((a, b) => new Date(a.creado_en) - new Date(b.creado_en));

      return { data: combinado };
    } catch (error) {
      // fallback: si falla la consulta compuesta, intenta la lógica original según rol
      try {
        if (userType === 'ADMIN') return await api.get('/mensajes/?emisor_tipo=TESORERO');
        if (userType === 'TESORERO') return await api.get('/mensajes/?emisor_tipo=ADMIN');
        return await api.get('/mensajes/');
      } catch (e) {
        throw error;
      }
    }
  },

  createMensaje: (mensajeData) => api.post('/mensajes/', mensajeData),
  deleteMensaje: (mensajeId) => api.delete(`/mensajes/${mensajeId}/`)
};
