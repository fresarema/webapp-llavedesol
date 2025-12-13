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

    useEffect(() => {
      cargarAnuncios();
      cargarLibrosCuentas();
      cargarMensajesContacto();
      cargarEventosCalendario();
      cargarSolicitudesIngreso();
    }, []);

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
            console.log('🔍 Iniciando carga de eventos...');
            const authTokens = JSON.parse(localStorage.getItem('authTokens'));
            const token = authTokens?.access;
            
            console.log('Token obtenido:', token ? 'Sí' : 'No');
            
            if (!token) {
                console.error('No hay token disponible');
                setCargandoCalendario(false);
                return;
            }
            
            const response = await axios.get('http://127.0.0.1:8000/api/eventos-calendario/', {
                headers: { 
                    Authorization: `Bearer ${token}` 
                }
            });
            console.log('✅ Eventos cargados:', response.data);
            setEventosCalendario(response.data);
        } catch (error) {
            console.error("Error cargando eventos:", error.response?.data || error.message);
        } finally {
            setCargandoCalendario(false);
        }
    };

    const cargarSolicitudesIngreso = async () => {
        try {
            setCargandoSolicitudes(true);
            let authTokens = localStorage.getItem('authTokens') ? JSON.parse(localStorage.getItem('authTokens')) : null;
            
            if (!authTokens) {
                console.error("No hay token de acceso. ¿Estás logueado?");
                setCargandoSolicitudes(false);
                return;
            }

            const response = await axios.get('http://127.0.0.1:8000/api/admin/solicitudes/', {
                headers: {
                    'Authorization': `Bearer ${authTokens.access}`
                }
            });
            
            const solicitudesConPassword = response.data.map(solicitud => ({
                ...solicitud,
                password_generada: solicitud.password_generada || null
            }));
            
            setSolicitudesIngreso(solicitudesConPassword);
        } catch (error) {
            console.error("Error cargando solicitudes de ingreso", error);
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
            
            if (!token) {
                console.error('No hay token disponible');
                throw new Error('No autenticado');
            }
            
            if (eventoData.id) {
                await axios.put(
                    `http://127.0.0.1:8000/api/eventos-calendario/${eventoData.id}/`,
                    eventoData,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                Swal.fire({
                    icon: "success",
                    title: "Evento actualizado",
                    text: "El evento del calendario ha sido actualizado correctamente.",
                    timer: 3000,
                    timerProgressBar: true,
                });
            } else {
                await axios.post(
                    'http://127.0.0.1:8000/api/eventos-calendario/',
                    eventoData,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                Swal.fire({
                    icon: "success",
                    title: "Evento creado",
                    text: "El evento ha sido añadido al calendario correctamente.",
                    timer: 3000,
                    timerProgressBar: true,
                });
            }
            
            cargarEventosCalendario();
            return true;
        } catch (error) {
            console.error("Error guardando evento:", error.response?.data || error.message);
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "No se pudo guardar el evento. Verifica los datos.",
            });
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
            
            if (!token) {
                console.error('No hay token disponible');
                throw new Error('No autenticado');
            }
            
            await axios.delete(
                `http://127.0.0.1:8000/api/eventos-calendario/${id}/`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            Swal.fire({
                icon: "success",
                title: "Evento eliminado",
                text: "El evento ha sido eliminado del calendario.",
                timer: 3000,
                timerProgressBar: true,
            });
            
            cargarEventosCalendario();
            return true;
        } catch (error) {
            console.error("Error eliminando evento:", error.response?.data || error.message);
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "No se pudo eliminar el evento.",
            });
            throw error;
        }
    };

    const handleEliminarMensaje = async (id) => {
        const result = await Swal.fire({
            title: "¿Eliminar mensaje?",
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
            await axios.delete(`http://127.0.0.1:8000/api/contacto/${id}/`);
            setMensajesContacto(mensajesContacto.filter(msg => msg.id !== id));
            Swal.fire({
                icon: "success",
                title: "Mensaje eliminado",
                text: "El mensaje ha sido eliminado correctamente.",
                timer: 3000,
                timerProgressBar: true,
            });
        } catch (error) {
            console.error("Error borrando mensaje", error);
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "Hubo un error al eliminar el mensaje.",
            });
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
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar"
        });

        if (!result.isConfirmed) return;

        try {
            await deleteAnuncio(id);
            setAnuncios(anuncios.filter(anuncio => anuncio.id !== id));
            Swal.fire({
                icon: "success",
                title: "Anuncio eliminado",
                text: "El anuncio ha sido eliminado correctamente.",
                timer: 3000,
                timerProgressBar: true,
            });
        } catch (error) {
            console.error("Error al eliminar:", error);
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "No se pudo eliminar el anuncio.",
            });
        }
    };

    const handleEliminarLibro = async (id, titulo) => {
        const result = await Swal.fire({
            title: "¿Eliminar libro de cuentas?",
            html: `¿Estás seguro de eliminar el libro <strong>"${titulo}"</strong>?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar"
        });

        if (!result.isConfirmed) return;

        try {
            await deleteLibroCuenta(id);
            setLibrosCuentas(librosCuentas.filter(libro => libro.id !== id));
            Swal.fire({
                icon: "success",
                title: "Libro eliminado",
                text: "El libro de cuentas ha sido eliminado correctamente.",
                timer: 3000,
                timerProgressBar: true,
            });
        } catch (error) {
            console.error("Error al eliminar libro:", error);
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "No se pudo eliminar el libro de cuentas.",
            });
        }
    };

    // FUNCIÓN MODIFICADA - SIN ALERTA CON CREDENCIALES
    const handleEstadoSolicitud = async (id, nuevoEstado) => {
        try {
            let authTokens = localStorage.getItem('authTokens') ? JSON.parse(localStorage.getItem('authTokens')) : null;

            if (!authTokens || !authTokens.access) {
                Swal.fire({
                    icon: "error",
                    title: "No autenticado",
                    text: "No estás autenticado. Por favor, inicia sesión."
                });
                return;
            }

            console.log(`Procesando solicitud ${id} con estado ${nuevoEstado}`);

            if (nuevoEstado === 'APROBADO') {
                const confirmacion = await Swal.fire({
                    title: "¿Aprobar solicitud?",
                    html: "Se creará un usuario automáticamente para el socio.<br><br>¿Deseas continuar?",
                    icon: "question",
                    showCancelButton: true,
                    confirmButtonColor: "#3085d6",
                    cancelButtonColor: "#d33",
                    confirmButtonText: "Sí, aprobar",
                    cancelButtonText: "Cancelar",
                    reverseButtons: true
                });

                if (!confirmacion.isConfirmed) return;

                const response = await axios.post(
                    `http://127.0.0.1:8000/api/admin/solicitudes/${id}/aprobar-con-usuario/`, 
                    {}, 
                    { 
                        headers: {
                            'Authorization': `Bearer ${authTokens.access}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                
                if (response.data.success) {
                    // ALERTA SIMPLE - SIN MOSTRAR CREDENCIALES
                    await Swal.fire({
                        title: "¡Solicitud Aprobada!",
                        text: "El usuario ha sido creado exitosamente.",
                        icon: "success",
                        confirmButtonText: "Entendido",
                        confirmButtonColor: "#3085d6"
                    });
                    
                    // Guardar contraseña en localStorage para referencia
                    if (response.data.password && response.data.usuario) {
                        localStorage.setItem(`credenciales_${response.data.usuario}`, 
                            JSON.stringify({
                                usuario: response.data.usuario,
                                password: response.data.password,
                                email: response.data.email,
                                fecha: new Date().toISOString()
                            })
                        );
                    }
                    
                    // Actualizar la solicitud en el estado local
                    setSolicitudesIngreso(prev => prev.map(solicitud => {
                        if (solicitud.id === id) {
                            return {
                                ...solicitud,
                                estado: 'APROBADO',
                                usuario_creado: response.data.usuario,
                                password_generada: response.data.password
                            };
                        }
                        return solicitud;
                    }));
                    
                } else {
                    Swal.fire({
                        icon: "warning",
                        title: "Advertencia",
                        text: response.data.message || 'Error desconocido',
                    });
                }
            } else {
                // Para RECHAZADO
                const confirmacion = await Swal.fire({
                    title: "¿Rechazar solicitud?",
                    text: "La solicitud será marcada como rechazada.",
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#d33",
                    cancelButtonColor: "#3085d6",
                    confirmButtonText: "Sí, rechazar",
                    cancelButtonText: "Cancelar",
                    reverseButtons: true
                });

                if (!confirmacion.isConfirmed) return;

                await axios.patch(
                    `http://127.0.0.1:8000/api/admin/solicitudes/${id}/`, 
                    { estado: nuevoEstado },
                    { 
                        headers: {
                            'Authorization': `Bearer ${authTokens.access}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                
                Swal.fire({
                    icon: "success",
                    title: "Solicitud Rechazada",
                    text: "La solicitud ha sido rechazada correctamente.",
                    timer: 3000,
                    timerProgressBar: true,
                });
                
                // Actualizar estado local
                setSolicitudesIngreso(prev => prev.map(solicitud => {
                    if (solicitud.id === id) {
                        return { ...solicitud, estado: nuevoEstado };
                    }
                    return solicitud;
                }));
            }
            
        } catch (error) {
            console.error("Error actualizando estado", error);
            
            if (error.response?.status === 401) {
                Swal.fire({
                    icon: "error",
                    title: "Sesión expirada",
                    text: "Tu sesión ha expirado. Por favor, inicia sesión nuevamente."
                }).then(() => {
                    logoutUser();
                });
            } else if (error.response?.data?.error) {
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: `❌ Error: ${error.response.data.error}`,
                });
            } else if (error.response?.data?.message) {
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: `❌ Error: ${error.response.data.message}`,
                });
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "Hubo un error al actualizar el estado. Verifica la consola para más detalles.",
                });
            }
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
            cancelButtonText: "Cancelar",
            reverseButtons: true
        });

        if (!result.isConfirmed) return;

        try {
            let authTokens = localStorage.getItem('authTokens') ? JSON.parse(localStorage.getItem('authTokens')) : null;
            await axios.delete(`http://127.0.0.1:8000/api/admin/solicitudes/${id}/`, { 
                headers: { 
                    'Authorization': `Bearer ${authTokens?.access}`,
                    'Content-Type': 'application/json'
                }
            });
            cargarSolicitudesIngreso();
            Swal.fire({
                icon: "success",
                title: "Registro eliminado",
                text: "El registro ha sido eliminado correctamente.",
                timer: 3000,
                timerProgressBar: true,
            });
        } catch (error) {
            console.error(error);
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "No se pudo eliminar el registro.",
            });
        }
    };

    const getBadgeColor = (estado) => {
        switch(estado) {
            case 'APROBADO': return 'bg-green-100 text-green-800 border-green-200';
            case 'RECHAZADO': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        }
    };

    const iniciarEdicion = (anuncio) => {
        setEditandoId(anuncio.id);
        setTitulo(anuncio.titulo);
        setDescripcion(anuncio.descripcion);
        setImagen(anuncio.imagen || "");
        setMostrarForm(true);
    };

    const cancelarForm = () => {
        setEditandoId(null);
        setTitulo("");
        setDescripcion("");
        setImagen("");
        setMostrarForm(false);
    };

    const handleGuardar = async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('titulo', titulo.trim());
        formData.append('descripcion', descripcion.trim());
        
        if (imagen instanceof File) {
            formData.append('imagen', imagen);
        }

        try {
            let config = {
                headers: { 'Content-Type': 'multipart/form-data' }
            };

            const authTokens = JSON.parse(localStorage.getItem('authTokens'));
            if (authTokens?.access) {
                config.headers['Authorization'] = `Bearer ${authTokens.access}`;
            }

            if (editandoId) {
                const response = await axios.patch(
                    `http://127.0.0.1:8000/api/anuncios/${editandoId}/`,
                    formData,
                    config
                );
                setAnuncios(anuncios.map(a => a.id === editandoId ? response.data : a));
                Swal.fire({
                    icon: "success",
                    title: "Noticia actualizada",
                    text: "La noticia ha sido actualizada correctamente.",
                    timer: 3000,
                    timerProgressBar: true,
                });
            } else {
                const response = await axios.post(
                    'http://127.0.0.1:8000/api/anuncios/',
                    formData,
                    config
                );
                setAnuncios([...anuncios, response.data]);
                Swal.fire({
                    icon: "success",
                    title: "Noticia creada",
                    text: "La noticia ha sido creada correctamente.",
                    timer: 3000,
                    timerProgressBar: true,
                });
            }

            cancelarForm();
        } catch (error) {
            console.error("Error al guardar:", error);
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "No se pudo guardar la noticia. Verifica los datos.",
            });
        }
    };

    const formatearFecha = (fechaString) => {
        const fecha = new Date(fechaString);
        return fecha.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatearFechaHora = (fechaString) => {
        const fecha = new Date(fechaString);
        return fecha.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getDownloadUrl = (archivoPath) => {
        if (!archivoPath) return '#';
        if (archivoPath.startsWith('http')) {
            return archivoPath;
        }
        return `http://127.0.0.1:8000${archivoPath}`;
    };

    const abrirModalMensaje = (mensaje) => {
        setMensajeSeleccionado(mensaje);
    };

    const cerrarModalMensaje = () => {
        setMensajeSeleccionado(null);
    };

    const filtrarMensajes = () => {
        let mensajesFiltrados = [...mensajesContacto];
        
        if (filtroBusqueda) {
            const busqueda = filtroBusqueda.toLowerCase();
            mensajesFiltrados = mensajesFiltrados.filter(msg => 
                msg.nombre.toLowerCase().includes(busqueda) || 
                msg.correo.toLowerCase().includes(busqueda) ||
                msg.mensaje.toLowerCase().includes(busqueda)
            );
        }
        
        if (filtroFecha) {
            const fechaSeleccionada = new Date(filtroFecha).toDateString();
            mensajesFiltrados = mensajesFiltrados.filter(msg => {
                const fechaMsg = new Date(msg.fecha).toDateString();
                return fechaMsg === fechaSeleccionada;
            });
        }
        
        if (filtroOrden === 'recientes') {
            mensajesFiltrados.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        } else if (filtroOrden === 'antiguos') {
            mensajesFiltrados.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
        } else if (filtroOrden === 'nombre') {
            mensajesFiltrados.sort((a, b) => a.nombre.localeCompare(b.nombre));
        }
        
        return mensajesFiltrados;
    };

    const limpiarFiltros = () => {
        setFiltroBusqueda('');
        setFiltroFecha('');
        setFiltroOrden('recientes');
        setPaginaActual(1);
    };

    const mensajesFiltrados = filtrarMensajes();
    const indiceUltimoMensaje = paginaActual * mensajesPorPagina;
    const indicePrimerMensaje = indiceUltimoMensaje - mensajesPorPagina;
    const mensajesActuales = mensajesFiltrados.slice(indicePrimerMensaje, indiceUltimoMensaje);
    const totalPaginas = Math.ceil(mensajesFiltrados.length / mensajesPorPagina);

    const irPaginaSiguiente = () => {
        if (paginaActual < totalPaginas) setPaginaActual(paginaActual + 1);
    };

    const irPaginaAnterior = () => {
        if (paginaActual > 1) setPaginaActual(paginaActual - 1);
    };

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

    const renderAnuncios = () => {
        const anunciosOrdenados = [...anuncios].sort((a, b) => {
            return new Date(b.creado_en) - new Date(a.creado_en);
        });

        const indiceUltimo = paginaAnuncios * anunciosPorPagina;
        const indicePrimero = indiceUltimo - anunciosPorPagina;
        const anunciosVisibles = anunciosOrdenados.slice(indicePrimero, indiceUltimo);
        const totalPaginasAnuncios = Math.ceil(anunciosOrdenados.length / anunciosPorPagina);

        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">
                        Noticias ({anuncios.length})
                    </h2>
                    {!mostrarForm && (
                        <button
                            onClick={() => setMostrarForm(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition duration-300 flex items-center gap-2 shadow-sm"
                        >
                            <span>➕</span> Crear Nueva Noticia
                        </button>
                    )}
                </div>

                {anuncios.length === 0 ? (
                    <div className="p-10 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 text-center bg-gray-50">
                        <p className="text-lg mb-2">No hay noticias creadas aún.</p>
                        <button
                            onClick={() => setMostrarForm(true)}
                            className="mt-2 text-blue-600 font-semibold hover:underline"
                        >
                            Crear la primera noticia
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="grid gap-4">
                            {anunciosVisibles.map((a) => (
                                <div key={a.id} className="border border-gray-200 p-4 rounded-lg bg-white hover:bg-gray-50 transition duration-200 shadow-sm flex flex-col sm:flex-row gap-4">
                                    {a.imagen && (
                                        <div className="flex-shrink-0">
                                            <div className="w-full sm:w-32 h-32 rounded-md overflow-hidden bg-gray-100 border border-gray-200">
                                                <img 
                                                    src={a.imagen} 
                                                    alt={a.titulo}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div className="flex-1 flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className="text-lg font-bold text-gray-800 line-clamp-1">{a.titulo}</h3>
                                                <span className="text-xs font-medium text-gray-400 whitespace-nowrap ml-2">
                                                    {formatearFecha(a.creado_en)}
                                                </span>
                                            </div>
                                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{a.descripcion}</p>
                                        </div>
                                        
                                        <div className="flex gap-2 justify-end sm:justify-start">
                                            <button
                                                onClick={() => iniciarEdicion(a)}
                                                className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded text-sm font-medium hover:bg-indigo-100 transition"
                                            >
                                                ✏️ Editar
                                            </button>
                                            <button
                                                onClick={() => handleEliminar(a.id, a.titulo)}
                                                className="px-3 py-1.5 bg-red-50 text-red-600 rounded text-sm font-medium hover:bg-red-100 transition"
                                            >
                                                🗑️ Eliminar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {totalPaginasAnuncios > 1 && (
                            <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
                                <button 
                                    onClick={() => setPaginaAnuncios(prev => Math.max(prev - 1, 1))}
                                    disabled={paginaAnuncios === 1}
                                    className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:text-gray-300 disabled:cursor-not-allowed text-gray-700 hover:bg-gray-100 bg-white border border-gray-200"
                                >
                                    ← Anterior
                                </button>
                                <span className="text-sm text-gray-600 font-medium">
                                    Página {paginaAnuncios} de {totalPaginasAnuncios}
                                </span>
                                <button 
                                    onClick={() => setPaginaAnuncios(prev => Math.min(prev + 1, totalPaginasAnuncios))}
                                    disabled={paginaAnuncios === totalPaginasAnuncios}
                                    className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:text-gray-300 disabled:cursor-not-allowed text-gray-700 hover:bg-gray-100 bg-white border border-gray-200"
                                >
                                    Siguiente →
                                </button>
                            </div>
                        )}
                    </>
                )}

                {mostrarForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-xl overflow-hidden">
                            <div className="bg-gray-100 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                                <h3 className="text-xl font-bold text-gray-800">
                                    {editandoId ? '✏️ Editar Noticia' : '➕ Crear Nueva Noticia'}
                                </h3>
                                <button onClick={cancelarForm} className="text-gray-500 hover:text-gray-700 font-bold text-xl">&times;</button>
                            </div>
                            
                            <div className="max-h-[70vh] overflow-y-auto">
                                <form onSubmit={handleGuardar}>
                                    <div className="p-6 space-y-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Título:</label>
                                            <input
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                value={titulo}
                                                onChange={(e) => setTitulo(e.target.value)}
                                                placeholder="Título de la noticia"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Descripción:</label>
                                            <textarea
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                rows="4"
                                                value={descripcion}
                                                onChange={(e) => setDescripcion(e.target.value)}
                                                placeholder="Contenido de la noticia..."
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Imagen de portada:</label>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="w-full p-2 border border-gray-300 rounded-lg text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                                onChange={(e) => {
                                                    if (e.target.files[0]) {
                                                        setImagen(e.target.files[0]);
                                                    }
                                                }}
                                            />
                                            <p className="text-xs text-gray-500 mt-2">Formatos: JPG, PNG, WEBP.</p>
                                        </div>

                                        {imagen && (
                                            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 flex flex-col items-center">
                                                <p className="text-sm font-medium text-gray-700 mb-2">Vista previa:</p>
                                                <div className="w-40 h-40 rounded-lg overflow-hidden border bg-white">
                                                    <img 
                                                        src={imagen instanceof File ? URL.createObjectURL(imagen) : imagen} 
                                                        alt="Vista previa" 
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                                        <button type="button" onClick={cancelarForm} className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-6 rounded-lg font-medium transition">Cancelar</button>
                                        <button type="submit" className="bg-green-500 hover:bg-green-600 text-white py-2 px-6 rounded-lg font-medium transition">
                                            {editandoId ? 'Actualizar' : 'Publicar'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderLibros = () => (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6 text-green-600">Libros de Cuentas</h2>
            
            {loadingLibros ? (
                <div className="text-center py-4">Cargando libros de cuentas...</div>
            ) : librosCuentas.length === 0 ? (
                <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 text-center">
                    <p className="text-lg">No hay libros de cuentas subidos aún.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {librosCuentas.map((libro) => (
                        <div key={libro.id} className="border border-gray-200 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition duration-200">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-lg text-gray-800">{libro.titulo}</h3>
                                    <p className="text-gray-600 mt-1">{libro.descripcion}</p>
                                    <div className="mt-2 text-sm text-gray-500">
                                        <p>Periodo: {formatearFecha(libro.fecha_periodo)}</p>
                                        <p>Tipo: <span className="font-medium">{libro.tipo}</span></p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <a 
                                        href={getDownloadUrl(libro.archivo)} 
                                        download
                                        className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded font-medium transition duration-300"
                                    >
                                        Descargar
                                    </a>
                                    <button
                                        onClick={() => handleEliminarLibro(libro.id, libro.titulo)}
                                        className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded font-medium transition duration-300"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderCalendario = () => (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Calendario de Eventos</h2>
            
            {cargandoCalendario ? (
                <div className="text-center py-8">
                    <p>Cargando calendario...</p>
                </div>
            ) : (
                <Calendario 
                    eventos={eventosCalendario}
                    onGuardarEvento={guardarEventoCalendario}
                    onEliminarEvento={eliminarEventoCalendario}
                    modo="admin"
                />
            )}
        </div>
    );

    const renderContacto = () => (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Solicitudes de Contacto Web</h2>
                <div className="text-sm text-gray-600">
                    {mensajesFiltrados.length} mensaje{mensajesFiltrados.length !== 1 ? 's' : ''} encontrado{mensajesFiltrados.length !== 1 ? 's' : ''}
                </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Buscar:
                        </label>
                        <input
                            type="text"
                            className="w-full p-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Nombre, correo..."
                            value={filtroBusqueda}
                            onChange={(e) => setFiltroBusqueda(e.target.value)}
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Fecha:
                        </label>
                        <input
                            type="date"
                            className="w-full p-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={filtroFecha}
                            onChange={(e) => setFiltroFecha(e.target.value)}
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ordenar:
                        </label>
                        <select
                            className="w-full p-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={filtroOrden}
                            onChange={(e) => setFiltroOrden(e.target.value)}
                        >
                            <option value="recientes">Más recientes</option>
                            <option value="antiguos">Más antiguos</option>
                            <option value="nombre">Nombre (A-Z)</option>
                        </select>
                    </div>
                    
                    <div className="flex items-end">
                        <button
                            onClick={limpiarFiltros}
                            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-3 text-sm rounded font-medium transition duration-300"
                        >
                            Limpiar filtros
                        </button>
                    </div>
                </div>
                
                <div className="mt-3 flex flex-wrap gap-2">
                    {filtroBusqueda && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                            Búsqueda: "{filtroBusqueda}"
                        </span>
                    )}
                    {filtroFecha && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                            Fecha: {filtroFecha}
                        </span>
                    )}
                    {filtroOrden !== 'recientes' && (
                        <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                            Orden: {filtroOrden === 'antiguos' ? 'Más antiguos' : 'Nombre A-Z'}
                        </span>
                    )}
                    {(filtroBusqueda || filtroFecha || filtroOrden !== 'recientes') && (
                        <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                            Filtrado: {mensajesFiltrados.length} de {mensajesContacto.length}
                        </span>
                    )}
                </div>
            </div>

            <div className="overflow-x-auto">
                {mensajesFiltrados.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                        <p className="text-gray-500 text-lg mb-2">
                            {filtroBusqueda || filtroFecha 
                                ? "No se encontraron mensajes con los filtros aplicados" 
                                : "No hay mensajes nuevos."}
                        </p>
                        {(filtroBusqueda || filtroFecha) && (
                            <button
                                onClick={limpiarFiltros}
                                className="text-blue-500 hover:text-blue-700 font-medium"
                            >
                                Limpiar filtros para ver todos
                            </button>
                        )}
                    </div>
                ) : (
                    <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                        <table className="w-full text-sm">
                            <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 10 }}>
                                <tr>
                                    <th className="px-3 py-2 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                                        Fecha
                                    </th>
                                    <th className="px-3 py-2 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                                        Nombre
                                    </th>
                                    <th className="px-3 py-2 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                                        Correo
                                    </th>
                                    <th className="px-3 py-2 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                                        Mensaje
                                    </th>
                                    <th className="px-3 py-2 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {mensajesActuales.map((msg) => (
                                    <tr key={msg.id} className="hover:bg-gray-50 transition duration-150">
                                        <td className="px-3 py-2 border-b border-gray-200 bg-white whitespace-nowrap">
                                            <div className="text-xs text-gray-500">{formatearFechaHora(msg.fecha)}</div>
                                        </td>
                                        <td className="px-3 py-2 border-b border-gray-200 bg-white">
                                            <div className="font-medium truncate max-w-[120px]" title={msg.nombre}>
                                                {msg.nombre}
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 border-b border-gray-200 bg-white">
                                            <a 
                                                href={`mailto:${msg.correo}`} 
                                                className="text-blue-600 hover:underline truncate max-w-[150px] block" 
                                                title={msg.correo}
                                            >
                                                {msg.correo}
                                            </a>
                                        </td>
                                        <td className="px-3 py-2 border-b border-gray-200 bg-white">
                                            <div className="text-gray-500 truncate max-w-[180px]" title={msg.mensaje}>
                                                {msg.mensaje.length > 40 ? msg.mensaje.substring(0, 40) + "..." : msg.mensaje}
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 border-b border-gray-200 bg-white whitespace-nowrap">
                                            <div className="flex gap-1">
                                                <button 
                                                    onClick={() => abrirModalMensaje(msg)}
                                                    className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded text-xs transition duration-200"
                                                >
                                                    Ver
                                                </button>
                                                <button 
                                                    onClick={() => handleEliminarMensaje(msg.id)}
                                                    className="bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded text-xs transition duration-200"
                                                >
                                                    Eliminar
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {totalPaginas > 1 && (
                <div className="flex justify-between items-center mt-4 p-3 bg-gray-50 rounded-lg">
                    <button 
                        onClick={irPaginaAnterior}
                        disabled={paginaActual === 1}
                        className={`px-3 py-1 rounded text-sm ${paginaActual === 1 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                    >
                        ← Anterior
                    </button>
                    
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-700">
                            Página {paginaActual} de {totalPaginas}
                        </span>
                    </div>

                    <button 
                        onClick={irPaginaSiguiente}
                        disabled={paginaActual === totalPaginas}
                        className={`px-3 py-1 rounded text-sm ${paginaActual === totalPaginas ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                    >
                        Siguiente →
                    </button>
                </div>
            )}
        </div>
    );

    const renderSolicitudes = () => {
        const solicitudesFiltradas = solicitudesIngreso.filter(s => 
            tabActiva === 'PENDIENTES' ? s.estado === 'PENDIENTE' : s.estado !== 'PENDIENTE'
        );

        const indiceUltimo = paginaSolicitudes * solicitudesPorPagina;
        const indicePrimero = indiceUltimo - solicitudesPorPagina;
        const solicitudesVisibles = solicitudesFiltradas.slice(indicePrimero, indiceUltimo);
        const totalPaginasSol = Math.ceil(solicitudesFiltradas.length / solicitudesPorPagina);

        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 border-b pb-4">
                    <h2 className="text-2xl font-bold text-gray-800">Solicitudes de Ingreso</h2>
                    
                    <div className="flex flex-col md:flex-row items-center gap-4 mt-4 md:mt-0">
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            <button
                                onClick={() => { setTabActiva('PENDIENTES'); setPaginaSolicitudes(1); }}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                                    tabActiva === 'PENDIENTES' 
                                    ? 'bg-white text-blue-600 shadow-sm' 
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                Pendientes ({solicitudesIngreso.filter(s => s.estado === 'PENDIENTE').length})
                            </button>
                            <button
                                onClick={() => { setTabActiva('HISTORIAL'); setPaginaSolicitudes(1); }}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                                    tabActiva === 'HISTORIAL' 
                                    ? 'bg-white text-blue-600 shadow-sm' 
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                Historial ({solicitudesIngreso.filter(s => s.estado !== 'PENDIENTE').length})
                            </button>
                        </div>
                        
                        {cargandoSolicitudes && (
                            <div className="text-sm text-blue-600">
                                <span className="animate-pulse">Actualizando...</span>
                            </div>
                        )}
                    </div>
                </div>

                {cargandoSolicitudes && solicitudesIngreso.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-500">Cargando solicitudes...</p>
                    </div>
                ) : solicitudesFiltradas.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                        {tabActiva === 'PENDIENTES' 
                            ? "No hay solicitudes pendientes." 
                            : "No hay solicitudes en el historial."}
                    </p>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full leading-normal">
                                <thead>
                                    <tr>
                                        <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase">Fecha</th>
                                        <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase">Postulante</th>
                                        <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase">RUT</th>
                                        <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-center text-xs font-semibold text-gray-600 uppercase">Estado</th>
                                        <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-center text-xs font-semibold text-gray-600 uppercase">Contraseña</th>
                                        <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-center text-xs font-semibold text-gray-600 uppercase">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {solicitudesVisibles.map((sol) => (
                                        <tr key={sol.id} className="hover:bg-gray-50 transition duration-150">
                                            <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                                {formatearFechaHora(sol.fecha_solicitud)}
                                            </td>
                                            <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                                <div className="font-bold">{sol.nombre_completo}</div>
                                                <div className="text-xs text-gray-500">{sol.email}</div>
                                                <div className="text-xs text-gray-500 italic mt-1">"{sol.motivacion.substring(0, 40)}..."</div>
                                            </td>
                                            <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                                {sol.rut_dni}
                                            </td>
                                            <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-center">
                                                <span className={`px-3 py-1 font-semibold text-xs rounded-full ${getBadgeColor(sol.estado)}`}>
                                                    {sol.estado === 'PENDIENTE' ? 'PENDIENTE' : sol.estado === 'APROBADO' ? 'APROBADO' : 'RECHAZADO'}
                                                </span>
                                                {sol.usuario_creado && (
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        👤 {sol.usuario_creado}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-center">
                                                {sol.password_generada ? (
                                                    <div className="flex flex-col items-center">
                                                        <code className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-mono">
                                                            {sol.password_generada}
                                                        </code>
                                                        <span className="text-xs text-gray-500 mt-1">
                                                            Generada: {formatearFecha(sol.fecha_solicitud)}
                                                        </span>
                                                    </div>
                                                ) : sol.estado === 'APROBADO' ? (
                                                    <span className="text-xs text-gray-500 italic">
                                                        Sin contraseña guardada
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-gray-500">—</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-center">
                                                {sol.estado === 'PENDIENTE' ? (
                                                    <div className="flex justify-center gap-2">
                                                        <button 
                                                            onClick={() => handleEstadoSolicitud(sol.id, 'APROBADO')} 
                                                            className="bg-green-500 hover:bg-green-600 text-white p-2 rounded transition flex items-center gap-1"
                                                            title="Aprobar y crear usuario"
                                                        >
                                                            <span>✅</span>
                                                            <span className="text-xs">Aprobar</span>
                                                        </button>
                                                        <button 
                                                            onClick={() => handleEstadoSolicitud(sol.id, 'RECHAZADO')} 
                                                            className="bg-red-500 hover:bg-red-600 text-white p-2 rounded transition flex items-center gap-1"
                                                            title="Rechazar"
                                                        >
                                                            <span>❌</span>
                                                            <span className="text-xs">Rechazar</span>
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-center gap-2">
                                                        <button 
                                                            onClick={() => handleEliminarSolicitud(sol.id)} 
                                                            className="text-red-500 hover:text-red-700 text-xs font-bold border border-red-200 px-3 py-1 rounded hover:bg-red-50 transition"
                                                            title="Eliminar registro"
                                                        >
                                                            Eliminar
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {totalPaginasSol > 1 && (
                            <div className="flex justify-between items-center mt-4 border-t pt-4">
                                <button 
                                    onClick={() => setPaginaSolicitudes(prev => Math.max(prev - 1, 1))}
                                    disabled={paginaSolicitudes === 1}
                                    className="px-3 py-1 rounded bg-gray-200 text-gray-600 disabled:opacity-50 hover:bg-gray-300 transition"
                                >
                                    Anterior
                                </button>
                                <span className="text-sm text-gray-600">
                                    Página {paginaSolicitudes} de {totalPaginasSol}
                                </span>
                                <button 
                                    onClick={() => setPaginaSolicitudes(prev => Math.min(prev + 1, totalPaginasSol))}
                                    disabled={paginaSolicitudes === totalPaginasSol}
                                    className="px-3 py-1 rounded bg-gray-200 text-gray-600 disabled:opacity-50 hover:bg-gray-300 transition"
                                >
                                    Siguiente
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        );
    };

    return (
        <div 
            style={{
                background: `url(${Fondo}) fixed center/cover no-repeat`,
                minHeight: '100vh',
                padding: '20px'
            }}
        >
            <div style={{
                minHeight: '100vh',
                margin: '-20px',
                padding: '20px'
            }}>
                <div 
                    className="rounded-lg shadow-md p-6 mb-6"
                    style={{
                        backgroundColor: '#1e2939',
                        background: 'linear-gradient(135deg, #1e2939 0%, #2d3748 100%)'
                    }}
                >
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full overflow-hidden bg-white p-1">
                                <img 
                                    src={Logo} 
                                    alt="Logo ONG Llave de Sol"
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">
                                    ONG Llave de Sol - Panel de Administración
                                </h1>
                                <p className="text-base mt-2 text-white">
                                    ¡Bienvenido, <span className="font-semibold">{user?.username}!</span>
                                </p>
                                <p className="text-sm mt-1 text-gray-300">
                                    Rol: {user?.is_admin ? 'Administrador' : user?.is_tesorero ? 'Tesorero' : user?.is_socio ? 'Socio' : 'Usuario'}
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={logoutUser}
                            className="bg-red-500 hover:bg-red-600 text-white py-2 px-5 rounded-lg font-medium transition duration-300 text-sm"
                        >
                            Cerrar Sesión
                        </button>
                    </div>
                </div>

                <div className="flex gap-4">
                    <div style={{
                        width: '220px',
                        display: 'flex',
                        flexDirection: 'column',
                        flexShrink: 0
                    }}>
                        <div className="bg-white rounded-lg shadow-md p-5">
                            <h3 className="text-base font-bold mb-4 text-gray-700">Menú</h3>
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px'
                            }}>
                                <button 
                                    onClick={() => setSeccionActiva('anuncios')}
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        textAlign: 'left',
                                        borderRadius: '6px',
                                        border: 'none',
                                        backgroundColor: seccionActiva === 'anuncios' ? '#3b82f6' : 'transparent',
                                        color: seccionActiva === 'anuncios' ? 'white' : '#374151',
                                        fontWeight: '500',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        fontSize: '14px'
                                    }}
                                >
                                    <span>📢</span>
                                    <span>Anuncios</span>
                                </button>
                                
                                <button 
                                    onClick={() => setSeccionActiva('libros')}
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        textAlign: 'left',
                                        borderRadius: '6px',
                                        border: 'none',
                                        backgroundColor: seccionActiva === 'libros' ? '#3b82f6' : 'transparent',
                                        color: seccionActiva === 'libros' ? 'white' : '#374151',
                                        fontWeight: '500',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        fontSize: '14px'
                                    }}
                                >
                                    <span>📚</span>
                                    <span>Libros de Cuentas</span>
                                </button>
                                
                                <button 
                                    onClick={() => setSeccionActiva('calendario')}
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        textAlign: 'left',
                                        borderRadius: '6px',
                                        border: 'none',
                                        backgroundColor: seccionActiva === 'calendario' ? '#3b82f6' : 'transparent',
                                        color: seccionActiva === 'calendario' ? 'white' : '#374151',
                                        fontWeight: '500',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        fontSize: '14px'
                                    }}
                                >
                                    <span>📅</span>
                                    <span>Calendario</span>
                                </button>

                                <button 
                                    onClick={() => setSeccionActiva('solicitudes')}
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        textAlign: 'left',
                                        borderRadius: '6px',
                                        border: 'none',
                                        backgroundColor: seccionActiva === 'solicitudes' ? '#3b82f6' : 'transparent',
                                        color: seccionActiva === 'solicitudes' ? 'white' : '#374151',
                                        fontWeight: '500',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        fontSize: '14px'
                                    }}
                                >
                                    <span>👥</span>
                                    <span>Solicitudes Ingreso</span>
                                    {solicitudesIngreso.filter(s => s.estado === 'PENDIENTE').length > 0 && (
                                        <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                            {solicitudesIngreso.filter(s => s.estado === 'PENDIENTE').length}
                                        </span>
                                    )}
                                </button>
                                
                                <button 
                                    onClick={() => setSeccionActiva('contacto')}
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        textAlign: 'left',
                                        borderRadius: '6px',
                                        border: 'none',
                                        backgroundColor: seccionActiva === 'contacto' ? '#3b82f6' : 'transparent',
                                        color: seccionActiva === 'contacto' ? 'white' : '#374151',
                                        fontWeight: '500',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        fontSize: '14px'
                                    }}
                                >
                                    <span>✉️</span>
                                    <span>Solicitudes Contacto</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                        {renderSeccionActiva()}
                    </div>

                    <div style={{ 
                        width: '380px',
                        flexShrink: 0
                    }}>
                        <MensajesPanel userType="ADMIN" />
                    </div>
                </div>

                {mensajeSeleccionado && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden">
                            <div className="bg-gray-100 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                                <h3 className="text-xl font-bold text-gray-800">Detalle del Mensaje</h3>
                                <button 
                                    onClick={cerrarModalMensaje}
                                    className="text-gray-500 hover:text-gray-700 font-bold text-xl"
                                >
                                    &times;
                                </button>
                            </div>
                            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                                <div className="grid grid-cols-2 gap-4 text-sm border-b pb-4">
                                    <div>
                                        <p className="text-gray-500 font-semibold">Fecha:</p>
                                        <p>{formatearFechaHora(mensajeSeleccionado.fecha)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 font-semibold">Remitente:</p>
                                        <p>{mensajeSeleccionado.nombre}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-gray-500 font-semibold">Correo:</p>
                                        <a href={`mailto:${mensajeSeleccionado.correo}`} className="text-blue-600 hover:underline">
                                            {mensajeSeleccionado.correo}
                                        </a>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-gray-500 font-semibold mb-2">Mensaje:</p>
                                    
                                    <p className="text-gray-800 whitespace-pre-wrap break-words leading-relaxed p-4 bg-gray-50 rounded-lg border">
                                        {mensajeSeleccionado.mensaje}
                                    </p>
                                </div>
                            </div>
                            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
                                <button 
                                    onClick={cerrarModalMensaje}
                                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}

export default AdminView;