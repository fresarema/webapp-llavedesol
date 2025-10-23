import React from 'react';

function Contacto() {

  const handleSubmit = (e) => {
    e.preventDefault();
    // ⚠️ Aquí es donde integrarías un servicio de envío de formularios,
    // como Formspree, Netlify Forms, o tu propio backend.
    alert('Formulario enviado! (Implementación del envío pendiente)'); 
  };

  return (
    // El 'id' es CLAVE para la navegación
    <section id="contacto" className="py-20 px-4 bg-gray-800">
      <div className="container mx-auto">
        <h2 className="text-4xl font-bold text-center mb-12 text-white">Contáctanos</h2>

        <div className="flex flex-col md:flex-row gap-12">
          
          {/* Columna 1: Información de Contacto */}
          <div className="md:w-1/3">
            <h3 className="text-2xl font-semibold mb-6 !text-orange-600">Nuestra Información</h3>
            
            <div className="space-y-4 text-white">
              <p>
                <strong>📧 Correo:</strong><br />
                info@ungllavedesol.org
              </p>
              <p>
                <strong>📞 Teléfono:</strong><br />
                +56 9 1234 5678
              </p>
              <p>
                <strong>📍 Dirección:</strong><br />
                Calle Ficticia #123, Ciudad Ejemplo, Chile
              </p>
              <p>
                <strong>📱 Redes Sociales:</strong><br />
                Síguenos en <a href="http://www.instagram.com/ong_llavedesolnodo/" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:text-orange-700 font-medium">Instagram</a>
              </p>
            </div>
            
            {/* Opcional: Mapa incrustado */}
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-3 !text-orange-600">Encuéntranos</h3>
              {/* Puedes incrustar un mapa de Google Maps aquí usando un iframe */}
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
                  required 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                ></textarea>
              </div>

              <button 
                type="submit" 
                className="w-full md:w-auto bg-orange-500 text-white font-bold py-3 px-8 rounded-full hover:bg-orange-600 transition-colors duration-300"
              >
                Enviar Mensaje
              </button>
            </form>
          </div>

        </div>
      </div>
    </section>
  );
}

export default Contacto;