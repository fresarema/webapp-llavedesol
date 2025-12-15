import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { cambiarPassword } from '../services/socioService';
import Calendario from '../components/Calendario/Calendario';
import MensajesPanel from '../components/MensajesPanel/MensajesPanel';
import Fondo from "../assets/fondo.png";
import Logo from "../assets/Logo.png";
import Swal from 'sweetalert2';

// Componente Menú Lateral (Extraído para limpieza)
const SocioSideMenu = ({ activeSection, setActiveSection, onOpenChangePassword, isOpen, closeMenu }) => {
    const btnClass = (section) => `
        w-full p-3 text-left rounded-lg transition-all duration-200 flex items-center gap-3 font-medium
        ${activeSection === section 
            ? 'bg-blue-600 text-white shadow-md' 
            : 'text-gray-700 hover:bg-gray-100'}
    `;

    return (
        <div className={`
            bg-white rounded-lg shadow-md p-5 flex-shrink-0
            transition-all duration-300 ease-in-out
            ${isOpen ? 'block' : 'hidden'} lg:block 
            w-full lg:w-64 lg:sticky lg:top-6 lg:self-start mb-6 lg:mb-0
        `}>
            <h3 className="text-base font-bold mb-4 text-gray-700 uppercase tracking-wider">Menú Socio</h3>
            <div className="flex flex-col gap-2">
                <button 
                    onClick={() => { setActiveSection('calendario'); closeMenu(); }}
                    className={btnClass('calendario')}
                >
                    <span className="text-lg">🗓️</span> Calendario
                </button>
                
                <div className="border-t my-2 border-gray-100"></div>

                <button 
                    onClick={() => { onOpenChangePassword(true); closeMenu(); }}
                    className="w-full p-3 text-left rounded-lg transition-all duration-200 flex items-center gap-3 font-medium text-gray-700 hover:bg-yellow-50 hover:text-yellow-700"
                >
                    <span className="text-lg">🔑</span> Cambiar Contraseña
                </button>
            </div>
        </div>
    );
};

