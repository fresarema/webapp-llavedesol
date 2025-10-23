import React from 'react';
// Tu import original, que es correcto
import { useAuth } from '../context/AuthContext';

function TesoreroView() {
    // Tu lógica original
    const { user, logoutUser } = useAuth();

    return (
        // Contenedor principal con fondo gris claro y centrado
        <div className="flex items-center justify-center min-h-screen bg-gray-100 text-gray-800">
            {/* Tarjeta blanca centrada */}
            <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">

                {/* Título estilizado (en verde para diferenciarlo) */}
                <h1 className="text-3xl font-bold text-green-600 mb-4">
                    Holiiii esta es la vista del tesorero $$$
                </h1>

                {/* Saludo estilizado */}
                <p className="text-lg mb-6">
                    ¡Bienvenido, <span className="font-semibold">{user?.username}!</span>
                </p>
                
                {/* Botón de Cerrar Sesión estilizado */}
                <button 
                    onClick={logoutUser}
                    className="w-full bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75 transition duration-300"
                >
                    Cerrar Sesión
                </button>
            </div>
        </div>
    );
}
export default TesoreroView;