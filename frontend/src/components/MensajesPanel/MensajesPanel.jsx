import React, { useState, useEffect, useRef } from 'react';
import { mensajesService } from "../../services/mensajesService";
import Swal from 'sweetalert2';

/**
 * MensajesPanel
 * - ADMIN: elimina definitivamente (DELETE backend).
 * - TESORERO / SOCIO: "eliminar" solo oculta localmente (localStorage) — no toca backend.
 * - Botón eliminar: mismo diseño para todos.
 * - Crear mensaje: solo ADMIN y TESORERO.
 *
 * NOTE: Ya no hay ningún botón ni enlace para "restaurar" mensajes ocultos.
 */

const HIDDEN_KEY_PREFIX = 'mensajes_hidden_'; // + userType (ej. mensajes_hidden_SOCIO)

const MensajesPanel = ({ userType }) => {
  const [mensajes, setMensajes] = useState([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [nuevoMensaje, setNuevoMensaje] = useState({
    asunto: '',
    mensaje: '',
    destinatario_tipo: userType === 'ADMIN' ? 'TESORERO' : 'ADMIN'
  });

  const listaRef = useRef(null);
  const hiddenKey = `${HIDDEN_KEY_PREFIX}${userType}`;

  // helpers para ocultos en localStorage
  const loadHiddenIds = () => {
    try {
      const raw = localStorage.getItem(hiddenKey);
      if (!raw) return new Set();
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return new Set();
      return new Set(arr);
    } catch (e) {
      console.warn('Error leyendo hidden ids:', e);
      return new Set();
    }
  };

  const saveHiddenIds = (setIds) => {
    try {
      const arr = Array.from(setIds);
      localStorage.setItem(hiddenKey, JSON.stringify(arr));
    } catch (e) {
      console.warn('Error guardando hidden ids:', e);
    }
  };

  // cargar mensajes y filtrar los ocultos locales
  const cargarMensajes = async () => {
    try {
      const response = await mensajesService.getMensajes(userType);
      const data = Array.isArray(response.data) ? response.data : (response.data.results || []);
      const hidden = loadHiddenIds();
      const visibles = data.filter(m => !(m && hidden.has(m.id)));
      setMensajes(visibles);
    } catch (error) {
      console.error('❌ Error cargando mensajes:', error);
      setMensajes([]);
    }
  };

  useEffect(() => {
    cargarMensajes();
    const interval = setInterval(cargarMensajes, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userType]);

  // scroll automático al final
  useEffect(() => {
    if (!listaRef.current) return;
    listaRef.current.scrollTop = listaRef.current.scrollHeight;
  }, [mensajes]);

  // Función para traducir errores (similar a la que usaste antes)
  const traducirError = (mensaje) => {
    if (!mensaje) return mensaje;
    
    const traducciones = {
      "already exists": "ya existe en el sistema",
      "This field is required.": "Este campo es obligatorio.",
      "Enter a valid email address.": "Ingresa una dirección de correo válida.",
      "Enter a valid date.": "Ingresa una fecha válida.",
      "Ensure this value has at most": "Asegúrate de que este valor tenga como máximo",
      "Ensure this value has at least": "Asegúrate de que este valor tenga al menos",
      "characters": "caracteres",
      "Invalid phone number": "Número de teléfono inválido",
      "Invalid format": "Formato inválido",
      "Must be a valid number": "Debe ser un número válido",
      "Must be unique": "Debe ser único",
      "Something went wrong": "Algo salió mal",
      "Server error": "Error del servidor",
      "Validation error": "Error de validación",
      "Forbidden": "No tienes permiso para realizar esta acción",
      "Unauthorized": "No estás autorizado. Inicia sesión nuevamente.",
      "Network Error": "Error de red. Verifica tu conexión.",
    };

    let mensajeTraducido = mensaje;
    Object.keys(traducciones).forEach(key => {
      if (mensajeTraducido.includes(key)) {
        mensajeTraducido = mensajeTraducido.replace(key, traducciones[key]);
      }
    });

    return mensajeTraducido;
  };

  // enviar mensaje (optimista)
  const enviarMensaje = async (e) => {
    e.preventDefault();
    try {
      const resp = await mensajesService.createMensaje({
        ...nuevoMensaje,
        emisor_tipo: userType
      });

      if (resp && resp.data) {
        setMensajes(prev => [...prev, resp.data]);
        Swal.fire({
          icon: "success",
          title: "¡Mensaje enviado!",
          text: "Tu mensaje se ha enviado correctamente.",
          showConfirmButton: false,
          timer: 1500
        });
      } else {
        const temp = {
          id: `temp-${Date.now()}`,
          asunto: nuevoMensaje.asunto,
          mensaje: nuevoMensaje.mensaje,
          emisor_tipo: userType,
          creado_en: new Date().toISOString(),
          leido: false
        };
        setMensajes(prev => [...prev, temp]);
        Swal.fire({
          icon: "success",
          title: "¡Mensaje enviado!",
          text: "Tu mensaje se ha enviado correctamente.",
          showConfirmButton: false,
          timer: 1500
        });
      }

      setNuevoMensaje({
        asunto: '',
        mensaje: '',
        destinatario_tipo: userType === 'ADMIN' ? 'TESORERO' : 'ADMIN'
      });
      setMostrarForm(false);
    } catch (error) {
      console.error('❌ Error enviando mensaje:', error);
      
      let errorMessage = "Error enviando mensaje. Por favor, inténtalo de nuevo.";
      
      if (error.response && error.response.data) {
        const errorData = error.response.data;
        let errorMessages = [];
        
        for (const [field, messages] of Object.entries(errorData)) {
          if (Array.isArray(messages)) {
            messages.forEach(msg => {
              errorMessages.push(traducirError(msg));
            });
          } else {
            errorMessages.push(traducirError(messages));
          }
        }
        
        if (errorMessages.length > 0) {
          errorMessage = errorMessages.join(' ');
        }
      } else if (error.message) {
        errorMessage = traducirError(error.message);
      }
      
      Swal.fire({
        icon: "error",
        title: "Error al enviar",
        text: errorMessage,
        confirmButtonText: "Entendido"
      });
    }
  };

  /**
   * borrarMensaje:
   * - ADMIN: elimina en backend (definitivo).
   * - TESORERO / SOCIO: oculta localmente (no backend).
   */
  const borrarMensaje = async (id, asunto = 'este mensaje') => {
    const result = await Swal.fire({
        title: "¿Estás seguro?",
        text: `¿Eliminar "${asunto}"?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar"
    });

    if (!result.isConfirmed) return;

    if (userType === 'TESORERO' || userType === 'SOCIO') {
      // ocultar local sin tocar backend
      try {
        setMensajes(prev => prev.filter(m => m.id !== id));
        const hidden = loadHiddenIds();
        hidden.add(id);
        saveHiddenIds(hidden);
        
        Swal.fire({
          icon: "success",
          title: "Mensaje ocultado",
          text: "El mensaje se ha ocultado de tu vista.",
          showConfirmButton: false,
          timer: 1500
        });
      } catch (e) {
        console.error('Error ocultando mensaje localmente:', e);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo ocultar el mensaje.",
          confirmButtonText: "Entendido"
        });
      }
      return;
    }

    // ADMIN: eliminar en backend
    try {
      setMensajes(prev => prev.filter(m => m.id !== id));
      await mensajesService.deleteMensaje(id);
      
      Swal.fire({
        icon: "success",
        title: "¡Eliminado!",
        text: "El mensaje se ha eliminado permanentemente.",
        showConfirmButton: false,
        timer: 1500
      });
    } catch (error) {
      console.error('❌ Error eliminando mensaje (backend):', error);
      
      let errorMessage = "Error al eliminar el mensaje. Por favor, inténtalo de nuevo.";
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = "El mensaje no fue encontrado. Puede que ya haya sido eliminado.";
        } else if (error.response.status === 403) {
          errorMessage = "No tienes permisos para eliminar este mensaje.";
        }
      }
      
      Swal.fire({
        icon: "error",
        title: "Error",
        text: errorMessage,
        confirmButtonText: "Entendido"
      });
      
      // Recargar mensajes para mostrar el estado actual
      await cargarMensajes();
    }
  };

  // permisos
  const puedeCrear = userType === 'ADMIN' || userType === 'TESORERO';
  const puedeEliminar = true; // todos ven el botón, la acción depende del role

  // estilo del botón eliminar (22x22)
  const deleteBtnBase = {
    position: 'absolute',
    top: '6px',
    right: '6px',
    width: '22px',
    height: '22px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '999px',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
    transition: 'transform 120ms ease, box-shadow 120ms ease',
    background: '#ef4444',
    color: 'white',
    fontSize: '12px',
    lineHeight: 1,
    padding: 0
  };

  const deleteBtnHover = {
    background: '#dc2626',
    transform: 'scale(1.05)',
    boxShadow: '0 2px 6px rgba(0,0,0,0.16)'
  };

  return (
    <div style={{
      background: 'white',
      padding: '12px',
      borderRadius: '8px',
      margin: '10px 0',
      border: '1px solid #ddd',
      width: '100%',
      maxWidth: '400px',
      maxHeight: '500px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, color: '#333', fontSize: '16px' }}>Tablón de Mensajes</h3>
        {puedeCrear && (
          <button onClick={() => setMostrarForm(!mostrarForm)} style={{ background: '#3B82F6', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}>
            Nuevo
          </button>
        )}
      </div>

      {/* Formulario (solo ADMIN/TESORERO) */}
      {puedeCrear && mostrarForm && (
        <div style={{ background: '#f9fafb', padding: '10px', borderRadius: '6px', marginBottom: '12px' }}>
          <form onSubmit={enviarMensaje}>
            <input type="text" placeholder="Asunto" value={nuevoMensaje.asunto} onChange={(e) => setNuevoMensaje({ ...nuevoMensaje, asunto: e.target.value })} style={{ width: '100%', padding: '8px', marginBottom: '8px' }} required />
            <textarea placeholder="Mensaje" value={nuevoMensaje.mensaje} onChange={(e) => setNuevoMensaje({ ...nuevoMensaje, mensaje: e.target.value })} style={{ width: '100%', padding: '8px', marginBottom: '8px' }} required />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" style={{ flex: 1, background: '#10B981', color: 'white', border: 'none', padding: '8px', borderRadius: '4px' }}>Enviar</button>
              <button type="button" onClick={() => setMostrarForm(false)} style={{ flex: 1, background: '#6B7280', color: 'white', border: 'none', padding: '8px', borderRadius: '4px' }}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* Lista */}
      <div ref={listaRef} style={{ flex: 1, overflowY: 'auto', minHeight: '200px' }}>
        <h4 style={{ marginBottom: '10px', color: '#555', fontSize: '14px' }}>Mensajes:</h4>

        {mensajes.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', fontStyle: 'italic', fontSize: '12px', padding: '20px 0' }}>No hay mensajes aún</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {mensajes.map(mensaje => {
              const creado = mensaje && mensaje.creado_en ? new Date(mensaje.creado_en) : null;
              const hora = creado ? creado.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '';
              const texto = mensaje && mensaje.mensaje ? mensaje.mensaje : '';

              return (
                <div key={mensaje.id || `${mensaje.asunto}-${Math.random()}`} style={{
                  background: mensaje.emisor_tipo === userType ? '#EFF6FF' : '#F0FDF4',
                  borderLeft: `3px solid ${mensaje.emisor_tipo === userType ? '#3B82F6' : '#10B981'}`,
                  padding: '10px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  position: 'relative'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <strong style={{ fontSize: '11px' }}>{mensaje.emisor_tipo === userType ? '👤 Tú' : `👤 ${mensaje.emisor_tipo}`}</strong>
                    <span style={{ color: '#666', fontSize: '10px', paddingRight: '36px' }}>{hora}</span>
                  </div>

                  <h5 style={{ margin: '3px 0', color: '#333', fontSize: '11px', fontWeight: 'bold' }}>{mensaje.asunto}</h5>

                  <p style={{ margin: 0, color: '#555', fontSize: '11px', lineHeight: '1.3' }}>{texto.length > 80 ? `${texto.substring(0, 80)}...` : texto}</p>

                  {puedeEliminar && (
                    <button onClick={() => borrarMensaje(mensaje.id, mensaje.asunto)} title="Eliminar mensaje" aria-label={`Eliminar mensaje ${mensaje.asunto || ''}`} style={deleteBtnBase} onMouseEnter={(e) => Object.assign(e.currentTarget.style, deleteBtnHover)} onMouseLeave={(e) => Object.assign(e.currentTarget.style, deleteBtnBase)}>✕</button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MensajesPanel;