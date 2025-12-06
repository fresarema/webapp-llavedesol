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
  
  // Formulario
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

  // Manejar clic en día
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

  // Manejar clic en evento
  const handleEventClick = (evento) => {
    if (modo !== 'admin') return;
    
    setEventoSeleccionado(evento);
    setFormEvento({
      titulo: evento.titulo || '',
      descripcion: evento.descripcion || '',
      fecha: evento.fecha || format(new Date(), 'yyyy-MM-dd'),
      hora_inicio: evento.hora_inicio || '09:00',
      hora_fin: evento.hora_fin || '17:00',
      tipo_evento: evento.tipo_evento || 'REUNION'
    });
    setMostrarModal(true);
  };

  // Obtener eventos de un día
  const getEventosDelDia = (dia) => {
    return eventosLocales.filter(evento => 
      evento.fecha && isSameDay(parseISO(evento.fecha), dia)
    );
  };

  // Guardar evento
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

  // Eliminar evento
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

  // =============== RENDER ===============

  const dias = generarDias();
  const diaNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const hoy = startOfDay(new Date());

  return (
    <div>
      {/* Cabecera del calendario */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={() => setFechaActual(subMonths(fechaActual, 1))}>
          ◀ Anterior
        </button>
        
        <h3>
          {format(fechaActual, 'MMMM yyyy', { locale: es })}
        </h3>
        
        <button onClick={() => setFechaActual(addMonths(fechaActual, 1))}>
          Siguiente ▶
        </button>
      </div>

      {/* Días de la semana */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: '10px' }}>
        {diaNames.map(dia => (
          <div key={dia} style={{ fontWeight: 'bold' }}>{dia}</div>
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
                border: '1px solid #ddd',
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
                color: esPasado ? '#999' : (esHoy ? '#3498db' : '#000')
              }}>
                {format(dia, 'd')}
                {esHoy && <span style={{fontSize: '10px', marginLeft: '3px'}}>HOY</span>}
              </div>
              
              {/* Eventos del día */}
              {eventosDelDia.map(evento => (
                <div 
                  key={evento.id}
                  style={{
                    fontSize: '12px',
                    padding: '2px 4px',
                    margin: '2px 0',
                    backgroundColor: '#3498db',
                    color: 'white',
                    borderRadius: '3px',
                    cursor: modo === 'admin' ? 'pointer' : 'default',
                    opacity: esPasado ? 0.7 : 1
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEventClick(evento);
                  }}
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

      {/* Botón para agregar evento */}
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
          style={{ marginTop: '20px', padding: '10px 20px' }}
        >
          + Agregar Evento
        </button>
      )}

      {/* Modal para evento */}
      {mostrarModal && modo === 'admin' && (
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
            padding: '20px',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '500px'
          }}>
            <h3>{eventoSeleccionado ? 'Editar Evento' : 'Nuevo Evento'}</h3>
            
            <form onSubmit={guardarEvento}>
              {/* Título */}
              <div style={{ marginBottom: '10px' }}>
                <label>Título: *</label>
                <input
                  type="text"
                  value={formEvento.titulo}
                  onChange={(e) => setFormEvento({...formEvento, titulo: e.target.value})}
                  required
                  style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                />
              </div>

              {/* Fecha */}
              <div style={{ marginBottom: '10px' }}>
                <label>Fecha: *</label>
                <input
                  type="date"
                  value={formEvento.fecha}
                  onChange={(e) => setFormEvento({...formEvento, fecha: e.target.value})}
                  required
                  min={format(new Date(), 'yyyy-MM-dd')} // No permite fechas pasadas
                  style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                />
                <small style={{color: '#666'}}>No se permiten fechas pasadas</small>
              </div>

              {/* Hora inicio/fin */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label>Hora inicio:</label>
                  <input
                    type="time"
                    value={formEvento.hora_inicio}
                    onChange={(e) => setFormEvento({...formEvento, hora_inicio: e.target.value})}
                    style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label>Hora fin:</label>
                  <input
                    type="time"
                    value={formEvento.hora_fin}
                    onChange={(e) => setFormEvento({...formEvento, hora_fin: e.target.value})}
                    style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                  />
                </div>
              </div>

              {/* Tipo de evento */}
              <div style={{ marginBottom: '10px' }}>
                <label>Tipo de evento:</label>
                <select
                  value={formEvento.tipo_evento}
                  onChange={(e) => setFormEvento({...formEvento, tipo_evento: e.target.value})}
                  style={{ width: '100%', padding: '8px', marginTop: '5px' }}
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
              <div style={{ marginBottom: '20px' }}>
                <label>Descripción:</label>
                <textarea
                  value={formEvento.descripcion}
                  onChange={(e) => setFormEvento({...formEvento, descripcion: e.target.value})}
                  rows="3"
                  style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                />
              </div>

              {/* Botones */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="submit">
                  {eventoSeleccionado ? 'Actualizar' : 'Guardar'}
                </button>
                
                {eventoSeleccionado && (
                  <button 
                    type="button" 
                    onClick={eliminarEvento}
                    style={{ backgroundColor: '#ff4444', color: 'white' }}
                  >
                    Eliminar
                  </button>
                )}
                
                <button 
                  type="button" 
                  onClick={cerrarModal}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendario;