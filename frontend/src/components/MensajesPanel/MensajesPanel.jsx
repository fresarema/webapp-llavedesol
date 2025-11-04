import React, { useState, useEffect } from 'react';
import { mensajesService } from "../../services/mensajesService";

const MensajesPanel = ({ userType }) => {
    const [mensajes, setMensajes] = useState([]);
    const [mostrarForm, setMostrarForm] = useState(false);
    const [nuevoMensaje, setNuevoMensaje] = useState({
        asunto: '',
        mensaje: '',
        destinatario_tipo: userType === 'ADMIN' ? 'TESORERO' : 'ADMIN'
    });

    const cargarMensajes = async () => {
        try {
            const response = await mensajesService.getMensajes(userType);
            setMensajes(response.data);
        } catch (error) {
            console.error('❌ Error cargando mensajes:', error);
        }
    };

    const enviarMensaje = async (e) => {
        e.preventDefault();
        try {
            await mensajesService.createMensaje({
                ...nuevoMensaje,
                emisor_tipo: userType
            });
            
            setNuevoMensaje({ 
                asunto: '', 
                mensaje: '', 
                destinatario_tipo: userType === 'ADMIN' ? 'TESORERO' : 'ADMIN' 
            });
            setMostrarForm(false);
            cargarMensajes();
        } catch (error) {
            console.error('❌ Error enviando mensaje:', error);
        }
    };

    useEffect(() => {
        cargarMensajes();
        const interval = setInterval(cargarMensajes, 30000);
        return () => clearInterval(interval);
    }, [userType]);

    return (
        <div style={{
            background: 'white', 
            padding: '15px', 
            borderRadius: '8px', 
            margin: '10px 0', 
            border: '1px solid #ddd',
            width: '400px', // ✅ ANCHO FIJO
            maxHeight: '500px', // ✅ ALTURA MÁXIMA
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* HEADER */}
            <div style={{
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '15px',
                flexShrink: 0 // ✅ NO SE ENCOGE
            }}>
                <h3 style={{margin: 0, color: '#333', fontSize: '16px'}}>Bandeja de Mensajes</h3>
                <button 
                    style={{
                        background: '#3B82F6', 
                        color: 'white', 
                        border: 'none', 
                        padding: '6px 12px', 
                        borderRadius: '4px', 
                        cursor: 'pointer',
                        fontSize: '12px'
                    }}
                    onClick={() => setMostrarForm(!mostrarForm)}
                >
                    Nuevo
                </button>
            </div>

            {/* FORMULARIO */}
            {mostrarForm && (
                <div style={{
                    background: '#f9fafb', 
                    padding: '12px', 
                    borderRadius: '6px', 
                    marginBottom: '15px',
                    flexShrink: 0 
                }}>
                    <form onSubmit={enviarMensaje}>
                        <div style={{marginBottom: '10px'}}>
                            <input
                                type="text"
                                placeholder="Asunto"
                                value={nuevoMensaje.asunto}
                                onChange={(e) => setNuevoMensaje({...nuevoMensaje, asunto: e.target.value})}
                                style={{
                                    width: '100%', 
                                    padding: '8px', 
                                    border: '1px solid #ccc', 
                                    borderRadius: '4px',
                                    fontSize: '12px'
                                }}
                                required
                            />
                        </div>
                        
                        <div style={{marginBottom: '10px'}}>
                            <textarea
                                placeholder="Escribe tu mensaje..."
                                value={nuevoMensaje.mensaje}
                                onChange={(e) => setNuevoMensaje({...nuevoMensaje, mensaje: e.target.value})}
                                style={{
                                    width: '100%', 
                                    padding: '8px', 
                                    border: '1px solid #ccc', 
                                    borderRadius: '4px', 
                                    height: '60px',
                                    fontSize: '12px'
                                }}
                                required
                            />
                        </div>

                        <div style={{display: 'flex', gap: '8px'}}>
                            <button type="submit" style={{
                                background: '#10B981', 
                                color: 'white', 
                                border: 'none', 
                                padding: '6px 12px', 
                                borderRadius: '4px', 
                                cursor: 'pointer', 
                                flex: 1,
                                fontSize: '12px'
                            }}>
                                Enviar
                            </button>
                            <button 
                                type="button" 
                                onClick={() => setMostrarForm(false)}
                                style={{
                                    background: '#6B7280', 
                                    color: 'white', 
                                    border: 'none', 
                                    padding: '6px 12px', 
                                    borderRadius: '4px', 
                                    cursor: 'pointer', 
                                    flex: 1,
                                    fontSize: '12px'
                                }}
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* LISTA DE MENSAJES CON SCROLL */}
            <div style={{
                flex: 1, // ✅ OCUPA EL ESPACIO RESTANTE
                overflowY: 'auto', // ✅ SCROLL VERTICAL
                minHeight: '200px' // ✅ ALTURA MÍNIMA
            }}>
                <h4 style={{
                    marginBottom: '10px', 
                    color: '#555', 
                    fontSize: '14px',
                    flexShrink: 0
                }}>
                    Mensajes:
                </h4>
                
                {mensajes.length === 0 ? (
                    <p style={{
                        textAlign: 'center', 
                        color: '#666', 
                        fontStyle: 'italic',
                        fontSize: '12px',
                        padding: '20px 0'
                    }}>
                        No hay mensajes aún
                    </p>
                ) : (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                    }}>
                        {mensajes.map(mensaje => (
                            <div key={mensaje.id} style={{
                                background: mensaje.emisor_tipo === userType ? '#EFF6FF' : '#F0FDF4',
                                borderLeft: `3px solid ${mensaje.emisor_tipo === userType ? '#3B82F6' : '#10B981'}`,
                                padding: '10px',
                                borderRadius: '4px',
                                fontSize: '12px'
                            }}>
                                <div style={{
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    marginBottom: '5px'
                                }}>
                                    <strong style={{fontSize: '11px'}}>
                                        {mensaje.emisor_tipo === userType ? '👤 Tú' : `👤 ${mensaje.emisor_tipo}`}
                                    </strong>
                                    <span style={{
                                        color: '#666', 
                                        fontSize: '10px'
                                    }}>
                                        {new Date(mensaje.creado_en).toLocaleTimeString('es-ES', { 
                                            hour: '2-digit', 
                                            minute: '2-digit' 
                                        })}
                                    </span>
                                </div>
                                <h5 style={{
                                    margin: '3px 0', 
                                    color: '#333', 
                                    fontSize: '11px',
                                    fontWeight: 'bold'
                                }}>
                                    {mensaje.asunto}
                                </h5>
                                <p style={{
                                    margin: 0, 
                                    color: '#555', 
                                    fontSize: '11px',
                                    lineHeight: '1.3'
                                }}>
                                    {mensaje.mensaje.length > 80 
                                        ? `${mensaje.mensaje.substring(0, 80)}...` 
                                        : mensaje.mensaje
                                    }
                                </p>
                                {!mensaje.leido && mensaje.emisor_tipo !== userType && (
                                    <span style={{
                                        background: '#EF4444', 
                                        color: 'white', 
                                        padding: '1px 6px', 
                                        borderRadius: '8px', 
                                        fontSize: '9px', 
                                        marginTop: '3px', 
                                        display: 'inline-block'
                                    }}>
                                        NUEVO
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MensajesPanel;