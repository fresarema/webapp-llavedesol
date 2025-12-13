import React, { useEffect, useState } from 'react';
import axios from 'axios'; 
import { useAuth } from '../context/AuthContext';
import { 
    getLibrosCuentas, 
    createLibroCuenta, 
    deleteLibroCuenta, 
    updateLibroCuenta, 
    getDonaciones,
    exportarDonacionesAExcel
}
from "../services/TesoreroService"; 

import MensajesPanel from "../components/MensajesPanel/MensajesPanel";
import Calendario from "../components/Calendario/Calendario"; 
import Fondo from "../assets/fondo.png";
import Logo from "../assets/Logo.png";

import Pagination from '../components/Pagination/Pagination';


function SideMenu({ activeSection, setActiveSection }) {
     const menuItems = [
      { name: 'Documentos de Tesoreria', path: 'documentos', icon: '📚' },
      { name: 'Gestión de Donaciones', path: 'donaciones', icon: '💰' },
      { name: 'Calendario', path: 'calendario', icon: '🗓️' },
   ];
   
   return (
      <div className="w-64 bg-white rounded-lg shadow-xl p-4 sticky top-6 self-start">
             <h3 className="text-lg font-bold mb-4 border-b pb-2 text-gray-800">Menú Tesorero</h3>
             <nav className="space-y-2">
                {menuItems.map((item) => (
                   <button
                      key={item.path}
                      onClick={() => setActiveSection(item.path)}
                      className={`flex items-center w-full px-3 py-2 rounded-lg text-left transition duration-200 
                             ${activeSection === item.path 
                                ? 'bg-green-500 text-white font-semibold shadow-md' 
                                : 'text-gray-700 hover:bg-gray-100'
                             }`}
                   >
                      <span className="mr-3 text-lg">{item.icon}</span>
                      {item.name}
                   </button>
                ))}
             </nav>
      </div>
   );
}

function TesoreroView() {
    const { user, logoutUser } = useAuth();
    const [libros, setLibros] = useState([]);
    const [librosFiltrados, setLibrosFiltrados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mostrarForm, setMostrarForm] = useState(false);
    const [editandoId, setEditandoId] = useState(null);
    const [activeSection, setActiveSection] = useState('cuentas'); 
    const [eventosCalendario, setEventosCalendario] = useState([]);
    const [cargandoCalendario, setCargandoCalendario] = useState(true);
    
    // 1. ESTADOS PARA GESTIÓN DE DONACIONES
    const [donaciones, setDonaciones] = useState([]);
    const [cargandoDonaciones, setCargandoDonaciones] = useState(true);
    const [errorDonaciones, setErrorDonaciones] = useState(null);
    const [exportando, setExportando] = useState(false);


    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10); // Límite de registros por pagina
    const [totalItems, setTotalItems] = useState(0);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);
    
    //Exportacion a excel

    const handleExportar = async () => {
        setExportando(true);
        try {
            const response = await exportarDonacionesAExcel();
            const contentType = response.headers.get('Content-Type') || 'text/csv';
            const contentDisposition = response.headers.get('Content-Disposition');
            
            let filename = 'donaciones_exportadas.csv';
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="(.+?)"/);
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1];
                }
            }

            // 2. Obtener los datos del archivo
            const blob = await response.blob(); 

            const url = window.URL.createObjectURL(new Blob([blob], { type: contentType }));
            const a = document.createElement('a');
            a.href = url;
            a.download = filename; //
            document.body.appendChild(a);
            a.click(); //
            a.remove(); //
            window.URL.revokeObjectURL(url); //

        } catch (error) {
            console.error("Error al exportar donaciones:", error);
            alert(error.message || "Fallo al iniciar la exportación.");
        } finally {
            setExportando(false);
        }
    };
    // Estado para filtros (mantenido)
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
        cargarEventosCalendario();

    }, []);
    useEffect(() => {
        if (activeSection === 'donaciones' && donaciones.length === 0) {
            cargarDonaciones();
        }
        
    }, [activeSection]);


