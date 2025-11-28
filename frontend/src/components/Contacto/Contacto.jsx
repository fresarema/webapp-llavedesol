import React, { useState } from 'react';
import axios from 'axios';

function Contacto() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const [status, setStatus] = useState('');

// Limite de caracteres para el mensaje
  const MAX_CHARS = 500;

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Si es el campo mensaje, validamos el largo antes de actualizar
    if (name === 'message' && value.length > MAX_CHARS) {
      return; // No permite escribir mas alla del limite
    }

    setFormData({
      ...formData,
      [name]: value
    });
  };

  const validateEmail = (email) => {
    // Regex estandar para validacion de correos
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(''); // Limpiar estado anterior

    // 1. Validacion de campos vacios (aunque el HTML required ayuda, esto es doble seguridad)
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
        setStatus('Error: Todos los campos son obligatorios.');
        return;
    }

    // 2. Validacion de Regex de Email
    if (!validateEmail(formData.email)) {
        setStatus('Error: Por favor ingresa un correo electrónico válido.');
        return;
    }

    setStatus('Enviando...');

    // Preparamos los datos para que coincidan con los campos del modelo Django
    // Django espera: nombre, correo, mensaje
    const dataToSend = {
      nombre: formData.name,
      correo: formData.email,
      mensaje: formData.message
    };

    try {
      // Ajusta la URL si el puerto es diferente
      await axios.post('http://127.0.0.1:8000/api/contacto/', dataToSend);
      setStatus('Formulario enviado con exito.');
      // Limpiar el formulario
      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
      console.error(error);
      setStatus('Hubo un error al enviar el mensaje.');
    }
  };

  return (
    // El 'id' es CLAVE para la navegacion
    <section id="contacto" className="py-20 px-4 bg-gray-800">
      <div className="container mx-auto">
        <h2 className="text-4xl font-bold text-center mb-12 text-white">Contáctanos</h2>

        <div className="flex flex-col md:flex-row gap-12">
          
          {/* Columna 1: Informacion de Contacto */}
          <div className="md:w-1/3">
            <h3 className="text-2xl font-semibold mb-6 !text-orange-600">Nuestra Información</h3>
            
            <div className="space-y-4 text-white">
              <p>
                <strong>Correo:</strong><br />
                info@ungllavedesol.org
              </p>
              <p>
                <strong>Teléfono:</strong><br />
                +56 9 1234 5678
              </p>
              <p>
                <strong>Dirección:</strong><br />
                Calle Ficticia #123, Ciudad Ejemplo, Chile
              </p>
              <p>
                <strong>Redes Sociales:</strong><br />
                Síguenos en <a href="http://www.instagram.com/ong_llavedesolnodo/" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:text-orange-700 font-medium">Instagram</a>
              </p>
            </div>
            
            {/* Opcional: Mapa incrustado */}
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-3 !text-orange-600">Encuéntranos</h3>
              {/* Puedes incrustar un mapa de Google Maps aqui usando un iframe */}
              <div className="w-full h-48 bg-gray-300 flex items-center justify-center text-sm text-gray-500 rounded-lg">
                [Espacio para mapa incrustado]
              </div>
            </div>

          </div>

          {/* Columna 2: Formulario */}
          <div className="md:w-2/3 bg-white p-8 rounded-xl shadow-lg">
            <h3 className="text-2xl font-semibold mb-6 text-gray-800">Envíanos un Mensaje</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                <input 
                  type="text" 
                  id="name" 
                  name="name" 
                  value={formData.name}
                  onChange={handleChange}
                  required 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                <input 
                  type="email" 
                  id="email" 
                  name="email" 
                  value={formData.email}
                  onChange={handleChange}
                  required 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Tu Mensaje</label>
                <textarea 
                  id="message" 
                  name="message" 
                  rows="4" 
                  value={formData.message}
                  onChange={handleChange}
                  required 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                ></textarea>
                {/* CONTADOR DE CARACTERES VISIBLE */}
                <div className="flex justify-end mt-1">
                    <span className={`text-sm font-semibold ${formData.message.length >= MAX_CHARS ? 'text-red-600' : 'text-gray-600'}`}>
                        {formData.message.length} / {MAX_CHARS} caracteres
                    </span>
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full md:w-auto bg-orange-500 text-white font-bold py-3 px-8 rounded-full hover:bg-orange-600 transition-colors duration-300"
              >
                Enviar Mensaje
              </button>

              {/* Mensaje de estado de la solicitud */}
              {status && (
                <p className={`text-center mt-4 font-semibold ${status.includes('error') ? 'text-red-600' : 'text-green-600'}`}>
                    {status}
                </p>
              )}
            </form>
          </div>

        </div>
      </div>
    </section>
  );
}

export default Contacto;