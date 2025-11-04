from django.db import models
from rest_framework import serializers

class Anuncio(models.Model):
    titulo = models.CharField(max_length=200)
    descripcion = models.TextField()
    imagen = models.URLField(blank=True, null=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.titulo
# Create your models here.
class AnuncioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Anuncio
        fields = '__all__'

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
    
 # modelo para mensjaes Internos
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