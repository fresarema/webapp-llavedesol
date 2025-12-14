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
} from "../services/TesoreroService"; 

import MensajesPanel from "../components/MensajesPanel/MensajesPanel";
import Calendario from "../components/Calendario/Calendario"; 
import Fondo from "../assets/fondo.png";
import Logo from "../assets/Logo.png";
import Pagination from '../components/Pagination/Pagination';

// --- COMPONENTE SIDE MENU RESPONSIVO ---
function SideMenu({ activeSection, setActiveSection, isOpen, closeMenu }) {
     const menuItems = [
      { name: 'Documentos Tesorería', path: 'documentos', icon: '📚' },
      { name: 'Gestión Donaciones', path: 'donaciones', icon: '💰' },
      { name: 'Calendario', path: 'calendario', icon: '🗓️' },
   ];
   
   return (
      <div className={`
          bg-white rounded-lg shadow-xl p-4 
          transition-all duration-300 ease-in-out
          ${isOpen ? 'block' : 'hidden'} lg:block 
          w-full lg:w-64 lg:sticky lg:top-6 lg:self-start mb-6 lg:mb-0
      `}>
             <h3 className="text-lg font-bold mb-4 border-b pb-2 text-gray-800">Menú Tesorero</h3>
             <nav className="space-y-2">
                {menuItems.map((item) => (
                   <button
                      key={item.path}
                      onClick={() => {
                          setActiveSection(item.path);
                          closeMenu(); // Cierra el menú al seleccionar en móvil
                      }}
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
    
    // --- ESTADOS ---
    const [libros, setLibros] = useState([]);
    const [librosFiltrados, setLibrosFiltrados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mostrarForm, setMostrarForm] = useState(false);
    const [editandoId, setEditandoId] = useState(null);
    const [activeSection, setActiveSection] = useState('documentos'); 
    const [eventosCalendario, setEventosCalendario] = useState([]);
    const [cargandoCalendario, setCargandoCalendario] = useState(true);
    
    // Estado para menú móvil
    const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);

    // Estados Donaciones
    const [donaciones, setDonaciones] = useState([]);
    const [cargandoDonaciones, setCargandoDonaciones] = useState(true);
    const [errorDonaciones, setErrorDonaciones] = useState(null);
    const [exportando, setExportando] = useState(false);

    // Paginación
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const paginate = (pageNumber) => setCurrentPage(pageNumber);
    
    // Filtros Libros
    const [filtros, setFiltros] = useState({
        busqueda: '', tipo: '', año: '', mes: '', orden: '-fecha_periodo'
    });

    const [form, setForm] = useState({
        titulo: '', descripcion: '', tipo: 'MENSUAL', fecha_periodo: '', archivo: null
    });

    // --- EFECTOS ---
    useEffect(() => {
        cargarLibros();
        cargarEventosCalendario();
    }, []);

    useEffect(() => {
        if (activeSection === 'donaciones') {
            cargarDonaciones(currentPage, itemsPerPage);
        }
    }, [activeSection, currentPage, itemsPerPage]);

    useEffect(() => {
        aplicarFiltros();
    }, [libros, filtros]);

    // --- FUNCIONES DE CARGA Y LÓGICA ---

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

            const blob = await response.blob();
            const url = window.URL.createObjectURL(new Blob([blob], { type: contentType }));
            
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error(error);
            alert(error.message || "Fallo exportación.");
        } finally {
            setExportando(false);
        }
    };

    const cargarDonaciones = async (page, limit) => {
        setCargandoDonaciones(true);
        setErrorDonaciones(null);
        try {
            const response = await getDonaciones(page, limit);
            setDonaciones(response.results || []);
            setTotalItems(response.count || 0);
        } catch (error) {
            console.error(error);
            setErrorDonaciones(error.message);
        } finally {
            setCargandoDonaciones(false);
        }
    };

    const cargarEventosCalendario = async () => {
        try {
            setCargandoCalendario(true);
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
            console.error(error);
        } finally {
            setCargandoCalendario(false);
        }
    };

    const cargarLibros = async () => {
        try {
            const data = await getLibrosCuentas();
            setLibros(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // --- LÓGICA DE FILTROS ---

    const aplicarFiltros = () => {
        let resultados = [...libros];

        // Filtro por búsqueda
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
            resultados = resultados.filter(libro => 
                new Date(libro.fecha_periodo).getFullYear().toString() === filtros.año
            );
        }

        // Filtro por mes
        if (filtros.mes) {
            resultados = resultados.filter(libro => 
                (new Date(libro.fecha_periodo).getMonth() + 1).toString().padStart(2, '0') === filtros.mes
            );
        }

        // Ordenamiento
        resultados.sort((a, b) => {
            const fechaA = new Date(a.fecha_periodo);
            const fechaB = new Date(b.fecha_periodo);
            return filtros.orden === '-fecha_periodo' ? fechaB - fechaA : fechaA - fechaB;
        });

        setLibrosFiltrados(resultados);
    };

    const handleFiltroChange = (e) => {
        const { name, value } = e.target;
        setFiltros(prev => ({ ...prev, [name]: value }));
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

    // --- FORMULARIOS CRUD ---

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
        setActiveSection('documentos');
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
                alert("Actualizado correctamente");
            } else {
                await createLibroCuenta(form);
                alert("Subido correctamente");
            }
            cancelarForm();
            cargarLibros();
        } catch (error) {
            console.error(error);
            alert(`Error: ${error.message}`);
        }
    };

    const handleEliminar = async (id, titulo) => {
        if (window.confirm(`¿Eliminar "${titulo}"?`)) {
            try {
                await deleteLibroCuenta(id);
                alert("Eliminado correctamente");
                cargarLibros();
            } catch (error) {
                console.error(error);
                alert("Error al eliminar");
            }
        }
    };

    // --- HELPERS ---

    const formatearFecha = (fechaString) => {
        return new Date(fechaString.split('T')[0]).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getDownloadUrl = (archivoPath) => {
        if (!archivoPath) return '#';
        return archivoPath.startsWith('http') ? archivoPath : `http://127.0.0.1:8000${archivoPath}`;
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP'
        }).format(amount);
    };

    // --- VISTAS INTERNAS  ---

    const DonacionesView = () => (
        <div className="flex-1 bg-white rounded-lg shadow-md p-4 md:p-6 w-full">
            <h2 className="text-xl md:text-2xl font-bold mb-4">💰 Historial de Donaciones</h2>
            <button className="w-full md:w-auto btn btn-success mb-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded" onClick={handleExportar} disabled={exportando}>
                {exportando ? 'Exportando...' : 'Exportar a Excel (.csv)'}
            </button>
            <p className='text-sm text-gray-600 mb-4'>Transacciones de Mercado Pago actualizadas automáticamente.</p>
            
            {cargandoDonaciones ? <div className="text-center py-8">Cargando...</div> : errorDonaciones ? <div className="p-3 bg-red-100 text-red-700 rounded">{errorDonaciones}</div> : donaciones.length === 0 ? <div className="text-center py-8 text-gray-500">No hay donaciones aún.</div> : (
                <>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">ID</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">Donador</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">Monto</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">Estado</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">Fecha</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {donaciones.map(donacion => (
                                    <tr key={donacion.id} className={donacion.estado === 'validado' ? 'bg-green-50' : (donacion.estado === 'rechazado' ? 'bg-red-50' : 'bg-yellow-50')}>
                                        <td className="px-4 py-3 font-medium text-gray-900">{donacion.id}</td>
                                        <td className="px-4 py-3 text-gray-700">{donacion.nombre_donador}</td>
                                        <td className="px-4 py-3 font-semibold text-gray-900">{formatCurrency(donacion.monto)}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex px-2 text-xs font-semibold leading-5 rounded-full ${donacion.estado === 'validado' ? 'bg-green-100 text-green-800' : donacion.estado === 'rechazado' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                {donacion.estado.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-700">{donacion.fecha_donacion ? new Date(donacion.fecha_donacion).toLocaleDateString('es-ES') : 'Pendiente'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-4">
                        <Pagination itemsPerPage={itemsPerPage} totalItems={totalItems} paginate={paginate} currentPage={currentPage} />
                    </div>
                </>
            )}
        </div>
    );

    const LibrosCuentasView = () => (
        <div className="flex-1 bg-white rounded-lg shadow-md p-4 md:p-6 w-full">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-xl md:text-2xl font-bold">📚 Documentos Tesorería</h2>
                <button onClick={() => { setMostrarForm(true); setEditandoId(null); }} className="w-full md:w-auto bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-medium transition">
                    + Subir Nuevo Libro
                </button>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-4 border">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-gray-700">Filtros</h3>
                    <button onClick={limpiarFiltros} className="text-xs text-gray-500 hover:underline">Limpiar</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                    <input type="text" name="busqueda" value={filtros.busqueda} onChange={handleFiltroChange} placeholder="Buscar..." className="border p-2 rounded text-sm w-full" />
                    <select name="tipo" value={filtros.tipo} onChange={handleFiltroChange} className="border p-2 rounded text-sm w-full">
                        <option value="">Todos los tipos</option>
                        <option value="MENSUAL">Mensual</option>
                        <option value="TRIMESTRAL">Trimestral</option>
                        <option value="ANUAL">Anual</option>
                        <option value="EVENTO">Evento</option>
                    </select>
                    <select name="año" value={filtros.año} onChange={handleFiltroChange} className="border p-2 rounded text-sm w-full">
                        <option value="">Año</option>
                        {obtenerAñosUnicos().map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                    <select name="mes" value={filtros.mes} onChange={handleFiltroChange} className="border p-2 rounded text-sm w-full">
                        <option value="">Mes</option>
                        <option value="01">Enero</option>
                        <option value="02">Febrero</option>
                        {/* ... resto de meses ... */}
                        <option value="12">Diciembre</option>
                    </select>
                    <select name="orden" value={filtros.orden} onChange={handleFiltroChange} className="border p-2 rounded text-sm w-full">
                        <option value="-fecha_periodo">Más reciente</option>
                        <option value="fecha_periodo">Más antiguo</option>
                    </select>
                </div>
            </div>

            {loading ? <div className="text-center py-8">Cargando...</div> : librosFiltrados.length === 0 ? <div className="text-center py-8 text-gray-500">No se encontraron documentos.</div> : (
                <div className="space-y-4">
                    {librosFiltrados.map((libro) => (
                        <div key={libro.id} className="border p-4 rounded-lg bg-gray-50 flex flex-col md:flex-row justify-between gap-4">
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-800">{libro.titulo}</h3>
                                <p className="text-gray-600 text-sm mt-1">{libro.descripcion}</p>
                                <div className="mt-2 text-xs text-gray-500">
                                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2">{libro.tipo}</span>
                                    <span>{formatearFecha(libro.fecha_periodo)}</span>
                                </div>
                            </div>
                            <div className="flex gap-2 w-full md:w-auto">
                                <a href={getDownloadUrl(libro.archivo)} download className="flex-1 md:flex-none text-center bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded text-sm">Descargar</a>
                                <button onClick={() => iniciarEdicion(libro)} className="flex-1 md:flex-none bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-3 rounded text-sm">Editar</button>
                                <button onClick={() => handleEliminar(libro.id, libro.titulo)} className="flex-1 md:flex-none bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded text-sm">Eliminar</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const FormularioLibroView = () => (
        <div className="flex-1 bg-white rounded-lg shadow-md p-6 w-full">
            <h3 className="text-xl font-bold mb-4">{editandoId ? '✏️ Editar' : '➕ Subir'} Documento</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input type="text" name="titulo" value={form.titulo} onChange={handleInputChange} className="border w-full p-3 rounded" placeholder="Título (Ej: Balance Enero)" required />
                <input name="descripcion" value={form.descripcion} onChange={handleInputChange} className="border w-full p-3 rounded" placeholder="Descripción" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <select name="tipo" value={form.tipo} onChange={handleInputChange} className="border w-full p-3 rounded"><option value="MENSUAL">Mensual</option><option value="TRIMESTRAL">Trimestral</option><option value="ANUAL">Anual</option><option value="EVENTO">Evento</option></select>
                    <input type="date" name="fecha_periodo" value={form.fecha_periodo} onChange={handleInputChange} className="border w-full p-3 rounded" required />
                </div>
                <div className="border p-4 rounded bg-gray-50">
                    <label className="block text-sm font-medium mb-2">Archivo (PDF/Excel):</label>
                    <input type="file" name="archivo" onChange={handleInputChange} className="w-full" accept=".pdf,.xlsx,.xls,.doc,.docx" required={!editandoId} />
                </div>
                <div className="flex gap-3 pt-2">
                    <button type="submit" className="flex-1 bg-green-600 text-white py-3 rounded hover:bg-green-700">Guardar</button>
                    <button type="button" onClick={cancelarForm} className="flex-1 bg-gray-500 text-white py-3 rounded hover:bg-gray-600">Cancelar</button>
                </div>
            </form>
        </div>
    );

    const CalendarioView = () => (
        <div className="flex-1 bg-white rounded-lg shadow-md p-4 md:p-6 w-full">
            <h2 className="text-xl md:text-2xl font-bold mb-4">🗓️ Calendario</h2>
            {cargandoCalendario ? <p>Cargando...</p> : <Calendario eventos={eventosCalendario} />}
        </div>
    );

    const renderContent = () => {
        switch (activeSection) {
            case 'documentos': return mostrarForm ? FormularioLibroView() : LibrosCuentasView();
            case 'donaciones': return DonacionesView();
            case 'calendario': return CalendarioView();
            default: return LibrosCuentasView();
        }
    }

    return (
        <div style={{ background: `url(${Fondo}) fixed center/cover no-repeat`, minHeight: '100vh' }} className="p-4">
            

            <div className="bg-gray-900 bg-opacity-90 rounded-xl shadow-lg p-6 mb-6 flex flex-col md:flex-row justify-between items-center gap-4 text-white">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="w-16 h-16 rounded-full bg-white p-1 flex-shrink-0">
                        <img src={Logo} alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    <div>
                        <h1 className="text-xl md:text-3xl font-bold leading-tight">Panel Tesorería</h1>
                        <p className="text-sm md:text-lg text-gray-300">Bienvenido, {user?.username}</p>
                    </div>
                    {/* Botón Hamburguesa Móvil */}
                    <button onClick={() => setMenuMovilAbierto(!menuMovilAbierto)} className="md:hidden ml-auto text-3xl">☰</button>
                </div>
                <button onClick={logoutUser} className="hidden md:block bg-red-500 hover:bg-red-600 px-6 py-2 rounded-lg font-bold transition">Cerrar Sesión</button>
            </div>

            {/* CONTENEDOR PRINCIPAL FLEX */}
            <div className="flex flex-col lg:flex-row gap-6 items-start">
                
                {/* 1. MENÚ LATERAL */}
                <SideMenu 
                    activeSection={activeSection} 
                    setActiveSection={setActiveSection} 
                    isOpen={menuMovilAbierto}
                    closeMenu={() => setMenuMovilAbierto(false)}
                />

                {/* 2. CONTENIDO CENTRAL + PANEL MENSAJES */}
                <div className="flex-1 flex flex-col lg:flex-row gap-6 w-full min-w-0">
                    
                    {/* Área Principal Dinámica */}
                    <div className="flex-1 min-w-0">
                        {renderContent()}
                    </div>

                    {/* Panel de Mensajes (Abajo en móvil, Derecha en Desktop) */}
                    <div className="w-full lg:w-80 flex-shrink-0">
                        <MensajesPanel userType="TESORERO" />
                        
                        {/* Botón cerrar sesión móvil al final */}
                        <button onClick={logoutUser} className="md:hidden w-full mt-6 bg-red-500 text-white py-3 rounded-lg font-bold">Cerrar Sesión</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TesoreroView;