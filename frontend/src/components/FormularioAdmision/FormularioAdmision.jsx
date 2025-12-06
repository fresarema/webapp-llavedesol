import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

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

    // Función inteligente que valida antes de escribir
    const handleChange = (e) => {
        const { name, value } = e.target;

        // 1. VALIDACIÓN TELÉFONO (Solo números, max 9)
        if (name === 'telefono') {
            // Si el valor no es un número (y no está vacío) o supera 9 caracteres, no hace nada (ignora el input)
            if (!/^\d*$/.test(value) || value.length > 9) {
                return;
            }
        }

        // 2. VALIDACIÓN RUT (Max 9 caracteres)
        if (name === 'rut_dni') {
            if (!/^[0-9kK]*$/.test(value) || value.length > 9) {
                return;
            }
        }

        // 3. VALIDACIÓN NOMBRE (Max 50 caracteres)
        if (name === 'nombre_completo' && value.length > 50) return;

        // 4. VALIDACIÓN PROFESIÓN (Max 50 caracteres)
        if (name === 'profesion' && value.length > 50) return;

        // 5. VALIDACIÓN MOTIVACIÓN (Max 300 caracteres)
        if (name === 'motivacion' && value.length > 300) return;

        // Si pasa las validaciones, actualizamos el estado
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validación extra: Verificar que el teléfono tenga 9 dígitos exactos
        if (formData.telefono.length !== 9) {
            alert("El teléfono debe tener 9 dígitos.");
            return;
        }

        setLoading(true);
        try {
            await axios.post('http://localhost:8000/api/solicitud-ingreso/', formData);
            alert('¡Solicitud enviada con éxito! Te contactaremos pronto.');
            navigate('/'); 
        } catch (error) {
            console.error("Error enviando solicitud:", error);
            if (error.response && error.response.data) {
                alert('Error: ' + JSON.stringify(error.response.data));
            } else {
                alert('Hubo un error al conectar con el servidor.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-5 mb-5">
            <div className="row justify-content-center">
                <div className="col-md-8 col-lg-6">
                    <div className="card shadow-lg border-0">
                        <div className="card-body p-5 bg-white text-dark rounded">
                            
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