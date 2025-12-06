from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from .models import Anuncio, LibroCuenta, Mensaje, Donacion, Contacto, SolicitudIngreso, EventoCalendario


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['is_admin'] = user.is_staff 
        token['is_tesorero'] = user.groups.filter(name='Tesorero').exists()
        token['is_socio'] = user.groups.filter(name='SOCIO').exists()
        return token


class AnuncioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Anuncio
        fields = '__all__'


class LibroCuentaSerializer(serializers.ModelSerializer):
    class Meta:
        model = LibroCuenta
        fields = '__all__'


class MensajeSerializer(serializers.ModelSerializer):
    emisor_display = serializers.SerializerMethodField()
    destinatario_display = serializers.SerializerMethodField()
    
    class Meta:
        model = Mensaje
        fields = '__all__'
    
    def get_emisor_display(self, obj):
        return obj.get_emisor_tipo_display()
    
    def get_destinatario_display(self, obj):
        return obj.get_destinatario_tipo_display()


class ContactoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contacto
        fields = '__all__'


class SolicitudIngresoSerializer(serializers.ModelSerializer):
    class Meta:
        model = SolicitudIngreso
        fields = '__all__'
        read_only_fields = ('fecha_solicitud', 'estado', 'usuario_creado', 'usuario_activo')
    
    def create(self, validated_data):
        # Crear la solicitud
        solicitud = SolicitudIngreso.objects.create(**validated_data)
        
        # Crear usuario INACTIVO automáticamente
        try:
            solicitud.crear_usuario_inactivo()
        except Exception as e:
            print(f"Error creando usuario automático: {e}")
            # Continuar aunque falle la creación de usuario
        
        return solicitud


class DonacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Donacion
        fields = '__all__'


class EventoCalendarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventoCalendario
        fields = '__all__'