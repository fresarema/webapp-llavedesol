import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import Calendario from '../components/Calendario/Calendario';
import Fondo from "../assets/fondo.png";
import Logo from "../assets/Logo.png";

function SocioView() {
    const { user, logoutUser } = useAuth();
    const [anuncios, setAnuncios] = useState([]);
    const [eventos, setEventos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [seccionActiva, setSeccionActiva] = useState('anuncios');

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            // Obtener tokens del localStorage (CORREGIDO)
            const authTokensString = localStorage.getItem('authTokens');
            
            if (!authTokensString) {
                alert('No estás autenticado. Por favor, inicia sesión.');
                window.location.href = '/login';
                return;
            }
            
            // Parsear el objeto JSON
            const authTokens = JSON.parse(authTokensString);
            const token = authTokens.access; // ¡IMPORTANTE: El token está en .access!
            
            console.log('Token obtenido:', token ? '✅ Sí' : '❌ No');
            
            // Configurar headers con el token
            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            };

            const [anunciosRes, eventosRes] = await Promise.all([
                axios.get('http://127.0.0.1:8000/api/anuncios/', config),
                axios.get('http://127.0.0.1:8000/api/eventos-calendario/', config)
            ]);
            
            setAnuncios(anunciosRes.data);
            setEventos(eventosRes.data);
            
        } catch (error) {
            console.error("Error cargando datos:", error);
            
            if (error.response?.status === 401) {
                alert('Sesión expirada. Por favor, inicia sesión nuevamente.');
                logoutUser();
            }
        } finally {
            setLoading(false);
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

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-screen bg-gray-100">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                <p className="text-gray-600">Cargando panel de socio...</p>
            </div>
        );
    }

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
                {/* Header */}
                <div className="rounded-lg shadow-md p-6 mb-6"
                    style={{
                        backgroundColor: '#1e2939',
                        background: 'linear-gradient(135deg, #1e2939 0%, #2d3748 100%)'
                    }}>
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
                                    ONG Llave de Sol - Panel de Socio
                                </h1>
                                <p className="text-base mt-2 text-white">
                                    ¡Bienvenido, <span className="font-semibold">{user?.username}!</span>
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

                {/* Menú simple */}
                <div className="flex gap-4 mb-6">
                    <button
                        onClick={() => setSeccionActiva('anuncios')}
                        className={`px-6 py-3 rounded-lg font-medium transition duration-300 ${seccionActiva === 'anuncios' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                    >
                        📢 Anuncios
                    </button>
                    <button
                        onClick={() => setSeccionActiva('calendario')}
                        className={`px-6 py-3 rounded-lg font-medium transition duration-300 ${seccionActiva === 'calendario' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                    >
                        📅 Calendario
                    </button>
                </div>

                {/* Contenido */}
                {seccionActiva === 'anuncios' && (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">📢 Anuncios</h2>
                            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded">
                                {anuncios.length} anuncio(s)
                            </span>
                        </div>
                        
                        {anuncios.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                                <p className="text-gray-500 text-lg">No hay anuncios disponibles.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {anuncios.map(anuncio => (
                                    <div key={anuncio.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition duration-200 shadow-sm">
                                        <div className="flex gap-4">
                                            {anuncio.imagen && (
                                                <div className="flex-shrink-0">
                                                    <div className="w-24 h-24 rounded-lg overflow-hidden border border-gray-300">
                                                        <img 
                                                            src={anuncio.imagen} 
                                                            alt={anuncio.titulo}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => e.target.style.display = 'none'}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                            
                                            <div className="flex-1">
                                                <h3 className="text-xl font-bold text-gray-800 mb-2">{anuncio.titulo}</h3>
                                                <p className="text-gray-600 mb-3">{anuncio.descripcion}</p>
                                                <div className="text-xs text-gray-500">
                                                    📅 Publicado: {formatearFecha(anuncio.creado_en)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {seccionActiva === 'calendario' && (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-2xl font-bold mb-6 text-gray-800">📅 Calendario de Eventos</h2>
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-blue-800 text-sm">
                                <span className="font-bold">Modo solo lectura:</span> Los socios pueden ver los eventos pero no editarlos.
                            </p>
                        </div>
                        <Calendario 
                            eventos={eventos}
                            modo="socio"  
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

export default SocioView;