// Donaciones 

    const cargarDonaciones = async (page, limit) => { // ⚠️ AHORA ACEPTA PARÁMETROS
    setCargandoDonaciones(true);
    setErrorDonaciones(null);
    
    try {
        // 1. Llamar al servicio con los parámetros de paginación
        // Tu servicio getDonaciones debe estar modificado para enviar page y limit a la API.
        const response = await getDonaciones(page, limit); 
        
        // 2. ⚠️ Procesar la respuesta del Backend (asumiendo formato DRF: { count: N, results: [...] })
        
        // Guardar las donaciones de la página actual
        setDonaciones(response.results || []); 
        
        // Guardar el total global de ítems (para calcular el número de páginas)
        setTotalItems(response.count || 0); 
        
    } catch (error) {
        console.error("Error cargando donaciones:", error);
        setErrorDonaciones(error.message || "No se pudieron cargar las donaciones.");
    } finally {
        setCargandoDonaciones(false);
    }
};

// 🔄 useEffect MODIFICADO
useEffect(() => {
    // Solo carga si la sección de donaciones está activa
    if (activeSection === 'donaciones') {
        // ⚠️ Llama a cargarDonaciones con el estado actual de la página y el límite.
        cargarDonaciones(currentPage, itemsPerPage); 
    }
    
// ⚠️ AÑADIDA DEPENDENCIA: Se ejecuta cada vez que cambia la página actual.
}, [activeSection, currentPage, itemsPerPage]);


