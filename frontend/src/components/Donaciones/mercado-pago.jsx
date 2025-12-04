import "./mercado-pago.css";
import { useNavigate, Link } from 'react-router-dom';
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';
import axios from "axios"
import { useState,useEffect } from "react";

initMercadoPago("APP_USR-4bfe976d-da4f-4740-8e7a-cc342f9a8c3b",{
    locale: "es-CL"
});


const Donaciones = () => {
    const [donationAmount, setDonationAmount] = useState(1);
    const [preferenceId, setPreferenceId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [donorName, setDonorName] = useState('Anónimo');

    const handleNameChange = (event) => {
        setDonorName(event.target.value.trim() || 'Anónimo');
        setPreferenceId(null); 
    };

    const handleInputChange = (event) => {
        const value = Number(event.target.value) > 0 ? Number(event.target.value) : 1;
        setDonationAmount(value);
        setPreferenceId(null); 
    };

    const createPreference = async (amount) => {
        try {
            const response = await axios.post("http://localhost:8000/api/crear-preferencia/", {
                item: { 
                    title: "Donacion Llave de Sol",
                    quantity: 1,
                    unit_price: amount,
                    donor_name: donorName
                }
            });
            
            const { id } = response.data;
            return id;

        } catch (error) {
            console.error("Error al crear la preferencia:", error);
            alert("Error al intentar generar la donación. Revisa la consola para más detalles.");
            return null;
        }
    };
    
    const handleDonate = async () => {
        if (donationAmount && donationAmount > 0) {
            setIsLoading(true);
            try {
                const id = await createPreference(donationAmount);
                if (id) {
                    setPreferenceId(id);
                }
            } finally {
                setIsLoading(false);
            }
        } else {
            alert("Por favor, ingresa un monto válido para donar.");
        }
    };

    return (
        <div className='donation-page-container'>
            {/* 🛑 HEADER AÑADIDO */}
            <header className='donation-header'>
                <h1 className='header-title'>Realizar Donación</h1>
            </header>
            {/* 🛑 FIN HEADER */}
            
            <div className='donation-card'>
                
                <h3 className='card-title'>Donaciones LLave de Sol</h3>
                <p className='card-subtitle'>Apoya nuestros programas sociales.</p>

                <div className='input-group'>
                    <label htmlFor="donor-name">Tu Nombre (Opcional)</label>
                    <input 
                        id="donor-name"
                        type="text" 
                        placeholder="Tu nombre aquí"
                        value={donorName === 'Anónimo' ? '' : donorName} 
                        onChange={handleNameChange} 
                        className="input-field"
                    />
                </div>

                <div className='input-group'>
                    <label htmlFor="donation-amount">Monto a donar (CLP)</label>
                    <input 
                        id="donation-amount"
                        type="number" 
                        className="input-field price-input"
                        value={donationAmount}
                        onChange={handleInputChange}
                        min="1"
                    />
                </div>

                <button 
                    onClick={handleDonate} 
                    className="main-button"
                    disabled={isLoading} 
                >
                    {isLoading ? "Generando Preferencia..." : "Generar Donación"}
                </button>
                
                {preferenceId && (
                    <div className='wallet-container'>
                         <Wallet initialization={{ preferenceId }} />
                    </div>
                   
                )}

                <Link 
                    to="/" 
                    className='secondary-button'
                >
                    Volver al inicio
                </Link>
                
            </div>
        </div>
    );
};

export default Donaciones;