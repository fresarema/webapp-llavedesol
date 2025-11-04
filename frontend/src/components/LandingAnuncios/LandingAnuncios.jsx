import React, { useEffect, useState } from 'react';
import { getAnuncios } from "../../services/anunciosService";

function LandingAnuncios() {
    const [anuncios, setAnuncios] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function cargarAnuncios() {
            try {
                console.log("🔍 Cargando anuncios..."); // Para debug
                const data = await getAnuncios();
                console.log("📦 Datos recibidos:", data); // Para debug
                const anunciosActivos = data.filter(anuncio => anuncio.is_active !== false);
                setAnuncios(anunciosActivos);
            } catch (error) {
                console.error("Error al cargar anuncios:", error);
            } finally {
                setLoading(false);
            }
        }
        cargarAnuncios();
    }, []);

    if (loading) {
        return (
            <div className="py-16 bg-white">
                <div className="container mx-auto px-4 text-center">
                    <div className="animate-pulse">Cargando anuncios...</div>
                </div>
            </div>
        );
    }

    // CAMBIA ESTA PARTE - mostrar sección incluso si no hay anuncios
    return (
        <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
                <h2 className="text-4xl font-bold text-center text-gray-800 mb-12">
                    Anuncios y Eventos
                </h2>
                
                {anuncios.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                        <p className="text-lg">No hay anuncios disponibles en este momento.</p>
                        <p className="text-sm mt-2">Vuelve pronto para ver nuestras novedades.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {anuncios.map((anuncio) => (
                            <div 
                                key={anuncio.id} 
                                className="bg-gray-50 rounded-lg shadow-md p-6 hover:shadow-lg transition duration-300 border border-gray-200"
                            >
                                <h3 className="text-xl font-bold text-gray-800 mb-3">
                                    {anuncio.titulo}
                                </h3>
                                <p className="text-gray-600 leading-relaxed">
                                    {anuncio.descripcion}
                                </p>
                                {anuncio.imagen && (
                                    <img 
                                        src={anuncio.imagen} 
                                        alt={anuncio.titulo}
                                        className="mt-4 rounded-lg w-full h-48 object-cover"
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

export default LandingAnuncios;