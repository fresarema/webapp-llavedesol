import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { cambiarPassword } from '../services/socioService';
import Calendario from '../components/Calendario/Calendario';
import MensajesPanel from '../components/MensajesPanel/MensajesPanel';
import Fondo from "../assets/fondo.png";
import Logo from "../assets/Logo.png";

function SocioView() {
    const { user, logoutUser } = useAuth();
    const [anuncios, setAnuncios] = useState([]);
    const [eventos, setEventos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [seccionActiva, setSeccionActiva] = useState('anuncios');
    
    // Estados para el cambio de contraseña
    const [mostrarCambioPassword, setMostrarCambioPassword] = useState(false);
    const [passwordActual, setPasswordActual] = useState('');
    const [nuevaPassword, setNuevaPassword] = useState('');
    const [confirmarPassword, setConfirmarPassword] = useState('');
    const [cambiandoPassword, setCambiandoPassword] = useState(false);
    const [mensajePassword, setMensajePassword] = useState('');
    const [tipoMensaje, setTipoMensaje] = useState('');

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            const authTokensString = localStorage.getItem('authTokens');
            
            if (!authTokensString) {
                alert('No estás autenticado. Por favor, inicia sesión.');
                window.location.href = '/login';
                return;
            }
            
            const authTokens = JSON.parse(authTokensString);
            const token = authTokens.access;
            
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

    // Función para cambiar contraseña
    const handleCambiarPassword = async (e) => {
        e.preventDefault();
        
        // Validaciones
        if (!passwordActual || !nuevaPassword || !confirmarPassword) {
            setMensajePassword('Todos los campos son obligatorios');
            setTipoMensaje('error');
            return;
        }
        
        if (nuevaPassword !== confirmarPassword) {
            setMensajePassword('Las contraseñas nuevas no coinciden');
            setTipoMensaje('error');
            return;
        }
        
        if (nuevaPassword.length < 6) {
            setMensajePassword('La nueva contraseña debe tener al menos 6 caracteres');
            setTipoMensaje('error');
            return;
        }
        
        try {
            setCambiandoPassword(true);
            setMensajePassword('');
            
            const authTokensString = localStorage.getItem('authTokens');
            const authTokens = JSON.parse(authTokensString);
            const token = authTokens.access;
            
            const datos = {
                password_actual: passwordActual,
                nueva_password: nuevaPassword,
                confirmar_password: confirmarPassword
            };
            
            // Llamar al servicio de cambio de contraseña
            const resultado = await cambiarPassword(datos, token);
            
            // Si fue exitoso
            setMensajePassword('✅ Contraseña cambiada correctamente');
            setTipoMensaje('success');
            
            // Limpiar formulario
            setPasswordActual('');
            setNuevaPassword('');
            setConfirmarPassword('');
            
            // Ocultar formulario después de 3 segundos
            setTimeout(() => {
                setMostrarCambioPassword(false);
                setMensajePassword('');
            }, 3000);
            
        } catch (error) {
            console.error('Error cambiando contraseña:', error);
            
            let mensajeError = 'Error al cambiar la contraseña';
            if (error.response?.data?.error) {
                mensajeError = error.response.data.error;
            } else if (error.response?.data?.detail) {
                mensajeError = error.response.data.detail;
            } else if (error.response?.status === 400) {
                mensajeError = 'Contraseña actual incorrecta';
            }
            
            setMensajePassword(`❌ ${mensajeError}`);
            setTipoMensaje('error');
            
        } finally {
            setCambiandoPassword(false);
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
            <div className="flex flex-col justify-center items-center h-screen"
                style={{
                    background: `url(${Fondo}) fixed center/cover no-repeat`,
                }}
            >
                <div className="bg-white/90 backdrop-blur-sm p-8 rounded-lg shadow-lg">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                    <p className="text-gray-700 font-medium">Cargando panel de socio...</p>
                </div>
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
                                <p className="text-sm mt-1 text-gray-300">
                                    Estás en el grupo: <span className="font-semibold">SOCIO</span>
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
                    {/* Menú lateral */}
                    <div style={{
                        width: '220px',
                        display: 'flex',
                        flexDirection: 'column',
                        flexShrink: 0
                    }}>
                        <div className="bg-white rounded-lg shadow-md p-5">
                            <h3 className="text-base font-bold mb-4 text-gray-700">Menú Socio</h3>
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
                                    onClick={() => setMostrarCambioPassword(true)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        textAlign: 'left',
                                        borderRadius: '6px',
                                        border: 'none',
                                        backgroundColor: mostrarCambioPassword ? '#3b82f6' : 'transparent',
                                        color: mostrarCambioPassword ? 'white' : '#374151',
                                        fontWeight: '500',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        fontSize: '14px'
                                    }}
                                >
                                    <span>🔑</span>
                                    <span>Cambiar Contraseña</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Contenido principal */}
                    <div style={{ flex: 1, minWidth: 0 }}>
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
                                        <p className="text-gray-400 text-sm mt-2">
                                            Los administradores publicarán anuncios importantes aquí.
                                        </p>
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

                    {/* Panel de mensajes (derecha) - SE MANTIENE */}
                    <div style={{ 
                        width: '380px',
                        flexShrink: 0
                    }}>
                        <MensajesPanel userType="SOCIO" />
                    </div>
                </div>

                {/* Modal de Cambio de Contraseña - SE MANTIENE IGUAL */}
                {mostrarCambioPassword && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
                            <div className="bg-gray-100 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                                <h3 className="text-xl font-bold text-gray-800">🔑 Cambiar Contraseña</h3>
                                <button 
                                    onClick={() => {
                                        setMostrarCambioPassword(false);
                                        setMensajePassword('');
                                        setPasswordActual('');
                                        setNuevaPassword('');
                                        setConfirmarPassword('');
                                    }}
                                    className="text-gray-500 hover:text-gray-700 font-bold text-xl"
                                >
                                    &times;
                                </button>
                            </div>
                            
                            <form onSubmit={handleCambiarPassword}>
                                <div className="p-6 space-y-4">
                                    {mensajePassword && (
                                        <div className={`p-3 rounded ${tipoMensaje === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {mensajePassword}
                                        </div>
                                    )}
                                    
                                    <div>
                                        <label className="block mb-2">
                                            <span className="block text-sm font-semibold text-gray-700 mb-2">Contraseña Actual:</span>
                                            <input
                                                type="password"
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                value={passwordActual}
                                                onChange={(e) => setPasswordActual(e.target.value)}
                                                placeholder="Ingresa tu contraseña actual"
                                                required
                                                disabled={cambiandoPassword}
                                            />
                                        </label>
                                    </div>

                                    <div>
                                        <label className="block mb-2">
                                            <span className="block text-sm font-semibold text-gray-700 mb-2">Nueva Contraseña:</span>
                                            <input
                                                type="password"
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                value={nuevaPassword}
                                                onChange={(e) => setNuevaPassword(e.target.value)}
                                                placeholder="Ingresa la nueva contraseña"
                                                required
                                                disabled={cambiandoPassword}
                                                minLength="6"
                                            />
                                            <p className="text-xs text-gray-500 mt-2">
                                                Mínimo 6 caracteres
                                            </p>
                                        </label>
                                    </div>

                                    <div>
                                        <label className="block mb-2">
                                            <span className="block text-sm font-semibold text-gray-700 mb-2">Confirmar Nueva Contraseña:</span>
                                            <input
                                                type="password"
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                value={confirmarPassword}
                                                onChange={(e) => setConfirmarPassword(e.target.value)}
                                                placeholder="Confirma la nueva contraseña"
                                                required
                                                disabled={cambiandoPassword}
                                                minLength="6"
                                            />
                                        </label>
                                    </div>
                                </div>

                                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMostrarCambioPassword(false);
                                            setMensajePassword('');
                                            setPasswordActual('');
                                            setNuevaPassword('');
                                            setConfirmarPassword('');
                                        }}
                                        className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-6 rounded-lg font-medium transition duration-300"
                                        disabled={cambiandoPassword}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="bg-green-500 hover:bg-green-600 text-white py-2 px-6 rounded-lg font-medium transition duration-300"
                                        disabled={cambiandoPassword}
                                    >
                                        {cambiandoPassword ? (
                                            <>
                                                <span className="animate-spin inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                                                Cambiando...
                                            </>
                                        ) : 'Cambiar Contraseña'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default SocioView;