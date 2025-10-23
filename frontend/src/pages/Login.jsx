import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext'; // Importamos nuestro hook
import { Link } from 'react-router-dom'; // Importar Link para el botón de "Volver"

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { loginUser } = useAuth(); // Obtenemos la función de login

    const handleSubmit = (e) => {
        e.preventDefault();
        loginUser(username, password);
    };

    return (
        // Usamos Tailwind para centrar y dar fondo
        <div className="flex justify-center items-center min-h-screen bg-gray-100">
            {/* Tarjeta de login */}
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md max-w-sm w-full">
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Iniciar Sesión</h2>
                
                {/* Campo de Usuario */}
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
                        Usuario
                    </label>
                    <input
                        id="username"
                        type="text"
                        placeholder="Tu usuario"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                </div>
                
                {/* Campo de Contraseña */}
                <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                        Contraseña
                    </label>
                    <input
                        id="password"
                        type="password"
                        placeholder="Tu contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                </div>
                
                {/* Contenedor de botones */}
                <div className="flex flex-col gap-4">
                    <button 
                        type="submit" 
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300"
                    >
                        Entrar
                    </button>
                    
                    {/* Botón "Volver" como un Link de router */}
                    <Link 
                        to="/"
                        className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300 text-center"
                    >
                        Volver al Inicio
                    </Link>
                </div>
            </form>
        </div>
    );
}

export default Login;

