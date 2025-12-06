import React, { useEffect, useState } from 'react';
import axios from 'axios'; 
import { useAuth } from '../context/AuthContext'; 
import { getAnuncios, createAnuncio, deleteAnuncio, updateAnuncio } from "../services/anunciosService";
import { getLibrosCuentas, deleteLibroCuenta } from "../services/TesoreroService";
import MensajesPanel from "../components/MensajesPanel/MensajesPanel"; 
import Fondo from "../assets/fondo.png";
import Logo from "../assets/Logo.png";

function AdminView() {
    const { user, logoutUser } = useAuth();

    const [anuncios, setAnuncios] = useState([]);
    const [librosCuentas, setLibrosCuentas] = useState([]);
    // Estado para mensajes de contacto
    const [mensajesContacto, setMensajesContacto] = useState([]);
    const [solicitudesIngreso, setSolicitudesIngreso] = useState([]);
    const [titulo, setTitulo] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [imagen, setImagen] = useState("");
    const [mostrarForm, setMostrarForm] = useState(false);
    const [editandoId, setEditandoId] = useState(null);
    const [loadingLibros, setLoadingLibros] = useState(true);

    // Estado para el modal de ver mensaje completo
    const [mensajeSeleccionado, setMensajeSeleccionado] = useState(null);

    // --- ESTADOS PARA PAGINACION DE MENSAJES ---
    const [paginaActual, setPaginaActual] = useState(1);
    const mensajesPorPagina = 10;
    // --- ESTADOS PARA PAGINACION DE SOLICITUDES DE ADMISION ---
    const [paginaSolicitudes, setPaginaSolicitudes] = useState(1);
    const solicitudesPorPagina = 5; 
    const [tabActiva, setTabActiva] = useState('PENDIENTES'); 


    useEffect(() => {
      cargarAnuncios();
      cargarLibrosCuentas();
      cargarMensajesContacto(); 
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

    // Funcion para cargar los mensajes de contacto
    const cargarMensajesContacto = async () => {
        try {
            const response = await axios.get('http://127.0.0.1:8000/api/contacto/');
            setMensajesContacto(response.data);
        } catch (error) {
            console.error("Error cargando mensajes de contacto", error);
        }
    };

    // Funcion para eliminar mensajes
    const handleEliminarMensaje = async (id) => {
        if (window.confirm("¿Estás seguro de borrar este mensaje?")) {
            try {
                await axios.delete(`http://127.0.0.1:8000/api/contacto/${id}/`);
                setMensajesContacto(mensajesContacto.filter(msg => msg.id !== id));

                // Si borramos el ultimo mensaje de una pagina, retrocedemos
                if (mensajesActuales.length === 1 && paginaActual > 1) {
                    setPaginaActual(paginaActual - 1);
                }
                alert("Mensaje eliminado correctamente");
            } catch (error) {
                console.error("Error borrando mensaje", error);
                alert("Hubo un error al eliminar el mensaje");
            }
        }
    };

    const handleEliminar = async (id, titulo) => {
        if (window.confirm(`¿Estás seguro de eliminar el anuncio "${titulo}"?`)) {
            try {
                await deleteAnuncio(id);
                setAnuncios(anuncios.filter(anuncio => anuncio.id !== id));
                alert("Anuncio eliminado correctamente");
            } catch (error) {
                console.error("Error al eliminar:", error);
                alert("Error al eliminar el anuncio.");
            }
        }
    };

    const handleEliminarLibro = async (id, titulo) => {
        if (window.confirm(`¿Estás seguro de eliminar el libro de cuentas "${titulo}"?`)) {
            try {
                await deleteLibroCuenta(id);
                setLibrosCuentas(librosCuentas.filter(libro => libro.id !== id));
                alert("Libro de cuentas eliminado correctamente");
            } catch (error) {
                console.error("Error al eliminar libro:", error);
                alert("Error al eliminar el libro de cuentas.");
            }
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

        const anuncioData = {
            titulo: titulo.trim(),
            descripcion: descripcion.trim(),
            imagen: imagen.trim() || null
        };

        try {
            if (editandoId) {
                const anuncioActualizado = await updateAnuncio(editandoId, anuncioData);
                setAnuncios(anuncios.map(a => a.id === editandoId ? anuncioActualizado : a));
                alert("Anuncio actualizado correctamente");
            } else {
                const nuevoAnuncio = await createAnuncio(anuncioData);
                setAnuncios([...anuncios, nuevoAnuncio]);
                alert("Anuncio creado correctamente");
            }

            cancelarForm();
        } catch (error) {
            console.error("Error al guardar:", error);
            alert("Error al guardar el anuncio.");
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

    const getDownloadUrl = (archivoPath) => {
        if (!archivoPath) return '#';
        if (archivoPath.startsWith('http')) {
            return archivoPath;
        }
        return `http://127.0.0.1:8000${archivoPath}`;
    };

    // LOGICA DE SOLICITUDES DE INGRESO
    const cargarSolicitudesIngreso = async () => {
        try {
            // Busca token JWT
            let authTokens = localStorage.getItem('authTokens') ? JSON.parse(localStorage.getItem('authTokens')) : null;
            
            if (!authTokens) {
                console.error("No hay token de acceso. ¿Estás logueado?");
                return;
            }

            const response = await axios.get('http://127.0.0.1:8000/api/admin/solicitudes/', {
                headers: {
                    'Authorization': `Bearer ${authTokens.access}`
                }
            });
            
            setSolicitudesIngreso(response.data);
        } catch (error) {
            console.error("Error cargando solicitudes de ingreso", error);

        }
    };

    // Funcion para Aprobar o Rechazar
    const handleEstadoSolicitud = async (id, nuevoEstado) => {
        try {
            let authTokens = localStorage.getItem('authTokens') ? JSON.parse(localStorage.getItem('authTokens')) : null;

            await axios.patch(`http://127.0.0.1:8000/api/admin/solicitudes/${id}/`, 
                { estado: nuevoEstado }, // Datos
                { 
                    headers: {
                        'Authorization': `Bearer ${authTokens?.access}`
                    }
                }
            );
            
            cargarSolicitudesIngreso();
            alert(`Solicitud ${nuevoEstado.toLowerCase()} correctamente.`);
        } catch (error) {
            console.error("Error actualizando estado", error);
            alert("Hubo un error al actualizar el estado.");
        }
    };

    // Funcion para borrar y darle ooootra oportunidad! Otra oportunidaaad!
    const handleEliminarSolicitud = async (id) => {
        if (!window.confirm("¿Estás seguro? Al borrarlo, el RUT quedará liberado para postular nuevamente.")) {
            return;
        }

        try {
            let authTokens = localStorage.getItem('authTokens') ? JSON.parse(localStorage.getItem('authTokens')) : null;
            await axios.delete(`http://127.0.0.1:8000/api/admin/solicitudes/${id}/`, { 
                headers: { 'Authorization': `Bearer ${authTokens?.access}` }
            });
            cargarSolicitudesIngreso(); // Recargar lista
            alert("Registro eliminado.");
        } catch (error) {
            console.error(error);
            alert("Error al eliminar.");
        }
    };

    // Ayuda visual para los colores de las etiquetas de estado
    const getBadgeColor = (estado) => {
        switch(estado) {
            case 'APROBADO': return 'bg-green-100 text-green-800 border-green-200';
            case 'RECHAZADO': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        }
    };





    // Funciones para el Modal de Mensaje
    const abrirModalMensaje = (mensaje) => {
        setMensajeSeleccionado(mensaje);
    };

    const cerrarModalMensaje = () => {
        setMensajeSeleccionado(null);
    };

    // --- LOGICA DE PAGINACION ---
    const indiceUltimoMensaje = paginaActual * mensajesPorPagina;
    const indicePrimerMensaje = indiceUltimoMensaje - mensajesPorPagina;
    const mensajesActuales = mensajesContacto.slice(indicePrimerMensaje, indiceUltimoMensaje);
    const totalPaginas = Math.ceil(mensajesContacto.length / mensajesPorPagina);

    const irPaginaSiguiente = () => {
        if (paginaActual < totalPaginas) setPaginaActual(paginaActual + 1);
    };

    const irPaginaAnterior = () => {
        if (paginaActual > 1) setPaginaActual(paginaActual - 1);
    };

    return (
        <div 
            style={{
                background: `url(${Fondo}) fixed center/cover no-repeat`,
                minHeight: '100vh',
                padding: '24px'
            }}
        >
            <div style={{
                minHeight: '100vh',
                margin: '-24px',
                padding: '24px'
            }}>
                {/* HEADER CON NUEVO COLOR AZUL OSCURO Y LOGO */}
                <div 
                    className="rounded-lg shadow-md p-6 mb-6"
                    style={{
                        backgroundColor: '#1e2939',
                        background: 'linear-gradient(135deg, #1e2939 0%, #2d3748 100%)'
                    }}
                >
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            {/* LOGO */}
                            <div className="w-16 h-16 rounded-full overflow-hidden bg-white p-1">
                                <img 
                                    src={Logo} 
                                    alt="Logo ONG Llave de Sol"
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-white">
                                    ONG Llave de Sol - Panel de Administración
                                </h1>
                                <p className="text-lg mt-2 text-white">
                                    ¡Bienvenido, <span className="font-semibold">{user?.username}!</span>
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={logoutUser}
                            className="bg-red-500 hover:bg-red-600 text-white py-2 px-6 rounded-lg font-medium transition duration-300"
                        >
                            Cerrar Sesión
                        </button>
                    </div>
                </div>

                <div className="flex gap-6 mb-8">
                    <div className="flex-1 bg-white rounded-lg shadow-md p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">Anuncios actuales</h2>
                            {!mostrarForm && (
                                <button
                                    onClick={() => setMostrarForm(true)}
                                    className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-medium transition duration-300"
                                >
                                    + Crear Nuevo Anuncio
                                </button>
                            )}
                        </div>

                        {anuncios.length === 0 ? (
                            <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 text-center">
                                <p className="text-lg">No hay anuncios creados aún.</p>
                                <button
                                    onClick={() => setMostrarForm(true)}
                                    className="mt-4 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-medium transition duration-300"
                                >
                                    Crear primer anuncio
                                </button>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {anuncios.map((a) => (
                                    <div key={a.id} className="border border-gray-200 p-4 rounded-lg bg-white hover:bg-gray-50 transition duration-200">
                                        <div className="flex gap-4">
                                            {a.imagen && (
                                                <div className="flex-shrink-0">
                                                    <div className="w-24 h-24 rounded-lg overflow-hidden">
                                                        <img 
                                                            src={a.imagen} 
                                                            alt={a.titulo}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                            
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start mb-2">
                                                    <strong className="text-xl block text-gray-800">{a.titulo}</strong>
                                                    <div className="flex gap-2 ml-4">
                                                        <button
                                                            onClick={() => iniciarEdicion(a)}
                                                            className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-sm transition duration-300"
                                                        >
                                                            Editar
                                                        </button>
                                                        <button
                                                            onClick={() => handleEliminar(a.id, a.titulo)}
                                                            className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded text-sm transition duration-300"
                                                        >
                                                            Eliminar
                                                        </button>
                                                    </div>
                                                </div>
                                                <p className="text-gray-600 mb-2">{a.descripcion}</p>
                                                
                                                <div className="text-xs text-gray-500">
                                                    <p>Creado: {formatearFecha(a.creado_en)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="w-96 space-y-6">
                        <MensajesPanel userType="ADMIN" />

                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-2xl font-bold mb-4 text-green-600">Libros de Cuentas</h2>
                            
                            {loadingLibros ? (
                                <div className="text-center py-4">Cargando libros de cuentas...</div>
                            ) : librosCuentas.length === 0 ? (
                                <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 text-center">
                                    <p>No hay libros de cuentas subidos aún.</p>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {librosCuentas.map((libro) => (
                                        <div key={libro.id} className="border border-gray-200 p-3 rounded-lg bg-gray-50">
                                            <h3 className="font-bold text-gray-800">{libro.titulo}</h3>
                                            <p className="text-sm text-gray-600 mt-1">{libro.descripcion}</p>
                                            <div className="mt-2 text-xs text-gray-500">
                                                <p>Periodo: {formatearFecha(libro.fecha_periodo)}</p>
                                                <p>Tipo: {libro.tipo}</p>
                                            </div>
                                            <div className="flex gap-2 mt-3">
                                                <a 
                                                    href={getDownloadUrl(libro.archivo)} 
                                                    download
                                                    className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded text-xs transition duration-300"
                                                >
                                                    Descargar
                                                </a>
                                                <button
                                                    onClick={() => handleEliminarLibro(libro.id, libro.titulo)}
                                                    className="bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded text-xs transition duration-300"
                                                >
                                                    Eliminar
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {mostrarForm && (
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <form onSubmit={handleGuardar}>
                                    <h3 className="text-xl font-bold mb-4 text-center">
                                        {editandoId ? 'Editar Anuncio' : 'Crear Nuevo Anuncio'}
                                    </h3>

                                    <div className="space-y-4">
                                        <label className="block">
                                            <span className="block text-sm font-medium mb-2">Título:</span>
                                            <input
                                                className="border w-full p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                value={titulo}
                                                onChange={(e) => setTitulo(e.target.value)}
                                                placeholder="Escribe el título aquí..."
                                                required
                                            />
                                        </label>

                                        <label className="block">
                                            <span className="block text-sm font-medium mb-2">Descripción:</span>
                                            <textarea
                                                className="border w-full p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                rows="4"
                                                value={descripcion}
                                                onChange={(e) => setDescripcion(e.target.value)}
                                                placeholder="Escribe la descripción aquí..."
                                            />
                                        </label>

                                        <label className="block">
                                            <span className="block text-sm font-medium mb-2">URL de Imagen (opcional):</span>
                                            <input
                                                type="url"
                                                className="border w-full p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                value={imagen}
                                                onChange={(e) => setImagen(e.target.value)}
                                                placeholder="https://ejemplo.com/imagen.jpg"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                Inserta la URL de una imagen para el anuncio
                                            </p>
                                        </label>

                                        {imagen && (
                                            <div className="mt-2">
                                                <p className="text-sm font-medium mb-2">Vista previa:</p>
                                                <div className="w-32 h-32 rounded-lg overflow-hidden border">
                                                    <img 
                                                        src={imagen} 
                                                        alt="Vista previa" 
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-3 mt-6">
                                        <button
                                            type="submit"
                                            className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded font-medium transition duration-300"
                                        >
                                            {editandoId ? 'Actualizar' : 'Guardar'} anuncio
                                        </button>
                                        <button
                                            type="button"
                                            onClick={cancelarForm}
                                            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded font-medium transition duration-300"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </div>

                {/* --- NUEVA SECCIÓN: SOLICITUDES DE ADMISIÓN (SOCIOS) --- */}
                {/* --- SECCIÓN: SOLICITUDES DE ADMISIÓN (MEJORADA) --- */}
                <div className="bg-white rounded-lg shadow-md p-6 mt-8">
                    
                    {/* ENCABEZADO CON PESTAÑAS */}
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6 border-b pb-4">
                        <h2 className="text-2xl font-bold text-gray-800">Solicitudes de Ingreso</h2>
                        
                        {/* BOTONES DE PESTAÑAS */}
                        <div className="flex bg-gray-100 p-1 rounded-lg mt-4 md:mt-0">
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
                                Historial
                            </button>
                        </div>
                    </div>

                    {/* LÓGICA DE FILTRADO Y PAGINACIÓN LOCAL */}
                    {(() => {
                        // 1. Filtrar según la pestaña activa
                        const solicitudesFiltradas = solicitudesIngreso.filter(s => 
                            tabActiva === 'PENDIENTES' ? s.estado === 'PENDIENTE' : s.estado !== 'PENDIENTE'
                        );

                        // 2. Calcular paginación sobre los filtrados
                        const indiceUltimo = paginaSolicitudes * solicitudesPorPagina;
                        const indicePrimero = indiceUltimo - solicitudesPorPagina;
                        const solicitudesVisibles = solicitudesFiltradas.slice(indicePrimero, indiceUltimo);
                        const totalPaginasSol = Math.ceil(solicitudesFiltradas.length / solicitudesPorPagina);

                        if (solicitudesFiltradas.length === 0) {
                            return <p className="text-gray-500 text-center py-8">No hay solicitudes en esta sección.</p>;
                        }

                        return (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full leading-normal">
                                        <thead>
                                            <tr>
                                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase">Fecha</th>
                                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase">Postulante</th>
                                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase">RUT</th>
                                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-center text-xs font-semibold text-gray-600 uppercase">Estado</th>
                                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-center text-xs font-semibold text-gray-600 uppercase">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {solicitudesVisibles.map((sol) => (
                                                <tr key={sol.id}>
                                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                                        {formatearFecha(sol.fecha_solicitud)}
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
                                                            {sol.estado}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-center">
                                                        {sol.estado === 'PENDIENTE' ? (
                                                            <div className="flex justify-center gap-2">
                                                                <button onClick={() => handleEstadoSolicitud(sol.id, 'APROBADO')} className="bg-green-500 hover:bg-green-600 text-white p-2 rounded transition" title="Aprobar">
                                                                    ✅
                                                                </button>
                                                                <button onClick={() => handleEstadoSolicitud(sol.id, 'RECHAZADO')} className="bg-red-500 hover:bg-red-600 text-white p-2 rounded transition" title="Rechazar">
                                                                    ❌
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button 
                                                                onClick={() => handleEliminarSolicitud(sol.id)} 
                                                                className="text-red-500 hover:text-red-700 text-xs font-bold border border-red-200 px-3 py-1 rounded hover:bg-red-50"
                                                            >
                                                                Eliminar Registro
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* CONTROLES DE PAGINACIÓN (Solo si hay más de 1 página) */}
                                {totalPaginasSol > 1 && (
                                    <div className="flex justify-between items-center mt-4 border-t pt-4">
                                        <button 
                                            onClick={() => setPaginaSolicitudes(prev => Math.max(prev - 1, 1))}
                                            disabled={paginaSolicitudes === 1}
                                            className="px-3 py-1 rounded bg-gray-200 text-gray-600 disabled:opacity-50 hover:bg-gray-300"
                                        >
                                            Anterior
                                        </button>
                                        <span className="text-sm text-gray-600">
                                            Página {paginaSolicitudes} de {totalPaginasSol}
                                        </span>
                                        <button 
                                            onClick={() => setPaginaSolicitudes(prev => Math.min(prev + 1, totalPaginasSol))}
                                            disabled={paginaSolicitudes === totalPaginasSol}
                                            className="px-3 py-1 rounded bg-gray-200 text-gray-600 disabled:opacity-50 hover:bg-gray-300"
                                        >
                                            Siguiente
                                        </button>
                                    </div>
                                )}
                            </>
                        );
                    })()}
                </div>

                {/* --- SECCIÓN: TABLA DE SOLICITUDES DE CONTACTO CON PAGINACION --- */}
                <div className="bg-white rounded-lg shadow-md p-6 mt-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">
                        Solicitudes de Contacto Web
                    </h2>

                    {mensajesContacto.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No hay mensajes nuevos.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full leading-normal">
                                <thead>
                                    <tr>
                                        <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Fecha
                                        </th>
                                        <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Nombre
                                        </th>
                                        <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Correo
                                        </th>
                                        <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Mensaje
                                        </th>
                                        <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {mensajesActuales.map((msg) => (
                                        <tr key={msg.id}>
                                            <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                                {formatearFecha(msg.fecha)}
                                            </td>
                                            <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm font-medium">
                                                {msg.nombre}
                                            </td>
                                            <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-blue-600">
                                                <a href={`mailto:${msg.correo}`}>{msg.correo}</a>
                                            </td>
                                            <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-gray-500">
                                                {/* Mostrar mensaje cortado si es muy largo visualmente */}
                                                {msg.mensaje.length > 50 ? msg.mensaje.substring(0, 50) + "..." : msg.mensaje}
                                            </td>
                                            <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => abrirModalMensaje(msg)}
                                                        className="bg-blue-100 text-blue-600 hover:bg-blue-200 hover:text-blue-900 font-bold py-1 px-3 rounded text-xs transition duration-200"
                                                    >
                                                        Ver
                                                    </button>
                                                    <button 
                                                        onClick={() => handleEliminarMensaje(msg.id)}
                                                        className="bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-900 font-bold py-1 px-3 rounded text-xs transition duration-200"
                                                    >
                                                        Borrar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Controles de Paginacion */}
                            {totalPaginas > 1 && (
                                <div className="flex justify-between items-center mt-4">
                                    <button 
                                        onClick={irPaginaAnterior}
                                        disabled={paginaActual === 1}
                                        className={`px-4 py-2 rounded ${paginaActual === 1 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                                    >
                                        Anterior
                                    </button>
                                    
                                    <span className="text-gray-700">
                                        Página {paginaActual} de {totalPaginas}
                                    </span>

                                    <button 
                                        onClick={irPaginaSiguiente}
                                        disabled={paginaActual === totalPaginas}
                                        className={`px-4 py-2 rounded ${paginaActual === totalPaginas ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                                    >
                                        Siguiente
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* MODAL CORREGIDO */}
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
                                        <p>{formatearFecha(mensajeSeleccionado.fecha)}</p>
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