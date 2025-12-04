import React, { useEffect, useState } from 'react';
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
    const [titulo, setTitulo] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [imagen, setImagen] = useState("");
    const [mostrarForm, setMostrarForm] = useState(false);
    const [editandoId, setEditandoId] = useState(null);
    const [loadingLibros, setLoadingLibros] = useState(true);

    useEffect(() => {
      cargarAnuncios();
      cargarLibrosCuentas();
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

                <div className="flex gap-6">
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
            </div>
        </div>
    );
}

export default AdminView;