from django.db import models
from django.contrib.auth.models import User, Group
from django.utils.crypto import get_random_string
from rest_framework import serializers

## -----------------------------------------------------------
## MODELOS EXISTENTES
## -----------------------------------------------------------

class SolicitudIngreso(models.Model):
    ESTADOS = [
        ('PENDIENTE', 'Pendiente'),
        ('APROBADO', 'Aprobado'),
        ('RECHAZADO', 'Rechazado'),
    ]

    nombre_completo = models.CharField(max_length=255)
    rut_dni = models.CharField(max_length=20, unique=True, verbose_name="RUT/DNI")
    fecha_nacimiento = models.DateField()
    email = models.EmailField(unique=True)
    telefono = models.CharField(max_length=20)
    profesion = models.CharField(max_length=100, blank=True, null=True)
    motivacion = models.TextField(verbose_name="¿Por qué quieres unirte?", blank=True)
    estado = models.CharField(max_length=20, choices=ESTADOS, default='PENDIENTE')
    fecha_solicitud = models.DateTimeField(auto_now_add=True)
    
    # ========== CAMPOS RELACIONADOS A USUARIO ==========
    usuario_creado = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        verbose_name="Usuario Django creado"
    )
    usuario_activo = models.BooleanField(
        default=False,
        verbose_name="¿Usuario activo?"
    )
    
    # ✅ ÚNICO CAMPO PARA CONTRASEÑA (elimina password_temporal)
    password_generada = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Contraseña generada",
        help_text="Contraseña generada al aprobar la solicitud"
    )

    def __str__(self):
        return f"{self.nombre_completo} - {self.estado}"
    
    def crear_usuario_inactivo(self):
        """Crea usuario automáticamente ACTIVO y guarda contraseña"""
        if self.usuario_creado:
            # Si ya existe, activarlo si no lo está
            if not self.usuario_creado.is_active:
                self.usuario_creado.is_active = True
                self.usuario_creado.save()
                self.usuario_activo = True
                self.save()
            return self.usuario_creado
            
        try:
            # Crear username del RUT (más seguro)
            username = self.rut_dni.lower().replace('.', '').replace('-', '')
            counter = 1
            original_username = username
            
            # Verificar si ya existe usuario con ese email
            if User.objects.filter(email=self.email).exists():
                # Si el email ya existe, usar ese usuario
                usuario_existente = User.objects.get(email=self.email)
                self.usuario_creado = usuario_existente
                self.usuario_activo = usuario_existente.is_active
                self.save()
                
                # Si está inactivo, activarlo
                if not usuario_existente.is_active:
                    usuario_existente.is_active = True
                    usuario_existente.save()
                    self.usuario_activo = True
                    self.save()
                
                return usuario_existente
            
            while User.objects.filter(username=username).exists():
                username = f"{original_username}{counter}"
                counter += 1
                if counter > 100:  # Límite de seguridad
                    raise Exception("No se puede generar un nombre de usuario único")
            
            # Dividir nombre
            nombres = self.nombre_completo.split()
            first_name = nombres[0] if nombres else ''
            last_name = ' '.join(nombres[1:]) if len(nombres) > 1 else ''
            
            # ✅ GENERAR CONTRASEÑA
            random_password = get_random_string(12)
            
            # ✅ GUARDAR CONTRASEÑA EN EL MODELO ANTES DE CREAR USUARIO
            self.password_generada = random_password
            
            # ✅ CREAR USUARIO ACTIVO AUTOMÁTICAMENTE
            user = User.objects.create_user(
                username=username,
                email=self.email,
                password=random_password,
                first_name=first_name,
                last_name=last_name,
                is_active=True,  # ← ¡ACTIVO!
                is_staff=False,
                is_superuser=False
            )
            
            # Asignar al grupo SOCIO
            grupo_socio, _ = Group.objects.get_or_create(name='SOCIO')
            user.groups.add(grupo_socio)
            
            # GUARDAR explícitamente las relaciones
            user.save()
            
            # Actualizar campos en la solicitud
            self.usuario_creado = user
            self.usuario_activo = True  # ← Actualizar a activo
            
            # ✅ GUARDAR TODOS LOS CAMBIOS (incluye password_generada)
            self.save()
            
            # Verificar que el usuario esté en el grupo
            if user.groups.filter(name='SOCIO').exists():
                print(f"✅ Usuario {user.username} creado ACTIVO y asignado al grupo SOCIO")
                print(f"🔑 Contraseña generada: {random_password}")
            else:
                print(f"❌ ERROR: Usuario {user.username} NO está en el grupo SOCIO")
                
            return user
            
        except Exception as e:
            print(f"Error creando usuario: {e}")
            import traceback
            traceback.print_exc()
            return None


class Anuncio(models.Model):
    titulo = models.CharField(max_length=200)
    descripcion = models.TextField()
    imagen = models.ImageField(upload_to='anuncios/', blank=True, null=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.titulo


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


class Donacion(models.Model):
    nombre_donador = models.CharField(max_length=255, default='Anónimo')
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    preference_id = models.CharField(max_length=255, blank=True, null=True, unique=True, verbose_name="ID Preferencia MP")
    pago_id = models.CharField(max_length=255, blank=True, null=True, unique=True, verbose_name="ID de Pago MP") 
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


class DonacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Donacion
        fields = '__all__'


class EventoCalendario(models.Model):
    TIPO_EVENTO = [
        ('REUNION', 'Reunión'),
        ('EVENTO', 'Evento público'),
        ('VOLUNTARIADO', 'Voluntariado'),
        ('CAPACITACION', 'Capacitación'),
        ('RECAUDACION', 'Recaudación de fondos'),
        ('ADMINISTRATIVO', 'Administrativo'),
    ]
    
    titulo = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True, null=True)
    fecha = models.DateField()
    hora_inicio = models.TimeField(blank=True, null=True)
    hora_fin = models.TimeField(blank=True, null=True)
    tipo_evento = models.CharField(max_length=20, choices=TIPO_EVENTO, default='REUNION')
    lugar = models.CharField(max_length=200, blank=True, null=True)
    responsable = models.CharField(max_length=100, blank=True, null=True)
    
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['fecha', 'hora_inicio']

    def __str__(self):
        return f"{self.titulo} - {self.fecha}"