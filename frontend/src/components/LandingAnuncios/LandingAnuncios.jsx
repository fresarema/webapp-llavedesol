import React, { useEffect, useState } from 'react';
import { getAnuncios } from "../../services/anunciosService";

function LandingAnuncios() {
    const [anuncios, setAnuncios] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function cargarAnuncios() {
            try {
                const data = await getAnuncios();
                console.log("📦 Datos recibidos:", data);
                if (data.length > 0) {
                    console.log("📝 Campos disponibles:", Object.keys(data[0]));
                }
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

    // Función para encontrar y formatear la fecha
    const obtenerFecha = (anuncio) => {
        // Busca campos comunes de fecha
        const camposFecha = ['creado_en', 'created_at', 'fecha_creacion', 'fecha', 'date_created'];
        
        for (let campo of camposFecha) {
            if (anuncio[campo]) {
                return new Date(anuncio[campo]).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            }
        }
        
        return 'Fecha no disponible';
    };

    if (loading) {
        return (
            <div className="py-16 bg-white">
                <div className="container mx-auto px-4 text-center">
                    <div className="animate-pulse">Cargando anuncios...</div>
                </div>
            </div>
        );
    }

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
                                    <div className="mt-4 rounded-lg overflow-hidden">
                                        <img 
                                            src={anuncio.imagen} 
                                            alt={anuncio.titulo}
                                            className="w-full h-48 object-cover hover:scale-105 transition duration-300"
                                        />
                                    </div>
                                )}
                                
                                {/* FECHA DE CREACIÓN - VERSIÓN INTELIGENTE */}
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <p className="text-sm text-gray-500">
                                        Publicado: {obtenerFecha(anuncio)}
                                    </p>
                                   
                                    
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

export default LandingAnuncios;