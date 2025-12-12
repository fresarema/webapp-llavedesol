import React, { useState } from 'react';
import axios from 'axios';

// Iconos SVG simples para no depender de librerías externas
const Icons = {
  MapPin: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Phone: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  ),
  Mail: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  Instagram: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  )
};

function Contacto() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const [status, setStatus] = useState('');
  const MAX_CHARS = 500;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'message' && value.length > MAX_CHARS) return;
    setFormData({ ...formData, [name]: value });
  };

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('');

    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
        setStatus('Error: Todos los campos son obligatorios.');
        return;
    }
    if (!validateEmail(formData.email)) {
        setStatus('Error: Por favor ingresa un correo electrónico válido.');
        return;
    }

    setStatus('Enviando...');
    const dataToSend = {
      nombre: formData.name,
      correo: formData.email,
      mensaje: formData.message
    };

    try {
      await axios.post('http://127.0.0.1:8000/api/contacto/', dataToSend);
      setStatus('¡Mensaje enviado con éxito!');
      setFormData({ name: '', email: '', message: '' });
      // Borrar mensaje de éxito después de 5 segundos
      setTimeout(() => setStatus(''), 5000);
    } catch (error) {
      console.error(error);
      setStatus('Hubo un error al enviar el mensaje.');
    }
  };

  return (
    <footer id="contacto" className="bg-gray-900 pt-20 pb-10">
      <div className="container mx-auto px-6">
        
        <div className="flex flex-col lg:flex-row gap-16 mb-16">
          
          {/* Columna Izquierda: Información */}
          <div className="lg:w-1/3 space-y-8">
            <div>
                <h2 className="text-4xl font-bold text-white mb-6">Contáctanos</h2>
                <p className="text-gray-400 leading-relaxed">
                    Estamos aquí para resolver tus dudas y recibir tus sugerencias. 
                    Juntos podemos construir una comunidad más fuerte.
                </p>
            </div>
            
            <div className="space-y-6">
                <div className="flex items-start gap-4">
                    <Icons.Mail />
                    <div>
                        <h4 className="text-white font-semibold">Correo</h4>
                        <p className="text-gray-400">info@ungllavedesol.org</p>
                    </div>
                </div>

                <div className="flex items-start gap-4">
                    <Icons.Phone />
                    <div>
                        <h4 className="text-white font-semibold">Teléfono</h4>
                        <p className="text-gray-400">+56 9 1234 5678</p>
                    </div>
                </div>

                <div className="flex items-start gap-4">
                    <Icons.MapPin />
                    <div>
                        <h4 className="text-white font-semibold">Dirección</h4>
                        <p className="text-gray-400">Calle Ficticia #123, Ciudad Ejemplo, Chile</p>
                    </div>
                </div>

                <div className="flex items-start gap-4">
                    <Icons.Instagram />
                    <div>
                        <h4 className="text-white font-semibold">Síguenos</h4>
                        <a href="http://www.instagram.com/ong_llavedesolnodo/" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:text-orange-400 hover:underline transition">
                            @ong_llavedesolnodo
                        </a>
                    </div>
                </div>
            </div>
          </div>

          {/* Columna Derecha: Formulario */}
          <div className="lg:w-2/3">
            <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-10">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">Envíanos un mensaje</h3>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">Nombre Completo</label>
                            <input 
                                type="text" id="name" name="name" 
                                value={formData.name} onChange={handleChange} required 
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:bg-white transition outline-none"
                                placeholder="Tu nombre"
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">Correo Electrónico</label>
                            <input 
                                type="email" id="email" name="email" 
                                value={formData.email} onChange={handleChange} required 
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:bg-white transition outline-none"
                                placeholder="tucorreo@ejemplo.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">Tu Mensaje</label>
                        <textarea 
                            id="message" name="message" rows="4" 
                            value={formData.message} onChange={handleChange} required 
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:bg-white transition outline-none resize-none"
                            placeholder="¿En qué podemos ayudarte?"
                        ></textarea>
                        <div className="flex justify-end mt-2">
                            <span className={`text-xs font-medium ${formData.message.length >= MAX_CHARS ? 'text-red-500' : 'text-gray-400'}`}>
                                {formData.message.length} / {MAX_CHARS}
                            </span>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        className="w-full bg-orange-600 text-white font-bold py-4 rounded-lg hover:bg-orange-700 transform hover:-translate-y-1 transition-all duration-300 shadow-lg shadow-orange-500/30"
                    >
                        Enviar Mensaje
                    </button>

                    {status && (
                        <div className={`p-4 rounded-lg text-center font-medium ${status.includes('Error') || status.includes('error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {status}
                        </div>
                    )}
                </form>
            </div>
          </div>
        </div>

        {/* BARRA DE COPYRIGHT FINAL */}
        <div className="border-t border-gray-800 pt-8 mt-16 text-center text-gray-500 text-sm">
            <p>&copy; {new Date().getFullYear()} ONG Llave de Sol. Todos los derechos reservados.</p>
        </div>

      </div>
    </footer>
  );
}

export default Contacto;