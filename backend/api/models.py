from django.db import models
from rest_framework import serializers

## -----------------------------------------------------------
## MODELOS EXISTENTES
## -----------------------------------------------------------

class Anuncio(models.Model):
    titulo = models.CharField(max_length=200)
    descripcion = models.TextField()
    imagen = models.URLField(blank=True, null=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.titulo
# Create your models here.

class LibroCuenta(models.Model):
    TIPO_CHOICES = [
        ('MENSUAL', 'Mensual'),
        ('TRIMESTRAL', 'Trimestral'), 
        ('ANUAL', 'Anual'),
        ('EVENTO', 'Evento Específico'),
    ]
    
    titulo = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True)
    archivo = models.FileField(upload_to='libros_cuentas/')
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, default='MENSUAL')
    fecha_periodo = models.DateField()
    fecha_subida = models.DateTimeField(auto_now_add=True)
    

    class Meta:
        ordering = ['-fecha_periodo']

    def __str__(self):
        return f"{self.titulo} - {self.fecha_periodo}"
    
# modelo para mensajes Internos
class Mensaje(models.Model):
    TIPO_USUARIO = [
        ('ADMIN', 'Administrador'),
        ('TESORERO', 'Tesorero'),
    ]
    
    emisor_tipo = models.CharField(max_length=10, choices=TIPO_USUARIO)
    destinatario_tipo = models.CharField(max_length=10, choices=TIPO_USUARIO)
    asunto = models.CharField(max_length=200)
    mensaje = models.TextField()
    leido = models.BooleanField(default=False)
    creado_en = models.DateTimeField(auto_now_add=True)
    archivo_adjunto = models.FileField(upload_to='mensajes_adjuntos/', blank=True, null=True)

    class Meta:
        ordering = ['-creado_en']

    def __str__(self):
        return f"{self.asunto} - {self.emisor_tipo}"

## -----------------------------------------------------------
## NUEVO MODELO PARA MERCADO PAGO
## -----------------------------------------------------------

class Donacion(models.Model):
    """
    Modelo para registrar las donaciones iniciadas con Mercado Pago.
    """
    
    # Datos de la donación
    nombre_donador = models.CharField(max_length=255, default='Anónimo')
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    
    # IDs de Mercado Pago
    preference_id = models.CharField(max_length=255, blank=True, null=True, unique=True, verbose_name="ID Preferencia MP")
    pago_id = models.CharField(max_length=255, blank=True, null=True, unique=True, verbose_name="ID de Pago MP") 
    
    # Estado y Tiempos
    estado = models.CharField(max_length=20, default='pendiente', verbose_name="Estado de Pago")
    fecha_donacion = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Donación"
        verbose_name_plural = "Donaciones"
        ordering = ['-fecha_donacion']

    def __str__(self):
        return f"Donación #{self.pk} // ({self.estado}) // {self.monto} // {self.fecha_donacion}"


class AnuncioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Anuncio
        fields = '__all__'

class LibroCuentaSerializer(serializers.ModelSerializer):
    class Meta:
        model = LibroCuenta
        fields = '__all__'
        
class MensajeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Mensaje
        fields = '__all__'
        
class Contacto(models.Model):
    nombre = models.CharField(max_length=100)
    correo = models.EmailField()
    mensaje = models.TextField()
    fecha = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Mensaje de {self.nombre}"
## -----------------------------------------------------------
## SERIALIZADOR DONACIONES
## -----------------------------------------------------------

class DonacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Donacion
        fields = '__all__'