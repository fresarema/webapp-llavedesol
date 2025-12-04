import React from 'react'
import Portada from '../../assets/Portada.webp';
import {motion} from 'framer-motion';
import { slideUp,slideFromSide } from '../../utility/animation';
import { Link } from 'react-router-dom';


const Hero = () => {
  return (
    <section id="hero" className='mt-36'>
        <div className='grid grid-cols-1 md:grid-cols-2'>
          
          {/*Textos y descripcion*/}
          <div className='p-10 sm:p-10 md:p-15 lg:p-30 xl:p-36'>
            
            <motion.p 
            className=' text-gray-700'
            variants={slideUp(0.3)}
            initial="initial"
            animate="animate">
              ONG Llave de Sol es una organización sin fines de lucro dedicada a brindar apoyo y 
              recursos a comunidades vulnerables. Nuestra misión es mejorar la calidad de vida 
              de las personas a través de programas educativos, asistencia médica y desarrollo 
              comunitario. Trabajamos con voluntarios comprometidos y colaboradores para crear un 
              impacto positivo y sostenible en las vidas de quienes más lo necesitan.
            </motion.p>
            <motion.div 
            className='flex justify-center gap-4'
            variants={slideUp(1.0)}
            initial="initial"
            animate="animate"
            >
              {             }
                <Link 
                  to= "/donaciones" 
                  className='bg-orange-600 py-2 px-12 
                  rounded-3xl text-white hover:bg-orange-700 hover:!text-yellow-200
                  transition-all duration-300 item-center 
                  cursor-pointer !no-underline'>
                  Dona ahora
                  </Link>

            </motion.div>
          </div>

          {/*Imagen*/}
          <motion.div 
          className='pt-84'
          variants={slideFromSide("right",0.5)}
          initial="initial"
          animate="animate"
          >
            <img src={Portada} alt='portada' className='w-full h-auto object-cover'  />
          </motion.div>
        </div>
    </section>
  )
}

export default Hero
