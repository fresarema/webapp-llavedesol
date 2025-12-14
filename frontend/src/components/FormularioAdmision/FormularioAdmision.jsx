import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const FormularioAdmision = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    
    const [formData, setFormData] = useState({
        nombre_completo: '',
        rut_dni: '',
        fecha_nacimiento: '',
        email: '',
        telefono: '',
        profesion: '',
        motivacion: ''
    });

    const traducirError = (mensaje) => {
        if (!mensaje) return mensaje;
        
        const traducciones = {
            "solicitud ingreso with this RUT/DNI already exists.": "Ya existe una solicitud con este RUT/DNI.",
            "solicitud ingreso with this email already exists.": "Ya existe una solicitud con este correo electrónico.",
            "with this RUT/DNI already exists.": "Ya existe una solicitud con este RUT/DNI.",
            "with this email already exists.": "Ya existe una solicitud con este correo electrónico.",
            "already exists": "ya existe en el sistema",
            "This field is required.": "Este campo es obligatorio.",
            "Enter a valid email address.": "Ingresa una dirección de correo válida.",
            "Enter a valid date.": "Ingresa una fecha válida.",
            "Ensure this value has at most": "Asegúrate de que este valor tenga como máximo",
            "Ensure this value has at least": "Asegúrate de que este valor tenga al menos",
            "characters": "caracteres",
            "Invalid phone number": "Número de teléfono inválido",
            "Invalid format": "Formato inválido",
            "Must be a valid number": "Debe ser un número válido",
            "Must be unique": "Debe ser único",
            "Something went wrong": "Algo salió mal",
            "Server error": "Error del servidor",
            "Validation error": "Error de validación",
        };

        let mensajeTraducido = mensaje;
        Object.keys(traducciones).forEach(key => {
            if (mensajeTraducido.includes(key)) {
                mensajeTraducido = mensajeTraducido.replace(key, traducciones[key]);
            }
        });

        return mensajeTraducido;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'telefono') {
            if (!/^\d*$/.test(value) || value.length > 9) {
                return;
            }
        }

        if (name === 'rut_dni') {
            if (!/^[0-9kK]*$/.test(value) || value.length > 9) {
                return;
            }
        }

        if (name === 'nombre_completo' && value.length > 50) return;
        if (name === 'profesion' && value.length > 50) return;
        if (name === 'motivacion' && value.length > 300) return;

        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.telefono.length !== 9) {
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "El teléfono debe tener 9 dígitos."
            });
            return;
        }

        setLoading(true);
        try {
            await axios.post('http://localhost:8000/api/solicitud-ingreso/', formData);
            
            // ✅ AQUÍ ESTÁ LA ALERTA AMIGABLE QUE ELEGISTE
            Swal.fire({
                title: "¡Solicitud Completada!",
                text: "Hemos recibido tu información correctamente. Te contactaremos pronto.",
                icon: "success",
                draggable: true,
                confirmButtonText: "Entendido"
            }).then(() => {
                navigate('/');
            });
            
        } catch (error) {
            console.error("Error enviando solicitud:", error);
            if (error.response && error.response.data) {
                const errorData = error.response.data;
                
                if (errorData.rut_dni && errorData.rut_dni.some(msg => msg.includes("already exists"))) {
                    Swal.fire({
                        icon: "error",
                        title: "Error",
                        text: "Este RUT o DNI ya está registrado en nuestro sistema."
                    });
                }
                else if (errorData.email && errorData.email.some(msg => msg.includes("already exists"))) {
                    Swal.fire({
                        icon: "error",
                        title: "Error",
                        text: "Este correo electrónico ya está registrado en nuestro sistema."
                    });
                }
                else if (errorData.rut_dni && errorData.email) {
                    Swal.fire({
                        icon: "error",
                        title: "Error",
                        html: `
                            <div style="text-align: left; padding: 10px;">
                                <p>• RUT/DNI: Ya está registrado en nuestro sistema.</p>
                                <p>• Email: Ya está registrado en nuestro sistema.</p>
                            </div>
                        `
                    });
                }
                else {
                    let errorMessages = [];
                    for (const [field, messages] of Object.entries(errorData)) {
                        if (Array.isArray(messages)) {
                            messages.forEach(msg => {
                                errorMessages.push(traducirError(msg));
                            });
                        } else {
                            errorMessages.push(traducirError(messages));
                        }
                    }
                    
                    Swal.fire({
                        icon: "error",
                        title: "Error en el formulario",
                        html: `
                            <div style="text-align: left; max-height: 200px; overflow-y: auto; padding: 10px;">
                                ${errorMessages.map(msg => `<p>• ${msg}</p>`).join('')}
                            </div>
                        `
                    });
                }
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Error de conexión",
                    text: "Hubo un problema al conectar con el servidor. Por favor, inténtalo de nuevo."
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const hoy = new Date().toISOString().split('T')[0];


    return (
        <div className="container mt-5 mb-5">
            <div className="row justify-content-center">
                <div className="col-md-8 col-lg-6">
                    <div className="card shadow-lg border-0">
                        <div className="card-body p-5 bg-white text-dark rounded">
                            <div className="mb-3">
                                <button 
                                    onClick={() => navigate('/')}
                                    className="btn btn-link text-decoration-none text-secondary ps-0 fw-bold"
                                    style={{ fontSize: '0.9rem' }}
                                >
                                    ← Volver al inicio
                                </button>
                            </div>
                            <h2 className="text-center mb-4 fw-bold">Únete a nuestra ONG</h2>
                            <p className="text-muted text-center mb-4">Completa tus datos y nos pondremos en contacto.</p>

                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label className="form-label fw-bold">Nombre Completo</label>
                                    <input 
                                        type="text" 
                                        name="nombre_completo" 
                                        className="form-control" 
                                        value={formData.nombre_completo}
                                        required 
                                        onChange={handleChange} 
                                        placeholder="Ej: Juan Pérez"
                                    />
                                    <small className="text-muted">{formData.nombre_completo.length}/50</small>
                                </div>
                                
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label fw-bold">RUT / DNI (Sin puntos ni guion)</label>
                                        <input 
                                            type="text" 
                                            name="rut_dni" 
                                            className="form-control" 
                                            value={formData.rut_dni}
                                            required 
                                            onChange={handleChange} 
                                            placeholder="Ej: 12345678"
                                        />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label fw-bold">Fecha de Nacimiento</label>
                                        <input 
                                            type="date" 
                                            name="fecha_nacimiento" 
                                            className="form-control" 
                                            required 
                                            onChange={handleChange} 
                                            max={hoy}
                                        />
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label fw-bold">Email</label>
                                        <input 
                                            type="email" 
                                            name="email" 
                                            className="form-control" 
                                            required 
                                            onChange={handleChange} 
                                        />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label fw-bold">Teléfono (9 dígitos)</label>
                                        <input 
                                            type="tel" 
                                            name="telefono" 
                                            className="form-control" 
                                            value={formData.telefono}
                                            required 
                                            onChange={handleChange} 
                                            placeholder="Ej: 912345678"
                                        />
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label fw-bold">Profesión / Ocupación</label>
                                    <input 
                                        type="text" 
                                        name="profesion" 
                                        className="form-control" 
                                        value={formData.profesion}
                                        onChange={handleChange} 
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label fw-bold">¿Por qué quieres unirte?</label>
                                    <textarea 
                                        name="motivacion" 
                                        className="form-control" 
                                        rows="3" 
                                        value={formData.motivacion}
                                        onChange={handleChange}
                                    ></textarea>
                                    <small className="text-muted">{formData.motivacion.length}/300</small>
                                </div>

                                <div className="d-grid gap-2">
                                    <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                                        {loading ? 'Enviando...' : 'Enviar Solicitud'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FormularioAdmision;