// Calendario

    const cargarEventosCalendario = async () => {

        try {
            setCargandoCalendario(true);
            const authTokens = JSON.parse(localStorage.getItem('authTokens'));
            const token = authTokens?.access;
            
            if (!token) {
                console.error('No hay token disponible para cargar eventos');
                setCargandoCalendario(false);
                return;
            }

            const response = await axios.get('http://127.0.0.1:8000/api/eventos-calendario/', {
                headers: { 
                    Authorization: `Bearer ${token}` 
                }
            });
            
            setEventosCalendario(response.data);
        } catch (error) {
            console.error("Error cargando eventos:", error.response?.data || error.message);
        } finally {
            setCargandoCalendario(false);
        }
    };

    const cargarLibros = async () => {
        // ... (código existente para cargar libros)
        try {
            const data = await getLibrosCuentas();
            setLibros(data);
        } catch (error) {
            console.error("Error al cargar libros:", error);
        } finally {
            setLoading(false);
        }
    };


    // Funciones existentes (aplicarFiltros, handleFiltroChange, etc. - Mantenidas)
    const aplicarFiltros = () => {
        let resultados = [...libros];
        // ... (lógica de filtros existente)
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

    const handleFiltroChange = (e) => {
        const { name, value } = e.target;
        setFiltros(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const limpiarFiltros = () => {
        setFiltros({
            busqueda: '',
            tipo: '',
            año: '',
            mes: '',
            orden: '-fecha_periodo'
        });
    };

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
            fecha_periodo: libro.fecha_periodo.split('T')[0] || libro.fecha_periodo, 
            archivo: null
        });
        setMostrarForm(true);
        setActiveSection('cuentas'); 
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
        const datePart = fechaString.split('T')[0];
        return new Date(datePart).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const getDownloadUrl = (archivoPath) => {
        if (!archivoPath) return '#';
        if (archivoPath.startsWith('http')) {
            return archivoPath;
        }
        return `http://127.0.0.1:8000${archivoPath}`;
    };

    const DonacionesView = () => {

        const formatCurrency = (amount) => 
        new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);

        return (
            <div className="flex-1 bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold mb-4">💰 Historial de Donaciones (Mercado Pago)</h2>

                <button className="btn btn-success mb-3" onClick={handleExportar} disabled={exportando}>
                    {exportando ? 'Exportando...' : 'Exportar a Excel (.csv)'}
                </button>
                
                <p className='text-gray-600 mb-4'>
                    Lista de transacciones de donaciones procesadas. El estado se actualiza automáticamente a través de la API de Mercado Pago.
                </p>
                
                {cargandoDonaciones ? (
                    <div className="text-center py-8 text-blue-500">Cargando datos de donaciones...</div>
                ) : errorDonaciones ? (
                    <div className="alert alert-danger p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        Error al cargar las donaciones: {errorDonaciones}
                    </div>
                ) : donaciones.length === 0 && totalItems === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        Aún no hay donaciones registradas en el sistema.
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Local</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Donador</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha de Pago</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Pago MP</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {/* Mapeamos las donaciones */}
                                    {donaciones.map(donacion => (
                                        <tr key={donacion.id} className={
                                            donacion.estado === 'validado' ? 'bg-green-50' : 
                                            (donacion.estado === 'rechazado' ? 'bg-red-50' : 'bg-yellow-50')
                                        }>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{donacion.id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{donacion.nombre_donador}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{formatCurrency(donacion.monto)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`inline-flex px-2 text-xs font-semibold leading-5 rounded-full ${
                                                    donacion.estado === 'validado' ? 'bg-green-100 text-green-800' :
                                                    donacion.estado === 'rechazado' ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                    {donacion.estado.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                {donacion.fecha_donacion ? new Date(donacion.fecha_donacion).toLocaleDateString('es-ES') : 'Pendiente'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{donacion.pago_id || 'N/A'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Añadir el componente de Paginación */}
                        <Pagination
                            itemsPerPage={itemsPerPage}
                            totalItems={totalItems} 
                            paginate={paginate}
                            currentPage={currentPage}
                        />
                    </>
                )}
            </div>
        );
    };

    const LibrosCuentasView = () => (
        <div className="flex-1 bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">📚 Gestión de Documentos de Tesoreria</h2>
                <button
                    onClick={() => { setMostrarForm(true); setEditandoId(null); }}
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
                    Mostrando {librosFiltrados.length} de {libros.length} Docimentos
                </div>
            </div>

            {loading ? (
                <div className="text-center py-8">Cargando Documentos...</div>
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
    );

    const FormularioLibroView = () => (
        <div className="flex-1 bg-white rounded-lg shadow-md p-6">
            <form onSubmit={handleSubmit}>
                <h3 className="text-xl font-bold mb-4">
                    {editandoId ? '✏️ Editar Documentos' : ' Subir Nuevo Documento'}
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
                        <input
                            name="descripcion"
                            value={form.descripcion}
                            onChange={handleInputChange}
                            className="border w-full p-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="Descripción del documento..."
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
                            className="border w-full p-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-green-700 hover:file:bg-gray-100"
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
                        {editandoId ? 'Actualizar' : 'Subir'} Documento
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
    );

    // Componente CalendarioView
    const CalendarioView = () => (
        <div className="flex-1 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">🗓️ Calendario de Eventos</h2>
            
            {cargandoCalendario ? (
                <div className="text-center py-8">Cargando eventos del calendario...</div>
            ) : (
                <Calendario 
                    eventos={eventosCalendario} 
                />
            )}
        </div>
    );

    // Renderizado condicional del contenido principal
    const renderContent = () => {
        switch (activeSection) {
            case 'cuentas':

                return mostrarForm ? FormularioLibroView() : LibrosCuentasView();
            case 'donaciones':
                return DonacionesView(); //  Renderiza la nueva vista de Donaciones
            case 'calendario':
                return CalendarioView(); // Renderiza el Calendario
            default:
                return mostrarForm ? FormularioLibroView() : LibrosCuentasView();
        }
    }

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
                {/* HEADER */}
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

                {/* CONTENIDO PRINCIPAL */}
                <div className="flex gap-6 items-start">
                    
                    {/* 1. MENÚ LATERAL */}
                    <SideMenu 
                        activeSection={activeSection} 
                        setActiveSection={setActiveSection} 
                    />

                    {/* 2. CONTENIDO PRINCIPAL Y PANEL DE MENSAJES */}
                    <div className="flex-1 flex gap-6">
                        { }
                        {renderContent()}

                        { /*Panel de mensajes */}
                        <div className="w-96 space-y-6 self-stretch">
                            <MensajesPanel userType="TESORERO" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TesoreroView;