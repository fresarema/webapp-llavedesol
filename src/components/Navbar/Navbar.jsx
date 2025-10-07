import React,{useState} from 'react'
import Logo from '../../assets/Logo.png'

const navbarlinks = [
    {
        id: 1,
        title:"Inicio",
        link: " / "
    },
    {
        id: 2,
        title:"Trabajo Local",
        link: "#trabajo-local"
    },
    {
        id: 3,
        title:"Contacto",
        link: "#contacto"
    },
    
]

const navbarRedes=[
  {
    id:1,
    title:"Instagram",
    link: "http://www.instagram.com/ong_llavedesolnodo/",
    icon: "bi bi-instagram"
  }
]

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="fixed top-0 left-0 bg-gray-800 w-full bg-opacity-30 backdrop-blur-md z-50">
      <div className='flex justify-between items-center sm:px-12 sm:py-6 px-4 py-3'>
        <div>
            <img src={Logo} alt="Logo" className='w-[100px]'/>
        </div>

        <button onClick={toggleMenu} className='md:hidden text-orange-500'>
          <svg 
          className='w-6 h-6'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'>
            {isOpen ? (<path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M6 18L18 6M6 6L12 12'
            />) : (<path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M4 6H16M4 12H16M4 18H16'
            />)}
            
            
            
          </svg>
        </button>




        <div className='hidden md:block'>
            <ul className='flex sm:space-x-8 space-x-4'>
                {navbarlinks.map((link)=>(
                  <li key={link.id}>
                    <a 
                    className= '!text-orange-500 sm:text-lg text-sm hover:!text-sky-200 transition-transform hover:scale-110 transform inline-block duration 300' 
                    href={link.link}>{link.title}</a>

                  </li>
                ))}
            </ul>
        </div>
        <div className='hidden md:block'>
            <ul className='flex space-x-4'>
                {navbarRedes.map((link)=>(
                  <li key={link.id}>
                    <a 
                    target='_blank'
                    rel='noopener noreferrer'
                    className='inline-block transition-transform duration-300 transform hover:scale-125'
                    href={link.link}>
                      <i 
                      className={`${link.icon} text-orange-500 text-lg sm:text-2xl hover:text-sky-200 transition-all duration-300`}>


                      </i>
                    </a>

                  </li>
                ))}
            </ul>
        </div>
      </div>
      <div className={`md:hidden absolute w-full bg-gray-800 transition-all duration-300 ${isOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}>
          <ul className='flex flex-col px-4 py-2'>
                {navbarlinks.map((link)=>(
                  <li key={link.id} className='py-2 text-center'>
                    <a 
                    className= '!text-orange-500 hover:!text-sky-200' 
                    href={link.link} onClick={()=>setIsOpen(false)}>{link.title}</a>

                  </li>
                ))}
            </ul>
            <ul className='flex space-x-4 px-4 py-2 border-t border-gray-600 justify-center'>
                {navbarRedes.map((link)=>(
                  <li key={link.id}>
                    <a 
                    target='_blank'
                    rel='noopener noreferrer'
                    className='inline-block'
                    href={link.link} onClick={()=>setIsOpen(false)}>
                      <i 
                      className={`${link.icon} text-lg text-orange-500 hover:text-sky-200`}>


                      </i>
                    </a>

                  </li>
                ))}
            </ul>
        </div>

    </nav>
  )
}

export default Navbar