function SocioView() {
    const { user, logoutUser } = useAuth();
    
    // Estados principales
    const [eventos, setEventos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [seccionActiva, setSeccionActiva] = useState('calendario');
    
    // Estado para el menú móvil (Responsive)
    const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
    
    // Estados para el cambio de contraseña
    const [mostrarCambioPassword, setMostrarCambioPassword] = useState(false);
    const [passwordActual, setPasswordActual] = useState('');
    const [nuevaPassword, setNuevaPassword] = useState('');
    const [confirmarPassword, setConfirmarPassword] = useState('');
    const [cambiandoPassword, setCambiandoPassword] = useState(false);

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            const authTokensString = localStorage.getItem('authTokens');
            
            if (!authTokensString) {
                Swal.fire({
                    icon: "error",
                    title: "Sesión expirada",
                    text: "Por favor, inicia sesión nuevamente.",
                    confirmButtonText: "OK"
                }).then(() => {
                    window.location.href = '/login';
                });
                return;
            }
            
            const authTokens = JSON.parse(authTokensString);
            const token = authTokens.access;
            
            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            };

            const eventosRes = await axios.get('http://127.0.0.1:8000/api/eventos-calendario/', config);
            setEventos(eventosRes.data);
            
        } catch (error) {
            console.error("Error cargando datos:", error);
            
            if (error.response?.status === 401) {
                Swal.fire({
                    icon: "error",
                    title: "Sesión expirada",
                    text: "Por favor, inicia sesión nuevamente.",
                    confirmButtonText: "OK"
                }).then(() => {
                    logoutUser();
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCambiarPassword = async (e) => {
        e.preventDefault();
        
        // Validaciones
        if (!passwordActual || !nuevaPassword || !confirmarPassword) {
            Swal.fire({
                icon: "warning",
                title: "Campos requeridos",
                text: "Todos los campos son obligatorios",
                confirmButtonText: "OK"
            });
            return;
        }
        
        if (nuevaPassword !== confirmarPassword) {
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "Las contraseñas nuevas no coinciden",
                confirmButtonText: "OK"
            });
            return;
        }
        
        if (nuevaPassword.length < 6) {
            Swal.fire({
                icon: "warning",
                title: "Contraseña muy corta",
                text: "La nueva contraseña debe tener al menos 6 caracteres",
                confirmButtonText: "OK"
            });
            return;
        }
        
        try {
            setCambiandoPassword(true);
            
            const authTokensString = localStorage.getItem('authTokens');
            const authTokens = JSON.parse(authTokensString);
            const token = authTokens.access;
            
            const datos = {
                password_actual: passwordActual,
                nueva_password: nuevaPassword,
                confirmar_password: confirmarPassword
            };
            
            // Llamar al servicio de cambio de contraseña
            await cambiarPassword(datos, token);
            
            // Si fue exitoso
            Swal.fire({
                icon: "success",
                title: "¡Contraseña cambiada!",
                text: "Tu contraseña se ha actualizado correctamente",
                showConfirmButton: false,
                timer: 2000
            });
            
            // Limpiar formulario
            setPasswordActual('');
            setNuevaPassword('');
            setConfirmarPassword('');
            
            // Ocultar formulario después del éxito
            setTimeout(() => {
                setMostrarCambioPassword(false);
            }, 2000);
            
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
            
            Swal.fire({
                icon: "error",
                title: "Error",
                text: mensajeError,
                confirmButtonText: "OK"
            });
            
        } finally {
            setCambiandoPassword(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-screen"
                style={{
                    background: `url(${Fondo}) fixed center/cover no-repeat`,
                }}
            >
                <div className="bg-white/90 backdrop-blur-sm p-8 rounded-lg shadow-lg">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4 mx-auto"></div>
                    <p className="text-gray-700 font-medium">Cargando panel de socio...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ background: `url(${Fondo}) fixed center/cover no-repeat`, minHeight: '100vh' }} className="p-4">
            
            {/* --- HEADER RESPONSIVO --- */}
            <div className="bg-gray-900 bg-opacity-90 rounded-xl shadow-lg p-6 mb-6 flex flex-col md:flex-row justify-between items-center gap-4 text-white">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="w-16 h-16 rounded-full bg-white p-1 flex-shrink-0">
                        <img src={Logo} alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold leading-tight">Panel de Socio</h1>
                        <p className="text-sm md:text-base text-gray-300">
                            Bienvenido, <span className="font-semibold text-white">{user?.username}</span>
                        </p>
                    </div>
                    {/* Botón Hamburguesa (Solo Móvil) */}
                    <button 
                        onClick={() => setMenuMovilAbierto(!menuMovilAbierto)}
                        className="md:hidden ml-auto text-3xl focus:outline-none hover:text-blue-400 transition"
                    >
                        ☰
                    </button>
                </div>
                <button 
                    onClick={logoutUser} 
                    className="hidden md:block bg-red-500 hover:bg-red-600 px-6 py-2 rounded-lg font-bold text-sm transition"
                >
                    Cerrar Sesión
                </button>
            </div>

            {/* --- CONTENEDOR FLEX PRINCIPAL (Column en móvil, Row en Desktop) --- */}
            <div className="flex flex-col lg:flex-row gap-6 items-start">
                
                {/* 1. MENÚ LATERAL */}
                <SocioSideMenu 
                    activeSection={seccionActiva} 
                    setActiveSection={setSeccionActiva} 
                    onOpenChangePassword={setMostrarCambioPassword}
                    isOpen={menuMovilAbierto}
                    closeMenu={() => setMenuMovilAbierto(false)}
                />

                {/* 2. CONTENIDO CENTRAL */}
                <div className="flex-1 w-full min-w-0 flex flex-col lg:flex-row gap-6">
                    
                    {/* Área Dinámica (Calendario) */}
                    <div className="flex-1 min-w-0">
                        {seccionActiva === 'calendario' && (
                            <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
                                <h2 className="text-2xl font-bold mb-4 text-gray-800">📅 Calendario de Eventos</h2>
                                {/* ELIMINADO EL MENSAJE INFORMATIVO */}
                                <Calendario eventos={eventos} modo="socio" />
                            </div>
                        )}
                    </div>

                    {/* 3. PANEL DE MENSAJES (DERECHA/ABAJO) */}
                    <div className="w-full lg:w-80 flex-shrink-0">
                        <MensajesPanel userType="SOCIO" />
                        
                        {/* Botón cerrar sesión móvil */}
                        <button onClick={logoutUser} className="md:hidden w-full mt-6 bg-red-500 text-white py-3 rounded-lg font-bold shadow-lg">
                            Cerrar Sesión
                        </button>
                    </div>
                </div>
            </div>

            {/* MODAL CAMBIO DE CONTRASEÑA (RESPONSIVO) */}
            {mostrarCambioPassword && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                🔑 Cambiar Contraseña
                            </h3>
                            <button 
                                onClick={() => { 
                                    setMostrarCambioPassword(false); 
                                    setPasswordActual('');
                                    setNuevaPassword('');
                                    setConfirmarPassword('');
                                }} 
                                className="text-gray-400 hover:text-gray-600 text-2xl transition"
                            >
                                &times;
                            </button>
                        </div>
                        
                        <form onSubmit={handleCambiarPassword} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Contraseña Actual</label>
                                <input 
                                    type="password" 
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" 
                                    value={passwordActual} 
                                    onChange={(e) => setPasswordActual(e.target.value)} 
                                    required 
                                    disabled={cambiandoPassword} 
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Nueva Contraseña</label>
                                <input 
                                    type="password" 
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" 
                                    value={nuevaPassword} 
                                    onChange={(e) => setNuevaPassword(e.target.value)} 
                                    required 
                                    disabled={cambiandoPassword} 
                                    minLength="6" 
                                />
                                <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Confirmar Nueva Contraseña</label>
                                <input 
                                    type="password" 
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" 
                                    value={confirmarPassword} 
                                    onChange={(e) => setConfirmarPassword(e.target.value)} 
                                    required 
                                    disabled={cambiandoPassword} 
                                    minLength="6" 
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button 
                                    type="button" 
                                    onClick={() => {
                                        setMostrarCambioPassword(false);
                                        setPasswordActual('');
                                        setNuevaPassword('');
                                        setConfirmarPassword('');
                                    }} 
                                    className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition" 
                                    disabled={cambiandoPassword}
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md transition disabled:opacity-70 flex items-center" 
                                    disabled={cambiandoPassword}
                                >
                                    {cambiandoPassword ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SocioView;