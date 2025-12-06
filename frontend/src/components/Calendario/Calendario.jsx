import React, { useState, useEffect } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek,
  addMonths, 
  subMonths,
  isSameMonth,
  isSameDay,
  addDays,
  parseISO,
  isBefore,
  startOfDay
} from 'date-fns';
import { es } from 'date-fns/locale';

const Calendario = ({ 
  eventos = [], 
  onGuardarEvento = null,
  onEliminarEvento = null,
  modo = 'admin' 
}) => {
  // Estados
  const [fechaActual, setFechaActual] = useState(new Date());
  const [eventosLocales, setEventosLocales] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  
  // Formulario (solo para admin)
  const [formEvento, setFormEvento] = useState({
    titulo: '',
    descripcion: '',
    fecha: format(new Date(), 'yyyy-MM-dd'),
    hora_inicio: '09:00',
    hora_fin: '17:00',
    tipo_evento: 'REUNION'
  });

  
  useEffect(() => {
    setEventosLocales(eventos);
  }, [eventos]);

  // =============== FUNCIONES ===============

  // Función para verificar si una fecha ya pasó
  const fechaYaPaso = (fecha) => {
    const hoy = startOfDay(new Date());
    const fechaComparar = startOfDay(fecha);
    return isBefore(fechaComparar, hoy);
  };

  // Generar días del calendario
  const generarDias = () => {
    const inicioMes = startOfMonth(fechaActual);
    const finMes = endOfMonth(fechaActual);
    const inicioSemana = startOfWeek(inicioMes);
    const finSemana = endOfWeek(finMes);

    const dias = [];
    let dia = inicioSemana;

    while (dia <= finSemana) {
      dias.push(dia);
      dia = addDays(dia, 1);
    }

    return dias;
  };

  // Manejar clic en día (SOLO para admin)
  const handleDayClick = (dia) => {
    if (modo !== 'admin') return;
    
    // Verifica si la fecha ya pasó
    if (fechaYaPaso(dia)) {
      alert('No se pueden crear eventos en fechas pasadas');
      return;
    }
    
    setFormEvento({
      ...formEvento,
      fecha: format(dia, 'yyyy-MM-dd')
    });
    setEventoSeleccionado(null);
    setMostrarModal(true);
  };

  // Manejar clic en evento (AMBOS modos)
  const handleEventClick = (evento) => {
    setEventoSeleccionado(evento);
    
    if (modo === 'admin') {
      // Para admin: carga formulario para editar
      setFormEvento({
        titulo: evento.titulo || '',
        descripcion: evento.descripcion || '',
        fecha: evento.fecha || format(new Date(), 'yyyy-MM-dd'),
        hora_inicio: evento.hora_inicio || '09:00',
        hora_fin: evento.hora_fin || '17:00',
        tipo_evento: evento.tipo_evento || 'REUNION'
      });
    }
    
    setMostrarModal(true);
  };

  // Obtener eventos de un día
  const getEventosDelDia = (dia) => {
    return eventosLocales.filter(evento => 
      evento.fecha && isSameDay(parseISO(evento.fecha), dia)
    );
  };

  // Guardar evento (SOLO para admin)
  const guardarEvento = (e) => {
    e.preventDefault();
    
    // Verifica si la fecha ya pasó
    const fechaEvento = new Date(formEvento.fecha);
    if (fechaYaPaso(fechaEvento)) {
      alert('No se pueden crear o modificar eventos en fechas pasadas');
      return;
    }
    
    // Prepara datos EXACTAMENTE como Django los espera
    const eventoData = {
      titulo: formEvento.titulo,
      descripcion: formEvento.descripcion || '',
      fecha: formEvento.fecha,
      hora_inicio: formEvento.hora_inicio || null,
      hora_fin: formEvento.hora_fin || null,
      tipo_evento: formEvento.tipo_evento
    };

    console.log('Enviando a Django:', eventoData);

    if (onGuardarEvento) {
      // Si está editando, agrega el id
      if (eventoSeleccionado?.id) {
        eventoData.id = eventoSeleccionado.id;
      }
      onGuardarEvento(eventoData);
    } else {
      // Modo demo
      if (eventoSeleccionado) {
        setEventosLocales(prev => 
          prev.map(ev => ev.id === eventoSeleccionado.id ? {...eventoData, id: eventoSeleccionado.id} : ev)
        );
      } else {
        setEventosLocales(prev => [...prev, {...eventoData, id: Date.now()}]);
      }
    }
    
    cerrarModal();
  };

  // Eliminar evento (SOLO para admin)
  const eliminarEvento = () => {
    if (!eventoSeleccionado) return;
    
    if (onEliminarEvento) {
      onEliminarEvento(eventoSeleccionado.id);
    } else {
      // Modo demo
      setEventosLocales(prev => 
        prev.filter(ev => ev.id !== eventoSeleccionado.id)
      );
    }
    
    cerrarModal();
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setEventoSeleccionado(null);
    setFormEvento({
      titulo: '',
      descripcion: '',
      fecha: format(new Date(), 'yyyy-MM-dd'),
      hora_inicio: '09:00',
      hora_fin: '17:00',
      tipo_evento: 'REUNION'
    });
  };

  // Función para traducir tipo de evento
  const traducirTipoEvento = (tipo) => {
    const traducciones = {
      'REUNION': 'Reunión',
      'EVENTO': 'Evento público',
      'VOLUNTARIADO': 'Voluntariado',
      'CAPACITACION': 'Capacitación',
      'RECAUDACION': 'Recaudación de fondos',
      'ADMINISTRATIVO': 'Administrativo'
    };
    return traducciones[tipo] || tipo;
  };

  // =============== RENDER ===============

  const dias = generarDias();
  const diaNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const hoy = startOfDay(new Date());

  return (
    <div>
      {/* Cabecera del calendario */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button 
          onClick={() => setFechaActual(subMonths(fechaActual, 1))}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg transition duration-300"
        >
          ◀ Anterior
        </button>
        
        <h3 className="text-xl font-bold text-gray-800">
          {format(fechaActual, 'MMMM yyyy', { locale: es })}
        </h3>
        
        <button 
          onClick={() => setFechaActual(addMonths(fechaActual, 1))}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg transition duration-300"
        >
          Siguiente ▶
        </button>
      </div>

      {/* Días de la semana */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: '10px' }}>
        {diaNames.map(dia => (
          <div key={dia} style={{ fontWeight: 'bold', color: '#4a5568' }}>{dia}</div>
        ))}
      </div>

      {/* Cuadrícula de días */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {dias.map(dia => {
          const esOtroMes = !isSameMonth(dia, fechaActual);
          const eventosDelDia = getEventosDelDia(dia);
          const esPasado = fechaYaPaso(dia);
          const esHoy = isSameDay(dia, hoy);
          
          return (
            <div 
              key={dia.toString()}
              style={{
                border: '1px solid #e2e8f0',
                minHeight: '100px',
                padding: '5px',
                backgroundColor: esOtroMes ? '#f9f9f9' : (esHoy ? '#e8f4fd' : 'white'),
                cursor: (modo === 'admin' && !esPasado) ? 'pointer' : 'default',
                opacity: esPasado ? 0.6 : 1,
                position: 'relative'
              }}
              onClick={() => handleDayClick(dia)}
            >
              <div style={{ 
                fontWeight: 'bold',
                color: esPasado ? '#999' : (esHoy ? '#3498db' : '#000'),
                marginBottom: '5px'
              }}>
                {format(dia, 'd')}
                {esHoy && <span style={{fontSize: '10px', marginLeft: '3px', color: '#3498db'}}>HOY</span>}
              </div>
              
              {/* Eventos del día */}
              {eventosDelDia.map(evento => (
                <div 
                  key={evento.id}
                  style={{
                    fontSize: '12px',
                    padding: '4px 6px',
                    margin: '3px 0',
                    backgroundColor: '#3498db',
                    color: 'white',
                    borderRadius: '4px',
                    cursor: 'pointer', // ✅ TODOS pueden hacer clic para ver detalles
                    opacity: esPasado ? 0.7 : 1,
                    transition: 'all 0.2s',
                    fontWeight: '500',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#2980b9'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#3498db'}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEventClick(evento);
                  }}
                  title={`${evento.titulo} (Haz clic para ver detalles)`}
                >
                  {evento.titulo}
                </div>
              ))}
              
              {/* Indicador de fecha pasada */}
              {esPasado && modo === 'admin' && (
                <div style={{
                  position: 'absolute',
                  bottom: '2px',
                  right: '2px',
                  fontSize: '9px',
                  color: '#999'
                }}>
                  Pasado
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Botón para agregar evento (SOLO admin) */}
      {modo === 'admin' && (
        <button 
          onClick={() => {
            // Verifica si hoy ya pasó (para medianoche)
            if (fechaYaPaso(new Date())) {
              alert('No se pueden crear eventos en fechas pasadas');
              return;
            }
            
            setFormEvento({
              titulo: '',
              descripcion: '',
              fecha: format(new Date(), 'yyyy-MM-dd'),
              hora_inicio: '09:00',
              hora_fin: '17:00',
              tipo_evento: 'REUNION'
            });
            setMostrarModal(true);
          }}
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-6 rounded-lg font-medium transition duration-300 mt-6"
        >
          + Agregar Evento
        </button>
      )}

      {/* Modal para evento */}
      {mostrarModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#2d3748' }}>
                {modo === 'admin' ? (eventoSeleccionado ? '✏️ Editar Evento' : '➕ Nuevo Evento') : '📅 Detalles del Evento'}
              </h3>
              <button 
                onClick={cerrarModal}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  fontSize: '24px', 
                  cursor: 'pointer',
                  color: '#718096'
                }}
              >
                &times;
              </button>
            </div>
            
            {modo === 'admin' ? (
              // ========== FORMULARIO PARA ADMIN ==========
              <form onSubmit={guardarEvento}>
                {/* Título */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#4a5568' }}>
                    Título: *
                  </label>
                  <input
                    type="text"
                    value={formEvento.titulo}
                    onChange={(e) => setFormEvento({...formEvento, titulo: e.target.value})}
                    required
                    style={{ 
                      width: '100%', 
                      padding: '10px', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                    placeholder="Nombre del evento"
                  />
                </div>

                {/* Fecha */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#4a5568' }}>
                    Fecha: *
                  </label>
                  <input
                    type="date"
                    value={formEvento.fecha}
                    onChange={(e) => setFormEvento({...formEvento, fecha: e.target.value})}
                    required
                    min={format(new Date(), 'yyyy-MM-dd')} // No permite fechas pasadas
                    style={{ 
                      width: '100%', 
                      padding: '10px', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                  <small style={{color: '#718096', fontSize: '12px'}}>No se permiten fechas pasadas</small>
                </div>

                {/* Hora inicio/fin */}
                <div style={{ display: 'flex', gap: '15px', marginBottom: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#4a5568' }}>
                      Hora inicio:
                    </label>
                    <input
                      type="time"
                      value={formEvento.hora_inicio}
                      onChange={(e) => setFormEvento({...formEvento, hora_inicio: e.target.value})}
                      style={{ 
                        width: '100%', 
                        padding: '10px', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#4a5568' }}>
                      Hora fin:
                    </label>
                    <input
                      type="time"
                      value={formEvento.hora_fin}
                      onChange={(e) => setFormEvento({...formEvento, hora_fin: e.target.value})}
                      style={{ 
                        width: '100%', 
                        padding: '10px', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                </div>

                {/* Tipo de evento */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#4a5568' }}>
                    Tipo de evento:
                  </label>
                  <select
                    value={formEvento.tipo_evento}
                    onChange={(e) => setFormEvento({...formEvento, tipo_evento: e.target.value})}
                    style={{ 
                      width: '100%', 
                      padding: '10px', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      fontSize: '14px',
                      backgroundColor: 'white'
                    }}
                  >
                    <option value="REUNION">Reunión</option>
                    <option value="EVENTO">Evento público</option>
                    <option value="VOLUNTARIADO">Voluntariado</option>
                    <option value="CAPACITACION">Capacitación</option>
                    <option value="RECAUDACION">Recaudación de fondos</option>
                    <option value="ADMINISTRATIVO">Administrativo</option>
                  </select>
                </div>

                {/* Descripción */}
                <div style={{ marginBottom: '25px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#4a5568' }}>
                    Descripción:
                  </label>
                  <textarea
                    value={formEvento.descripcion}
                    onChange={(e) => setFormEvento({...formEvento, descripcion: e.target.value})}
                    rows="4"
                    style={{ 
                      width: '100%', 
                      padding: '10px', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      fontSize: '14px',
                      resize: 'vertical'
                    }}
                    placeholder="Descripción detallada del evento..."
                  />
                </div>

                {/* Botones ADMIN */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  {eventoSeleccionado && (
                    <button 
                      type="button" 
                      onClick={eliminarEvento}
                      style={{ 
                        padding: '10px 20px',
                        backgroundColor: '#f56565',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '14px',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#e53e3e'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#f56565'}
                    >
                      Eliminar
                    </button>
                  )}
                  
                  <button 
                    type="submit"
                    style={{ 
                      padding: '10px 20px',
                      backgroundColor: '#48bb78',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '14px',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#38a169'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#48bb78'}
                  >
                    {eventoSeleccionado ? 'Actualizar' : 'Guardar'}
                  </button>
                  
                  <button 
                    type="button" 
                    onClick={cerrarModal}
                    style={{ 
                      padding: '10px 20px',
                      backgroundColor: '#e2e8f0',
                      color: '#4a5568',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '14px',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#cbd5e0'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#e2e8f0'}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              // ========== VISTA DE SOLO LECTURA PARA SOCIO ==========
              <div>
                {/* Información del evento */}
                {eventoSeleccionado && (
                  <div style={{ marginBottom: '25px' }}>
                    {/* Título */}
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px', fontWeight: '600' }}>
                        TÍTULO
                      </div>
                      <div style={{ 
                        fontSize: '18px', 
                        fontWeight: 'bold', 
                        color: '#2d3748',
                        padding: '12px',
                        backgroundColor: '#f7fafc',
                        borderRadius: '6px',
                        borderLeft: '4px solid #3498db'
                      }}>
                        {eventoSeleccionado.titulo}
                      </div>
                    </div>

                    {/* Fecha y hora */}
                    <div style={{ display: 'flex', gap: '15px', marginBottom: '16px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px', fontWeight: '600' }}>
                          FECHA
                        </div>
                        <div style={{ 
                          padding: '10px',
                          backgroundColor: '#f7fafc',
                          borderRadius: '6px',
                          fontSize: '14px',
                          color: '#2d3748'
                        }}>
                          {eventoSeleccionado.fecha ? format(parseISO(eventoSeleccionado.fecha), 'dd/MM/yyyy') : 'No especificada'}
                        </div>
                      </div>
                      
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px', fontWeight: '600' }}>
                          HORARIO
                        </div>
                        <div style={{ 
                          padding: '10px',
                          backgroundColor: '#f7fafc',
                          borderRadius: '6px',
                          fontSize: '14px',
                          color: '#2d3748'
                        }}>
                          {eventoSeleccionado.hora_inicio && eventoSeleccionado.hora_fin 
                            ? `${eventoSeleccionado.hora_inicio} - ${eventoSeleccionado.hora_fin}`
                            : 'Horario no especificado'}
                        </div>
                      </div>
                    </div>

                    {/* Tipo de evento */}
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px', fontWeight: '600' }}>
                        TIPO DE EVENTO
                      </div>
                      <div style={{ 
                        padding: '10px',
                        backgroundColor: '#f7fafc',
                        borderRadius: '6px',
                        fontSize: '14px',
                        color: '#2d3748'
                      }}>
                        {traducirTipoEvento(eventoSeleccionado.tipo_evento)}
                      </div>
                    </div>

                    {/* Descripción */}
                    {eventoSeleccionado.descripcion && (
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px', fontWeight: '600' }}>
                          DESCRIPCIÓN
                        </div>
                        <div style={{ 
                          padding: '12px',
                          backgroundColor: '#f7fafc',
                          borderRadius: '6px',
                          fontSize: '14px',
                          color: '#2d3748',
                          lineHeight: '1.5'
                        }}>
                          {eventoSeleccionado.descripcion}
                        </div>
                      </div>
                    )}

                    {/* Estado */}
                    <div style={{ marginBottom: '25px' }}>
                      <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px', fontWeight: '600' }}>
                        ESTADO
                      </div>
                      <div style={{ 
                        padding: '10px',
                        backgroundColor: '#f0fff4',
                        borderRadius: '6px',
                        fontSize: '14px',
                        color: '#276749',
                        fontWeight: '600',
                        border: '1px solid #9ae6b4'
                      }}>
                        ✅ Evento programado
                      </div>
                    </div>
                  </div>
                )}

                {/* Botón único para SOCIO */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <button 
                    type="button" 
                    onClick={cerrarModal}
                    style={{ 
                      padding: '12px 30px',
                      backgroundColor: '#3498db',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '14px',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#2980b9'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#3498db'}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendario;