import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getLibrosCuentas, createLibroCuenta, deleteLibroCuenta, updateLibroCuenta } from "../services/TesoreroService";
import MensajesPanel from "../components/MensajesPanel/MensajesPanel";
import Fondo from "../assets/fondo.png";
import Logo from "../assets/Logo.png";

function TesoreroView() {
    const { user, logoutUser } = useAuth();
    const [libros, setLibros] = useState([]);
    const [librosFiltrados, setLibrosFiltrados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mostrarForm, setMostrarForm] = useState(false);
    const [editandoId, setEditandoId] = useState(null);
    
    // Estado para filtros
    const [filtros, setFiltros] = useState({
        busqueda: '',
        tipo: '',
        año: '',
        mes: '',
        orden: '-fecha_periodo'
    });

    const [form, setForm] = useState({
        titulo: '',
        descripcion: '',
        tipo: 'MENSUAL',
        fecha_periodo: '',
        archivo: null
    });

    useEffect(() => {
        cargarLibros();
    }, []);

    // Aplicar filtros cuando cambien los filtros o los libros
    useEffect(() => {
        aplicarFiltros();
    }, [filtros, libros]);

    const cargarLibros = async () => {
        try {
            const data = await getLibrosCuentas();
            setLibros(data);
        } catch (error) {
            console.error("Error al cargar libros:", error);
        } finally {
            setLoading(false);
        }
    };

    // Función para aplicar filtros
    const aplicarFiltros = () => {
        let resultados = [...libros];

        // Filtro por búsqueda de texto
        if (filtros.busqueda) {
            const busquedaLower = filtros.busqueda.toLowerCase();
            resultados = resultados.filter(libro => 
                libro.titulo.toLowerCase().includes(busquedaLower) ||
                libro.descripcion.toLowerCase().includes(busquedaLower)
            );
        }

        // Filtro por tipo
        if (filtros.tipo) {
            resultados = resultados.filter(libro => libro.tipo === filtros.tipo);
        }

        // Filtro por año
        if (filtros.año) {
            resultados = resultados.filter(libro => {
                const añoLibro = new Date(libro.fecha_periodo).getFullYear().toString();
                return añoLibro === filtros.año;
            });
        }

        // Filtro por mes
        if (filtros.mes) {
            resultados = resultados.filter(libro => {
                const mesLibro = (new Date(libro.fecha_periodo).getMonth() + 1).toString().padStart(2, '0');
                return mesLibro === filtros.mes;
            });
        }

        // Ordenamiento
        resultados.sort((a, b) => {
            const fechaA = new Date(a.fecha_periodo);
            const fechaB = new Date(b.fecha_periodo);
            
            if (filtros.orden === '-fecha_periodo') {
                return fechaB - fechaA;
            } else {
                return fechaA - fechaB;
            }
        });

        setLibrosFiltrados(resultados);
    };

    // Manejar cambios en los filtros
    const handleFiltroChange = (e) => {
        const { name, value } = e.target;
        setFiltros(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Limpiar todos los filtros
    const limpiarFiltros = () => {
        setFiltros({
            busqueda: '',
            tipo: '',
            año: '',
            mes: '',
            orden: '-fecha_periodo'
        });
    };

    // Obtener años únicos para el dropdown
    const obtenerAñosUnicos = () => {
        const años = libros.map(libro => new Date(libro.fecha_periodo).getFullYear());
        return [...new Set(años)].sort((a, b) => b - a);
    };

    const handleInputChange = (e) => {
        const { name, value, type, files } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: type === 'file' ? files[0] : value
        }));
    };

    const iniciarEdicion = (libro) => {
        setEditandoId(libro.id);
        setForm({
            titulo: libro.titulo,
            descripcion: libro.descripcion,
            tipo: libro.tipo,
            fecha_periodo: libro.fecha_periodo,
            archivo: null
        });
        setMostrarForm(true);
    };

    const cancelarForm = () => {
        setEditandoId(null);
        setForm({
            titulo: '',
            descripcion: '',
            tipo: 'MENSUAL',
            fecha_periodo: '',
            archivo: null
        });
        setMostrarForm(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editandoId) {
                await updateLibroCuenta(editandoId, form);
                alert("Libro de cuentas actualizado correctamente");
            } else {
                await createLibroCuenta(form);
                alert("Libro de cuentas subido correctamente");
            }
            
            cancelarForm();
            cargarLibros();
        } catch (error) {
            console.error("Error completo:", error);
            alert(`Error: ${error.message}`);
        }
    };

    const handleEliminar = async (id, titulo) => {
        if (window.confirm(`¿Estás seguro de eliminar "${titulo}"?`)) {
            try {
                await deleteLibroCuenta(id);
                alert("Libro eliminado correctamente");
                cargarLibros();
            } catch (error) {
                console.error("Error al eliminar:", error);
                alert("Error al eliminar el libro");
            }
        }
    };

    const formatearFecha = (fechaString) => {
        return new Date(fechaString).toLocaleDateString('es-ES');
    };

    const getDownloadUrl = (archivoPath) => {
        if (!archivoPath) return '#';
        if (archivoPath.startsWith('http')) {
            return archivoPath;
        }
        return `http://127.0.0.1:8000${archivoPath}`;
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
                                    ONG Llave de Sol - Panel del Tesorero
                                </h1>
                                <p className="text-lg mt-2 text-white">
                                    ¡Bienvenido, <span className="font-semibold">Tesorero {user?.username}!</span>
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

                <div className="flex gap-6">
                    <div className="flex-1 bg-white rounded-lg shadow-md p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">Libros de Cuentas</h2>
                            <button
                                onClick={() => setMostrarForm(true)}
                                className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-medium transition duration-300"
                            >
                                + Subir Nuevo Libro
                            </button>
                        </div>

                        {/* SECCIÓN DE FILTROS - COMPACTA */}
                        <div className="bg-gray-50 p-3 rounded-lg mb-4 border">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-md font-semibold text-gray-700">Filtros</h3>
                                <button
                                    onClick={limpiarFiltros}
                                    className="text-xs text-gray-500 hover:text-gray-700 underline"
                                >
                                    Limpiar filtros
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                                {/* Búsqueda por texto */}
                                <div>
                                    <label className="block text-xs font-medium mb-1 text-gray-600">Buscar</label>
                                    <input
                                        type="text"
                                        name="busqueda"
                                        value={filtros.busqueda}
                                        onChange={handleFiltroChange}
                                        placeholder="Título o descripción..."
                                        className="border w-full p-1 rounded text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                                    />
                                </div>

                                {/* Filtro por tipo */}
                                <div>
                                    <label className="block text-xs font-medium mb-1 text-gray-600">Tipo</label>
                                    <select
                                        name="tipo"
                                        value={filtros.tipo}
                                        onChange={handleFiltroChange}
                                        className="border w-full p-1 rounded text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                                    >
                                        <option value="">Todos los tipos</option>
                                        <option value="MENSUAL">Mensual</option>
                                        <option value="TRIMESTRAL">Trimestral</option>
                                        <option value="ANUAL">Anual</option>
                                        <option value="EVENTO">Evento</option>
                                    </select>
                                </div>

                                {/* Filtro por año */}
                                <div>
                                    <label className="block text-xs font-medium mb-1 text-gray-600">Año</label>
                                    <select
                                        name="año"
                                        value={filtros.año}
                                        onChange={handleFiltroChange}
                                        className="border w-full p-1 rounded text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                                    >
                                        <option value="">Todos los años</option>
                                        {obtenerAñosUnicos().map(año => (
                                            <option key={año} value={año}>{año}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Filtro por mes */}
                                <div>
                                    <label className="block text-xs font-medium mb-1 text-gray-600">Mes</label>
                                    <select
                                        name="mes"
                                        value={filtros.mes}
                                        onChange={handleFiltroChange}
                                        className="border w-full p-1 rounded text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                                    >
                                        <option value="">Todos los meses</option>
                                        <option value="01">Enero</option>
                                        <option value="02">Febrero</option>
                                        <option value="03">Marzo</option>
                                        <option value="04">Abril</option>
                                        <option value="05">Mayo</option>
                                        <option value="06">Junio</option>
                                        <option value="07">Julio</option>
                                        <option value="08">Agosto</option>
                                        <option value="09">Septiembre</option>
                                        <option value="10">Octubre</option>
                                        <option value="11">Noviembre</option>
                                        <option value="12">Diciembre</option>
                                    </select>
                                </div>

                                {/* Ordenamiento */}
                                <div>
                                    <label className="block text-xs font-medium mb-1 text-gray-600">Ordenar</label>
                                    <select
                                        name="orden"
                                        value={filtros.orden}
                                        onChange={handleFiltroChange}
                                        className="border w-full p-1 rounded text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                                    >
                                        <option value="-fecha_periodo">Más reciente</option>
                                        <option value="fecha_periodo">Más antiguo</option>
                                    </select>
                                </div>
                            </div>

                            {/* Contador de resultados */}
                            <div className="mt-2 text-xs text-gray-500">
                                Mostrando {librosFiltrados.length} de {libros.length} libros
                            </div>
                        </div>

                        {loading ? (
                            <div className="text-center py-8">Cargando libros...</div>
                        ) : librosFiltrados.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                {libros.length === 0 
                                    ? "No hay libros de cuentas subidos aún."
                                    : "No se encontraron libros con los filtros aplicados."
                                }
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {librosFiltrados.map((libro) => (
                                    <div key={libro.id} className="border border-gray-200 p-4 rounded-lg bg-gray-50">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <h3 className="text-xl font-bold text-gray-800">{libro.titulo}</h3>
                                                <p className="text-gray-600 mt-1">{libro.descripcion}</p>
                                                <div className="mt-2 text-sm text-gray-500">
                                                    <p>Periodo: {formatearFecha(libro.fecha_periodo)}</p>
                                                    <p>Tipo: {libro.tipo}</p>
                                                    <p>Archivo: {libro.archivo?.split('/').pop()}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 ml-4">
                                                <a 
                                                    href={getDownloadUrl(libro.archivo)} 
                                                    download
                                                    className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-sm transition duration-300"
                                                >
                                                    Descargar
                                                </a>
                                                <button
                                                    onClick={() => iniciarEdicion(libro)}
                                                    className="bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-3 rounded text-sm transition duration-300"
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => handleEliminar(libro.id, libro.titulo)}
                                                    className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded text-sm transition duration-300"
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

                    <div className="w-96 space-y-6">
                        <MensajesPanel userType="TESORERO" />

                        {mostrarForm && (
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <form onSubmit={handleSubmit}>
                                    <h3 className="text-xl font-bold mb-4">
                                        {editandoId ? 'Editar Libro de Cuentas' : 'Subir Nuevo Libro de Cuentas'}
                                    </h3>
                                    
                                    <div className="space-y-4">
                                        <label className="block">
                                            <span className="block text-sm font-medium mb-2">Título:</span>
                                            <input
                                                type="text"
                                                name="titulo"
                                                value={form.titulo}
                                                onChange={handleInputChange}
                                                className="border w-full p-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                                                placeholder="Ej: Cuentas Enero 2024"
                                                required
                                            />
                                        </label>

                                        <label className="block">
                                            <span className="block text-sm font-medium mb-2">Descripción:</span>
                                            <textarea
                                                name="descripcion"
                                                value={form.descripcion}
                                                onChange={handleInputChange}
                                                className="border w-full p-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                                                rows="3"
                                                placeholder="Descripción del libro de cuentas..."
                                            />
                                        </label>

                                        <label className="block">
                                            <span className="block text-sm font-medium mb-2">Tipo:</span>
                                            <select
                                                name="tipo"
                                                value={form.tipo}
                                                onChange={handleInputChange}
                                                className="border w-full p-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                                            >
                                                <option value="MENSUAL">Mensual</option>
                                                <option value="TRIMESTRAL">Trimestral</option>
                                                <option value="ANUAL">Anual</option>
                                                <option value="EVENTO">Evento Específico</option>
                                            </select>
                                        </label>

                                        <label className="block">
                                            <span className="block text-sm font-medium mb-2">Fecha del Periodo:</span>
                                            <input
                                                type="date"
                                                name="fecha_periodo"
                                                value={form.fecha_periodo}
                                                onChange={handleInputChange}
                                                className="border w-full p-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                                                required
                                            />
                                        </label>

                                        <label className="block">
                                            <span className="block text-sm font-medium mb-2">
                                                Archivo (PDF/Excel): {editandoId && <span className="text-gray-500 text-sm">(Opcional - dejar vacío para mantener el actual)</span>}
                                            </span>
                                            <input
                                                type="file"
                                                name="archivo"
                                                onChange={handleInputChange}
                                                className="border w-full p-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                                                accept=".pdf,.xlsx,.xls,.doc,.docx"
                                                required={!editandoId}
                                            />
                                        </label>
                                    </div>

                                    <div className="flex gap-3 mt-6">
                                        <button
                                            type="submit"
                                            className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded font-medium transition duration-300"
                                        >
                                            {editandoId ? 'Actualizar' : 'Subir'} Libro
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
            </div>
        </div>
    );
}

export default TesoreroView;