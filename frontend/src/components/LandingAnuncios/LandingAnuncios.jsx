import React, { useEffect, useState } from 'react';
import { getAnuncios } from "../../services/anunciosService";
import { Link } from 'react-router-dom';

function LandingAnuncios() {
    const [anuncios, setAnuncios] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // 1. ESTADOS PARA PAGINACIÓN
    const [paginaActual, setPaginaActual] = useState(1);
    const noticiasPorPagina = 6; // Mostramos 6 para hacer 2 filas de 3 tarjetas

    useEffect(() => {
        async function cargarAnuncios() {
            try {
                const data = await getAnuncios();
                const anunciosActivos = data.filter(anuncio => anuncio.is_active !== false);
                
                // 2. ORDENAR: Lo más nuevo primero
                // Asumimos que el backend devuelve 'creado_en' o 'created_at'
                const ordenados = anunciosActivos.sort((a, b) => {
                    const fechaA = new Date(a.creado_en || a.created_at || 0);
                    const fechaB = new Date(b.creado_en || b.created_at || 0);
                    return fechaB - fechaA; // Descendente (Newest first)
                });

                setAnuncios(ordenados);
            } catch (error) {
                console.error("Error al cargar anuncios:", error);
            } finally {
                setLoading(false);
            }
        }
        cargarAnuncios();
    }, []);

    // 3. LÓGICA DE CORTE (SLICE) PARA PAGINACIÓN
    const indiceUltimo = paginaActual * noticiasPorPagina;
    const indicePrimero = indiceUltimo - noticiasPorPagina;
    const anunciosVisibles = anuncios.slice(indicePrimero, indiceUltimo);
    const totalPaginas = Math.ceil(anuncios.length / noticiasPorPagina);

    // Funciones de navegación
    const irPaginaSiguiente = () => {
        if (paginaActual < totalPaginas) {
            setPaginaActual(prev => prev + 1);
            // Opcional: Hacer scroll suave al inicio de la sección de noticias
            document.getElementById('trabajo-local').scrollIntoView({ behavior: 'smooth' });
        }
    };

    const irPaginaAnterior = () => {
        if (paginaActual > 1) {
            setPaginaActual(prev => prev - 1);
            document.getElementById('trabajo-local').scrollIntoView({ behavior: 'smooth' });
        }
    };

    const obtenerFecha = (anuncio) => {
        const camposFecha = ['creado_en', 'created_at', 'fecha_creacion', 'fecha', 'date_created'];
        for (let campo of camposFecha) {
            if (anuncio[campo]) {
                return new Date(anuncio[campo]).toLocaleDateString('es-ES', {
                    year: 'numeric', month: 'long', day: 'numeric'
                });
            }
        }
        return 'Fecha no disponible';
    };

    if (loading) {
        return (
            <div className="py-20 bg-gray-50 flex justify-center items-center">
                <div className="animate-pulse text-xl text-gray-500 font-semibold">Cargando noticias...</div>
            </div>
        );
    }

    return (
        <section id="trabajo-local" className="py-20 bg-gray-50 scroll-mt-32">
            <div className="container mx-auto px-6">
                
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 font-montserrat mb-4">
                        Nuestras Actividades
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Mantente informado sobre los últimos eventos, noticias y el trabajo que realizamos en la comunidad.
                    </p>
                </div>
                
                {anuncios.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-gray-500 py-12 bg-white rounded-2xl shadow-sm border border-gray-100 max-w-2xl mx-auto">
                        <span className="text-6xl mb-4">📰</span>
                        <p className="text-xl font-medium">No hay anuncios disponibles por el momento.</p>
                        <p className="text-sm mt-2 text-gray-400">Estamos preparando nuevas actividades.</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                            {anunciosVisibles.map((anuncio) => (
                                <article 
                                    key={anuncio.id} 
                                    className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border border-gray-100 flex flex-col h-full"
                                >
                                    {anuncio.imagen ? (
                                        <div className="h-56 overflow-hidden relative group">
                                            <img 
                                                src={anuncio.imagen} 
                                                alt={anuncio.titulo}
                                                className="w-full h-full object-cover transform group-hover:scale-110 transition duration-500"
                                            />
                                            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition duration-300"></div>
                                        </div>
                                    ) : (
                                        <div className="h-56 bg-gradient-to-br from-orange-100 to-yellow-100 flex items-center justify-center">
                                            <span className="text-4xl">📢</span>
                                        </div>
                                    )}

                                    <div className="p-8 flex flex-col flex-grow">
                                        <div className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-3">
                                            {obtenerFecha(anuncio)}
                                        </div>

                                        <h3 className="text-2xl font-bold text-gray-900 font-montserrat mb-4 leading-tight line-clamp-2">
                                            {anuncio.titulo}
                                        </h3>

                                        <p className="text-gray-600 leading-relaxed mb-6 line-clamp-3 flex-grow">
                                            {anuncio.descripcion}
                                        </p>
                                        
                                        <div className="pt-4 border-t border-gray-100 mt-auto">
                                            <Link 
                                                to={`/anuncio/${anuncio.id}`} 
                                                className="text-sm font-bold text-gray-800 hover:text-orange-600 transition-colors cursor-pointer flex items-center gap-2"
                                            >
                                                Leer nota completa 
                                                <span className="text-lg">→</span>
                                            </Link>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>

                        {/* 4. CONTROLES DE PAGINACIÓN MODERNOS */}
                        {totalPaginas > 1 && (
                            <div className="flex justify-center items-center mt-16 gap-6">
                                <button 
                                    onClick={irPaginaAnterior}
                                    disabled={paginaActual === 1}
                                    className={`
                                        flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm transition-all duration-300
                                        ${paginaActual === 1 
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                            : 'bg-white text-gray-800 hover:bg-orange-50 hover:text-orange-600 shadow-md hover:shadow-lg border border-gray-200'}
                                    `}
                                >
                                    <span>←</span> Anterior
                                </button>

                                <div className="flex items-center gap-2">
                                    {/* Indicadores de página (Puntos) */}
                                    {Array.from({ length: totalPaginas }).map((_, index) => (
                                        <div 
                                            key={index}
                                            className={`
                                                h-2 rounded-full transition-all duration-300 
                                                ${paginaActual === index + 1 ? 'w-8 bg-orange-500' : 'w-2 bg-gray-300'}
                                            `}
                                        />
                                    ))}
                                </div>

                                <button 
                                    onClick={irPaginaSiguiente}
                                    disabled={paginaActual === totalPaginas}
                                    className={`
                                        flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm transition-all duration-300
                                        ${paginaActual === totalPaginas 
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                            : 'bg-white text-gray-800 hover:bg-orange-50 hover:text-orange-600 shadow-md hover:shadow-lg border border-gray-200'}
                                    `}
                                >
                                    Siguiente <span>→</span>
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </section>
    );
}

export default LandingAnuncios;