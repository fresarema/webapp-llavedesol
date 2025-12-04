import Hero from "../components/Hero/Hero"
import Navbar from "../components/Navbar/Navbar"
import Fondo from "../assets/fondo.png"
import TrabajoLocal from "../components/TrabajoLocal/TrabajoLocal";
import Contacto from "../components/Contacto/Contacto";
import LandingAnuncios from "../components/LandingAnuncios/LandingAnuncios";


function App() {

  const bgImagen ={
    backgroundAttachment: 'fixed',
    backgroundImage: `url(${Fondo})`,
    backgoundRepeat: 'no-repeat',
    backgroundSize: 'cover',
    backgroundPosition: 'bottom',
    width: '100%',
  }

  return (
    <div style={bgImagen} className="relative">
      <Navbar />
      <Hero />
      <TrabajoLocal />
      <LandingAnuncios />
      <Contacto />
    </div>
  )
}

export default App
