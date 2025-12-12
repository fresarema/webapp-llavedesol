import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getAnuncioById } from '../services/anunciosService'; 
import Navbar from '../components/Navbar/Navbar'; 

const DetalleAnuncio = () => {
    const { id } = useParams(); 
    const navigate = useNavigate();
    const [anuncio, setAnuncio] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const cargarDetalle = async () => {
            try {
                const data = await getAnuncioById(id);
                setAnuncio(data);
            } catch (error) {
                console.error(error);
                // Opcional: Redirigir si no existe
                // navigate('/'); 
            } finally {
                setLoading(false);
            }
        };
        cargarDetalle();
    }, [id]);

    const formatearFecha = (fecha) => {
        if (!fecha) return '';
        return new Date(fecha).toLocaleDateString('es-ES', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex justify-center items-center bg-gray-50">
                <div className="animate-pulse text-xl text-gray-500">Cargando noticia...</div>
            </div>
        );
    }

    if (!anuncio) {
        return <div className="text-center py-20">Anuncio no encontrado.</div>;
    }

    return (
        <div className="bg-white min-h-screen">
            {/* Reutilizamos tu Navbar (asegúrate de que Navbar maneje su posición, si es fixed agrega padding top) */}
            <div className='relative z-50 bg-gray-900'> {/* Un wrapper oscuro para la navbar si es transparente */}
                <Navbar /> 
            </div>

            <div className="container mx-auto px-6 py-12 mt-20 max-w-4xl">
                
                {/* Botón Volver */}
                <Link to="/" className="inline-flex items-center text-orange-600 font-semibold mb-8 hover:underline">
                    ← Volver a Inicio
                </Link>

                {/* Encabezado del Artículo */}
                <header className="mb-10 text-center">
                    <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                        {formatearFecha(anuncio.creado_en || anuncio.created_at)} {/* Ajusta según tu backend */}
                    </span>
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 font-montserrat mt-4 leading-tight">
                        {anuncio.titulo}
                    </h1>
                </header>

                {/* Imagen Principal */}
                {anuncio.imagen && (
                    <div className="w-full h-64 md:h-96 rounded-3xl overflow-hidden shadow-lg mb-10">
                        <img 
                            src={anuncio.imagen} 
                            alt={anuncio.titulo} 
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}

                {/* Cuerpo del Texto */}
                <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap font-sans">
                    {/* whitespace-pre-wrap respeta los saltos de línea que puso el admin */}
                    {anuncio.descripcion}
                </div>

                {/* Pie de página del artículo */}
                <div className="mt-16 pt-8 border-t border-gray-100 text-center">
                    <p className="text-gray-500 italic">Comparte esta noticia con tu comunidad.</p>
                </div>
            </div>
        </div>
    );
};

export default DetalleAnuncio;