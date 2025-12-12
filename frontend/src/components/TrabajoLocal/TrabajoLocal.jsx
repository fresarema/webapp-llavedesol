import React from 'react';

// --- IMPORTANTE ---
// Reemplaza estas importaciones con las imágenes que guardes en tu carpeta 'assets'
import img1 from '../../assets/placeholder1.jpg'; // Ejemplo
import img2 from '../../assets/placeholder2.jpg'; // Ejemplo
import img3 from '../../assets/placeholder3.jpg'; // Ejemplo
import img4 from '../../assets/placeholder4.jpg'; // Ejemplo
import img5 from '../../assets/placeholder5.jpg'; // Ejemplo
import img6 from '../../assets/placeholder6.jpg'; // Ejemplo


// Creamos un array con las imágenes para manejarlo más fácil
const instagramPosts = [
  { id: 1, imgSrc: img1, alt: 'Descripción de la imagen 1' },
  { id: 2, imgSrc: img2, alt: 'Descripción de la imagen 2' },
  { id: 3, imgSrc: img3, alt: 'Descripción de la imagen 3' },
  { id: 4, imgSrc: img4, alt: 'Descripción de la imagen 4' },
  { id: 5, imgSrc: img5, alt: 'Descripción de la imagen 5' },
  { id: 6, imgSrc: img6, alt: 'Descripción de la imagen 6' },
];


function TrabajoLocal() {
  return (
    // El 'id' es CLAVE para que el enlace de la navbar funcione
    <section id="trabajoo" className="py-20 px-4">
      <div className="container mx-auto text-center">
        
        <h2 className="text-4xl font-bold mb-4 text-gray-800">Nuestro Trabajo Local</h2>
        <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
          Síguenos en Instagram para ver el impacto diario de nuestras iniciativas y el trabajo de nuestros voluntarios en la comunidad.
        </p>

        {/* Cuadrícula de Imágenes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {instagramPosts.map(post => (
            <div key={post.id} className="overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
              <img 
                src={post.imgSrc} 
                alt={post.alt} 
                className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-300"
              />
            </div>
          ))}
        </div>
        
        <a 
          href="http://www.instagram.com/ong_llavedesolnodo/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="mt-12 inline-block bg-orange-500 text-white font-bold py-3 px-8 rounded-full hover:bg-orange-600 transition-colors duration-300"
        >
          Ver más en Instagram
        </a>

      </div>
    </section>
  );
}

export default TrabajoLocal;