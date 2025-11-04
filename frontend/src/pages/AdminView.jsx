import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext'; 
import { getAnuncios, createAnuncio, deleteAnuncio, updateAnuncio } from "../services/anunciosService";

function AdminView() {
    const { user, logoutUser } = useAuth();

    const [anuncios, setAnuncios] = useState([]);
    const [titulo, setTitulo] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [mostrarForm, setMostrarForm] = useState(false);
    const [editandoId, setEditandoId] = useState(null);

    useEffect(() => {
      async function cargar() {
        const data = await getAnuncios();
        setAnuncios(data);
      }
      cargar();
    }, []);

    const handleEliminar = async (id, titulo) => {
        if (window.confirm(`¿Estás seguro de eliminar el anuncio "${titulo}"?`)) {
            try {
                await deleteAnuncio(id);
                setAnuncios(anuncios.filter(anuncio => anuncio.id !== id));
                alert("Anuncio eliminado correctamente");
            } catch (error) {
                console.error("Error al eliminar:", error);
                alert("Error al eliminar el anuncio.");
            }
        }
    };

    const iniciarEdicion = (anuncio) => {
        setEditandoId(anuncio.id);
        setTitulo(anuncio.titulo);
        setDescripcion(anuncio.descripcion);
        setMostrarForm(true);
    };

    const cancelarForm = () => {
        setEditandoId(null);
        setTitulo("");
        setDescripcion("");
        setMostrarForm(false);
    };

    const handleGuardar = async (e) => {
        e.preventDefault();

        const anuncioData = {
            titulo: titulo.trim(),
            descripcion: descripcion.trim()
        };

        try {
            if (editandoId) {
                const anuncioActualizado = await updateAnuncio(editandoId, anuncioData);
                setAnuncios(anuncios.map(a => a.id === editandoId ? anuncioActualizado : a));
                alert("Anuncio actualizado correctamente");
            } else {
                const nuevoAnuncio = await createAnuncio(anuncioData);
                setAnuncios([...anuncios, nuevoAnuncio]);
                alert("Anuncio creado correctamente");
            }

            cancelarForm();
        } catch (error) {
            console.error("Error al guardar:", error);
            alert("Error al guardar el anuncio.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 text-gray-800 p-6">
            {/* HEADER CON TÍTULO Y CERRAR SESIÓN */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-blue-600">
                            ONG Llave de Sol
                        </h1>
                        <p className="text-lg mt-2">
                            ¡Bienvenido, <span className="font-semibold">{user?.username}!</span>
                        </p>
                    </div>
                    <button 
                        onClick={logoutUser}
                        className="bg-red-500 hover:bg-red-600 text-white py-2 px-6 rounded-lg font-medium transition duration-300"
                    >
                        Cerrar Sesión
                    </button>
                </div>
            </div>

            {/* CONTENIDO PRINCIPAL - DOS COLUMNAS */}
            <div className="flex gap-6">
                {/* COLUMNA IZQUIERDA - ANUNCIOS (MÁS GRANDE) */}
                <div className="flex-1 bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold">Anuncios actuales</h2>
                        {!mostrarForm && (
                            <button
                                onClick={() => setMostrarForm(true)}
                                className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-medium transition duration-300"
                            >
                                + Crear Nuevo Anuncio
                            </button>
                        )}
                    </div>

                    {anuncios.length === 0 ? (
                        <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 text-center">
                            <p className="text-lg">No hay anuncios creados aún.</p>
                            <button
                                onClick={() => setMostrarForm(true)}
                                className="mt-4 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-medium transition duration-300"
                            >
                                Crear primer anuncio
                            </button>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {anuncios.map((a) => (
                                <div key={a.id} className="border border-gray-200 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition duration-200">
                                    <div className="flex justify-between items-start mb-3">
                                        <strong className="text-xl block">{a.titulo}</strong>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => iniciarEdicion(a)}
                                                className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-sm transition duration-300"
                                            >
                                                Editar
                                            </button>
                                            <button
                                                onClick={() => handleEliminar(a.id, a.titulo)}
                                                className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded text-sm transition duration-300"
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-gray-600 text-lg">{a.descripcion}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* COLUMNA DERECHA - FORMULARIO (SOLO CUANDO SE MUESTRA) */}
                {mostrarForm && (
                    <div className="w-96 bg-white rounded-lg shadow-md p-6 h-fit">
                        <form onSubmit={handleGuardar}>
                            <h3 className="text-xl font-bold mb-4 text-center">
                                {editandoId ? 'Editar Anuncio' : 'Crear Nuevo Anuncio'}
                            </h3>

                            <div className="space-y-4">
                                <label className="block">
                                    <span className="block text-sm font-medium mb-2">Título:</span>
                                    <input
                                        className="border w-full p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={titulo}
                                        onChange={(e) => setTitulo(e.target.value)}
                                        placeholder="Escribe el título aquí..."
                                        required
                                    />
                                </label>

                                <label className="block">
                                    <span className="block text-sm font-medium mb-2">Descripción:</span>
                                    <textarea
                                        className="border w-full p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        rows="6"
                                        value={descripcion}
                                        onChange={(e) => setDescripcion(e.target.value)}
                                        placeholder="Escribe la descripción aquí..."
                                    />
                                </label>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="submit"
                                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded font-medium transition duration-300"
                                >
                                    {editandoId ? 'Actualizar' : 'Guardar'} anuncio
                                </button>
                                <button
                                    type="button"
                                    onClick={cancelarForm}
                                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded font-medium transition duration-300"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminView;