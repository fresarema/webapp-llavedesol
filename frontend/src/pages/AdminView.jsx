import React, { useEffect, useState } from 'react';
import axios from 'axios'; 
import { useAuth } from '../context/AuthContext'; 
import { getAnuncios, createAnuncio, deleteAnuncio, updateAnuncio } from "../services/anunciosService";
import { getLibrosCuentas, deleteLibroCuenta } from "../services/TesoreroService";
import MensajesPanel from "../components/MensajesPanel/MensajesPanel"; 
import Calendario from "../components/Calendario/Calendario"; 
import Fondo from "../assets/fondo.png";
import Logo from "../assets/Logo.png";
import Swal from 'sweetalert2';

function AdminView() {
    const { user, logoutUser } = useAuth();

    // --- ESTADOS EXISTENTES ---
    const [anuncios, setAnuncios] = useState([]);
    const [paginaAnuncios, setPaginaAnuncios] = useState(1);
    const anunciosPorPagina = 4;
    const [librosCuentas, setLibrosCuentas] = useState([]);
    const [mensajesContacto, setMensajesContacto] = useState([]);
    const [eventosCalendario, setEventosCalendario] = useState([]);
    const [solicitudesIngreso, setSolicitudesIngreso] = useState([]);
    const [cargandoCalendario, setCargandoCalendario] = useState(true);
    const [cargandoSolicitudes, setCargandoSolicitudes] = useState(false);
    const [titulo, setTitulo] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [imagen, setImagen] = useState("");
    const [mostrarForm, setMostrarForm] = useState(false);
    const [editandoId, setEditandoId] = useState(null);
    const [loadingLibros, setLoadingLibros] = useState(true);
    const [mensajeSeleccionado, setMensajeSeleccionado] = useState(null);
    const [paginaActual, setPaginaActual] = useState(1);
    const mensajesPorPagina = 10;
    const [seccionActiva, setSeccionActiva] = useState('anuncios');
    const [filtroBusqueda, setFiltroBusqueda] = useState('');
    const [filtroFecha, setFiltroFecha] = useState('');
    const [filtroOrden, setFiltroOrden] = useState('recientes');
    const [paginaSolicitudes, setPaginaSolicitudes] = useState(1);
    const solicitudesPorPagina = 5; 
    const [tabActiva, setTabActiva] = useState('PENDIENTES'); 
    const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);

    useEffect(() => {
      cargarAnuncios();
      cargarLibrosCuentas();
      cargarMensajesContacto();
      cargarEventosCalendario();
      cargarSolicitudesIngreso();
    }, []);

    // ... FUNCIONES DE CARGA Y LÓGICA

    const cargarAnuncios = async () => {
        const data = await getAnuncios();
        setAnuncios(data);
    };

    const cargarLibrosCuentas = async () => {
        try {
            const data = await getLibrosCuentas();
            setLibrosCuentas(data);
        } catch (error) {
            console.error("Error al cargar libros de cuentas:", error);
        } finally {
            setLoadingLibros(false);
        }
    };

    const cargarMensajesContacto = async () => {
        try {
            const response = await axios.get('http://127.0.0.1:8000/api/contacto/');
            setMensajesContacto(response.data);
        } catch (error) {
            console.error("Error cargando mensajes de contacto", error);
        }
    };

    const cargarEventosCalendario = async () => {
        try {
            const authTokens = JSON.parse(localStorage.getItem('authTokens'));
            const token = authTokens?.access;

            if (!token) {
                setCargandoCalendario(false);
                return;
            }

            const response = await axios.get('http://127.0.0.1:8000/api/eventos-calendario/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEventosCalendario(response.data);
        } catch (error) {
            console.error("Error cargando eventos:", error);
        } finally {
            setCargandoCalendario(false);
        }
    };

    const cargarSolicitudesIngreso = async () => {
        try {
            setCargandoSolicitudes(true);
            let authTokens = localStorage.getItem('authTokens') ? JSON.parse(localStorage.getItem('authTokens')) : null;

            if (!authTokens) {
                console.error("No hay token de acceso.");
                setCargandoSolicitudes(false);
                return;
            }

            const response = await axios.get('http://127.0.0.1:8000/api/admin/solicitudes/', {
                headers: { 'Authorization': `Bearer ${authTokens.access}` }
            });

            const solicitudesConPassword = response.data.map(solicitud => ({
                ...solicitud,
                password_generada: solicitud.password_generada || null
            }));

            setSolicitudesIngreso(solicitudesConPassword);
        } catch (error) {
            console.error("Error cargando solicitudes:", error);
            if (error.response?.status === 401) {
                Swal.fire({
                    icon: "error",
                    title: "Sesión expirada",
                    text: "Tu sesión ha expirado. Por favor, inicia sesión nuevamente."
                }).then(() => {
                    logoutUser();
                });
            }
        } finally {
            setCargandoSolicitudes(false);
        }
    };

    const guardarEventoCalendario = async (eventoData) => {
        try {
            const authTokens = JSON.parse(localStorage.getItem('authTokens'));
            const token = authTokens?.access;

            if (eventoData.id) {
                await axios.put(
                    `http://127.0.0.1:8000/api/eventos-calendario/${eventoData.id}/`,
                    eventoData,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                Swal.fire("Éxito", "Evento actualizado", "success");
            } else {
                await axios.post(
                    'http://127.0.0.1:8000/api/eventos-calendario/',
                    eventoData,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                Swal.fire("Éxito", "Evento creado", "success");
            }
            cargarEventosCalendario();
            return true;
        } catch (error) {
            console.error("Error guardando evento:", error);
            Swal.fire("Error", "No se pudo guardar el evento", "error");
            throw error;
        }
    };

    const eliminarEventoCalendario = async (id) => {
        const result = await Swal.fire({
            title: "¿Eliminar evento?",
            text: "Esta acción no se puede deshacer.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar"
        });

        if (!result.isConfirmed) return;

        try {
            const authTokens = JSON.parse(localStorage.getItem('authTokens'));
            const token = authTokens?.access;

            await axios.delete(
                `http://127.0.0.1:8000/api/eventos-calendario/${id}/`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            Swal.fire("Eliminado", "El evento ha sido eliminado.", "success");
            cargarEventosCalendario();
            return true;
        } catch (error) {
            console.error("Error eliminando evento:", error);
            Swal.fire("Error", "No se pudo eliminar el evento.", "error");
            throw error;
        }
    };

    const handleEliminarMensaje = async (id) => {
        const result = await Swal.fire({
            title: "¿Eliminar mensaje?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Sí, eliminar"
        });

        if (!result.isConfirmed) return;

        try {
            await axios.delete(`http://127.0.0.1:8000/api/contacto/${id}/`);
            setMensajesContacto(mensajesContacto.filter(msg => msg.id !== id));
            Swal.fire("Eliminado", "Mensaje eliminado correctamente.", "success");
        } catch (error) {
            console.error("Error borrando mensaje", error);
            Swal.fire("Error", "No se pudo eliminar el mensaje.", "error");
        }
    };

    const handleEliminar = async (id, titulo) => {
        const result = await Swal.fire({
            title: "¿Eliminar anuncio?",
            html: `¿Estás seguro de eliminar el anuncio <strong>"${titulo}"</strong>?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Sí, eliminar"
        });

        if (!result.isConfirmed) return;

        try {
            await deleteAnuncio(id);
            setAnuncios(anuncios.filter(a => a.id !== id));
            Swal.fire("Eliminado", "Anuncio eliminado correctamente.", "success");
        } catch (error) {
            console.error("Error al eliminar anuncio:", error);
            Swal.fire("Error", "No se pudo eliminar el anuncio.", "error");
        }
    };

    const handleEliminarLibro = async (id, titulo) => {
        const result = await Swal.fire({
            title: "¿Eliminar libro?",
            html: `¿Estás seguro de eliminar el libro <strong>"${titulo}"</strong>?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Sí, eliminar"
        });

        if (!result.isConfirmed) return;

        try {
            await deleteLibroCuenta(id);
            setLibrosCuentas(librosCuentas.filter(l => l.id !== id));
            Swal.fire("Eliminado", "Libro eliminado correctamente.", "success");
        } catch (error) {
            console.error("Error al eliminar libro:", error);
            Swal.fire("Error", "No se pudo eliminar el libro.", "error");
        }
    };

    const handleEstadoSolicitud = async (id, nuevoEstado) => {
        try {
            let authTokens = localStorage.getItem('authTokens') ? JSON.parse(localStorage.getItem('authTokens')) : null;

            if (!authTokens || !authTokens.access) {
                Swal.fire("Error", "No estás autenticado", "error");
                return;
            }

            if (nuevoEstado === 'APROBADO') {
                const conf = await Swal.fire({
                    title: "¿Aprobar solicitud?",
                    text: "Se generará un usuario y contraseña automáticamente.",
                    icon: "question",
                    showCancelButton: true,
                    confirmButtonColor: "#3085d6",
                    cancelButtonColor: "#d33",
                    confirmButtonText: "Sí, aprobar"
                });

                if (!conf.isConfirmed) return;

                const response = await axios.post(
                    `http://127.0.0.1:8000/api/admin/solicitudes/${id}/aprobar-con-usuario/`,
                    {},
                    { headers: { 'Authorization': `Bearer ${authTokens.access}` } }
                );

                if (response.data.success) {
                    await Swal.fire({
                        title: "¡Usuario Creado!",
                        html: `
                            <div class="text-left bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <p class="mb-2">El socio ha sido registrado correctamente.</p>
                                <hr class="my-2"/>
                                <p><strong>👤 Usuario:</strong> ${response.data.usuario}</p>
                                <p><strong>🔑 Contraseña:</strong> <span class="font-mono bg-yellow-100 px-1 rounded">${response.data.password}</span></p>
                                <hr class="my-2"/>
                                <p class="text-sm text-gray-500">Por favor, guarda o envía estas credenciales al socio.</p>
                            </div>
                        `,
                        icon: "success",
                        confirmButtonText: "Entendido"
                    });

                    setSolicitudesIngreso(prev => prev.map(s =>
                        s.id === id ? {
                            ...s,
                            estado: 'APROBADO',
                            usuario_creado: response.data.usuario,
                            password_generada: response.data.password
                        } : s
                    ));
                }
            } else {
                const conf = await Swal.fire({
                    title: "¿Rechazar?",
                    text: "La solicitud quedará marcada como rechazada.",
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#d33",
                    confirmButtonText: "Sí, rechazar"
                });

                if (!conf.isConfirmed) return;

                await axios.patch(
                    `http://127.0.0.1:8000/api/admin/solicitudes/${id}/`,
                    { estado: nuevoEstado },
                    { headers: { 'Authorization': `Bearer ${authTokens.access}` } }
                );

                Swal.fire("Rechazado", "La solicitud ha sido rechazada.", "success");
                setSolicitudesIngreso(prev => prev.map(s => s.id === id ? { ...s, estado: nuevoEstado } : s));
            }
        } catch (error) {
            console.error("Error:", error);
            Swal.fire("Error", "Ocurrió un error al procesar la solicitud.", "error");
        }
    };

    const handleEliminarSolicitud = async (id) => {
        const result = await Swal.fire({
            title: "¿Eliminar registro?",
            html: "¿Estás seguro? <br><br>Al borrarlo, el RUT quedará liberado para postular nuevamente.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar"
        });

        if (result.isConfirmed) {
            try {
                let authTokens = localStorage.getItem('authTokens') ? JSON.parse(localStorage.getItem('authTokens')) : null;
                
                await axios.delete(
                    `http://127.0.0.1:8000/api/admin/solicitudes/${id}/`, 
                    { headers: { 'Authorization': `Bearer ${authTokens?.access}` } }
                );
                
                cargarSolicitudesIngreso();
                Swal.fire("Eliminado", "El registro ha sido eliminado correctamente.", "success");
            } catch (error) {
                console.error(error);
                Swal.fire("Error", "No se pudo eliminar el registro.", "error");
            }
        }
    };
    // --- ESTILOS DINÁMICOS PARA BADGES ---
    const getBadgeColor = (estado) => {
        switch(estado) {
            case 'APROBADO': return 'bg-green-100 text-green-800 border-green-200';
            case 'RECHAZADO': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        }
    };

    // --- FORMULARIO Y EDICIÓN ---
    const iniciarEdicion = (anuncio) => { setEditandoId(anuncio.id); setTitulo(anuncio.titulo); setDescripcion(anuncio.descripcion); setImagen(anuncio.imagen || ""); setMostrarForm(true); };
    const cancelarForm = () => { setEditandoId(null); setTitulo(""); setDescripcion(""); setImagen(""); setMostrarForm(false); };
    const handleGuardar = async (e) => { e.preventDefault(); const formData = new FormData(); formData.append('titulo', titulo.trim()); formData.append('descripcion', descripcion.trim()); if (imagen instanceof File) { formData.append('imagen', imagen); } try { let config = { headers: { 'Content-Type': 'multipart/form-data' } }; const authTokens = JSON.parse(localStorage.getItem('authTokens')); if (authTokens?.access) config.headers['Authorization'] = `Bearer ${authTokens.access}`; if (editandoId) { const res = await axios.patch(`http://127.0.0.1:8000/api/anuncios/${editandoId}/`, formData, config); setAnuncios(anuncios.map(a => a.id === editandoId ? res.data : a)); Swal.fire("Actualizado", "", "success"); } else { const res = await axios.post('http://127.0.0.1:8000/api/anuncios/', formData, config); setAnuncios([...anuncios, res.data]); Swal.fire("Creado", "", "success"); } cancelarForm(); } catch (error) { Swal.fire("Error", "", "error"); } };

    // --- HELPERS ---
    const formatearFecha = (fechaString) => new Date(fechaString).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    const formatearFechaHora = (fechaString) => new Date(fechaString).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const getDownloadUrl = (archivoPath) => !archivoPath ? '#' : archivoPath.startsWith('http') ? archivoPath : `http://127.0.0.1:8000${archivoPath}`;
    const abrirModalMensaje = (mensaje) => setMensajeSeleccionado(mensaje);
    const cerrarModalMensaje = () => setMensajeSeleccionado(null);

    // --- FILTROS Y PAGINACIÓN ---
    const filtrarMensajes = () => { let res = [...mensajesContacto]; if (filtroBusqueda) res = res.filter(m => m.nombre.toLowerCase().includes(filtroBusqueda.toLowerCase()) || m.correo.toLowerCase().includes(filtroBusqueda.toLowerCase())); if (filtroFecha) res = res.filter(m => new Date(m.fecha).toDateString() === new Date(filtroFecha).toDateString()); if (filtroOrden === 'recientes') res.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)); else if (filtroOrden === 'antiguos') res.sort((a, b) => new Date(a.fecha) - new Date(b.fecha)); else if (filtroOrden === 'nombre') res.sort((a, b) => a.nombre.localeCompare(b.nombre)); return res; };
    const limpiarFiltros = () => { setFiltroBusqueda(''); setFiltroFecha(''); setFiltroOrden('recientes'); setPaginaActual(1); };
    const mensajesFiltrados = filtrarMensajes();
    const indiceUltimoMensaje = paginaActual * mensajesPorPagina;
    const indicePrimerMensaje = indiceUltimoMensaje - mensajesPorPagina;
    const mensajesActuales = mensajesFiltrados.slice(indicePrimerMensaje, indiceUltimoMensaje);
    const totalPaginas = Math.ceil(mensajesFiltrados.length / mensajesPorPagina);
    const irPaginaSiguiente = () => { if (paginaActual < totalPaginas) setPaginaActual(paginaActual + 1); };
    const irPaginaAnterior = () => { if (paginaActual > 1) setPaginaActual(paginaActual - 1); };

    // --- RENDERIZADO DE SECCIONES (Ahora responsivas) ---
    const renderAnuncios = () => {
        const anunciosOrdenados = [...anuncios].sort((a, b) => new Date(b.creado_en) - new Date(a.creado_en));
        const indiceUltimo = paginaAnuncios * anunciosPorPagina;
        const indicePrimero = indiceUltimo - anunciosPorPagina;
        const anunciosVisibles = anunciosOrdenados.slice(indicePrimero, indiceUltimo);
        const totalPaginasAnuncios = Math.ceil(anunciosOrdenados.length / anunciosPorPagina);

        return (
            <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-800">
                        Noticias ({anuncios.length})
                    </h2>
                    {!mostrarForm && (
                        <button onClick={() => setMostrarForm(true)} className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition duration-300 flex items-center justify-center gap-2 shadow-sm">
                            <span>➕</span> Crear Nueva Noticia
                        </button>
                    )}
                </div>

                {anuncios.length === 0 ? (
                    <div className="p-10 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 text-center bg-gray-50">
                        <p className="text-lg mb-2">No hay noticias creadas aún.</p>
                        <button onClick={() => setMostrarForm(true)} className="mt-2 text-blue-600 font-semibold hover:underline">Crear la primera noticia</button>
                    </div>
                ) : (
                    <>
                        <div className="grid gap-4">
                            {anunciosVisibles.map((a) => (
                                <div key={a.id} className="border border-gray-200 p-4 rounded-lg bg-white hover:bg-gray-50 transition duration-200 shadow-sm flex flex-col md:flex-row gap-4">
                                    {a.imagen && (
                                        <div className="flex-shrink-0">
                                            <div className="w-full md:w-32 h-48 md:h-32 rounded-md overflow-hidden bg-gray-100 border border-gray-200">
                                                <img src={a.imagen} alt={a.titulo} className="w-full h-full object-cover" />
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex-1 flex flex-col justify-between">
                                        <div>
                                            <div className="flex flex-col md:flex-row justify-between items-start mb-1">
                                                <h3 className="text-lg font-bold text-gray-800 line-clamp-1">{a.titulo}</h3>
                                                <span className="text-xs font-medium text-gray-400 whitespace-nowrap md:ml-2">{formatearFecha(a.creado_en)}</span>
                                            </div>
                                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{a.descripcion}</p>
                                        </div>
                                        <div className="flex gap-2 justify-end md:justify-start">
                                            <button onClick={() => iniciarEdicion(a)} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded text-sm font-medium hover:bg-indigo-100 transition">✏️ Editar</button>
                                            <button onClick={() => handleEliminar(a.id, a.titulo)} className="px-3 py-1.5 bg-red-50 text-red-600 rounded text-sm font-medium hover:bg-red-100 transition">🗑️ Eliminar</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {totalPaginasAnuncios > 1 && (
                            <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
                                <button onClick={() => setPaginaAnuncios(prev => Math.max(prev - 1, 1))} disabled={paginaAnuncios === 1} className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:text-gray-300 disabled:cursor-not-allowed text-gray-700 hover:bg-gray-100 bg-white border border-gray-200">← Anterior</button>
                                <span className="text-sm text-gray-600 font-medium">Página {paginaAnuncios} de {totalPaginasAnuncios}</span>
                                <button onClick={() => setPaginaAnuncios(prev => Math.min(prev + 1, totalPaginasAnuncios))} disabled={paginaAnuncios === totalPaginasAnuncios} className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:text-gray-300 disabled:cursor-not-allowed text-gray-700 hover:bg-gray-100 bg-white border border-gray-200">Siguiente →</button>
                            </div>
                        )}
                    </>
                )}
                {/* MODAL DE EDICIÓN - YA RESPONSIVO */}
                {mostrarForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
                            <div className="bg-gray-100 px-6 py-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
                                <h3 className="text-xl font-bold text-gray-800">{editandoId ? '✏️ Editar Noticia' : '➕ Crear Nueva Noticia'}</h3>
                                <button onClick={cancelarForm} className="text-gray-500 hover:text-gray-700 font-bold text-xl">&times;</button>
                            </div>
                            <div className="overflow-y-auto p-6">
                                <form onSubmit={handleGuardar} className="space-y-6">
                                    <div><label className="block text-sm font-semibold text-gray-700 mb-2">Título:</label><input className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value={titulo} onChange={(e) => setTitulo(e.target.value)} required /></div>
                                    <div><label className="block text-sm font-semibold text-gray-700 mb-2">Descripción:</label><textarea className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" rows="4" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} required /></div>
                                    <div><label className="block text-sm font-semibold text-gray-700 mb-2">Imagen:</label><input type="file" accept="image/*" className="w-full" onChange={(e) => { if (e.target.files[0]) setImagen(e.target.files[0]); }} /></div>
                                    {imagen && (<div className="p-4 border border-gray-200 rounded-lg bg-gray-50 flex flex-col items-center"><div className="w-40 h-40 rounded-lg overflow-hidden border bg-white"><img src={imagen instanceof File ? URL.createObjectURL(imagen) : imagen} alt="Previa" className="w-full h-full object-cover" /></div></div>)}
                                    <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={cancelarForm} className="bg-gray-500 text-white py-2 px-4 rounded">Cancelar</button><button type="submit" className="bg-green-500 text-white py-2 px-4 rounded">Guardar</button></div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderLibros = () => (
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h2 className="text-xl md:text-2xl font-bold mb-6 text-green-600">Libros de Cuentas</h2>
            {loadingLibros ? <div className="text-center">Cargando...</div> : librosCuentas.length === 0 ? <div className="p-8 border-2 border-dashed rounded text-center">No hay libros.</div> : (
                <div className="space-y-4">
                    {librosCuentas.map((libro) => (
                        <div key={libro.id} className="border p-4 rounded-lg bg-gray-50 flex flex-col md:flex-row justify-between items-start gap-4">
                            <div><h3 className="font-bold text-lg">{libro.titulo}</h3><p className="text-gray-600">{libro.descripcion}</p><p className="text-sm text-gray-500 mt-1">Periodo: {formatearFecha(libro.fecha_periodo)}</p></div>
                            <div className="flex gap-2 w-full md:w-auto"><a href={getDownloadUrl(libro.archivo)} download className="flex-1 md:flex-none text-center bg-blue-500 text-white py-2 px-4 rounded">Descargar</a><button onClick={() => handleEliminarLibro(libro.id, libro.titulo)} className="flex-1 md:flex-none bg-red-500 text-white py-2 px-4 rounded">Eliminar</button></div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderCalendario = () => (
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-6">Calendario</h2>
            {cargandoCalendario ? <p className="text-center">Cargando...</p> : <Calendario eventos={eventosCalendario} onGuardarEvento={guardarEventoCalendario} onEliminarEvento={eliminarEventoCalendario} modo="admin" />}
        </div>
    );

    const renderContacto = () => (
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-xl md:text-2xl font-bold text-gray-800">Solicitudes de Contacto</h2>
                <div className="text-sm text-gray-600">
                    {mensajesFiltrados.length} mensaje{mensajesFiltrados.length !== 1 ? 's' : ''}
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-3 border border-gray-100">
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Buscar</label>
                    <input type="text" className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Nombre, correo..." value={filtroBusqueda} onChange={(e) => setFiltroBusqueda(e.target.value)} />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Fecha</label>
                    <input type="date" className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={filtroFecha} onChange={(e) => setFiltroFecha(e.target.value)} />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Ordenar</label>
                    <select className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={filtroOrden} onChange={(e) => setFiltroOrden(e.target.value)}>
                        <option value="recientes">Más recientes</option>
                        <option value="antiguos">Más antiguos</option>
                        <option value="nombre">Nombre (A-Z)</option>
                    </select>
                </div>
                <div className="flex items-end">
                    <button onClick={limpiarFiltros} className="w-full bg-gray-200 text-gray-700 py-2 rounded text-sm font-medium hover:bg-gray-300 transition">Limpiar</button>
                </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200">
                {/* min-w-[900px] asegura que las columnas no se aplasten en móvil */}
                <table className="w-full text-sm min-w-[900px]"> 
                    <thead className="bg-gray-50 text-gray-700 uppercase text-xs font-bold">
                        <tr>
                            <th className="p-4 text-left">Fecha</th>
                            <th className="p-4 text-left">Nombre</th>
                            <th className="p-4 text-left">Correo</th>
                            <th className="p-4 text-left">Mensaje</th>
                            <th className="p-4 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {mensajesActuales.map((msg) => (
                            <tr key={msg.id} className="hover:bg-blue-50 transition-colors">
                                <td className="p-4 whitespace-nowrap text-gray-500">
                                    {formatearFechaHora(msg.fecha)}
                                </td>
                                <td className="p-4 font-medium text-gray-900">
                                    {msg.nombre}
                                </td>
                                <td className="p-4 text-blue-600">
                                    <a href={`mailto:${msg.correo}`} className="hover:underline">
                                        {msg.correo}
                                    </a>
                                </td>
                                <td className="p-4 text-gray-600 max-w-xs truncate" title={msg.mensaje}>
                                    {/* Muestra los primeros 50 caracteres del mensaje */}
                                    {msg.mensaje.length > 50 ? msg.mensaje.substring(0, 50) + "..." : msg.mensaje}
                                </td>
                                <td className="p-4">
                                    <div className="flex justify-center gap-2">
                                        <button 
                                            onClick={() => abrirModalMensaje(msg)} 
                                            className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1 rounded text-xs font-bold transition"
                                        >
                                            Ver
                                        </button>
                                        <button 
                                            onClick={() => handleEliminarMensaje(msg.id)} 
                                            className="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1 rounded text-xs font-bold transition"
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {mensajesActuales.length === 0 && (
                            <tr>
                                <td colSpan="5" className="p-8 text-center text-gray-500">
                                    No se encontraron mensajes.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Paginación */}
            {totalPaginas > 1 && (
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                    <button 
                        onClick={irPaginaAnterior} 
                        disabled={paginaActual === 1} 
                        className="px-4 py-2 rounded-lg text-sm bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Anterior
                    </button>
                    <span className="text-sm text-gray-600">
                        Página {paginaActual} de {totalPaginas}
                    </span>
                    <button 
                        onClick={irPaginaSiguiente} 
                        disabled={paginaActual === totalPaginas} 
                        className="px-4 py-2 rounded-lg text-sm bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Siguiente
                    </button>
                </div>
            )}
        </div>
    );

    const renderSolicitudes = () => {
        const solicitudesFiltradas = solicitudesIngreso.filter(s => tabActiva === 'PENDIENTES' ? s.estado === 'PENDIENTE' : s.estado !== 'PENDIENTE');
        const indiceUltimo = paginaSolicitudes * solicitudesPorPagina;
        const indicePrimero = indiceUltimo - solicitudesPorPagina;
        const solicitudesVisibles = solicitudesFiltradas.slice(indicePrimero, indiceUltimo);
        const totalPaginasSol = Math.ceil(solicitudesFiltradas.length / solicitudesPorPagina);

        return (
            <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
                <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-800">Solicitudes</h2>
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button onClick={() => setTabActiva('PENDIENTES')} className={`px-4 py-2 rounded ${tabActiva==='PENDIENTES'?'bg-white shadow':''}`}>Pendientes</button>
                        <button onClick={() => setTabActiva('HISTORIAL')} className={`px-4 py-2 rounded ${tabActiva==='HISTORIAL'?'bg-white shadow':''}`}>Historial</button>
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] text-sm"> 
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-3 text-left">Fecha</th>
                                <th className="p-3 text-left">Postulante</th>
                                <th className="p-3 text-center">RUT</th>
                                <th className="p-3 text-center">Estado</th>
                                <th className="p-3 text-center">Contraseña</th> 
                                <th className="p-3 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {solicitudesVisibles.map(s => (
                                <tr key={s.id} className="border-b hover:bg-gray-50">
                                    <td className="p-3 text-gray-500">{formatearFecha(s.fecha_solicitud)}</td>
                                    <td className="p-3">
                                        <div className="font-bold">{s.nombre_completo}</div>
                                        <div className="text-xs text-gray-500">{s.email}</div>
                                    </td>
                                    <td className="p-3 text-center">{s.rut_dni}</td>
                                    <td className="p-3 text-center">
                                        <span className={`px-2 py-1 rounded text-xs border ${getBadgeColor(s.estado)}`}>
                                            {s.estado}
                                        </span>
                                    </td>
                                
                                    <td className="p-3 text-center">
                                        {s.password_generada ? (
                                            <div className="flex flex-col items-center">
                                                <code className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-mono border border-yellow-200">
                                                    {s.password_generada}
                                                </code>
                                                <span className="text-[10px] text-gray-400 mt-1">Generada</span>
                                            </div>
                                        ) : s.estado === 'APROBADO' ? (
                                            <span className="text-xs text-gray-400 italic">No visible</span>
                                        ) : (
                                            <span className="text-gray-300">-</span>
                                        )}
                                    </td>

                                    <td className="p-3 text-center">
                                        <div className="flex justify-center gap-2">
                                            {s.estado === 'PENDIENTE' ? (
                                                <>
                                                    <button 
                                                        onClick={() => handleEstadoSolicitud(s.id, 'APROBADO')} 
                                                        className="bg-green-500 hover:bg-green-600 text-white p-2 rounded transition shadow-sm" 
                                                        title="Aprobar"
                                                    >
                                                        ✅
                                                    </button>
                                                    <button 
                                                        onClick={() => handleEstadoSolicitud(s.id, 'RECHAZADO')} 
                                                        className="bg-red-500 hover:bg-red-600 text-white p-2 rounded transition shadow-sm" 
                                                        title="Rechazar"
                                                    >
                                                        ❌
                                                    </button>
                                                </>
                                            ) : (
                                                <button 
                                                    onClick={() => handleEliminarSolicitud(s.id)} 
                                                    className="text-red-500 border border-red-200 hover:bg-red-50 px-3 py-1 rounded transition text-xs font-bold"
                                                >
                                                    Eliminar
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* PAGINACIÓN */}
                {totalPaginasSol > 1 && (
                    <div className="flex justify-between items-center mt-4 border-t pt-4">
                        <button onClick={() => setPaginaSolicitudes(prev => Math.max(prev - 1, 1))} disabled={paginaSolicitudes === 1} className="px-3 py-1 rounded bg-gray-200 text-gray-600 disabled:opacity-50 hover:bg-gray-300">Anterior</button>
                        <span className="text-sm text-gray-600">Página {paginaSolicitudes} de {totalPaginasSol}</span>
                        <button onClick={() => setPaginaSolicitudes(prev => Math.min(prev + 1, totalPaginasSol))} disabled={paginaSolicitudes === totalPaginasSol} className="px-3 py-1 rounded bg-gray-200 text-gray-600 disabled:opacity-50 hover:bg-gray-300">Siguiente</button>
                    </div>
                )}
            </div>
        );
    };

    const renderMenuButton = (id, icon, label, badgeCount = 0) => (
        <button 
            onClick={() => { setSeccionActiva(id); setMenuMovilAbierto(false); }}
            className={`w-full p-3 text-left rounded-lg transition-colors flex items-center gap-3 mb-2 
                ${seccionActiva === id ? 'bg-blue-600 text-white font-medium' : 'text-gray-700 hover:bg-gray-100'}
            `}
        >
            <span className="text-xl">{icon}</span>
            <span>{label}</span>
            {badgeCount > 0 && <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{badgeCount}</span>}
        </button>
    );

    const renderSeccionActiva = () => {
        switch(seccionActiva) {
            case 'anuncios':
                return renderAnuncios();
            case 'libros':
                return renderLibros();
            case 'calendario':
                return renderCalendario();
            case 'contacto':
                return renderContacto();
            case 'solicitudes':
                return renderSolicitudes();
            default:
                return renderAnuncios();
        }
    };

    return (
        <div style={{ background: `url(${Fondo}) fixed center/cover no-repeat`, minHeight: '100vh' }} className="p-4">
            {/* --- HEADER RESPONSIVO --- */}
            <div className="bg-gray-900 bg-opacity-90 rounded-xl shadow-lg p-6 mb-6 flex flex-col md:flex-row justify-between items-center gap-4 text-white">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="w-16 h-16 rounded-full bg-white p-1 flex-shrink-0">
                        <img src={Logo} alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold leading-tight">Panel Admin</h1>
                        <p className="text-sm text-gray-300">Bienvenido, {user?.username}</p>
                    </div>
                    {/* Botón Hamburguesa (Solo Móvil) */}
                    <button 
                        onClick={() => setMenuMovilAbierto(!menuMovilAbierto)}
                        className="md:hidden ml-auto text-3xl focus:outline-none"
                    >
                        ☰
                    </button>
                </div>
                <button onClick={logoutUser} className="hidden md:block bg-red-500 hover:bg-red-600 px-5 py-2 rounded-lg font-bold text-sm transition">Cerrar Sesión</button>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 items-start">
                
                {/* --- MENÚ LATERAL (SIDEBAR) --- */}
                {/* En móvil se oculta/muestra según el estado. En Desktop (lg) siempre es block */}
                <div className={`
                    w-full lg:w-64 bg-white rounded-xl shadow-lg p-4 flex-shrink-0
                    ${menuMovilAbierto ? 'block' : 'hidden'} lg:block
                `}>
                    <h3 className="font-bold text-gray-500 mb-4 uppercase text-xs tracking-wider">Menú Principal</h3>
                    {renderMenuButton('anuncios', '📢', 'Anuncios')}
                    {renderMenuButton('libros', '📚', 'Libros Cuentas')}
                    {renderMenuButton('calendario', '📅', 'Calendario')}
                    {renderMenuButton('solicitudes', '👥', 'Solicitudes', solicitudesIngreso.filter(s => s.estado === 'PENDIENTE').length)}
                    {renderMenuButton('contacto', '✉️', 'Contacto')}
                    
                    {/* Botón cerrar sesión móvil */}
                    <button onClick={logoutUser} className="md:hidden w-full mt-4 bg-red-100 text-red-600 p-3 rounded-lg font-bold">Cerrar Sesión</button>
                </div>

                {/* --- CONTENIDO PRINCIPAL --- */}
                <div className="w-full flex-1 min-w-0">
                    {renderSeccionActiva()}
                </div>

                {/* --- PANEL DE MENSAJES (RIGHT SIDEBAR) --- */}
                {/* En móvil pasa abajo. En Desktop (lg) se queda a la derecha con ancho fijo */}
                <div className="w-full lg:w-96 flex-shrink-0">
                    <MensajesPanel userType="ADMIN" />
                </div>
            </div>

            {/* --- MODAL DETALLE MENSAJE (RESPONSIVO) --- */}
            {mensajeSeleccionado && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-fade-in-up">
                        <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
                            <h3 className="font-bold text-gray-800">Mensaje de {mensajeSeleccionado.nombre}</h3>
                            <button onClick={cerrarModalMensaje} className="text-2xl text-gray-400 hover:text-gray-600">&times;</button>
                        </div>
                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div className="text-sm text-gray-500 mb-2">{formatearFechaHora(mensajeSeleccionado.fecha)}</div>
                            <p className="whitespace-pre-wrap text-gray-700 bg-blue-50 p-4 rounded-lg">{mensajeSeleccionado.mensaje}</p>
                            <a href={`mailto:${mensajeSeleccionado.correo}`} className="block text-center w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Responder a {mensajeSeleccionado.correo}</a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminView;