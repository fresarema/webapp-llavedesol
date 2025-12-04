from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from .models import Anuncio, LibroCuenta, Mensaje, Donacion, Contacto

# -----------------------------------------------------------
# SERIALIZER DE TOKEN (JWT)
# -----------------------------------------------------------

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['is_admin'] = user.is_staff 
        token['is_tesorero'] = user.groups.filter(name='Tesorero').exists()
        return token

# -----------------------------------------------------------
# SERIALIZERS EXISTENTES
# -----------------------------------------------------------

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

# -----------------------------------------------------------
# SERIALIZER REQUERIDO PARA MERCADO PAGO
# -----------------------------------------------------------

class DonacionSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo Donacion, utilizado para registrar y consultar
    el estado de los pagos de Mercado Pago.
    """
    class Meta:
        model = Donacion
        fields = '__all__'