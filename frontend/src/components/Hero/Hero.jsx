import React from 'react';
import { motion } from 'framer-motion';
import { slideUp } from '../../utility/animation';
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    // bg-black/50: Esto es el "Overlay". Oscurece el fondo que viene del padre (LandingPage)
    // min-h-[80vh]: Asegura que esta sección sea alta e imponente
    <section id="hero" className='w-full min-h-[80vh] flex items-center justify-center bg-black/50 rounded-b-3xl'>
      
      <div className='container mx-auto px-6 text-center text-white'>
        <div className='max-w-4xl mx-auto'>
          
          {/* TÍTULO PRINCIPAL */}
          <motion.h1
            variants={slideUp(0.2)}
            initial="initial"
            animate="animate"
            className="text-4xl md:text-6xl font-bold mb-6 font-montserrat tracking-wide"
          >
            Construyendo Futuro
          </motion.h1>

          {/* TEXTO DESCRIPTIVO */}
          <motion.p 
            className='text-lg md:text-xl text-gray-100 mb-10 leading-relaxed font-sans'
            variants={slideUp(0.3)}
            initial="initial"
            animate="animate"
          >
            ONG Llave de Sol es una organización sin fines de lucro dedicada a brindar apoyo y 
            recursos a comunidades vulnerables. Nuestra misión es mejorar la calidad de vida 
            de las personas a través de programas educativos, asistencia médica y desarrollo 
            comunitario.
          </motion.p>

          {/* BOTONES DE ACCIÓN */}
          <motion.div 
            className='flex flex-col sm:flex-row justify-center gap-5'
            variants={slideUp(0.5)}
            initial="initial"
            animate="animate"
          >
             {/* Botón Dona Ahora: Naranja Fuerte */}
             <Link 
              to="/donaciones" 
              className='bg-orange-600 text-white py-3 px-10 rounded-full font-bold text-lg
              hover:bg-orange-700 hover:scale-105 transition-all duration-300 shadow-lg shadow-orange-600/30'
            >
              Dona ahora
            </Link>
            
            {/* Botón Hazte Socio: Amarillo Brillante (Identidad Llave de Sol) */}
            <Link 
              to="/unete" 
              className='bg-yellow-400 text-gray-900 py-3 px-10 rounded-full font-bold text-lg
              hover:bg-yellow-300 hover:scale-105 transition-all duration-300 shadow-lg shadow-yellow-400/30'
            >
              Hazte socio
            </Link>
          </motion.div>

        </div>
      </div>
    </section>
  )
}

export default Hero;